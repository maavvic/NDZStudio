/**
 * AI Studio Frontend Overlay
 * "See-Click-Prompt" Experience
 */
(function ($) {
    'use strict';

    const AIStudioEditor = {
        $overlay: null,
        $label: null,
        $currentBlock: null,
        isEditing: false,
        aiEnabled: true,
        outlinesEnabled: false,
        modelTier: 'medium',

        init: function () {
            this.aiEnabled = localStorage.getItem('aipg_ai_enabled') !== 'false';
            this.outlinesEnabled = localStorage.getItem('aipg_outlines_enabled') === 'true';
            this.modelTier = localStorage.getItem('aipg_model_tier') || 'claude_auto';
            this.createUI();
            this.bindEvents();
            this.updateModeUI();
            console.log('[AI Studio] Live Editor Overlay v4 Initialized');
        },

        createUI: function () {
            this.$overlay = $('<div class="aipg-block-overlay"></div>').appendTo('body');
            this.$label = $('<div class="aipg-block-label">✨ <span>Edit with AI</span></div>').appendTo(this.$overlay);

            this.$modal = $(`
                <div class="aipg-modal-backdrop"></div>
                
                <!-- Refinement Prompt Modal -->
                <div class="aipg-editor-modal" id="aipg-refine-modal">
                    <h3>Refine this section</h3>
                    <p style="font-size: 13px; color: #666;">Provide a prompt to AI to modify this specific block.</p>
                    <textarea id="aipg-prompt-input" placeholder="e.g., 'Make this heading more professional', 'Add a button below the text', 'Change this background'"></textarea>
                    <div style="text-align: right;">
                        <button class="ws-btn-secondary" id="aipg-cancel-edit">Cancel</button>
                        <button class="ws-btn-primary" id="aipg-submit-edit">Update Block</button>
                    </div>
                </div>

                <!-- Error Diagnostics Modal -->
                <div class="aipg-editor-modal" id="aipg-error-modal" style="width: 600px; max-width: 95%;">
                    <h3 style="color: #e74c3c;">AI Refinement Error</h3>
                    <p id="aipg-error-message" style="font-size: 14px; font-weight: 500; margin-bottom: 10px;"></p>
                    <div class="aipg-diagnostics-container" style="background: #1e1e1e; color: #a6e22e; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 12px; height: 250px; overflow-y: auto; text-align: left; margin-bottom: 15px; display: none;">
                        <pre id="aipg-error-diagnostics" style="margin: 0; white-space: pre-wrap; word-wrap: break-word;"></pre>
                    </div>
                    <div style="text-align: right; display: flex; justify-content: space-between; align-items: center;">
                        <button class="ws-btn-secondary" id="aipg-copy-error-btn" style="display: none; font-size: 12px; padding: 6px 12px;">Copy Log</button>
                        <button class="ws-btn-primary" id="aipg-close-error-modal">Close</button>
                    </div>
                </div>
            `).appendTo('body');

            // Float Toggle Mode
            this.$toggle = $(`
                <div class="aipg-mode-toggle ${this.aiEnabled ? 'aipg-mode-ai' : ''}">
                    <div class="aipg-toggle-switch"><div class="aipg-toggle-knob"></div></div>
                    <div>
                        <div class="aipg-mode-label">AI Edit Mode</div>
                        <div class="aipg-mode-desc">Click elements to refine</div>
                    </div>
                    ${this.aiEnabled ? `
                        <select id="aipg-model-tier-select" class="aipg-save-btn" style="margin-left: 15px; padding: 6px 10px; font-size: 12px; outline: none; cursor: pointer; appearance: menulist; min-height: 31px;">
                            <option value="medium" style="color: black;" ${this.modelTier === 'medium' ? 'selected' : ''}>Simple (Gemini Flash)</option>
                            <option value="complex" style="color: black;" ${this.modelTier === 'complex' ? 'selected' : ''}>Advanced (Gemini Pro)</option>
                            <option value="claude_auto" style="color: black;" ${this.modelTier === 'claude_auto' ? 'selected' : ''}>Claude (Auto)</option>
                        </select>
                        <button id="aipg-toggle-outlines-btn" class="aipg-save-btn" style="margin-left: 10px; background: ${this.outlinesEnabled ? '#e67e22' : '#7f8c8d'};" title="Show Structural Outlines">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-right: 4px; vertical-align: middle;"><path d="M4 4h16v16H4z"></path></svg>
                            Outlines
                        </button>
                        <button id="aipg-save-project-btn" class="aipg-save-btn">Save Project</button>
                        <button id="aipg-exit-wizard-btn" class="aipg-exit-btn" title="Exit to Wizard">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </button>
                    ` : ''}
                </div>
            `).appendTo('body');

            this.$overlay.hide();
        },

        bindEvents: function () {
            const self = this;

            // Global hover tracking: Focus on all blocks including large containers and headers
            $(document).on('mouseenter', '[class*="wp-block-"], header, footer, main, nav', function (e) {
                if (!self.aiEnabled || self.isEditing) return;
                const $el = $(this);

                const isGlobalWrapper = $el.is('body, main, header, footer, nav, .wp-site-blocks, .is-root-container, .wp-block-post-content');
                if (isGlobalWrapper) {
                    // Ignore hover for structural high-level wrappers
                    self.$overlay.hide();
                    return;
                }

                // Stop propagation so we pick the innermost block when hovering specifically,
                // BUT we allow the user to reach outer blocks if they hover on their edges.
                e.stopPropagation();
                self.highlightBlock($el);

                if (self.outlinesEnabled) {
                    $('.aipg-outline-box').remove(); // Clear previous overlays

                    const drawBox = function ($target, levelClass) {
                        if (!$target || $target.length === 0) return;
                        const offset = $target.offset();
                        $('<div class="aipg-outline-box ' + levelClass + '"></div>').css({
                            top: offset.top,
                            left: offset.left,
                            width: $target.outerWidth(),
                            height: $target.outerHeight()
                        }).appendTo('body');
                    };

                    // Find up to 2 wp-block parents
                    const $parents = $el.parents('[class*="wp-block-"]').slice(0, 2);
                    if ($parents.length > 0) drawBox($($parents[0]), 'aipg-outline-parent-1');
                    if ($parents.length > 1) drawBox($($parents[1]), 'aipg-outline-parent-2');

                    // Find direct children
                    const $children1 = $el.find('[class*="wp-block-"]').filter(function () {
                        return $(this).parent().closest('[class*="wp-block-"]')[0] === $el[0];
                    });
                    $children1.each(function () { drawBox($(this), 'aipg-outline-child-1'); });

                    // Find children of children
                    const $children2 = $children1.find('[class*="wp-block-"]').filter(function () {
                        const directParentBlock = $(this).parent().closest('[class*="wp-block-"]')[0];
                        return Array.from($children1).includes(directParentBlock);
                    });
                    $children2.each(function () { drawBox($(this), 'aipg-outline-child-2'); });
                }
            });

            $(document).on('mouseleave', '[class*="wp-block-"], header, footer, main, nav', function () {
                if (!self.aiEnabled || self.isEditing) return;
                self.$overlay.hide().removeClass('aipg-active');

                if (self.outlinesEnabled) {
                    $('.aipg-outline-box').remove();
                }
            });

            // Click detection via coordinates (to avoid flickering from pointer-events: auto)
            $(document).on('mousedown', function (e) {
                if (!self.aiEnabled || self.isEditing || !self.$overlay.is(':visible')) return;

                const o = self.$overlay.offset();
                const w = self.$overlay.outerWidth();
                const h = self.$overlay.outerHeight();

                // Check if click is within overlay bounds
                if (e.pageY >= o.top && e.pageY <= (o.top + h) &&
                    e.pageX >= o.left && e.pageX <= (o.left + w)) {

                    e.preventDefault();
                    e.stopPropagation();
                    self.openModal();
                }
            });

            // Save Project Button
            $(document).on('click', '#aipg-save-project-btn', function (e) {
                e.stopPropagation();
                self.saveProject();
            });

            // Toggle Mode Click
            this.$toggle.on('click', '.aipg-toggle-switch, .aipg-toggle-info', function () {
                self.aiEnabled = !self.aiEnabled;
                localStorage.setItem('aipg_ai_enabled', self.aiEnabled);
                self.updateModeUI();
                if (!self.aiEnabled) {
                    self.$overlay.hide();
                    $('#aipg-model-tier-select, #aipg-save-project-btn, #aipg-toggle-outlines-btn, #aipg-exit-wizard-btn').remove();
                    $('.aipg-outline-parent-1, .aipg-outline-parent-2, .aipg-outline-child-1, .aipg-outline-child-2').removeClass('aipg-outline-parent-1 aipg-outline-parent-2 aipg-outline-child-1 aipg-outline-child-2');
                } else {
                    if (!$('#aipg-save-project-btn').length) {
                        self.$toggle.append(`
                            <select id="aipg-model-tier-select" class="aipg-save-btn" style="margin-left: 15px; padding: 6px 10px; font-size: 12px; outline: none; cursor: pointer; appearance: menulist; min-height: 31px;">
                                <option value="medium" style="color: black;" ${self.modelTier === 'medium' ? 'selected' : ''}>Simple (Gemini Flash)</option>
                                <option value="complex" style="color: black;" ${self.modelTier === 'complex' ? 'selected' : ''}>Advanced (Gemini Pro)</option>
                                <option value="claude_haiku" style="color: black;" ${self.modelTier === 'claude_haiku' ? 'selected' : ''}>Simple (Claude Haiku)</option>
                                <option value="claude_sonnet" style="color: black;" ${self.modelTier === 'claude_sonnet' ? 'selected' : ''}>Advanced (Claude Sonnet)</option>
                            </select>
                            <button id="aipg-toggle-outlines-btn" class="aipg-save-btn" style="margin-left: 10px; background: ${self.outlinesEnabled ? '#e67e22' : '#7f8c8d'};" title="Show Structural Outlines">
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-right: 4px; vertical-align: middle;"><path d="M4 4h16v16H4z"></path></svg>
                                Outlines
                            </button>
                            <button id="aipg-save-project-btn" class="aipg-save-btn">Save Project</button>
                            <button id="aipg-exit-wizard-btn" class="aipg-exit-btn" title="Exit to Wizard">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            </button>
                        `);
                    }
                }
            });

            // Toggle Outlines Click
            $(document).on('click', '#aipg-toggle-outlines-btn', function (e) {
                e.stopPropagation();
                self.outlinesEnabled = !self.outlinesEnabled;
                localStorage.setItem('aipg_outlines_enabled', self.outlinesEnabled);

                const $btn = $(this);
                if (self.outlinesEnabled) {
                    $btn.css('background', '#e67e22');
                } else {
                    $btn.css('background', '#7f8c8d');
                    $('.aipg-outline-parent-1, .aipg-outline-parent-2, .aipg-outline-child-1, .aipg-outline-child-2').removeClass('aipg-outline-parent-1 aipg-outline-parent-2 aipg-outline-child-1 aipg-outline-child-2');
                }
            });

            // Model Tier Change (delegated due to dynamic DOM)
            $(document).on('change', '#aipg-model-tier-select', function (e) {
                e.stopPropagation();
                self.modelTier = $(this).val();
                localStorage.setItem('aipg_model_tier', self.modelTier);
                console.log('[AI Studio] Active Model Tier:', self.modelTier);
            });

            // Exit Wizard Button
            $(document).on('click', '#aipg-exit-wizard-btn', function (e) {
                e.stopPropagation();
                if (confirm('Exit to Onboarding Wizard? Any unsaved changes on this page will be lost.')) {
                    window.location.href = aipg_editor_vars.wizard_url;
                }
            });

            // Modal Actions
            $('#aipg-cancel-edit').on('click', () => self.closeModal());
            $('#aipg-submit-edit').on('click', () => self.submitToAi());
            $('#aipg-close-error-modal').on('click', () => self.closeErrorModal());

            $('#aipg-copy-error-btn').on('click', function (e) {
                e.stopPropagation();
                const textToCopy = $('#aipg-error-diagnostics').text();
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const $btn = $(this);
                    const originalText = $btn.text();
                    $btn.text('Copied!');
                    setTimeout(() => $btn.text(originalText), 2000);
                });
            });

            $('.aipg-modal-backdrop').on('click', () => {
                self.closeModal();
                self.closeErrorModal();
            });
        },

        updateModeUI: function () {
            if (this.aiEnabled) {
                this.$toggle.addClass('aipg-mode-ai');
                this.$toggle.find('.aipg-mode-label').text('AI Edit Mode: ON');
                this.$toggle.find('.aipg-mode-desc').text('Hover/Click elements to edit layout');
            } else {
                this.$toggle.removeClass('aipg-mode-ai');
                this.$toggle.find('.aipg-mode-label').text('Preview Mode');
                this.$toggle.find('.aipg-mode-desc').text('Standard site interaction');
            }
        },

        highlightBlock: function ($block) {
            this.$currentBlock = $block;
            const offset = $block.offset();
            const width = $block.outerWidth();
            const height = $block.outerHeight();

            // Toggle compact mode for small elements - avoid overlapping icons
            if (width < 120 || height < 60) {
                this.$overlay.addClass('aipg-compact');
            } else {
                this.$overlay.removeClass('aipg-compact');
            }

            this.$overlay.css({
                top: offset.top,
                left: offset.left,
                width: width,
                height: height
            }).addClass('aipg-active').show();
        },

        openModal: function () {
            this.isEditing = true;
            $('.aipg-modal-backdrop').fadeIn(200);
            $('#aipg-refine-modal').fadeIn(200);
            $('#aipg-prompt-input').val('').focus();
            $('#aipg-submit-edit').text('Update Block').prop('disabled', false);
        },

        closeModal: function () {
            this.isEditing = false;
            $('.aipg-modal-backdrop').fadeOut(200);
            $('#aipg-refine-modal').fadeOut(200);
            this.$overlay.hide();
        },

        showErrorModal: function (message, diagnosticsObj = null) {
            this.isEditing = true;
            $('#aipg-refine-modal').hide(); // Hide refinement modal if it was open

            $('#aipg-error-message').text(message);

            const $diagContainer = $('.aipg-diagnostics-container');
            const $copyBtn = $('#aipg-copy-error-btn');

            if (diagnosticsObj) {
                try {
                    const diagStr = JSON.stringify(diagnosticsObj, null, 2);
                    $('#aipg-error-diagnostics').text(diagStr);
                    $diagContainer.show();
                    $copyBtn.show();
                } catch (e) {
                    $diagContainer.hide();
                    $copyBtn.hide();
                }
            } else {
                $diagContainer.hide();
                $copyBtn.hide();
            }

            $('.aipg-modal-backdrop').fadeIn(200);
            $('#aipg-error-modal').fadeIn(200);
        },

        closeErrorModal: function () {
            this.isEditing = false;
            $('.aipg-modal-backdrop').fadeOut(200);
            $('#aipg-error-modal').fadeOut(200);
            this.$overlay.hide();
        },

        getComputedStyles: function ($el) {
            const el = $el[0];
            const styles = window.getComputedStyle(el);
            return {
                fontSize: styles.fontSize,
                fontWeight: styles.fontWeight,
                color: styles.color,
                backgroundColor: styles.backgroundColor,
                fontFamily: styles.fontFamily,
                padding: styles.padding,
                margin: styles.margin,
                lineHeight: styles.lineHeight,
                textAlign: styles.textAlign,
                borderRadius: styles.borderRadius,
                display: styles.display
            };
        },

        submitToAi: function () {
            const self = this;
            const prompt = $('#aipg-prompt-input').val();
            const $block = this.$currentBlock;
            const $btn = $('#aipg-submit-edit');

            if (!prompt) return;

            // Clean capture: recursively remove AI Studio temporary classes before sending to AI

            let $target = $block;
            let $targetContainer = $block;
            let isDived = false;

            // Check if we selected a theme wrapper or something containing theme-level elements
            const containsContentArea = $block.find('.entry-content, .wp-block-post-content').length > 0;
            const isContentArea = $block.hasClass('entry-content') || $block.hasClass('wp-block-post-content');
            const isHighLevelWrapper = $block.prop("tagName") === 'MAIN' || $block.prop("tagName") === 'BODY' || $block.hasClass('wp-site-blocks');

            const isThemeContainer = isContentArea || containsContentArea || isHighLevelWrapper;
            const isGutenbergBlock = $block.attr('class') && $block.attr('class').includes('wp-block-') && !$block.hasClass('wp-block-post-title');

            if (isThemeContainer || !isGutenbergBlock) {
                // Find all blocks INSIDE the content area (skip theme-level wrappers)
                let $contentArea = $block;
                if (containsContentArea && !isContentArea) {
                    $contentArea = $block.find('.entry-content, .wp-block-post-content').first();
                }

                if ($contentArea.length) {
                    // Surgical Recovery: Only take IMMEDIATE blocks from the content area
                    const $topLevelBlocks = $contentArea.children('[class*="wp-block-"]');
                    if ($topLevelBlocks.length) {
                        const $virtual = $('<div></div>').append($topLevelBlocks.clone());
                        $target = $virtual;
                        $targetContainer = $contentArea;
                        isDived = true;
                    }
                }
            }

            const $clone = $target.clone();
            $clone.removeClass('aipg-refining aipg-active-hover');
            $clone.find('.aipg-refining, .aipg-active-hover').removeClass('aipg-refining aipg-active-hover');

            // If we're using a virtual container, just send its innerHTML (the sequence of blocks)
            const originalMarkup = isDived ? $clone.html() : $clone[0].outerHTML;

            // Context capturing: Isolate parent context by replacing selected block with a placeholder
            const computedStyles = this.getComputedStyles($block);
            let parentMarkup = '';

            // Get up to 2 levels of parents for better visual context
            let $contextWrapper = $block.parent();
            if ($contextWrapper.length) {
                if ($contextWrapper.parent().length && !$contextWrapper.parent().is('body, html')) {
                    $contextWrapper = $contextWrapper.parent();
                }
                // Mark the target inside original to find it in clone
                $block.addClass('aipg-temp-target-marker');
                const $cloneToProcess = $contextWrapper.clone();
                $block.removeClass('aipg-temp-target-marker');

                $cloneToProcess.find('.aipg-temp-target-marker').replaceWith('[TARGET_BLOCK_TO_REPLACE_HERE]');
                parentMarkup = $cloneToProcess[0].outerHTML.substring(0, 6000); // Send more context
            }

            $btn.text('AI is thinking...').prop('disabled', true);

            // Visual feedback: block starts pulsing
            $block.addClass('aipg-refining');
            this.closeModal();

            const payload = {
                action: 'aipg_studio_contextual_edit',
                nonce: aipg_editor_vars.nonce,
                prompt: prompt,
                markup: originalMarkup,
                computed_styles: JSON.stringify(computedStyles),
                parent_markup: parentMarkup,
                post_id: aipg_editor_vars.post_id,
                model_tier: this.modelTier
            };

            $.ajax({
                url: aipg_editor_vars.ajaxurl,
                type: 'POST',
                data: payload,
                timeout: 120000, // 2 minutes for slow Pro models
                success: function (response) {
                    $block.removeClass('aipg-refining');

                    if (response.success) {
                        const newMarkup = response.data.new_markup;
                        const newStyles = response.data.new_styles;

                        if (newStyles) {
                            // Inject dynamic block-support styles (Flex/Grid)
                            const styleId = 'aipg-dynamic-block-styles';
                            let $style = $('#' + styleId);
                            if (!$style.length) {
                                $style = $('<style id="' + styleId + '"></style>').appendTo('head');
                            }
                            // Append new styles so side-by-side (flex) classes work live
                            $style.html(newStyles);
                        }

                        let $newElement = $(newMarkup);
                        $newElement.addClass('aipg-fade-in');

                        if (isDived) {
                            // Update the inner content of the specific content area (preserves title/wrappers)
                            $targetContainer.html($newElement);
                        } else {
                            // Standard block replacement
                            // Fallback for Dynamic Blocks like Template Parts that render as pure HTML
                            // and might lose their jQuery bindings or structural wrapper
                            if ($block.is('footer, header, main, .wp-block-template-part')) {
                                // For structural tags, destroying the tag with .replaceWith() often strips 
                                // critical FSE theme classes (like alignfull, is-layout-constrained) making it vanish.
                                // Instead, we will merge the new styles and replace only the inner HTML.

                                let $actualReplacement = $newElement;

                                if (!$newElement.is($block.prop('tagName'))) {
                                    let $innerTag = $('<div>').append($newElement).find($block.prop('tagName')).first();
                                    if ($innerTag.length > 0) {
                                        $actualReplacement = $innerTag;
                                    }
                                }


                                if ($actualReplacement.is($block.prop('tagName'))) {
                                    // It matches! Preserve the original $block node.
                                    // 1. Update Inner HTML
                                    $block.html($actualReplacement.html());

                                    // 2. Apply new AI styles
                                    const newStyle = $actualReplacement.attr('style');
                                    if (newStyle) {
                                        $block.attr('style', newStyle);
                                    }

                                    // 3. Add any new generated classes without destroying original ones
                                    const newClass = $actualReplacement.attr('class');
                                    if (newClass) {
                                        $block.addClass(newClass);
                                    }
                                } else {
                                    // Absolute fallback - ensure we don't nest a full wrapper inside
                                    // by taking the innerHTML if the wrapper has children
                                    if ($newElement.children().length > 0) {
                                        $block.html($newElement.html());
                                    } else {
                                        $block.html($newElement); // fallback if it's just raw content
                                    }

                                    // Still apply the new styles/classes to the preserved structural block
                                    const newStyle = $newElement.attr('style');
                                    if (newStyle) $block.attr('style', newStyle);

                                    const newClass = $newElement.attr('class');
                                    if (newClass) $block.addClass(newClass);
                                }

                                $block.addClass('aipg-fade-in');

                                // Re-bind overlay clicking events to the new element
                                if (typeof window.aipgBindOverlayEvents === 'function') {
                                    window.aipgBindOverlayEvents();
                                }
                            } else {
                                $block.replaceWith($newElement);
                            }
                        }
                        $('#aipg-submit-edit').text('Update Block').prop('disabled', false);
                    } else {
                        const errorMsg = typeof response.data === 'string' ? response.data : (response.data.message || 'Unknown error');
                        const diagData = (response.data && response.data.diagnostics) ? response.data.diagnostics : null;

                        if (diagData) {
                            console.error('[AI Studio] Refinement Diagnostics:', diagData);
                        }

                        self.showErrorModal(errorMsg, diagData);
                        $btn.text('Try Again').prop('disabled', false);
                    }
                },
                error: function (xhr, status, error) {
                    $block.removeClass('aipg-refining');
                    let errMsg = 'Server error while refining block.';
                    if (status === 'timeout') {
                        errMsg = 'The AI took too long to respond (timeout). Please try a simpler request.';
                    }
                    self.showErrorModal(errMsg, { status: status, error: error, details: xhr.responseText });
                    console.error('[AI Studio] Request Error:', status, error, xhr);
                    $btn.text('Try Again').prop('disabled', false);
                }
            });
        },

        saveProject: function () {
            const name = prompt('Enter a name for this project version:', 'New Design Variation');
            if (!name) return;

            const $btn = $('#aipg-save-project-btn');
            const originalText = $btn.text();
            $btn.text('Saving...').prop('disabled', true);

            const payload = {
                action: 'aipg_save_as_project',
                nonce: aipg_editor_vars.nonce,
                post_id: aipg_editor_vars.post_id,
                name: name
            };

            $.post(aipg_editor_vars.ajaxurl, payload, function (response) {
                if (response.success) {
                    alert(response.data);
                    $btn.text('Saved!').addClass('aipg-save-success');
                    setTimeout(() => {
                        $btn.text(originalText).removeClass('aipg-save-success').prop('disabled', false);
                    }, 3000);
                } else {
                    alert('Error: ' + response.data);
                    $btn.text(originalText).prop('disabled', false);
                }
            });
        }
    };

    $(document).ready(() => AIStudioEditor.init());

})(jQuery);
