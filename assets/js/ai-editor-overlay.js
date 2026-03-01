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

        init: function () {
            this.aiEnabled = localStorage.getItem('aipg_ai_enabled') !== 'false';
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
                <div class="aipg-editor-modal">
                    <h3>Refine this section</h3>
                    <p style="font-size: 13px; color: #666;">Provide a prompt to AI to modify this specific block.</p>
                    <textarea id="aipg-prompt-input" placeholder="e.g., 'Make this heading more professional', 'Add a button below the text', 'Change this background'"></textarea>
                    <div style="text-align: right;">
                        <button class="ws-btn-secondary" id="aipg-cancel-edit">Cancel</button>
                        <button class="ws-btn-primary" id="aipg-submit-edit">Update Block</button>
                    </div>
                </div>
            `).appendTo('body');

            // Float Toggle Mode
            this.$toggle = $(`
                <div class="aipg-mode-toggle">
                    <div class="aipg-toggle-switch"><div class="aipg-toggle-knob"></div></div>
                    <div>
                        <div class="aipg-mode-label">AI Edit Mode</div>
                        <div class="aipg-mode-desc">Click elements to refine</div>
                    </div>
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

                // Stop propagation so we pick the innermost block when hovering specifically,
                // BUT we allow the user to reach outer blocks if they hover on their edges.
                e.stopPropagation();
                self.highlightBlock($el);
            });

            $(document).on('mouseleave', '[class*="wp-block-"]', function () {
                if (!self.aiEnabled || self.isEditing) return;
                self.$overlay.hide();
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

            // Toggle Mode Click
            this.$toggle.on('click', function () {
                self.aiEnabled = !self.aiEnabled;
                localStorage.setItem('aipg_ai_enabled', self.aiEnabled);
                self.updateModeUI();
                if (!self.aiEnabled) self.$overlay.hide();
            });

            // Modal Actions
            $('#aipg-cancel-edit').on('click', () => self.closeModal());
            $('#aipg-submit-edit').on('click', () => self.submitToAi());
            $('.aipg-modal-backdrop').on('click', () => self.closeModal());
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

            // Toggle compact mode for small elements
            if (width < 120) {
                this.$overlay.addClass('aipg-compact');
            } else {
                this.$overlay.removeClass('aipg-compact');
            }

            this.$overlay.css({
                top: offset.top,
                left: offset.left,
                width: width,
                height: height
            }).show();
        },

        openModal: function () {
            this.isEditing = true;
            $('.aipg-modal-backdrop').fadeIn(200);
            $('.aipg-editor-modal').fadeIn(200);
            $('#aipg-prompt-input').val('').focus();
            $('#aipg-submit-edit').text('Update Block').prop('disabled', false);
        },

        closeModal: function () {
            this.isEditing = false;
            $('.aipg-modal-backdrop').fadeOut(200);
            $('.aipg-editor-modal').fadeOut(200);
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
            if ($block.parent().length) {
                const $parentClone = $block.parent().clone();
                // Find the index of the current block in its parent to replace it accurately in the clone
                const blockIndex = $block.index();
                $parentClone.children().eq(blockIndex).replaceWith('[SELECTED_BLOCK_HERE]');
                parentMarkup = $parentClone[0].outerHTML.substring(0, 4000);
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
                post_id: aipg_editor_vars.post_id
            };

            $.post(aipg_editor_vars.ajaxurl, payload, function (response) {
                $block.removeClass('aipg-refining');

                if (response.success) {
                    const newMarkup = response.data.new_markup;
                    const $newElement = $(newMarkup);
                    $newElement.addClass('aipg-fade-in');

                    if (isDived) {
                        // Update the inner content of the specific content area (preserves title/wrappers)
                        $targetContainer.html($newElement);
                    } else {
                        // Standard block replacement
                        $block.replaceWith($newElement);
                    }
                    $('#aipg-submit-edit').text('Update Block').prop('disabled', false);
                } else {
                    const errorMsg = typeof response.data === 'string' ? response.data : (response.data.message || 'Unknown error');
                    if (response.data && response.data.diagnostics) {
                        console.error('[AI Studio] Refinement Diagnostics:', response.data.diagnostics);
                    }
                    alert('AI Refinement Error: ' + errorMsg);
                    $btn.text('Try Again').prop('disabled', false);
                }
            }).fail((xhr) => {
                $block.removeClass('aipg-refining');
                alert('Server error while refining block.');
                console.error('[AI Studio] Request Error:', xhr);
                $btn.text('Try Again').prop('disabled', false);
            });
        }
    };

    $(document).ready(() => AIStudioEditor.init());

})(jQuery);
