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
                
                <!-- AI Editor Sidebar -->
                <div class="aipg-editor-modal" id="aipg-refine-modal">
                    <div class="aipg-sidebar-header">
                        <h3>Edit Block</h3>
                        <button class="ws-btn-secondary" id="aipg-close-sidebar-btn" style="padding: 4px 8px; margin: 0; background: transparent; color: #888;">✕</button>
                    </div>

                    <div class="aipg-sidebar-tabs">
                        <button class="aipg-tab-btn active" data-tab="ai-prompt">AI Magic</button>
                        <button class="aipg-tab-btn" data-tab="manual-tweaks">Manual Tweaks</button>
                    </div>

                    <!-- AI Tab -->
                    <div class="aipg-tab-content active" id="tab-ai-prompt">
                        <p style="font-size: 12px; color: #888; margin-top: 0;">Provide a prompt to AI to modify this block structure or styling.</p>
                        <textarea id="aipg-prompt-input" placeholder="e.g., 'Make this heading more professional', 'Change this background'"></textarea>
                        
                        <div class="aipg-control-group" style="margin-top: 15px;">
                            <button class="ws-btn-primary" id="aipg-submit-edit" style="width: 100%;">Refine with AI</button>
                        </div>
                    </div>

                    <!-- Manual Tweaks Tab -->
                    <div class="aipg-tab-content" id="tab-manual-tweaks">
                        <div class="aipg-control-group">
                            <label class="aipg-control-label">Width Constraints</label>
                            <select id="aipg-manual-width">
                                <option value="constrained">Content Width (Constrained)</option>
                                <option value="full">Full Width (Align: Full)</option>
                            </select>
                        </div>

                        <div class="aipg-control-group">
                            <label class="aipg-control-label">Padding Top (REM)</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="range" id="aipg-manual-pt-range" min="0" max="20" step="0.5" value="0">
                                <span id="aipg-manual-pt-val" style="font-size:12px;color:#fff;width:30px;">0</span>
                            </div>
                        </div>

                        <div class="aipg-control-group">
                            <label class="aipg-control-label">Padding Bottom (REM)</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="range" id="aipg-manual-pb-range" min="0" max="20" step="0.5" value="0">
                                <span id="aipg-manual-pb-val" style="font-size:12px;color:#fff;width:30px;">0</span>
                            </div>
                        </div>

                        <div class="aipg-control-group">
                            <label class="aipg-control-label">Background Color</label>
                            <div style="display: flex; gap: 10px;">
                                <input type="color" id="aipg-manual-bg-color" value="#000000" style="width: 40px; padding: 0; cursor: pointer;">
                                <button class="ws-btn-secondary" id="aipg-clear-bg-color" style="flex: 1; margin: 0; font-size: 12px; padding: 4px;">Clear Color</button>
                            </div>
                        </div>

                        <div class="aipg-control-group" style="margin-top: 15px; border-top: 1px solid #333; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 11px; color: #888;">Auto-saves on change</span>
                            <span id="aipg-manual-save-status" style="font-size: 12px; font-weight: bold; color: #aaa;"></span>
                        </div>
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
            const targetSelectors = '[class*="wp-block-"], header, footer, main, nav, section, article, div, p, span, h1, h2, h3, h4, h5, h6, a, img, button, ul, ol, li, blockquote, figure, figcaption';

            $(document).on('mouseenter', targetSelectors, function (e) {
                if (!self.aiEnabled || self.isEditing) return;
                const $el = $(this);

                const isGlobalWrapper = $el.is('body, html, .wp-site-blocks, .is-root-container, #wp-studio-wizard-root');
                if (isGlobalWrapper) {
                    // Ignore hover for structural high-level wrappers
                    self.$overlay.hide();
                    return;
                }

                // Protect against hovering over our own modals/UI
                if ($el.closest('.aipg-editor-modal, .aipg-mode-toggle, .aipg-block-overlay').length > 0) return;

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

            $(document).on('mouseleave', targetSelectors, function () {
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

            // Sidebar Close Button
            $('#aipg-close-sidebar-btn').on('click', () => self.closeModal());

            // Tab Switching functionality
            $('.aipg-sidebar-tabs .aipg-tab-btn').on('click', function () {
                $('.aipg-sidebar-tabs .aipg-tab-btn').removeClass('active');
                $(this).addClass('active');

                $('.aipg-tab-content').removeClass('active');
                $('#tab-' + $(this).data('tab')).addClass('active');
            });

            // Modal Actions
            $('#aipg-cancel-edit').on('click', () => self.closeModal());
            $('#aipg-submit-edit').on('click', () => self.submitToAi());
            $('#aipg-close-error-modal').on('click', () => self.closeErrorModal());

            // Manual Tweak Live Preview (Instant DOM Update)
            $('#aipg-manual-pt-range').on('input', function () {
                const val = $(this).val();
                $('#aipg-manual-pt-val').text(val);
                if (self.$currentBlock) self.$currentBlock.css('padding-top', val + 'rem');
            });
            $('#aipg-manual-pb-range').on('input', function () {
                const val = $(this).val();
                $('#aipg-manual-pb-val').text(val);
                if (self.$currentBlock) self.$currentBlock.css('padding-bottom', val + 'rem');
            });
            $('#aipg-manual-bg-color').on('input', function () {
                const val = $(this).val();
                if (self.$currentBlock) self.$currentBlock.css('background-color', val);
            });
            $('#aipg-manual-width').on('change', function () {
                const val = $(this).val();
                if (self.$currentBlock) {
                    if (val === 'full') {
                        self.$currentBlock.addClass('alignfull');
                        // Force nested Gutenberg inner containers to expand
                        self.$currentBlock.find('.wp-block-group__inner-container').css('max-width', '100%');
                    } else {
                        self.$currentBlock.removeClass('alignfull');
                        self.$currentBlock.find('.wp-block-group__inner-container').css('max-width', '');
                    }
                }
            });

            // Manual Tweak Database Save (Triggers on release of slider or exact selection)
            $('#aipg-manual-width, #aipg-manual-pt-range, #aipg-manual-pb-range, #aipg-manual-bg-color').on('change', function () {
                self.saveManualTweaks(false);
            });

            $('#aipg-clear-bg-color').on('click', function () {
                $('#aipg-manual-bg-color').val('#000000');
                if (self.$currentBlock) self.$currentBlock.css('background-color', '');
                self.saveManualTweaks(true); // Flag for clearing color
            });

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
            $('#aipg-refine-modal').addClass('aipg-sidebar-open');
            $('#aipg-prompt-input').val('').focus();
            $('#aipg-submit-edit').text('Refine with AI').prop('disabled', false);

            // Populate manual tweak inputs with current block state
            this.syncManualInputsWithBlock();
        },

        closeModal: function () {
            this.isEditing = false;
            $('.aipg-modal-backdrop').fadeOut(200);
            $('#aipg-refine-modal').removeClass('aipg-sidebar-open');
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

        rgbToHex: function (rgb) {
            if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return null;
            let sep = rgb.indexOf(",") > -1 ? "," : " ";
            rgb = rgb.substr(4).split(")")[0].split(sep);
            let r = (+rgb[0]).toString(16), g = (+rgb[1]).toString(16), b = (+rgb[2]).toString(16);
            if (r.length == 1) r = "0" + r;
            if (g.length == 1) g = "0" + g;
            if (b.length == 1) b = "0" + b;
            return "#" + r + g + b;
        },

        syncManualInputsWithBlock: function () {
            if (!this.$currentBlock) return;
            const styles = this.getComputedStyles(this.$currentBlock);

            // Width
            if (this.$currentBlock.hasClass('alignfull')) {
                $('#aipg-manual-width').val('full');
            } else {
                $('#aipg-manual-width').val('constrained');
            }

            // Padding px to rem approximation
            const ptPx = parseFloat(styles.paddingTop) || 0;
            const pbPx = parseFloat(styles.paddingBottom) || 0;
            const baseFontSize = 16;

            const ptVal = (ptPx / baseFontSize).toFixed(1);
            const pbVal = (pbPx / baseFontSize).toFixed(1);

            $('#aipg-manual-pt-range').val(ptVal);
            $('#aipg-manual-pt-val').text(ptVal);

            $('#aipg-manual-pb-range').val(pbVal);
            $('#aipg-manual-pb-val').text(pbVal);

            // Background Color
            const hexColor = this.rgbToHex(styles.backgroundColor);
            if (hexColor) {
                $('#aipg-manual-bg-color').val(hexColor);
            } else {
                $('#aipg-manual-bg-color').val('#000000');
            }
        },

        saveManualTweaks: function (clearColor = false, callback = null) {
            if (!this.$currentBlock) return;
            const $block = this.$currentBlock;

            // Extract values
            const width = $('#aipg-manual-width').val();
            const pt = $('#aipg-manual-pt-range').val();
            const pb = $('#aipg-manual-pb-range').val();
            const bgColor = clearColor ? 'CLEAR' : $('#aipg-manual-bg-color').val();

            // Prepare markup target (strip temp tracking classes and temp CSS)
            const $clone = $block.clone();
            $clone.removeClass('aipg-refining aipg-active-hover');
            $clone.find('.aipg-refining, .aipg-active-hover').removeClass('aipg-refining aipg-active-hover');

            // Revert temporary max-width hacks before serialization
            $clone.find('.wp-block-group__inner-container').css('max-width', '');

            const originalMarkup = $clone[0].outerHTML;

            const payload = {
                action: 'aipg_studio_manual_edit',
                nonce: aipg_editor_vars.nonce,
                markup: originalMarkup,
                post_id: parseInt(aipg_editor_vars.post_id, 10),
                width: width,
                padding_top: pt,
                padding_bottom: pb,
                bg_color: bgColor
            };

            $.ajax({
                url: aipg_editor_vars.ajaxurl + '?action=aipg_studio_manual_edit',
                type: 'POST',
                data: payload,
                success: function (res) {
                    if (!res.success) {
                        console.error('[AI Studio] Manual Tweak Save Failed:', res.data);
                        alert("Error saving tweaks: " + res.data);
                    } else {
                        console.log('[AI Studio] Manual Tweak Saved Successfully.');
                        if (callback) callback();
                    }
                },
                error: function (xhr, status, error) {
                    console.error('[AI Studio] Server error during saving manual tweak:', error);
                    alert("Server error connecting to backend.");
                }
            });
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

            // Allow native HTML elements to pass through directly without surgical unwrapping
            const isNativeHTML = $block.is('p, span, h1, h2, h3, h4, h5, h6, a, img, button, ul, ol, li, blockquote, figure, figcaption');
            const isGutenbergBlock = ($block.attr('class') && $block.attr('class').includes('wp-block-') && !$block.hasClass('wp-block-post-title')) || isNativeHTML;

            // Only run surgical extraction if it's explicitly a theme container, OR a generic structural div wrapping Gutenberg blocks
            if (isThemeContainer || (!isGutenbergBlock && $block.is('div, section, article, nav'))) {
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

            try {
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

                console.log('[AI Studio] Sending Refinement Request:', {
                    action: payload.action,
                    prompt: payload.prompt,
                    markupLength: payload.markup.length,
                    parentMarkupLength: payload.parent_markup.length
                });

                $.ajax({
                    url: aipg_editor_vars.ajaxurl + '?action=aipg_studio_contextual_edit',
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

                            if (response.data.is_template_part) {
                                // The backend updated an entire template part (like Header/Footer).
                                // Replace the closest template part container rather than the specific block hovered.
                                let $tpContainer = $block.closest('header, footer, [class*="wp-block-template-part"]');
                                if ($tpContainer.length) {
                                    console.log('[AI Studio] Replacer: Replacing Template Part Container', { old: $tpContainer[0].outerHTML, new: $newElement[0].outerHTML });
                                    $tpContainer.replaceWith($newElement);
                                } else {
                                    console.log('[AI Studio] Replacer: Replacing Template Part Block', { old: $block[0].outerHTML, new: $newElement[0].outerHTML });
                                    $block.replaceWith($newElement);
                                }
                            } else if (isDived) {
                                // Update the inner content of the specific content area (preserves title/wrappers)
                                console.log('[AI Studio] Replacer: Diving content via .html()', { container: $targetContainer[0].outerHTML, innerHTML: newMarkup });
                                $targetContainer.html($newElement);
                            } else {
                                // Standard block replacement
                                console.log('[AI Studio] Replacer: Standard replaceWith', { old: $block[0].outerHTML, new: $newElement.prop('outerHTML') || newMarkup });
                                $block.replaceWith($newElement);
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
            } catch (err) {
                console.error('[AI Studio] Critical Payload Error:', err);
                $block.removeClass('aipg-refining');
                $('#aipg-submit-edit').text('Update Block').prop('disabled', false);
                alert('JS Error while preparing payload: ' + err.message);
            }
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
