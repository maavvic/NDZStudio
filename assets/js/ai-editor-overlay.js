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
        modelTier: 'medium',
        marginTargetMode: 'current',
        paddingTargetMode: 'current',
        lastFocusedMarginInput: 'aipg-manual-mt',
        lastFocusedPaddingInput: 'aipg-manual-pt',

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
            // Initialize UI Modal & Overlay
            this.$overlay = $(`
                <div class="aipg-block-overlay">
                    <div class="aipg-omni-node aipg-omni-top">
                        <button class="aipg-omni-dup" data-dir="top" title="Duplicate Above">+</button>
                        <button class="aipg-omni-ai" data-dir="top" title="Generate New Above">✨</button>
                    </div>
                    <div class="aipg-omni-node aipg-omni-bottom">
                        <button class="aipg-omni-dup" data-dir="bottom" title="Duplicate Below">+</button>
                        <button class="aipg-omni-ai" data-dir="bottom" title="Generate New Below">✨</button>
                    </div>
                    <div class="aipg-omni-node aipg-omni-left">
                        <button class="aipg-omni-dup" data-dir="left" title="Duplicate Left">+</button>
                        <button class="aipg-omni-ai" data-dir="left" title="Generate New Left">✨</button>
                    </div>
                    <div class="aipg-omni-node aipg-omni-right">
                        <button class="aipg-omni-dup" data-dir="right" title="Duplicate Right">+</button>
                        <button class="aipg-omni-ai" data-dir="right" title="Generate New Right">✨</button>
                    </div>
                    
                    <!-- Delete Button in Top Right Corner -->
                    <button class="aipg-omni-del" title="Delete Block" style="position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; border-radius: 50%; background: #ef4444; border: 2px solid #111; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.5); pointer-events: auto; transition: transform 0.1s ease;">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            `).appendTo('body');
            this.$label = $('<div class="aipg-block-label">✨ <span>Edit with AI</span></div>').appendTo(this.$overlay);

            // Structure Navigator Panel
            this.$navigator = $(`
                <div class="aipg-navigator-panel" id="aipg-structure-navigator" style="display: none;">
                    <div class="aipg-nav-header">
                        <div class="aipg-nav-title">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            Structure
                        </div>
                        <div class="aipg-nav-controls">
                            <button class="ws-btn-secondary" id="aipg-refresh-nav-btn" style="padding: 2px 6px; font-size: 10px;" title="Refresh Structure">↻</button>
                            <button class="ws-btn-secondary" id="aipg-close-nav-btn" style="padding: 2px 6px; font-size: 10px;">✕</button>
                        </div>
                    </div>
                    <div class="aipg-nav-tree-area">
                        <ul class="aipg-nav-tree"></ul>
                    </div>
                </div>
            `).appendTo('body');

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

                             <div class="aipg-control-divider" style="margin-top: 5px;">Background</div>

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
                                <label class="aipg-control-label">Margin</label>
                                <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 15px;">
                                    <div class="aipg-toggle-group" id="aipg-margin-target-toggle">
                                        <button class="aipg-mini-btn active" data-mode="current" title="Target Selected Element">Selected</button>
                                        <button class="aipg-mini-btn" data-mode="parent" title="Target Outer Wrapper">Parent</button>
                                    </div>
                                    <select id="aipg-margin-unit" class="aipg-unit-select">
                                        <option value="px">px</option>
                                        <option value="em">em</option>
                                        <option value="rem" selected>rem</option>
                                        <option value="%">%</option>
                                    </select>
                                    <button class="aipg-link-btn active" id="aipg-link-margin" title="Link values together">
                                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                    </button>
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
                                <label class="aipg-control-label">Padding</label>
                                <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 15px;">
                                    <div class="aipg-toggle-group" id="aipg-padding-target-toggle">
                                        <button class="aipg-mini-btn active" data-mode="current" title="Target Selected Element">Selected</button>
                                        <button class="aipg-mini-btn" data-mode="parent" title="Target Outer Wrapper">Parent</button>
                                    </div>
                                    <select id="aipg-padding-unit" class="aipg-unit-select">
                                        <option value="px">px</option>
                                        <option value="em">em</option>
                                        <option value="rem" selected>rem</option>
                                        <option value="%">%</option>
                                    </select>
                                    <button class="aipg-link-btn active" id="aipg-link-padding" title="Link values together">
                                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                    </button>
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
                                <div class="aipg-toggle-group" id="aipg-add-pos-toggle">
                                    <button class="aipg-mini-btn active" data-pos="below">Below Selection</button>
                                    <button class="aipg-mini-btn" data-pos="above">Above Selection</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="aipg-sidebar-footer">
                        <div style="display: flex; gap: 8px; width: 100%; margin-bottom: 10px;">
                        </div>
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

                <!-- Custom Confirm Modal -->
                <div id="aipg-custom-confirm-modal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; max-width: 95%; background: var(--aipg-glass-bg); backdrop-filter: blur(12px); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 12px; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); z-index: 10000003; color: var(--aipg-text);">
                    <h3 style="margin-top: 0; display: flex; align-items: center; gap: 8px; font-size: 18px; color: #ef4444;">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        Confirm Action
                    </h3>
                    <p id="aipg-custom-confirm-message" style="font-size: 14px; color: var(--aipg-text); margin-bottom: 20px;">Are you sure you want to proceed?</p>
                    
                    <div style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button class="ws-btn-secondary" id="aipg-custom-confirm-cancel" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 6px; color: white; cursor: pointer;">Cancel</button>
                        <button class="ws-btn-primary" id="aipg-custom-confirm-yes" style="background: #ef4444; border: none; padding: 8px 16px; border-radius: 6px; color: white; cursor: pointer; font-weight: 600;">Yes, proceed</button>
                    </div>
                </div>

                <!-- Custom Alert Modal -->
                <div id="aipg-custom-alert-modal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; max-width: 95%; background: var(--aipg-glass-bg); backdrop-filter: blur(12px); border: 1px solid var(--aipg-accent); border-radius: 12px; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); z-index: 10000003; color: var(--aipg-text);">
                    <h3 style="margin-top: 0; display: flex; align-items: center; gap: 8px; font-size: 18px; color: var(--aipg-accent);">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        Notice
                    </h3>
                    <p id="aipg-custom-alert-message" style="font-size: 14px; color: var(--aipg-text); margin-bottom: 20px;">This is an alert.</p>
                    
                    <div style="display: flex; justify-content: flex-end;">
                        <button class="ws-btn-primary" id="aipg-custom-alert-ok" style="background: var(--aipg-accent); border: none; padding: 8px 16px; border-radius: 6px; color: white; cursor: pointer; font-weight: 600;">OK</button>
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
                    <div class="aipg-toggle-divider"></div>
                    <button id="aipg-toggle-nav-btn" class="aipg-mode-btn" title="Structure Navigator">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-right: 4px; vertical-align: middle;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                        Navigator
                    </button>
                    <select id="aipg-model-tier-select" class="aipg-mode-select">
                        <option value="medium" ${this.modelTier === 'medium' ? 'selected' : ''}>Flash</option>
                        <option value="complex" ${this.modelTier === 'complex' ? 'selected' : ''}>Pro</option>
                        <option value="claude_auto" ${this.modelTier === 'claude_auto' ? 'selected' : ''}>Claude</option>
                    </select>
                    <button id="aipg-toggle-outlines-btn" class="aipg-mode-btn ${this.outlinesEnabled ? 'active' : ''}" title="Show Structural Outlines">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-right: 4px; vertical-align: middle;"><path d="M4 4h16v16H4z"></path></svg>
                        Outlines
                    </button>
                    <button id="aipg-save-project-btn" class="aipg-mode-btn aipg-btn-primary">Save Project</button>
                    <button id="aipg-exit-wizard-btn" class="aipg-mode-btn aipg-btn-exit" title="Exit to Wizard">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-right: 4px; vertical-align: middle;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Exit
                    </button>
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
                let $el = $(this);

                // PROTECT: If we are already editing THIS block, don't show the hover overlay (the redundant buttons)
                if (self.isEditing && self.$currentBlock && self.$currentBlock[0] === $el[0]) {
                    // But ensure it's visible if it was hidden
                    self.$overlay.show().addClass('aipg-active');
                    return;
                }

                // Apply interactive target resolution (skip structural BEM elements)
                $el = self.resolveInteractiveTarget($el);
                if (!$el || $el.length === 0) return;

                const isGlobalWrapper = $el.is('body, html, .wp-site-blocks, .is-root-container, #wp-studio-wizard-root');
                if (isGlobalWrapper) {
                    // Ignore hover for structural high-level wrappers
                    self.$overlay.hide();
                    return;
                }

                // Protect against hovering over our own modals/UI
                if ($el.closest('.aipg-editor-modal, .aipg-mode-toggle, .aipg-block-overlay, #aipg-custom-confirm-modal, #aipg-custom-alert-modal, .aipg-outline-box, .aipg-modal-backdrop').length > 0) return;

                // Prevent flicker: if we are already highlighting THIS exact block, do nothing.
                if (self.$currentBlock && self.$currentBlock[0] === $el[0] && self.$overlay.is(':visible')) {
                    e.stopPropagation();
                    return;
                }

                // Stop propagation so we pick the innermost block when hovering specifically,
                // BUT we allow the user to reach outer blocks if they hover on their edges.
                e.stopPropagation();

                // If we are currently selecting via Navigator or in Refine Mode, ignore hover highlights
                if (self._navSelecting || self.isEditing) return;

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
                // If we are currently focusing the Navigator or just performed a Navigator-triggered highlight, ignore
                const timeSinceNavHighlight = Date.now() - (self._lastNavHighlightTime || 0);
                if (!self.aiEnabled || self.isEditing || self._navFocus || timeSinceNavHighlight < 500) return;

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
                const timeSinceNavHighlight = Date.now() - (self._lastNavHighlightTime || 0);
                if (!self.aiEnabled || self.isEditing || self._navFocus || timeSinceNavHighlight < 500) return;

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

            // Click detection globally to allow selecting blocks even when not hovering
            $(document).on('mousedown', function (e) {
                if (!self.aiEnabled) return;

                // Stop if clicking our own UI elements (sidebar, mode toggle, overlays)
                if ($(e.target).closest('.aipg-editor-modal, .aipg-mode-toggle, .aipg-block-overlay, #aipg-custom-confirm-modal, #aipg-custom-alert-modal, .aipg-outline-box, .aipg-modal-backdrop-FIXED_REMOVE').length > 0) return;

                // Ignore clicks on omni buttons and the delete button inside the overlay
                if ($(e.target).closest('.aipg-omni-node, .aipg-omni-del').length) return;

                // Detect if the user clicked a block-like element
                let $targetEl = $(e.target);
                let $block = self.resolveInteractiveTarget($targetEl);

                if ($block && $block.length) {
                    // Valid block found! Switch focus and open editor.
                    e.preventDefault();
                    e.stopPropagation();
                    self.highlightBlock($block);
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
            $('#aipg-manual-save-btn').on('click', () => self.saveManualTweaks());
            $('#aipg-close-error-modal').on('click', () => self.closeErrorModal());

            // Navigator Toggle
            $(document).on('click', '#aipg-toggle-nav-btn', function() {
                self.$navigator.fadeToggle(200);
                if (self.$navigator.is(':visible')) {
                    self.refreshNavigator();
                }
            });

            $(document).on('click', '#aipg-close-nav-btn', () => this.$navigator.fadeOut(200));
            $(document).on('click', '#aipg-refresh-nav-btn', () => this.refreshNavigator());

            // Tree Interactions
            $(document).on('click', '.aipg-nav-label', function(e) {
                e.stopPropagation();
                const $item = $(this).closest('.aipg-nav-item');
                const $target = $item.data('el');
                
                if ($target && $target.length) {
                    // Set a selection lock so hover handlers don't immediately hide the overlay
                    self._navSelecting = true;
                    self.highlightBlock($target, true); // Scroll on click
                    self.openModal();
                    
                    $('.aipg-nav-item').removeClass('active');
                    $item.addClass('active');

                    // Release lock after a short delay to allow stable selection
                    setTimeout(() => { self._navSelecting = false; }, 500);
                }
            });

            $(document).on('click', '.aipg-nav-toggle', function(e) {
                e.stopPropagation();
                $(this).closest('.aipg-nav-item').toggleClass('expanded');
            });

            $(document).on('mouseenter', '#aipg-structure-navigator', function() {
                self._navFocus = true;
            });
            $(document).on('mouseleave', '#aipg-structure-navigator', function() {
                self._navFocus = false;
            });

            $(document).on('mouseenter', '.aipg-nav-label', function() {
                const $target = $(this).closest('.aipg-nav-item').data('el');
                if ($target) {
                    if (self._navHighlightTimer) clearTimeout(self._navHighlightTimer);
                    
                    self._lastNavHighlightTime = Date.now();
                    self._navHighlightTimer = setTimeout(() => {
                        self.highlightBlock($target, true);
                    }, 50); // Small debounce to avoid flickering during rapid movement
                }
            });
            
            $(document).on('mouseleave', '.aipg-nav-label', function() {
                if (self._navHighlightTimer) clearTimeout(self._navHighlightTimer);
            });

            // Drag Navigator Logic
            let isDragging = false, startX, startY, startLeft, startTop;
            $(document).on('mousedown', '.aipg-nav-header', function(e) {
                if ($(e.target).closest('button').length) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const offset = self.$navigator.offset();
                startLeft = offset.left;
                startTop = offset.top - $(window).scrollTop();
                e.preventDefault();
            });

            $(document).on('mousemove', function(e) {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                self.$navigator.css({
                    left: startLeft + dx,
                    top: startTop + dy,
                    right: 'auto',
                    bottom: 'auto'
                });
            });

            $(document).on('mouseup', () => isDragging = false);

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

            // Target Mode Toggle
            $('#aipg-target-mode-toggle button').on('click', function () {
                const mode = $(this).data('mode');
                self.styleTargetMode = mode;
                $('#aipg-target-mode-toggle button').removeClass('active');
                $(this).addClass('active');

                // Re-sync inputs to show values of the newly targeted element
                self.syncManualInputsWithBlock();

                // Re-highlight visually
                if (self.$currentBlock) {
                    const $target = self.getStyleTarget(self.$currentBlock);
                    self.highlightBlock(self.$currentBlock);
                }
            });

            // Spacing Target Toggles
            $('#aipg-margin-target-toggle button, #aipg-padding-target-toggle button').on('click', function () {
                const $group = $(this).parent();
                const type = $group.attr('id').includes('margin') ? 'margin' : 'padding';
                const mode = $(this).data('mode');

                self[type + 'TargetMode'] = mode;
                $group.find('button').removeClass('active');
                $(this).addClass('active');

                // Re-sync inputs to show values of the newly targeted element
                self.syncManualInputsWithBlock();

                // Re-highlight visually
                if (self.$currentBlock) self.highlightBlock(self.$currentBlock);
            });

            // Tracking last focused input for unlinked slider behavior
            $('.aipg-spacing-grid input').on('focus', function () {
                const id = $(this).attr('id');
                if (id.includes('-m')) self.lastFocusedMarginInput = id;
                else if (id.includes('-p')) self.lastFocusedPaddingInput = id;
            });

            // Sliders logic
            $('#aipg-slider-margin').on('input', function () {
                const val = $(this).val();
                const u = $('#aipg-margin-unit').val();
                if (self.$currentBlock) {
                    const $target = self.getStyleTarget(self.$currentBlock, 'margin');
                    if ($('#aipg-link-margin').hasClass('active')) {
                        $('#aipg-manual-mt, #aipg-manual-mb, #aipg-manual-ml, #aipg-manual-mr').val(val);
                        $target.css({ 'margin-top': val + u, 'margin-bottom': val + u, 'margin-left': val + u, 'margin-right': val + u });
                    } else {
                        // Unlinked: only affect the last focused or default field
                        const targetId = self.lastFocusedMarginInput;
                        $('#' + targetId).val(val);
                        const cssProp = targetId.replace('aipg-manual-m', 'margin-'); // mt -> margin-t
                        const finalProp = cssProp.replace('-t', '-top').replace('-b', '-bottom').replace('-l', '-left').replace('-r', '-right');
                        $target.css(finalProp, val + u);
                    }
                    self.highlightBlock(self.$currentBlock);
                    self.markAsManualChanged();
                }
            });

            $('#aipg-slider-padding').on('input', function () {
                const val = $(this).val();
                const u = $('#aipg-padding-unit').val();
                if (self.$currentBlock) {
                    const $target = self.getStyleTarget(self.$currentBlock, 'padding');
                    if ($('#aipg-link-padding').hasClass('active')) {
                        $('#aipg-manual-pt, #aipg-manual-pb, #aipg-manual-pl, #aipg-manual-pr').val(val);
                        $target.css({ 'padding-top': val + u, 'padding-bottom': val + u, 'padding-left': val + u, 'padding-right': val + u });
                    } else {
                        // Unlinked: only affect the last focused or default field
                        const targetId = self.lastFocusedPaddingInput;
                        $('#' + targetId).val(val);
                        const cssProp = targetId.replace('aipg-manual-p', 'padding-');
                        const finalProp = cssProp.replace('-t', '-top').replace('-b', '-bottom').replace('-l', '-left').replace('-r', '-right');
                        $target.css(finalProp, val + u);
                    }
                    self.highlightBlock(self.$currentBlock);
                    self.markAsManualChanged();
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
                    const $target = self.getStyleTarget(self.$currentBlock, 'margin');
                    if (mt !== '') $target.css('margin-top', mt + u);
                    if (mb !== '') $target.css('margin-bottom', mb + u);
                    if (ml !== '') $target.css('margin-left', ml + u);
                    if (mr !== '') $target.css('margin-right', mr + u);

                    // Also update overlay in real-time
                    self.highlightBlock(self.$currentBlock);
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
                    const $target = self.getStyleTarget(self.$currentBlock, 'padding');
                    if (pt !== '') $target.css('padding-top', pt + u);
                    if (pb !== '') $target.css('padding-bottom', pb + u);
                    if (pl !== '') $target.css('padding-left', pl + u);
                    if (pr !== '') $target.css('padding-right', pr + u);
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
                    self.showAlertModal('WordPress Media Library is not available. Please ensure you are logged in as admin.');
                } else {
                    self.insertNewBlock(type, 'below');
                }
            });

            $('#aipg-add-pos-toggle button').on('click', function () {
                $(this).parent().find('button').removeClass('active');
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

            $(document).on('click', '.aipg-omni-del', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (!self.$currentBlock) return;

                self.showConfirmModal('Are you sure you want to permanently delete this element?', () => {
                    self.omniDeleteElement();
                });
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
                if ($('#aipg-custom-confirm-modal').is(':visible')) {
                    $('#aipg-custom-confirm-modal').fadeOut(200);
                }
                if ($('#aipg-custom-alert-modal').is(':visible')) {
                    $('#aipg-custom-alert-modal').fadeOut(200);
                }
            });
        },

        updateModeUI: function () {
            if (this.aiEnabled) {
                this.$toggle.addClass('aipg-mode-ai');
                this.$toggle.find('.aipg-mode-label').html('AI Edit Mode: <span class="aipg-status-on">ON</span>');
                this.$toggle.find('.aipg-mode-desc').text('Hover/Click elements to edit layout');
            } else {
                this.$toggle.removeClass('aipg-mode-ai');
                this.$toggle.find('.aipg-mode-label').html('AI Edit Mode: <span class="aipg-status-off">OFF</span>');
                this.$toggle.find('.aipg-mode-desc').text('Standard site interaction');
            }
        },

        /**
         * Resolves the element that should be used for UI interaction (highlighting).
         * It climbs up from BEM internal elements (e.g. __background, __inner-container)
         * to find the "real" element the user likely intends to interact with.
         */
        resolveInteractiveTarget($el) {
            if (!$el || $el.length === 0) return null;

            // If it's a structural internal (likely BEM like __background or __inner-container),
            // climb up until we find a block root or a non-internal element.
            // We search for classes containing "__" which is standard for Gutenberg internal components.
            if ($el.attr('class') && $el.attr('class').includes('__')) {
                const $parentBlock = $el.closest('[class*="wp-block-"]:not([class*="__"])');
                if ($parentBlock.length > 0) return $parentBlock;
            }

            return $el;
        },

        /**
         * Resolves the true block root for backend operations.
         * Returns the nearest parent that is a genuine Gutenberg block (has wp-block- but NOT __).
         */
        resolveBlockRoot($el) {
            if (!$el || $el.length === 0) return null;

            // If it IS a block root already, return it
            if ($el.is('[class*="wp-block-"]:not([class*="__"])')) return $el;

            // Otherwise climb to the nearest block root
            const $root = $el.closest('[class*="wp-block-"]:not([class*="__"])');
            return $root.length > 0 ? $root : $el;
        },

        /**
         * Resolves where padding/margin should be applied.
         * For Cover and Group blocks, we often target the inner container.
         */
        getStyleTarget($block, type = 'padding') {
            if (!$block || $block.length === 0) return $block;

            const mode = (type === 'margin') ? this.marginTargetMode : this.paddingTargetMode;

            if (mode === 'parent') {
                // If we are current in a "root" block that has an inner container (Cover/Group),
                // "Selected" normally dives into the inner. "Parent" should stay on the outer.
                // If we are on a simple block, "Parent" should go to its containing block.

                // Check if the current block is a known dived-into container
                if ($block.is('.wp-block-cover__inner-container, .wp-block-group > div:first-child')) {
                    return this.resolveBlockRoot($block);
                }

                // If it's a root that HAS an inner container, Parent mode targets this root (the wrapper)
                // while Current targets the inner.
                if ($block.hasClass('wp-block-cover') || $block.hasClass('wp-block-group')) {
                    return $block;
                }

                // Fallback: try to find a real parent block
                const $pBlock = $block.parent().closest('[class*="wp-block-"]:not([class*="__"])');
                if ($pBlock.length) return $pBlock;

                return this.resolveBlockRoot($block);
            }

            // mode === 'current' (Selected)
            let $el = $block;
            if ($el.hasClass('wp-block-cover')) {
                const $inner = $el.find('.wp-block-cover__inner-container').first();
                if ($inner.length) return $inner;
            }
            if ($el.hasClass('wp-block-group')) {
                const $inner = $el.children('div').first();
                if ($inner.length) return $inner;
            }
            return $el;
        },

        highlightBlock: function ($block, shouldScroll = true) {
            if (!$block || !$block.length) return;

            // Prevent redundant highlights for the same block
            if (this.$currentBlock && this.$currentBlock[0] === $block[0] && this.$overlay.is(':visible')) {
                return;
            }

            this.$currentBlock = $block;

            // Ensure element is visible
            if (shouldScroll && this.$navigator && this.$navigator.is(':visible')) {
                // REDESIGNED: Only scroll if the TOP of the element is off-screen
                // This prevents large elements from jumping to their bottom/center
                const rect = $block[0].getBoundingClientRect();
                const vHeight = (window.innerHeight || document.documentElement.clientHeight);
                
                // If top is above viewport OR top is below 80% of viewport
                const isOffScreen = rect.top < 0 || rect.top > (vHeight * 0.8);
                
                if (isOffScreen) {
                    // Use 'nearest' for a much calmer scroll experience
                    $block[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }

            const offset = $block.offset();
            const width = $block.outerWidth();
            const height = $block.outerHeight();

            // While editing, hide the interactive buttons to avoid distraction
            if (this.isEditing) {
                this.$overlay.find('.aipg-omni-node, .aipg-omni-del').hide();
            } else {
                this.$overlay.find('.aipg-omni-node, .aipg-omni-del').show();
            }

            // Toggle compact mode for small elements - avoid overlapping icons
            if (width < 120 || height < 60) {
                this.$overlay.addClass('aipg-compact');
            } else {
                this.$overlay.removeClass('aipg-compact');
            }

            this.$overlay.stop(true, true).css({
                top: offset.top,
                left: offset.left,
                width: width,
                height: height
            }).addClass('aipg-active').show();
        },

        openModal: function () {
            this.isEditing = true;
            // Backdrop removed per user request
            $('#aipg-refine-modal').addClass('aipg-sidebar-open');
            $('#aipg-prompt-input').val('').focus();
            $('#aipg-submit-edit').text('Refine with AI').prop('disabled', false);

            // Capture original state for lookup during database save
            this.originalBlockMarkup = this.$currentBlock[0].outerHTML;

            // Populate manual tweak inputs with current block state
            this.syncManualInputsWithBlock();

            // Sync Navigator if visible
            if (this.$navigator && this.$navigator.is(':visible')) {
                this.selectNavigatorNode(this.$currentBlock);
            }
        },

        closeModal: function () {
            this.isEditing = false;
            // Backdrop removed per user request
            $('#aipg-refine-modal').removeClass('aipg-sidebar-open');
            this.$overlay.hide();
        },

        showConfirmModal: function (message, onConfirm) {
            $('#aipg-custom-confirm-message').text(message);
            $('.aipg-modal-backdrop').fadeIn(200);
            $('#aipg-custom-confirm-modal').fadeIn(200);

            // Clean up previous event listeners namespace to prevent double-firing
            $('#aipg-custom-confirm-yes').off('click').on('click', () => {
                $('#aipg-custom-confirm-modal').fadeOut(200);
                $('.aipg-modal-backdrop').fadeOut(200);
                if (onConfirm) onConfirm();
            });

            $('#aipg-custom-confirm-cancel').off('click').on('click', () => {
                $('#aipg-custom-confirm-modal').fadeOut(200);
                $('.aipg-modal-backdrop').fadeOut(200);
            });
        },

        showAlertModal: function (message) {
            $('#aipg-custom-alert-message').text(message);
            $('.aipg-modal-backdrop').fadeIn(200);
            $('#aipg-custom-alert-modal').fadeIn(200);

            $('#aipg-custom-alert-ok').off('click').on('click', () => {
                $('#aipg-custom-alert-modal').fadeOut(200);
                $('.aipg-modal-backdrop').fadeOut(200);
            });
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
            const $mTarget = this.getStyleTarget(this.$currentBlock, 'margin');
            const $pTarget = this.getStyleTarget(this.$currentBlock, 'padding');

            const pEl = $pTarget[0];
            const pStyles = window.getComputedStyle(pEl);
            const mEl = $mTarget[0];
            const mStyles = window.getComputedStyle(mEl);

            // Background & Typography from padding target (usually current)
            const styles = pStyles;

            // Background
            $('#aipg-manual-bg-color').val(this.rgbToHex(styles.backgroundColor));

            // Font Size
            const fs = parseInt(styles.fontSize);
            if (!isNaN(fs)) $('#aipg-manual-fs-range, #aipg-manual-fs-num').val(fs);

            // Text Color
            $('#aipg-manual-text-color').val(this.rgbToHex(styles.color));

            // Helper to get unit
            const getInlineUnitAndVal = (computedPx, inlineStyleStr, defaultUnit) => {
                let u = defaultUnit;
                let v = 0;
                if (inlineStyleStr && inlineStyleStr.match(/[a-z%]+$/)) {
                    u = inlineStyleStr.match(/[a-z%]+$/)[0];
                    v = parseFloat(inlineStyleStr);
                } else {
                    const pxNum = parseFloat(computedPx) || 0;
                    if (pxNum) {
                        if (u === 'rem' || u === 'em') v = (pxNum / 16).toFixed(1);
                        else v = pxNum;
                    }
                }
                return { unit: u, val: isNaN(parseFloat(v)) ? 0 : v };
            };

            // Padding
            const ptData = getInlineUnitAndVal(pStyles.paddingTop, pEl.style.paddingTop, 'rem');
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
            if ($target.hasClass('alignfull')) $('#aipg-manual-width').val('full');
            else if ($target.hasClass('alignconstrained')) $('#aipg-manual-width').val('constrained');
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

            // Ensure we are operating on a genuine Gutenberg block root for stability
            $block = this.resolveBlockRoot($block);
            if (!$block) return;

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

        omniDeleteElement: function () {
            const self = this;
            let $block = this.$currentBlock;
            if (!$block) return;

            // Ensure we are operating on a genuine Gutenberg block root for stability
            $block = this.resolveBlockRoot($block);
            if (!$block) return;

            const originalBorder = $block.css('border');
            $block.css('border', '2px solid #ef4444').fadeTo(200, 0.5);

            const $clone = $block.clone();
            $clone.removeClass(function (index, className) {
                return (className.match(/(^|\s)aipg-\S+/g) || []).join(' ');
            });
            // jQuery removeClass can leave an empty class="" attribute, which throws off string matching if the original block had one class that was just stripped.
            if ($clone.attr('class') === '') {
                $clone.removeAttr('class');
            }
            $clone.removeAttr('data-aipg-hover');
            $clone.removeAttr('style');
            $clone.find('*').removeAttr('style');
            $clone.find('.aipg-omni-node, .aipg-omni-del').remove();

            const targetMarkup = $clone[0].outerHTML;

            const payload = {
                action: 'aipg_studio_insert_element', // Re-using insert endpoint, parsing 'delete' action_type
                nonce: aipg_editor_vars.nonce,
                action_type: 'delete',
                position: '',
                prompt: '',
                lookup_markup: targetMarkup,
                post_id: parseInt(aipg_editor_vars.post_id, 10),
            };

            $.ajax({
                url: aipg_editor_vars.ajaxurl,
                type: 'POST',
                data: payload,
                success: function (response) {
                    if (response.success) {
                        self.$overlay.hide().removeClass('aipg-active');
                        $block.fadeOut(300, function () { $(this).remove(); });
                        self.$currentBlock = null;

                        // Fire a small toast or visual confirmation
                        const $toast = $('<div style="position:fixed;bottom:20px;right:20px;background:#ef4444;color:white;padding:12px 24px;border-radius:8px;z-index:999999;box-shadow:0 10px 25px rgba(0,0,0,0.5);">Block Deleted</div>').appendTo('body');
                        setTimeout(() => $toast.fadeOut(300, function () { $(this).remove(); }), 2500);

                    } else {
                        $block.css('border', originalBorder || '').fadeTo(100, 1.0);
                        const errorMsg = typeof response.data === 'string' ? response.data : (response.data.message || 'Unknown error');
                        self.showErrorModal('Deletion failed: ' + errorMsg);
                    }
                },
                error: function (xhr, status, error) {
                    $block.css('border', originalBorder || '').fadeTo(100, 1.0);
                    self.showErrorModal('Network error during deletion: ' + status);
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
        },

        refreshNavigator: function() {
            const $tree = this.$navigator.find('.aipg-nav-tree');
            $tree.empty();
            const self = this;
            
            // Collect main structural parts with priority
            const $header = $('.aipg-part-header, header').first();
            const $footer = $('.aipg-part-footer, footer').first();
            
            // For Body/Main, we look for typical content wrappers
            const $main = $('main, .entry-content, #main-content, .wp-site-blocks > main').first();
            
            if ($header.length) self.buildTree($header, $tree);
            
            // If we found a main content area, add it specifically
            if ($main.length && $main[0] !== $header[0] && $main[0] !== $footer[0]) {
                self.buildTree($main, $tree);
            } else if ($tree.children().length === 0) {
                // Fallback to the wizard root or body if no specific parts found yet
                const $root = $('#wp-studio-wizard-root');
                self.buildTree($root.length ? $root : $('body'), $tree);
            }
            
            if ($footer.length && $footer[0] !== $header[0]) {
                self.buildTree($footer, $tree);
            }
        },

        buildTree: function($container, $parentList) {
            const self = this;
            const skipTags = ['script', 'style', 'svg', 'br', 'hr', 'input', 'label'];
            
            $container.children().each(function() {
                const $child = $(this);
                
                // Exclude AI UI elements
                if ($child.hasClass('aipg-editor-modal') || $child.hasClass('aipg-mode-toggle') || $child.is('#wpadminbar')) {
                    return;
                }
                
                const tag = $child.prop('tagName').toLowerCase();
                
                if (skipTags.includes(tag)) return;
                
                // Reduce Spans: Skip span elements that have no classes
                if (tag === 'span' && !$child.attr('class')) {
                    self.buildTree($child, $parentList);
                    return;
                }
                
                const $item = self.createTreeItem($child);
                $parentList.append($item);
                
                const $subList = $('<ul class="aipg-nav-children"></ul>');
                $item.append($subList);
                self.buildTree($child, $subList);
                
                if ($subList.children().length > 0) {
                    $item.addClass('has-children expanded');
                }
            });
        },

        createTreeItem: function($el) {
            const type = this.getElementType($el);
            const icon = this.getElementIcon(type);
            
            const $item = $(`
                <li class="aipg-nav-item">
                    <div class="aipg-nav-label">
                        <span class="aipg-nav-toggle"><svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="3" fill="none"><polyline points="9 18 15 12 9 6"></polyline></svg></span>
                        <span class="aipg-nav-type-icon">${icon}</span>
                        <span class="aipg-nav-text">${type}</span>
                    </div>
                </li>
            `);
            
            $item.data('el', $el);
            return $item;
        },

        getElementType: function($el) {
            const classes = $el.attr('class') || '';
            const tag = $el.prop('tagName').toLowerCase();
            
            if (classes.includes('wp-block-heading')) return 'Heading';
            if (classes.includes('wp-block-paragraph')) return 'Paragraph';
            if (classes.includes('wp-block-image')) return 'Image';
            if (classes.includes('wp-block-button')) return 'Button';
            if (classes.includes('wp-block-group')) return 'Group';
            if (classes.includes('wp-block-columns')) return 'Columns';
            if (classes.includes('wp-block-column')) return 'Column';
            if (classes.includes('wp-block-cover')) return 'Cover';
            
            // Critical Main Segments
            if (classes.includes('aipg-part-header') || tag === 'header') return 'Header';
            if (classes.includes('aipg-part-footer') || tag === 'footer') return 'Footer';
            if (tag === 'main') return 'Main Content';
            if (tag === 'body') return 'Page Body';
            
            return tag.charAt(0).toUpperCase() + tag.slice(1);
        },

        getElementIcon: function(type) {
            const t = type.toLowerCase();
            const iconMap = {
                'heading': 'H',
                'paragraph': 'P',
                'image': '▨',
                'button': '●',
                'group': '▣',
                'columns': '⫴',
                'column': '▯',
                'cover': '🌅',
                'header': '▭',
                'footer': '▱',
                'div': '◇',
                'span': '▫',
                'section': '▭',
                'article': '📝',
                'main': '🏠',
                'aside': '🗒️',
                'nav': '🧭',
                'ul': 'list',
                'ol': 'list',
                'li': '•',
                'a': '🔗',
                'img': '▨',
                'p': 'P',
                'h1': 'H1',
                'h2': 'H2',
                'h3': 'H3',
                'h4': 'H4',
                'h5': 'H5',
                'h6': 'H6'
            };
            
            // Refined check for specific tags
            if (t.startsWith('h') && t.length <= 2) return t.toUpperCase();
            if (t === 'p' || t === 'paragraph') return 'P';
            if (t === 'img' || t === 'image') return '▨';
            if (t === 'div') return '◇';
            if (t === 'span') return '·';
            if (t === 'a' || t === 'link') return '🔗';
            if (t === 'ul' || t === 'ol') return '≣';
            if (t === 'li') return '•';
            if (t === 'button') return '●';
            if (t === 'section' || t === 'article') return '▭';
            if (t === 'header') return '▤';
            if (t === 'footer') return 'row';

            return iconMap[t] || '•';
        },

        selectNavigatorNode: function($el) {
            const self = this;
            if (!$el || !$el.length) return;
            
            // Find the item in the tree
            const $items = this.$navigator.find('.aipg-nav-item');
            let $foundItem = null;
            
            $items.each(function() {
                if ($(this).data('el') && $(this).data('el')[0] === $el[0]) {
                    $foundItem = $(this);
                    return false;
                }
            });
            
            if ($foundItem) {
                $('.aipg-nav-item').removeClass('active');
                $foundItem.addClass('active');
                
                // Expand parents
                $foundItem.parents('.aipg-nav-item').addClass('expanded');
                
                // Scroll into view
                const $area = this.$navigator.find('.aipg-nav-tree-area');
                $area.scrollTop($area.scrollTop() + $foundItem.position().top - 50);
            }
        }
    };

    $(document).ready(() => AIStudioEditor.init());

})(jQuery);
