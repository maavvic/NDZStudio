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
        originalBlockMarkup: null,
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
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="aipg-logo-sparkle">✨</div>
                            <h3 style="margin:0; font-size:15px;">AI Studio Builder</h3>
                        </div>
                        <button class="ws-btn-secondary" id="aipg-close-sidebar-btn" style="padding: 4px 8px; margin: 0; background: transparent; color: #888;">✕</button>
                    </div>

                    <div class="aipg-sidebar-tabs">
                        <button class="aipg-tab-btn active" data-tab="ai-prompt">AI Magic</button>
                        <button class="aipg-tab-btn" data-tab="manual-style">Styles</button>
                        <button class="aipg-tab-btn" data-tab="add-blocks">Add</button>
                    </div>

                    <div class="aipg-sidebar-scroll-area">
                        <!-- AI Tab -->
                        <div class="aipg-tab-content active" id="tab-ai-prompt">
                            <p style="font-size: 12px; color: #888; margin-top: 0;">Describe what you want to change, and AI will rebuild the block for you.</p>
                            <textarea id="aipg-prompt-input" placeholder="e.g., 'Make this heading more professional', 'Change this background'"></textarea>
                            
                            <div class="aipg-control-group" style="margin-top: 15px;">
                                <button class="ws-btn-primary" id="aipg-submit-edit" style="width: 100%;">Refine with AI</button>
                            </div>

                            <div id="aipg-ai-polish-hint" style="margin-top: 15px; padding: 10px; background: rgba(230, 126, 34, 0.1); border-radius: 6px; border-left: 3px solid #e67e22; display: none;">
                                <p style="font-size: 11px; margin: 0; color: #e67e22; line-height: 1.4;">
                                    <strong>AI Polish Mode:</strong> You've made manual changes. Mention them in your prompt if you want AI to "perfect" them.
                                </p>
                            </div>
                        </div>

                        <!-- Style Tab (Manual Overrides) -->
                        <div class="aipg-tab-content" id="tab-manual-style">
                            <div class="aipg-control-group">
                                <label class="aipg-control-label">Background Color</label>
                                <div style="display: flex; gap: 8px;">
                                    <input type="color" id="aipg-manual-bg-color" value="#000000" style="width: 44px; padding: 2px; cursor: pointer; height: 32px;">
                                    <button class="ws-btn-secondary" id="aipg-clear-bg-color" style="flex: 1; margin: 0; font-size: 11px; padding: 4px;">Clear</button>
                                </div>
                            </div>

                            <div class="aipg-control-divider">Typography</div>

                            <div class="aipg-control-group">
                                <label class="aipg-control-label">Font Size (px)</label>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <input type="range" id="aipg-manual-fs-range" min="8" max="120" step="1" value="16">
                                    <input type="number" id="aipg-manual-fs-num" value="16" style="width: 50px; text-align: center; font-size: 11px;">
                                </div>
                            </div>

                            <div class="aipg-control-group">
                                <label class="aipg-control-label">Text Color</label>
                                <input type="color" id="aipg-manual-text-color" value="#ffffff" style="height: 32px; padding: 2px;">
                            </div>

                            <div class="aipg-control-divider">Layout & Spacing</div>

                            <div class="aipg-control-group">
                                <label class="aipg-control-label">Padding (Top/Bottom)</label>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <input type="number" id="aipg-manual-pt" placeholder="Top" title="Padding Top (REM)">
                                    <input type="number" id="aipg-manual-pb" placeholder="Bottom" title="Padding Bottom (REM)">
                                </div>
                            </div>

                            <div class="aipg-control-group">
                                <label class="aipg-control-label">Width Constraints</label>
                                <select id="aipg-manual-width">
                                    <option value="">Default (From Theme)</option>
                                    <option value="constrained">Content Width</option>
                                    <option value="full">Full Width</option>
                                </select>
                            </div>

                            <div class="aipg-media-section" id="aipg-image-controls" style="margin-top: 15px; background: #2a2a2a; padding: 12px; border-radius: 8px; border: 1px dashed #444;">
                                <label class="aipg-control-label">Image Settings</label>
                                <button class="ws-btn-secondary" id="aipg-change-media-btn" style="width: 100%; margin-bottom: 10px; font-size: 12px;">🖼️ Swap Image</button>
                                <label class="aipg-control-label">Max Width (%)</label>
                                <input type="range" id="aipg-manual-img-width" min="10" max="100" step="1" value="100">
                            </div>
                        </div>

                        <!-- Add Tab -->
                        <div class="aipg-tab-content" id="tab-add-blocks">
                            <p style="font-size: 11px; color: #888; margin-top: 0;">Add new elements into this section.</p>
                            
                            <div class="aipg-add-grid">
                                <div class="aipg-add-item" data-block="heading">
                                    <div class="aipg-add-icon">H</div>
                                    <span>Heading</span>
                                </div>
                                <div class="aipg-add-item" data-block="paragraph">
                                    <div class="aipg-add-icon">P</div>
                                    <span>Text</span>
                                </div>
                                <div class="aipg-add-item" data-block="image">
                                    <div class="aipg-add-icon">🖼️</div>
                                    <span>Image</span>
                                </div>
                                <div class="aipg-add-item" data-block="button">
                                    <div class="aipg-add-icon">🔘</div>
                                    <span>Button</span>
                                </div>
                                <div class="aipg-add-item" data-block="spacer">
                                    <div class="aipg-add-icon">↕️</div>
                                    <span>Spacer</span>
                                </div>
                                <div class="aipg-add-item" data-block="logo">
                                    <div class="aipg-add-icon">⭐</div>
                                    <span>Logo</span>
                                </div>
                            </div>

                            <div style="margin-top: 20px;">
                                <label class="aipg-control-label">Insert Position</label>
                                <div class="aipg-toggle-group">
                                    <button class="aipg-mini-btn active" data-pos="below">Below Selection</button>
                                    <button class="aipg-mini-btn" data-pos="above">Above Selection</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="aipg-sidebar-footer">
                        <div id="aipg-manual-save-status" style="font-size: 11px; color: #888; flex: 1;">Waiting for changes...</div>
                        <button class="ws-btn-primary" id="aipg-manual-save-btn">Save Changes</button>
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

            // Manual Style Live Preview
            $('#aipg-manual-fs-range').on('input', function () {
                const val = $(this).val();
                $('#aipg-manual-fs-num').val(val);
                if (self.$currentBlock) self.$currentBlock.css('font-size', val + 'px');
                self.markAsManualChanged();
            });
            $('#aipg-manual-fs-num').on('input', function () {
                const val = $(this).val();
                $('#aipg-manual-fs-range').val(val);
                if (self.$currentBlock) self.$currentBlock.css('font-size', val + 'px');
                self.markAsManualChanged();
            });
            $('#aipg-manual-text-color').on('input', function () {
                const val = $(this).val();
                if (self.$currentBlock) self.$currentBlock.css('color', val);
                self.markAsManualChanged();
            });

            $('#aipg-manual-width').on('change', function () {
                const val = $(this).val();
                self.$currentBlock.removeClass('alignfull alignconstrained');
                if (val) self.$currentBlock.addClass('align' + val);
                self.markAsManualChanged();
            });

            $('#aipg-manual-img-width').on('input', function () {
                const val = $(this).val();
                const $img = self.$currentBlock.is('img') ? self.$currentBlock : self.$currentBlock.find('img').first();
                if ($img.length) {
                    $img.css('max-width', val + '%');
                }
                self.markAsManualChanged();
            });

            $('#aipg-manual-pt, #aipg-manual-pb').on('input', function () {
                const pt = $('#aipg-manual-pt').val();
                const pb = $('#aipg-manual-pb').val();
                if (self.$currentBlock) {
                    if (pt) self.$currentBlock.css('padding-top', pt + 'rem');
                    if (pb) self.$currentBlock.css('padding-bottom', pb + 'rem');
                }
                self.markAsManualChanged();
            });

            $('#aipg-manual-bg-color').on('input', function () {
                const val = $(this).val();
                if (self.$currentBlock) self.$currentBlock.css('background-color', val);
                self.markAsManualChanged();
            });

            // Media tab handlers
            $('#aipg-manual-img-width').on('input', function () {
                const val = $(this).val();
                $('#aipg-img-width-val').text(val + '%');
                const $img = self.$currentBlock.is('img') ? self.$currentBlock : self.$currentBlock.find('img').first();
                if ($img.length) {
                    $img.css('max-width', val + '%');
                }
                self.markAsManualChanged();
            });

            // Media Library Integration
            $('#aipg-change-media-btn, #aipg-change-media').on('click', function (e) {
                e.preventDefault();
                if (typeof wp === 'undefined' || !wp.media) return;

                const frame = wp.media({
                    title: 'Select or Upload Media',
                    button: { text: 'Use this media' },
                    multiple: false
                });

                frame.on('select', function () {
                    const attachment = frame.state().get('selection').first().toJSON();
                    if (self.$currentBlock) {
                        const $img = self.$currentBlock.is('img') ? self.$currentBlock : self.$currentBlock.find('img').first();
                        if ($img.length) {
                            $img.attr('src', attachment.url);
                            if (attachment.alt) $img.attr('alt', attachment.alt);
                        }
                    }
                    self.markAsManualChanged();
                });
                frame.open();
            });

            // Add Tab handlers
            $('.aipg-add-item').on('click', function () {
                const type = $(this).data('block');
                self.insertNewBlock(type, 'below');
            });

            $('.aipg-mini-btn').on('click', function () {
                $('.aipg-mini-btn').removeClass('active');
                $(this).addClass('active');
            });

            // Save Buttons
            $('#aipg-manual-save-btn').on('click', () => self.saveManualTweaks());
            $('#aipg-clear-bg-color').on('click', function () {
                $('#aipg-manual-bg-color').val('#000000');
                if (self.$currentBlock) self.$currentBlock.css('background-color', '');
                self.markAsManualChanged();
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

            // Capture original state for lookup during database save
            this.originalBlockMarkup = this.$currentBlock[0].outerHTML;

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
            if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent' || rgb === 'initial') return '#000000';
            const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            if (!match) return '#000000';
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return "#" + r + g + b;
        },

        markAsManualChanged: function () {
            $('#aipg-manual-save-status').text('Changes pending...').css('color', '#e67e22');
            $('#aipg-ai-polish-hint').fadeIn();
        },

        syncManualInputsWithBlock: function () {
            if (!this.$currentBlock) return;
            const el = this.$currentBlock[0];
            const styles = window.getComputedStyle(el);

            // Background
            $('#aipg-manual-bg-color').val(this.rgbToHex(styles.backgroundColor));

            // Typography
            const fs = parseInt(styles.fontSize);
            $('#aipg-manual-fs-range').val(fs);
            $('#aipg-manual-fs-num').val(fs);
            $('#aipg-manual-text-color').val(this.rgbToHex(styles.color));

            // Spacing
            const ptPx = parseFloat(styles.paddingTop) || 0;
            const pbPx = parseFloat(styles.paddingBottom) || 0;
            $('#aipg-manual-pt').val((ptPx / 16).toFixed(1));
            $('#aipg-manual-pb').val((pbPx / 16).toFixed(1));

            // Width
            if (this.$currentBlock.hasClass('alignfull')) $('#aipg-manual-width').val('full');
            else if (this.$currentBlock.hasClass('alignconstrained')) $('#aipg-manual-width').val('constrained');
            else $('#aipg-manual-width').val('');

            // Media
            const $img = this.$currentBlock.is('img') ? this.$currentBlock : this.$currentBlock.find('img').first();
            if ($img.length) {
                $('#aipg-image-controls').show();
                const currentWidth = $img[0].style.maxWidth ? parseInt($img[0].style.maxWidth) : 100;
                $('#aipg-manual-img-width').val(currentWidth);
            } else {
                $('#aipg-image-controls').hide();
            }

            $('#aipg-manual-save-status').text('Selection synced.').css('color', '#888');
            $('#aipg-ai-polish-hint').hide();
        },

        saveManualTweaks: function (callback = null) {
            if (!this.$currentBlock) return;
            const self = this;
            const $block = this.$currentBlock;
            const $saveBtn = $('#aipg-manual-save-btn');

            $saveBtn.text('Saving...').prop('disabled', true);
            $('#aipg-manual-save-status').text('Writing to database...');

            // Extract values for the backend to handle grammar nicely
            const width = $('#aipg-manual-width').val();
            const pt = $('#aipg-manual-pt').val();
            const pb = $('#aipg-manual-pb').val();
            const bgColor = $('#aipg-manual-bg-color').val();
            const textColor = $('#aipg-manual-text-color').val();
            const fontSize = $('#aipg-manual-fs-range').val();
            const imgWidth = $('#aipg-manual-img-width').val(); // New: Image width

            // Prepare markup (always grab fresh DOM)
            const $clone = $block.clone();
            $clone.removeClass('aipg-refining aipg-active-hover');

            // Clean up temporary styles that shouldn't be in DB
            const markup = $clone[0].outerHTML;

            const payload = {
                action: 'aipg_studio_manual_edit',
                nonce: aipg_editor_vars.nonce,
                markup: markup,
                lookup_markup: self.originalBlockMarkup, // Use the state from before tweaks
                post_id: parseInt(aipg_editor_vars.post_id, 10),
                width: width,
                padding_top: pt,
                padding_bottom: pb,
                bg_color: bgColor,
                text_color: textColor,
                font_size: fontSize,
                img_width: imgWidth // New: Image width
            };

            $.ajax({
                url: aipg_editor_vars.ajaxurl,
                type: 'POST',
                data: payload,
                success: function (res) {
                    $saveBtn.text('Save Changes').prop('disabled', false);
                    if (res.success) {
                        $('#aipg-manual-save-status').text('Saved!').css('color', '#27ae60');
                        $('#aipg-ai-polish-hint').hide();
                        setTimeout(() => $('#aipg-manual-save-status').text('All changes saved.').css('color', '#888'), 2000);
                        if (callback) callback();
                    } else {
                        self.showErrorModal('Manual Save Failed', res.data);
                    }
                },
                error: function () {
                    $saveBtn.text('Save Changes').prop('disabled', false);
                    self.showErrorModal('Connectivity error during manual save.');
                }
            });
        },

        insertNewBlock: function (type, position) {
            if (!this.$currentBlock) return;
            const self = this;

            // Temporary insertion for visual feedback
            let html = '';
            switch (type) {
                case 'heading': html = '<h2>New Heading</h2>'; break;
                case 'paragraph': html = '<p>Write your content here...</p>'; break;
                case 'button': html = '<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Click Me</a></div>'; break;
                case 'image': html = '<figure class="wp-block-image size-full"><img src="https://via.placeholder.com/800x400" alt="Placeholder"></figure>'; break;
                case 'logo': html = '<div class="wp-block-site-logo"><a class="custom-logo-link"><img src="https://via.placeholder.com/150" style="max-width:150px;" alt="Logo"></a></div>'; break;
                case 'spacer': html = '<div style="height:50px" class="wp-block-spacer"></div>'; break;
            }

            if (position === 'above') {
                this.$currentBlock.before(html);
            } else {
                this.$currentBlock.after(html);
            }

            // We trigger a "manual save" of the WHOLE CONTAINER to ensure the new block is in the DB
            this.markAsManualChanged();
        },

        getComputedStyles: function ($el) {
            if (!$el || !$el.length) return {};
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

            // ATOMIC REFINEMENT: If we are inside a template part (header/footer),
            // we should refine the ENTIRE template part as one atomic unit to prevent nesting issues.
            const $tpContainer = $block.closest('[class*="aipg-part-"]');
            if ($tpContainer.length) {
                console.log('[AI Studio] Atomic Mode: Detected Template Part parent. Switching target to:', $tpContainer.prop('tagName'));
                $target = $tpContainer;
                $targetContainer = $tpContainer;
            }

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
                                // Try to find the closest template part container by our internal class first, then semantic tags.
                                let $tpContainer = $block.closest('[class*="aipg-part-"], header, footer, [class*="wp-block-template-part"]');

                                if ($tpContainer.length) {
                                    console.log('[AI Studio] Replacer: Replacing Template Part Container', {
                                        selector: $tpContainer.prop("tagName"),
                                        oldSize: $tpContainer[0].outerHTML.length,
                                        newSize: $newElement[0].outerHTML.length
                                    });
                                    $tpContainer.replaceWith($newElement);
                                } else {
                                    console.log('[AI Studio] Replacer: Replacing Template Part Block (Fallback)', {
                                        oldSize: $block[0].outerHTML.length,
                                        newSize: $newElement[0].outerHTML.length
                                    });
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
