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

            // Add Omni-directional Insert Nodes
            const dirs = ['top', 'bottom', 'left', 'right'];
            dirs.forEach(dir => {
                this.$overlay.append(`
                    <div class="aipg-omni-node aipg-omni-${dir}">
                        <button class="aipg-omni-btn aipg-omni-dup" data-dir="${dir}" title="Duplicate element here">+</button>
                        <button class="aipg-omni-btn aipg-omni-ai" data-dir="${dir}" title="Generate new element with AI">✨</button>
                    </div>
                `);
            });

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
                        <button class="aipg-tab-btn" data-tab="manual-style">Modify</button>
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
                                <label class="aipg-control-label">Width Constraints</label>
                                <select id="aipg-manual-width">
                                    <option value="">Default (From Theme)</option>
                                    <option value="constrained">Content Width</option>
                                    <option value="full">Full Width</option>
                                </select>
                            </div>

                            <div class="aipg-control-group">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                    <label class="aipg-control-label" style="margin: 0;">Margin</label>
                                    <div style="display: flex; gap: 8px; align-items: center;">
                                        <select id="aipg-margin-unit" class="aipg-unit-select" style="font-size: 11px; padding: 2px 4px; border-radius: 4px; background: rgba(255,255,255,0.05); color: #ccc; border: 1px solid rgba(255,255,255,0.1);">
                                            <option value="px">px</option>
                                            <option value="em">em</option>
                                            <option value="rem" selected>rem</option>
                                            <option value="%">%</option>
                                        </select>
                                        <button class="aipg-link-btn active" id="aipg-link-margin" title="Link values together">🔗</button>
                                    </div>
                                </div>
                                <input type="range" id="aipg-slider-margin" min="0" max="10" step="0.1" value="0" style="margin-top: 0;">
                                <div class="aipg-spacing-grid aipg-4way">
                                    <div class="aipg-spacing-field">
                                        <input type="number" id="aipg-manual-mt" step="0.1" placeholder="0">
                                        <span>Top</span>
                                    </div>
                                    <div class="aipg-spacing-field">
                                        <input type="number" id="aipg-manual-mr" step="0.1" placeholder="0">
                                        <span>Right</span>
                                    </div>
                                    <div class="aipg-spacing-field">
                                        <input type="number" id="aipg-manual-mb" step="0.1" placeholder="0">
                                        <span>Bottom</span>
                                    </div>
                                    <div class="aipg-spacing-field">
                                        <input type="number" id="aipg-manual-ml" step="0.1" placeholder="0">
                                        <span>Left</span>
                                    </div>
                                </div>
                            </div>

                            <div class="aipg-control-group">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                    <label class="aipg-control-label" style="margin: 0;">Padding</label>
                                    <div style="display: flex; gap: 8px; align-items: center;">
                                        <select id="aipg-padding-unit" class="aipg-unit-select" style="font-size: 11px; padding: 2px 4px; border-radius: 4px; background: rgba(255,255,255,0.05); color: #ccc; border: 1px solid rgba(255,255,255,0.1);">
                                            <option value="px">px</option>
                                            <option value="em">em</option>
                                            <option value="rem" selected>rem</option>
                                            <option value="%">%</option>
                                        </select>
                                        <button class="aipg-link-btn active" id="aipg-link-padding" title="Link values together">🔗</button>
                                    </div>
                                </div>
                                <input type="range" id="aipg-slider-padding" min="0" max="10" step="0.1" value="0" style="margin-top: 0;">
                                <div class="aipg-spacing-grid aipg-4way">
                                    <div class="aipg-spacing-field">
                                        <input type="number" id="aipg-manual-pt" step="0.1" placeholder="0">
                                        <span>Top</span>
                                    </div>
                                    <div class="aipg-spacing-field">
                                        <input type="number" id="aipg-manual-pr" step="0.1" placeholder="0">
                                        <span>Right</span>
                                    </div>
                                    <div class="aipg-spacing-field">
                                        <input type="number" id="aipg-manual-pb" step="0.1" placeholder="0">
                                        <span>Bottom</span>
                                    </div>
                                    <div class="aipg-spacing-field">
                                        <input type="number" id="aipg-manual-pl" step="0.1" placeholder="0">
                                        <span>Left</span>
                                    </div>
                                </div>
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
                <div id="aipg-error-modal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; max-width: 95%; background: var(--aipg-glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--aipg-glass-border); border-radius: 12px; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); z-index: 10000002; color: var(--aipg-text);">
                    <h3 style="color: #ef4444; margin-top: 0; display: flex; align-items: center; gap: 8px;">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        AI Refinement Error
                    </h3>
                    <p id="aipg-error-message" style="font-size: 14px; font-weight: 500; margin-bottom: 10px;"></p>
                    <div class="aipg-diagnostics-container" style="background: rgba(0,0,0,0.6); color: #4ade80; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 12px; height: 250px; overflow-y: auto; text-align: left; margin-bottom: 15px; display: none;">
                        <pre id="aipg-error-diagnostics" style="margin: 0; white-space: pre-wrap; word-wrap: break-word;"></pre>
                    </div>
                    <div style="text-align: right; display: flex; justify-content: space-between; align-items: center;">
                        <button class="ws-btn-secondary" id="aipg-copy-error-btn" style="display: none; font-size: 12px; padding: 6px 12px; background: rgba(255,255,255,0.1); border: none; color: white;">Copy Log</button>
                        <button class="ws-btn-primary" id="aipg-close-error-modal" style="background: var(--aipg-accent); border: none; padding: 8px 16px; border-radius: 6px; color: white;">Close</button>
                    </div>
                </div>

                <!-- Custom Prompt Modal for AI Insertion -->
                <div id="aipg-omni-prompt-modal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 450px; max-width: 95%; background: var(--aipg-glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--aipg-accent); border-radius: 12px; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); z-index: 10000002; color: var(--aipg-text);">
                    <h3 style="margin-top: 0; display: flex; align-items: center; gap: 8px; font-size: 18px;">
                        <span style="color: var(--aipg-accent);">✨</span> Generate New Element
                    </h3>
                    <p style="font-size: 13px; color: var(--aipg-text-dim); margin-bottom: 16px;">Describe what kind of element you would like to generate in this position. The AI will match the parent's styling.</p>
                    <textarea id="aipg-omni-prompt-input" rows="3" placeholder="e.g. 'A blue call to action button saying Hello'" style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 12px; color: white; font-family: inherit; resize: vertical; margin-bottom: 16px; outline: none;"></textarea>
                    
                    <div style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button class="ws-btn-secondary" id="aipg-omni-prompt-cancel" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 6px; color: white; cursor: pointer;">Cancel</button>
                        <button class="ws-btn-primary" id="aipg-omni-prompt-submit" style="background: var(--aipg-accent); border: none; padding: 8px 16px; border-radius: 6px; color: white; cursor: pointer; font-weight: 600;">Generate Element</button>
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

                // Prevent flicker: if we are already highlighting THIS exact block, do nothing.
                if (self.$currentBlock && self.$currentBlock[0] === $el[0] && self.$overlay.is(':visible')) {
                    e.stopPropagation();
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

            $(document).on('mouseleave', targetSelectors, function (e) {
                if (!self.aiEnabled || self.isEditing) return;

                // Prevent flicker: if we are moving from the block into the overlay's buttons, don't hide
                if (e.relatedTarget && $(e.relatedTarget).closest('.aipg-block-overlay').length) {
                    return;
                }

                self.$overlay.hide().removeClass('aipg-active');

                if (self.outlinesEnabled) {
                    $('.aipg-outline-box').remove();
                }
            });

            // When the mouse leaves the overlay buttons (which have pointer-events auto)
            $(document).on('mouseleave', '.aipg-block-overlay', function (e) {
                if (!self.aiEnabled || self.isEditing) return;

                // Did we move back to the currently highlighted block?
                if (self.$currentBlock && e.relatedTarget) {
                    // Check if relatedTarget is the current block or a child of it
                    if ($(e.relatedTarget).closest(self.$currentBlock).length) {
                        return; // We moved back to the main block, keep overlay active
                    }
                }

                self.$overlay.hide().removeClass('aipg-active');
                if (self.outlinesEnabled) {
                    $('.aipg-outline-box').remove();
                }
            });

            // Click detection via coordinates (to avoid flickering from pointer-events: auto)
            $(document).on('mousedown', function (e) {
                if (!self.aiEnabled || self.isEditing || !self.$overlay.is(':visible')) return;

                // Ignore clicks on omni buttons
                if ($(e.target).closest('.aipg-omni-node').length) return;

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
                const tab = $(this).data('tab');
                $('.aipg-sidebar-tabs .aipg-tab-btn').removeClass('active');
                $(this).addClass('active');

                $('.aipg-tab-content').removeClass('active');
                $('#tab-' + tab).addClass('active');

                // Hide backdrop if in style tab for unobstructed view
                if (tab === 'manual-style') {
                    $('.aipg-modal-backdrop').fadeOut(200);
                } else {
                    $('.aipg-modal-backdrop').fadeIn(200);
                }
            });

            // Modal Actions
            $('#aipg-cancel-edit').on('click', () => self.closeModal());
            $('#aipg-submit-edit').on('click', () => self.submitToAi());
            $('#aipg-close-error-modal').on('click', () => self.closeErrorModal());

            // Manual Style Live Preview
            $('#aipg-manual-bg-color').on('input', function () {
                if (self.$currentBlock) self.$currentBlock.css('background-color', $(this).val());
                self.markAsManualChanged();
            });

            $('#aipg-manual-text-color').on('input', function () {
                if (self.$currentBlock) self.$currentBlock.css('color', $(this).val());
                self.markAsManualChanged();
            });

            $('#aipg-manual-fs-range, #aipg-manual-fs-num').on('input', function () {
                const val = $(this).val();
                $('#aipg-manual-fs-range, #aipg-manual-fs-num').val(val);
                if (self.$currentBlock) self.$currentBlock.css('font-size', val + 'px');
                self.markAsManualChanged();
            });

            // Link Buttons logic
            $('#aipg-link-margin').on('click', function () {
                $(this).toggleClass('active');
            });
            $('#aipg-link-padding').on('click', function () {
                $(this).toggleClass('active');
            });

            // Unit Selectors
            $('.aipg-unit-select').on('change', function () {
                const type = $(this).attr('id') === 'aipg-margin-unit' ? 'margin' : 'padding';
                const unit = $(this).val();
                const $slider = $('#aipg-slider-' + type);

                if (unit === 'px' || unit === '%') {
                    $slider.attr('max', 200);
                    $slider.attr('step', 1);
                } else {
                    $slider.attr('max', 10);
                    $slider.attr('step', 0.1);
                }

                if (type === 'margin') $('#aipg-slider-margin').trigger('input');
                else $('#aipg-slider-padding').trigger('input');
            });

            // Sliders logic
            $('#aipg-slider-margin').on('input', function () {
                const val = $(this).val();
                const u = $('#aipg-margin-unit').val();
                if ($('#aipg-link-margin').hasClass('active')) {
                    $('#aipg-manual-mt, #aipg-manual-mb, #aipg-manual-ml, #aipg-manual-mr').val(val);
                    if (self.$currentBlock) {
                        self.$currentBlock.css('margin-top', val + u);
                        self.$currentBlock.css('margin-bottom', val + u);
                        self.$currentBlock.css('margin-left', val + u);
                        self.$currentBlock.css('margin-right', val + u);
                        self.markAsManualChanged();
                    }
                }
            });

            $('#aipg-slider-padding').on('input', function () {
                const val = $(this).val();
                const u = $('#aipg-padding-unit').val();
                if ($('#aipg-link-padding').hasClass('active')) {
                    $('#aipg-manual-pt, #aipg-manual-pb, #aipg-manual-pl, #aipg-manual-pr').val(val);
                    if (self.$currentBlock) {
                        self.$currentBlock.css('padding-top', val + u);
                        self.$currentBlock.css('padding-bottom', val + u);
                        self.$currentBlock.css('padding-left', val + u);
                        self.$currentBlock.css('padding-right', val + u);
                        self.markAsManualChanged();
                    }
                }
            });

            // Input logic with Linking overrides
            $('#aipg-manual-mt, #aipg-manual-mb, #aipg-manual-ml, #aipg-manual-mr').on('input', function () {
                const val = $(this).val();
                const u = $('#aipg-margin-unit').val();
                if ($('#aipg-link-margin').hasClass('active') && val !== '') {
                    $('#aipg-manual-mt, #aipg-manual-mb, #aipg-manual-ml, #aipg-manual-mr').val(val);
                    $('#aipg-slider-margin').val(val);
                }
                const mt = $('#aipg-manual-mt').val();
                const mb = $('#aipg-manual-mb').val();
                const ml = $('#aipg-manual-ml').val();
                const mr = $('#aipg-manual-mr').val();

                if (self.$currentBlock) {
                    if (mt !== '') self.$currentBlock.css('margin-top', mt + u);
                    if (mb !== '') self.$currentBlock.css('margin-bottom', mb + u);
                    if (ml !== '') self.$currentBlock.css('margin-left', ml + u);
                    if (mr !== '') self.$currentBlock.css('margin-right', mr + u);
                    self.markAsManualChanged();
                }
            });

            $('#aipg-manual-pt, #aipg-manual-pb, #aipg-manual-pl, #aipg-manual-pr').on('input', function () {
                const val = $(this).val();
                const u = $('#aipg-padding-unit').val();
                if ($('#aipg-link-padding').hasClass('active') && val !== '') {
                    $('#aipg-manual-pt, #aipg-manual-pb, #aipg-manual-pl, #aipg-manual-pr').val(val);
                    $('#aipg-slider-padding').val(val);
                }
                const pt = $('#aipg-manual-pt').val();
                const pb = $('#aipg-manual-pb').val();
                const pl = $('#aipg-manual-pl').val();
                const pr = $('#aipg-manual-pr').val();

                if (self.$currentBlock) {
                    if (pt !== '') self.$currentBlock.css('padding-top', pt + u);
                    if (pb !== '') self.$currentBlock.css('padding-bottom', pb + u);
                    if (pl !== '') self.$currentBlock.css('padding-left', pl + u);
                    if (pr !== '') self.$currentBlock.css('padding-right', pr + u);
                    self.markAsManualChanged();
                }
            });

            // Add Tab handlers
            $('.aipg-add-item').on('click', function () {
                const type = $(this).data('block');

                // One-step insertion for media types (Logo/Image)
                if ((type === 'logo' || type === 'image') && typeof wp !== 'undefined' && wp.media) {
                    const frame = wp.media({
                        title: 'Select ' + (type === 'logo' ? 'Logo' : 'Image'),
                        button: { text: 'Insert Block' },
                        multiple: false
                    });

                    frame.on('select', function () {
                        const attachment = frame.state().get('selection').first().toJSON();
                        if (attachment && attachment.url) {
                            self.insertNewBlock(type, 'below', attachment.url);
                        }
                    });

                    frame.open();
                } else if (type === 'logo' || type === 'image') {
                    // Fallback if media library fails to load for some reason
                    console.error('[AI Studio] WordPress Media Library not available on frontend.');
                    alert('WordPress Media Library is not available. Please ensure you are logged in as admin.');
                } else {
                    self.insertNewBlock(type, 'below');
                }
            });

            $('.aipg-mini-btn').on('click', function () {
                $('.aipg-mini-btn').removeClass('active');
                $(this).addClass('active');
            });

            // Omni-directional insertion
            $(document).on('click', '.aipg-omni-dup', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (!self.$currentBlock) return;
                self.omniInsertElement('duplicate', $(this).data('dir'), '');
            });

            $(document).on('click', '.aipg-omni-ai', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (!self.$currentBlock) return;

                // Store direction and open custom modal instead of native prompt
                self.omniPendingDir = $(this).data('dir');
                $('.aipg-modal-backdrop').fadeIn(200);
                $('#aipg-omni-prompt-modal').fadeIn(200);
                $('#aipg-omni-prompt-input').val('').focus();
                self.isEditing = true;
            });

            $(document).on('click', '#aipg-omni-prompt-cancel', function () {
                $('#aipg-omni-prompt-modal').fadeOut(200);
                $('.aipg-modal-backdrop').fadeOut(200);
                self.isEditing = false;
            });

            $(document).on('click', '#aipg-omni-prompt-submit', function () {
                const promptMsg = $('#aipg-omni-prompt-input').val().trim();
                if (!promptMsg) return;

                $('#aipg-omni-prompt-modal').fadeOut(200);
                $('.aipg-modal-backdrop').fadeOut(200);
                self.isEditing = false;

                self.omniInsertElement('ai', self.omniPendingDir, promptMsg);
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
                if ($('#aipg-omni-prompt-modal').is(':visible')) {
                    $('#aipg-omni-prompt-modal').fadeOut(200);
                    self.isEditing = false;
                }
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

            // Spacing Initialization
            const getInlineUnitAndVal = (computedPx, inlineStyleStr, defaultUnit) => {
                let u = defaultUnit;
                let v = 0;
                if (inlineStyleStr && inlineStyleStr.match(/[a-z%]+$/)) {
                    u = inlineStyleStr.match(/[a-z%]+$/)[0];
                    v = parseFloat(inlineStyleStr);
                } else if (inlineStyleStr && parseFloat(inlineStyleStr)) {
                    v = parseFloat(inlineStyleStr);
                } else {
                    const pxNum = parseFloat(computedPx) || 0;
                    if (pxNum) {
                        if (u === 'rem' || u === 'em') v = (pxNum / 16).toFixed(1);
                        else v = pxNum;
                    }
                }
                return { unit: u, val: v };
            };

            const ptData = getInlineUnitAndVal(styles.paddingTop, el.style.paddingTop, 'rem');
            const mtData = getInlineUnitAndVal(styles.marginTop, el.style.marginTop, 'rem');

            $('#aipg-padding-unit').val(ptData.unit).trigger('change');
            $('#aipg-margin-unit').val(mtData.unit).trigger('change');

            const pbData = getInlineUnitAndVal(styles.paddingBottom, el.style.paddingBottom, ptData.unit);
            const plData = getInlineUnitAndVal(styles.paddingLeft, el.style.paddingLeft, ptData.unit);
            const prData = getInlineUnitAndVal(styles.paddingRight, el.style.paddingRight, ptData.unit);

            const mbData = getInlineUnitAndVal(styles.marginBottom, el.style.marginBottom, mtData.unit);
            const mlData = getInlineUnitAndVal(styles.marginLeft, el.style.marginLeft, mtData.unit);
            const mrData = getInlineUnitAndVal(styles.marginRight, el.style.marginRight, mtData.unit);

            $('#aipg-manual-pt').val(ptData.val || '');
            $('#aipg-manual-pb').val(pbData.val || '');
            $('#aipg-manual-pl').val(plData.val || '');
            $('#aipg-manual-pr').val(prData.val || '');

            $('#aipg-manual-mt').val(mtData.val || '');
            $('#aipg-manual-mb').val(mbData.val || '');
            $('#aipg-manual-ml').val(mlData.val || '');
            $('#aipg-manual-mr').val(mrData.val || '');

            // Update sliders based on first valid value
            if (ptData.val) $('#aipg-slider-padding').val(ptData.val);
            else $('#aipg-slider-padding').val(0);

            if (mtData.val) $('#aipg-slider-margin').val(mtData.val);
            else $('#aipg-slider-margin').val(0);

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
            const pU = $('#aipg-padding-unit').val();
            const mU = $('#aipg-margin-unit').val();

            const pt = $('#aipg-manual-pt').val() !== '' ? $('#aipg-manual-pt').val() + pU : '';
            const pb = $('#aipg-manual-pb').val() !== '' ? $('#aipg-manual-pb').val() + pU : '';
            const pl = $('#aipg-manual-pl').val() !== '' ? $('#aipg-manual-pl').val() + pU : '';
            const pr = $('#aipg-manual-pr').val() !== '' ? $('#aipg-manual-pr').val() + pU : '';
            const mt = $('#aipg-manual-mt').val() !== '' ? $('#aipg-manual-mt').val() + mU : '';
            const mb = $('#aipg-manual-mb').val() !== '' ? $('#aipg-manual-mb').val() + mU : '';
            const ml = $('#aipg-manual-ml').val() !== '' ? $('#aipg-manual-ml').val() + mU : '';
            const mr = $('#aipg-manual-mr').val() !== '' ? $('#aipg-manual-mr').val() + mU : '';

            const bgColor = $('#aipg-manual-bg-color').val();
            const textColor = $('#aipg-manual-text-color').val();
            const fontSize = $('#aipg-manual-fs-range').val();
            const imgWidth = $('#aipg-manual-img-width').val();

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
                padding_left: pl,
                padding_right: pr,
                margin_top: mt,
                margin_bottom: mb,
                margin_left: ml,
                margin_right: mr,
                bg_color: bgColor,
                text_color: textColor,
                font_size: fontSize,
                img_width: imgWidth
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

        insertNewBlock: function (type, position, mediaUrl = null) {
            if (!this.$currentBlock) return;
            const self = this;

            // Temporary insertion for visual feedback
            let html = '';
            const placeholderImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='none' stroke='%23e67e22' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";

            switch (type) {
                case 'heading': html = '<h2>New Heading</h2>'; break;
                case 'paragraph': html = '<p>Write your content here...</p>'; break;
                case 'button': html = '<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Click Me</a></div>'; break;
                case 'image':
                    html = '<figure class="wp-block-image size-full"><img src="' + (mediaUrl || placeholderImg) + '" alt="Added Image"></figure>';
                    break;
                case 'logo':
                    html = '<div class="wp-block-site-logo"><a class="custom-logo-link"><img src="' + (mediaUrl || placeholderImg) + '" style="max-width:150px;" alt="Logo"></a></div>';
                    break;
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

        omniInsertElement: function (actionType, position, promptStr) {
            const self = this;
            let $block = this.$currentBlock;
            if (!$block) return;

            // CRITICAL FIX: The user might be hovering on an internal structure element (like <span class="wp-block-cover__background">)
            // that is NOT a real Gutenberg block in the DB. We MUST find the closest actual block wrapper.
            // Rule 1: It MUST have a class starting with wp-block-
            // Rule 2: It CANNOT be a BEM child element (containing __)
            // Rule 3: It CANNOT be a generic inline/media tag disguised as a block root.
            while ($block.length) {
                const hasBlockClass = $block[0].className && $block[0].className.includes('wp-block-');
                const isBEMChild = $block[0].className && $block[0].className.includes('__');
                const isDisallowedTag = $block.is('span, img, a, strong, em, b, i');

                if (hasBlockClass && !isBEMChild && !isDisallowedTag) {
                    break; // Found a valid root block
                }

                const $parent = $block.parent().closest('[class*="wp-block-"]');
                if ($parent.length && $parent[0] !== $block[0]) {
                    $block = $parent;
                } else {
                    break;
                }
            }

            // Visual feedback
            const originalBorder = $block.css('border');
            $block.css('border', '2px dashed #4ade80');

            // Clean up temporary styles that shouldn't be in DB
            const $clone = $block.clone();

            // Remove ALL our custom structural editor classes before sending to PHP
            // Because PHP's aipg_find_block_in_tree needs a close match to what's in the DB.
            $clone.removeClass(function (index, className) {
                return (className.match(/(^|\s)aipg-\S+/g) || []).join(' ');
            });
            $clone.removeAttr('data-aipg-hover');

            // CRITICAL STRIPPING: Remove styles that are likely visual-only or injected by the browser/resizers.
            // Gutenberg block HTML in the DB rarely has complex `style=` tags unless explicitly set.
            // When we compare strings, `style="min-height: 900px;"` might fail against `style="min-height:900px"`,
            // or worse, the browser adds `aspect-ratio`, `background-position`, etc.
            // We'll remove the `style` attribute entirely from the clone to force a structural/class-based match in PHP.
            $clone.removeAttr('style');
            $clone.find('*').removeAttr('style');

            // Also clean up any potential omni-nodes that might have been accidentally cloned
            $clone.find('.aipg-omni-node').remove();

            const targetMarkup = $clone[0].outerHTML;

            const payload = {
                action: 'aipg_studio_insert_element',
                nonce: aipg_editor_vars.nonce,
                action_type: actionType,
                position: position,
                prompt: promptStr,
                lookup_markup: targetMarkup,
                post_id: parseInt(aipg_editor_vars.post_id, 10),
                model_tier: this.modelTier
            };

            console.log(`[AI Studio] Omni-Insert (${actionType} @ ${position}) payload:`, payload);

            $.ajax({
                url: aipg_editor_vars.ajaxurl,
                type: 'POST',
                data: payload,
                timeout: 90000,
                success: function (response) {
                    $block.css('border', originalBorder || '');
                    if (response.success) {
                        const newRendered = response.data.new_rendered;
                        const $newElement = $(newRendered);
                        $newElement.addClass('aipg-fade-in');

                        if (position === 'top' || position === 'left') {
                            $block.before($newElement);
                        } else {
                            $block.after($newElement);
                        }

                        // Briefly highlight the new element
                        setTimeout(() => {
                            $newElement.removeClass('aipg-fade-in');
                            self.highlightBlock($newElement);
                        }, 500);

                    } else {
                        const errorMsg = typeof response.data === 'string' ? response.data : (response.data.message || 'Unknown error');
                        self.showErrorModal('Insertion failed: ' + errorMsg);
                    }
                },
                error: function (xhr, status, error) {
                    $block.css('border', originalBorder || '');
                    self.showErrorModal('Network error during insertion: ' + status);
                }
            });
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
