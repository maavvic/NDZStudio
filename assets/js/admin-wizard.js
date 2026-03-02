/**
 * WP Studio Wizard - Core Logic
 * Version 1.1.5 - Forced Load
 */
console.log('%c[Wizard] admin-wizard.js Loaded Successfully', 'color: white; background: #0071e3; padding: 5px; border-radius: 3px;');

(function ($) {
    'use strict';

    const WPStudioWizard = {
        currentStep: 0,
        data: {
            siteName: '',
            industry: '',
            style: '',
            pages: [],
            palette: {
                base: [],
                variation: []
            },
            template: null,
            error: null
        },

        steps: [
            {
                title: 'The Canvas of Your Vision',
                subtitle: 'Every masterpiece begins with a name. How shall we call your site?',
                render: function () {
                    return `
                        <div class="ws-form-group">
                            <label class="ws-label">Website Name</label>
                            <input type="text" id="ws-site-name" class="ws-input" placeholder="e.g. My Awesome Bakery" value="${WPStudioWizard.data.siteName}">
                        </div>

                        <div id="ws-recent-projects-area" style="margin-top: 40px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 30px;">
                            <h3 class="ws-mini-title" style="margin-bottom:20px; font-size: 16px; font-weight: 600;">Resume Your Projects</h3>
                            <div id="ws-recent-projects-list">
                                <div class="ws-ai-loading"><div class="ws-mini-spinner"></div> Looking for saved designs...</div>
                            </div>
                        </div>
                    `;
                },
                onEnter: function () {
                    WPStudioWizard.fetchRecentProjects();
                },
                validate: function () {
                    const val = $('#ws-site-name').val().trim();
                    if (!val) return 'Please enter a name for your website.';
                    WPStudioWizard.data.siteName = val;
                    return true;
                }
            },
            {
                title: 'Defining the Essence',
                subtitle: 'Choose the medium that best describes your digital presence.',
                render: function () {
                    const industries = [
                        { id: 'business', title: 'Business / Company', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 21h18M3 7v14M21 7v14M9 21V10l3-3 3 3v11m-6-3h6"/></svg>' },
                        { id: 'ecommerce', title: 'Online Store', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' },
                        { id: 'portfolio', title: 'Portfolio / Creator', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
                        { id: 'blog', title: 'Blog / Magazine', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>' },
                        { id: 'restaurant', title: 'Food & Drink', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>' }
                    ];
                    return `
                        <div class="ws-option-grid">
                            ${industries.map(ind => `
                                <div class="ws-option-card ${WPStudioWizard.data.industry === ind.id ? 'active' : ''}" data-id="${ind.id}">
                                    <div class="ws-option-icon">${ind.icon}</div>
                                    <div class="ws-option-title">${ind.title}</div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                },
                validate: function () {
                    if (!WPStudioWizard.data.industry) return 'Please select your website type.';
                    return true;
                }
            },
            {
                title: 'The Visual Signature',
                subtitle: 'Select an aesthetic soul for your brand.',
                render: function () {
                    const styles = [
                        { id: 'minimal', title: 'Minimalist', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>' },
                        { id: 'modern', title: 'Modern', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4.43a1.67 1.67 0 0 1 2.4 0L9 8z"></path><path d="M12 15v5s3.03-.55 4.43-2.03a1.67 1.67 0 0 0 0-2.43L16 15z"></path></svg>' },
                        { id: 'classic', title: 'Classic', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>' },
                        { id: 'bold', title: 'Bold & Vibrant', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>' }
                    ];
                    return `
                        <div class="ws-option-grid">
                            ${styles.map(s => `
                                <div class="ws-option-card ${WPStudioWizard.data.style === s.id ? 'active' : ''}" data-id="${s.id}">
                                    <div class="ws-option-icon">${s.icon}</div>
                                    <div class="ws-option-title">${s.title}</div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                },
                validate: function () {
                    if (!WPStudioWizard.data.style) return 'Please select a style.';
                    return true;
                }
            },
            {
                title: 'Color Foundations',
                subtitle: 'Choose a primary palette that resonates with your brand.',
                render: function () {
                    const palettes = [
                        { label: 'Onyx & Gold', colors: ['#1a1a1a', '#d4af37', '#ffffff'] },
                        { label: 'Ocean Breeze', colors: ['#0077b6', '#90e0ef', '#caf0f8'] },
                        { label: 'Nordic Forest', colors: ['#2d6a4f', '#74c69d', '#d8f3dc'] },
                        { label: 'Berry Bliss', colors: ['#800f2f', '#ff4d6d', '#fff0f3'] },
                        { label: 'Cyber Punk', colors: ['#130f40', '#f0932b', '#eb4d4b'] },
                        { label: 'Zen Minimal', colors: ['#3d405b', '#e07a5f', '#f4f1de'] }
                    ];
                    return `
                        <div class="ws-palette-grid" id="ws-base-palettes">
                            ${palettes.map((p, idx) => `
                                <div class="ws-palette-card ${JSON.stringify(WPStudioWizard.data.palette.base) === JSON.stringify(p.colors) ? 'active' : ''}" data-idx="${idx}" data-colors='${JSON.stringify(p.colors)}'>
                                    <div class="ws-swatch-container">
                                        ${p.colors.map(c => `<div class="ws-swatch" style="background:${c}"></div>`).join('')}
                                    </div>
                                    <div class="ws-palette-label">${p.label}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="ws-custom-color-box">
                            <label class="ws-label">Or Pick a Custom Brand Color</label>
                            <div class="ws-color-input-wrapper">
                                <input type="color" id="ws-custom-color" class="ws-color-picker" value="${WPStudioWizard.data.palette.base[0] || '#d94e28'}">
                                <button class="ws-btn ws-btn-secondary" id="ws-btn-ai-suggest">Ask AI to Generate Palette</button>
                            </div>
                            <div id="ai-loading-indicator" style="display:none;" class="ws-ai-loading">
                                <div class="ws-mini-spinner"></div> Generating harmonious options...
                            </div>
                        </div>
                    `;
                },
                validate: function () {
                    if (WPStudioWizard.data.palette.base.length === 0) return 'Please select a base palette or define a custom color.';
                    return true;
                }
            },
            {
                title: 'Atmospheric Variations',
                subtitle: 'Fine-tune the mood. Which variation feels most authentic?',
                render: function () {
                    const self = WPStudioWizard;
                    if (!self.aiOptions || self.aiOptions.length === 0) {
                        if (self.data.error) {
                            return `<div class="ws-error-container"><div class="ws-error-message">${self.data.error}</div><button class="ws-btn ws-btn-secondary ws-btn-sm" onclick="WPStudioWizard.retry()">Retry AI</button></div>`;
                        }
                        return '<div class="ws-ai-loading"><div class="ws-mini-spinner"></div> Loading variations...</div>';
                    }
                    return `
                        <div class="ws-palette-grid">
                            ${self.aiOptions.map((p, idx) => `
                                <div class="ws-palette-card variation ${JSON.stringify(self.data.palette.variation) === JSON.stringify(p.colors) ? 'active' : ''}" data-idx="${idx}" data-colors='${JSON.stringify(p.colors)}'>
                                    <div class="ws-swatch-container">
                                        ${p.colors.map(c => `<div class="ws-swatch" style="background:${c}"></div>`).join('')}
                                    </div>
                                    <div class="ws-palette-label">${p.label}</div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                },
                onEnter: function () {
                    const self = WPStudioWizard;
                    if (self.isFetching) return;
                    if (!self.aiOptions || self.lastBase !== JSON.stringify(self.data.palette.base)) {
                        self.fetchAiOptions(2);
                    }
                },
                validate: function () {
                    if (WPStudioWizard.data.palette.variation.length === 0) return 'Please select a variation.';
                    return true;
                }
            },
            {
                title: 'The Architectural Soul',
                subtitle: 'Which structure speaks most to your vision? AI has prepared 3 bespoke concepts.',
                render: function () {
                    if (WPStudioWizard.data.error) {
                        return `<div class="ws-error-container"><div class="ws-error-icon">⚠️</div><div class="ws-error-message">${WPStudioWizard.data.error}</div><button class="ws-btn ws-btn-secondary" onclick="WPStudioWizard.retry()">Try Again</button></div>`;
                    }
                    if (!WPStudioWizard.templates || WPStudioWizard.templates.length === 0) {
                        return '<div class="ws-ai-loading"><div class="ws-mini-spinner"></div> Architecting your options...</div>';
                    }
                    return `
                        <div class="ws-template-grid">
                            ${WPStudioWizard.templates.map((t, idx) => `
                                <div class="ws-template-card ${WPStudioWizard.data.template && WPStudioWizard.data.template.name === t.name ? 'active' : ''}" data-idx="${idx}">
                                    <div class="ws-template-header">
                                        <h3 class="ws-template-name">${t.name}</h3>
                                        <p class="ws-template-desc">${t.description}</p>
                                    </div>
                                    <div class="ws-template-pages">
                                        <label class="ws-mini-label">Included Pages:</label>
                                        <div class="ws-page-chips">
                                            ${t.pages.map(p => `<span class="ws-page-chip" title="${p.summary}">${p.title}</span>`).join('')}
                                        </div>
                                    </div>
                                    <div class="ws-template-actions" style="display: none;">
                                        <button class="ws-btn ws-btn-preview" data-idx="${idx}">
                                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            View Website Preview
                                        </button>
                                        <div class="ws-preview-status" style="display:none;">
                                            <div class="ws-mini-spinner"></div> <span class="ws-status-text">Architecting...</span>
                                        </div>
                                        <button class="ws-btn ws-btn-secondary ws-btn-save-project" data-idx="${idx}" style="margin-top:10px; width:100%; justify-content:center;">
                                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                            Save to My Projects
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                },
                onEnter: function () {
                    const self = WPStudioWizard;
                    if (self.isFetching) return;
                    if (!self.templates) {
                        self.fetchTemplates();
                    }
                },
                validate: function () {
                    if (!WPStudioWizard.data.template) return 'Please select a template concept.';
                    return true;
                }
            },
            {
                title: 'The Final Brushstroke',
                subtitle: 'Review your composition before we bring it to life.',
                render: function () {
                    const industryMap = { business: 'Business / Company', ecommerce: 'Online Store', portfolio: 'Portfolio', blog: 'Blog', restaurant: 'Food & Drink' };
                    const styleMap = { minimal: 'Minimalist', modern: 'Modern', classic: 'Classic', bold: 'Bold & Vibrant' };
                    const p = WPStudioWizard.data.palette.variation;
                    return `
                                <div class="ws-summary-card" style="background: rgba(0, 113, 227, 0.05); padding: 30px; border-radius: 24px; text-align: left;">
                                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 24px;">
                                        <div>
                                            <p style="margin-bottom:8px;"><strong>Website Name:</strong> ${WPStudioWizard.data.siteName}</p>
                                            <p style="margin-bottom:8px;"><strong>Industry:</strong> ${industryMap[WPStudioWizard.data.industry] || WPStudioWizard.data.industry}</p>
                                            <p style="margin-bottom:8px;"><strong>Visual Style:</strong> ${styleMap[WPStudioWizard.data.style] || WPStudioWizard.data.style}</p>
                                            <p style="margin-bottom:8px;"><strong>Selected Concept:</strong> ${WPStudioWizard.data.template ? WPStudioWizard.data.template.name : 'None'}</p>
                                        </div>
                                        <div style="text-align:right">
                                            <label class="ws-label">Your Palette</label>
                                            <div class="ws-swatch-container" style="justify-content:flex-end; margin-top:10px;">
                                                ${p.map(c => `<div class="ws-swatch" style="background:${c}; width:40px; height:40px;"></div>`).join('')}
                                            </div>
                                        </div>
                                    </div>
                                    <div style="border-top: 1px solid rgba(0,0,0,0.1); padding-top: 20px;">
                                        <strong>Structure Preview:</strong>
                                        <div class="ws-page-chips" style="margin-top: 10px;">
                                            ${WPStudioWizard.data.template ? WPStudioWizard.data.template.pages.map(pg => `<span class="ws-page-chip">${pg.title}</span>`).join('') : ''}
                                        </div>
                                    </div>
                                    <p style="margin-top: 24px; color: var(--ws-text-secondary); font-size: 15px;">Click "Generate Studio" to start the AI engine and build your custom WordPress environment.</p>
                                </div>
                    `;
                },
                validate: function () { return true; }
            }
        ],

        init: function () {
            try {
                console.log('%c[Wizard] Init Started. currentStep: ' + this.currentStep, 'color: #0071e3; font-weight: bold;');
                this.goToStep(0);
                this.bindEvents();
            } catch (e) {
                console.error('%c[Wizard Init Error]', 'color: white; background: red; padding: 5px;', e);
            }
        },

        goToStep: function (stepIdx) {
            this.currentStep = stepIdx;
            const step = this.steps[this.currentStep];
            console.log(`[Wizard] Moving to Step: ${this.currentStep} -> ${step.title}`);

            // Render first to show loading state if needed
            this.render();

            if (step.onEnter) {
                console.log(`%c[Wizard] Executing onEnter for Step: ${this.currentStep}`, 'color: #8e44ad; font-weight: bold;');
                step.onEnter();
            }
        },

        render: function () {
            const step = this.steps[this.currentStep];
            const isLast = this.currentStep === this.steps.length - 1;
            const progress = ((this.currentStep + 1) / this.steps.length) * 100;

            console.log(`[Wizard] Rendering UI for Step: ${this.currentStep}`);

            const html = `
                <div class="ws-wizard-step" key="${this.currentStep}">
                    <div class="ws-step-header" style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h2 class="ws-title">${step.title}</h2>
                            <p class="ws-subtitle">${step.subtitle}</p>
                        </div>
                        <button class="ws-btn ws-btn-secondary ws-btn-sm" id="ws-btn-my-projects">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:5px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                            My Projects
                        </button>
                    </div>
                    
                    <div id="ws-step-content">
                        ${step.render()}
                    </div>

                    <div class="ws-footer">
                        <button class="ws-btn ws-btn-secondary" id="ws-prev" ${this.currentStep === 0 ? 'style="visibility:hidden"' : ''}>Back</button>
                        <button class="ws-btn ws-btn-primary" id="ws-next">
                            ${isLast ? 'Generate Studio' : 'Continue'}
                        </button>
                    </div>
                </div>
            `;

            $('#wp-studio-wizard-root').html(html);

            // Append progress bar to the main container if it doesn't exist
            if (!$('#ws-progress-bar').length) {
                $('#wp-studio-wizard-root').append('<div id="ws-progress-bar" class="ws-progress-bar"></div>');
            }
            $('#ws-progress-bar').css('width', progress + '%');
        },

        bindEvents: function () {
            const self = this;

            $(document).on('click', '.ws-option-card', function () {
                const id = $(this).data('id');
                const step = self.steps[self.currentStep];

                if (self.currentStep === 1) self.data.industry = id;
                if (self.currentStep === 2) self.data.style = id;

                $('.ws-option-card').removeClass('active');
                $(this).addClass('active');
            });

            $(document).on('click', '.ws-palette-card', function () {
                const colors = $(this).data('colors');
                const $this = $(this);

                if ($this.hasClass('variation')) {
                    self.data.palette.variation = colors;
                } else {
                    self.data.palette.base = colors;
                    self.data.palette.variation = []; // Reset sub-choices
                }

                $this.parent().find('.ws-palette-card').removeClass('active');
                $this.addClass('active');
            });

            $(document).on('click', '.ws-template-card', function () {
                const idx = $(this).data('idx');
                self.data.template = self.templates[idx];
                $('.ws-template-card').removeClass('active').find('.ws-template-actions').hide();
                $(this).addClass('active').find('.ws-template-actions').fadeIn();
            });

            $(document).on('click', '.ws-btn-preview', function (e) {
                e.stopPropagation();
                const idx = $(this).data('idx');
                if (idx === undefined) return;
                const template = self.templates[idx];
                self.generatePrototype(template, $(this).closest('.ws-template-card'));
            });

            $(document).on('click', '#ws-btn-ai-suggest', function () {
                const baseColor = $('#ws-custom-color').val();
                self.data.palette.base = [baseColor, '#ffffff', '#000000']; // Temporary base
                self.fetchAiOptions(1, baseColor);
            });

            $(document).on('click', '#ws-next', function () {
                const step = self.steps[self.currentStep];
                const validation = step.validate();

                if (validation !== true) {
                    alert(validation);
                    return;
                }

                if (self.currentStep < self.steps.length - 1) {
                    self.goToStep(self.currentStep + 1);
                } else {
                    self.finish();
                }
            });

            $(document).on('click', '#ws-prev', function () {
                if (self.currentStep > 0) {
                    self.goToStep(self.currentStep - 1);
                }
            });

            $(document).on('click', '#ws-btn-my-projects', function () {
                self.showProjectsView();
            });

            $(document).on('click', '.ws-btn-save-project', function (e) {
                e.stopPropagation();
                const idx = $(this).data('idx');
                const $btn = $(this);
                const template = self.templates[idx];
                self.saveToLibrary(template, $btn);
            });

            $(document).on('click', '.ws-btn-deploy-pj', function () {
                const pjId = $(this).data('id');
                self.deployProject(pjId);
            });

            $(document).on('click', '.ws-btn-remove-pj', function () {
                const pjId = $(this).data('id');
                if (confirm('Are you sure? This will permanently delete all pages and content for this project.')) {
                    self.removeProject(pjId);
                }
            });

            // Load Saved Project Snapshot
            $(document).on('click', '.ws-btn-load-project', function () {
                const id = $(this).data('id');
                self.loadProject(id);
            });

            // Delete Saved Project Snapshot
            $(document).on('click', '.ws-btn-delete-project', function (e) {
                e.stopPropagation();
                const id = $(this).data('id');
                if (confirm('Permanently delete this saved version?')) {
                    self.deleteProject(id);
                }
            });
        },

        finish: function () {
            const self = this;
            const template = this.data.template;

            if (!template) {
                alert('No template selected. Please go back and pick a concept.');
                return;
            }

            $('#wp-studio-wizard-root').html(`
                <div class="aipg-wizard-loading">
                    <div class="aipg-spinner"></div>
                    <h2 class="ws-title">Architecting Your Studio...</h2>
                    <p class="ws-subtitle" id="ws-finish-status">Our AI is now crafting your multi-page website based on the "${template.name}" concept.</p>
                </div>
            `);

            console.log('[Wizard] Starting Final Generation for:', template.name);

            const payload = {
                action: 'aipg_generate_studio_prototype',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                template_name: template.name,
                prototype_prompt: template.prototype_prompt,
                palette: self.data.palette.variation
            };

            $.post(ajaxurl, payload, function (res) {
                if (res.success && res.data.status === 'COMPLETED') {
                    $('#ws-finish-status').text('Installing your custom WordPress environment...');

                    $.post(ajaxurl, {
                        action: 'aipg_install_prototype',
                        nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                        code: res.data.response,
                        template_name: template.name
                    }, function (installRes) {
                        if (installRes.success) {
                            self.showSuccess(installRes.data.preview_url);
                        } else {
                            self.showError('Installation failed: ' + installRes.data);
                        }
                    });
                } else {
                    const errorMsg = (res && res.data) ? res.data : 'The AI engine might be busy or returning malformed data.';
                    self.showError('Generation failed: ' + errorMsg + ' Please try again in 30 seconds.');
                }
            }).fail(function (jqXHR) {
                const status = jqXHR.status;
                let msg = 'Connection error during final generation.';
                if (status === 0) msg += ' (Check if your backend is running at http://localhost:8000)';
                if (status === 504) msg += ' (Gateway Timeout - The AI took too long)';
                self.showError(msg);
            });
        },

        showSuccess: function (previewUrl) {
            $('#wp-studio-wizard-root').html(`
                <div class="ws-wizard-step" style="text-align:center; align-items:center;">
                    <div style="font-size: 64px; margin-bottom: 20px;">✨</div>
                    <h2 class="ws-title">Your Studio is Ready!</h2>
                    <p class="ws-subtitle">We've successfully architected and installed your multi-page website prototype.</p>
                    
                    <div style="margin: 40px 0; display: flex; gap: 20px; justify-content: center;">
                        <a href="${previewUrl}" target="_blank" class="ws-btn ws-btn-primary" style="text-decoration:none; padding: 15px 30px;">
                            Launch Website
                        </a>
                        <a href="?page=nodevzone" class="ws-btn ws-btn-secondary" style="text-decoration:none; padding: 15px 30px;">
                            Close & View Projects
                        </a>
                    </div>
                    
                    <p style="color: var(--ws-text-secondary); font-size: 14px; max-width: 500px;">
                        You can now view your website, navigate through all pages, and refine the design further from the AI Studio dashboard.
                    </p>
                </div>
            `);
            // Set progress to 100%
            $('#ws-progress-bar').css('width', '100%');
        },

        showError: function (msg) {
            $('#wp-studio-wizard-root').html(`
                <div class="ws-wizard-step" style="text-align:center; align-items:center;">
                    <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
                    <h2 class="ws-title">Architecture Interrupted</h2>
                    <p class="ws-subtitle">${msg}</p>
                    <button class="ws-btn ws-btn-primary" onclick="location.reload()">Restart Wizard</button>
                </div>
            `);
        },

        fetchAiOptions: function (step, baseColor = null) {
            const self = this;
            if (this.isFetching) return;
            this.isFetching = true;

            const payload = {
                step: step,
                base_color: baseColor,
                current_palette: step === 2 ? self.data.palette.base : null
            };

            if (step === 1) {
                $('#ai-loading-indicator').show();
            }

            this.data.error = null;

            this.callAiStudio('suggest-colors', payload).then(res => {
                if (step === 1) {
                    $('#ai-loading-indicator').hide();
                    if (res.options && res.options.length > 0) {
                        self.data.palette.base = res.options[0].colors;
                        self.render();
                    }
                } else if (step === 2) {
                    self.aiOptions = res.options;
                    self.lastBase = JSON.stringify(self.data.palette.base);
                    self.render();
                }
                self.isFetching = false;
            }).catch(err => {
                console.error('AI Color Error:', err);
                self.data.error = "The AI failed to generate color variations. Please try again or select a palette manually.";
                if (step === 1) $('#ai-loading-indicator').hide();
                self.isFetching = false;
                self.render();
            });
        },

        fetchTemplates: function () {
            const self = this;
            if (this.isFetching) return;
            this.isFetching = true;

            const payload = {
                site_name: self.data.siteName,
                industry: self.data.industry,
                style: self.data.style,
                palette: self.data.palette.variation
            };

            this.data.error = null;
            this.callAiStudio('suggest-templates', payload).then(res => {
                self.templates = res.templates || [];
                self.isFetching = false;
                self.render();
            }).catch(err => {
                console.error('Template Fetch Error:', err);
                self.data.error = "The AI failed to architect your templates. This might be a temporary connection issue.";
                self.isFetching = false;
                self.render();
            });
        },

        retry: function () {
            this.data.error = null;
            const currentStep = this.steps[this.currentStep];
            if (currentStep.onEnter) currentStep.onEnter();
            this.render();
        },

        generatePrototype: function (template, $card) {
            const self = this;
            const $status = $card.find('.ws-preview-status');
            const $btn = $card.find('.ws-btn-preview');

            $btn.prop('disabled', true).css('opacity', 0.5);
            $status.show().find('.ws-status-text').text('Initiating AI Generation...');

            const payload = {
                action: 'aipg_generate_studio_prototype',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                template_name: template.name,
                prototype_prompt: template.prototype_prompt,
                palette: self.data.palette.variation
            };

            console.log('[Wizard] Generating Prototype for:', template.name, 'Payload:', payload);

            $.post(ajaxurl, payload, function (res) {
                console.log('[Wizard] Prototype Response:', res);
                if (res.success && res.data.status === 'COMPLETED') {
                    $status.find('.ws-status-text').text('Installing Prototype...');
                    self.installPrototype(res.data.response, template.name, $card, template.id);
                } else {
                    const data = (res && res.data) ? res.data : 'The AI engine might be busy or returning malformed data.';
                    let errorMsg = typeof data === 'object' ? (data.msg || JSON.stringify(data)) : data;

                    $status.find('.ws-status-text').text('Generation Error');
                    console.error('[Wizard] Prototype Generation Error:', data);
                    alert('Generation Failed: ' + errorMsg);
                    $btn.prop('disabled', false).css('opacity', 1);
                }
            }).fail(function (jqXHR) {
                console.error('[Wizard] Prototype Request Failed:', jqXHR);
                alert('Connection error during prototype generation.');
                $btn.prop('disabled', false).css('opacity', 1);
            });
        },

        installPrototype: function (code, name, $card, project_id) {
            const self = this;
            const $status = $card.find('.ws-preview-status');

            $.post(ajaxurl, {
                action: 'aipg_install_prototype',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                code: code,
                template_name: name,
                project_id: project_id
            }, function (res) {
                if (res.success) {
                    $status.show().html(`
                        <a href="${res.data.preview_url}" target="_blank" class="ws-btn ws-btn-primary ws-btn-launch" style="text-decoration:none; display:inline-flex;">
                            Launch Live Preview
                        </a>
                    `);
                    $card.find('.ws-btn-preview').hide();
                } else {
                    alert('Installation failed: ' + res.data);
                }
            });
        },

        fetchRecentProjects: function () {
            const self = this;
            $.post(ajaxurl, {
                action: 'aipg_list_studio_projects',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : ''
            }, function (res) {
                if (res.success && res.data.projects.length > 0) {
                    self.renderRecentProjects(res.data.projects);
                } else {
                    $('#ws-recent-projects-list').html('<p style="color:#999; font-size:13px; font-style:italic;">No saved projects found. Your first design journey starts here!</p>');
                }
            });
        },

        renderRecentProjects: function (projects) {
            const listHtml = projects.map(pj => `
                <div class="ws-project-mini-card">
                    <div class="ws-pj-info">
                        <strong>${pj.name}</strong>
                        <span>${new Date(pj.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="ws-pj-actions">
                        <button class="ws-btn ws-btn-sm ws-btn-primary ws-btn-load-project" data-id="${pj.id}">Load & Edit</button>
                        <button class="ws-btn ws-btn-sm ws-btn-secondary ws-btn-delete-project" data-id="${pj.id}" title="Delete">
                             <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            `).join('');
            $('#ws-recent-projects-list').html(listHtml);
        },

        loadProject: function (id) {
            const $btn = $(`.ws-btn-load-project[data-id="${id}"]`);
            $btn.text('Loading...').prop('disabled', true);

            $.post(ajaxurl, {
                action: 'aipg_load_project',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                project_id: id
            }, function (res) {
                if (res.success) {
                    window.location.href = res.data.redirect_url;
                } else {
                    alert('Load failed: ' + res.data);
                    $btn.text('Load & Edit').prop('disabled', false);
                }
            });
        },

        deleteProject: function (id) {
            $.post(ajaxurl, {
                action: 'aipg_delete_project',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                project_id: id
            }, function (res) {
                if (res.success) {
                    WPStudioWizard.fetchRecentProjects();
                } else {
                    alert('Delete failed.');
                }
            });
        },

        showProjectsView: function () {
            const self = this;
            $('#wp-studio-wizard-root').html(`
                <div class="ws-wizard-step">
                    <div class="ws-step-header">
                        <h2 class="ws-title">My Designs</h2>
                        <p class="ws-subtitle">Manage and continue your AI-architected creations.</p>
                    </div>
                    <div id="ws-projects-grid" class="ws-template-grid">
                        <div class="ws-ai-loading"><div class="ws-mini-spinner"></div> Retrieving your projects...</div>
                    </div>
                    <div class="ws-footer">
                        <a href="?page=nodevzone" class="ws-btn ws-btn-secondary">Back to Wizard</a>
                    </div>
                </div>
            `);

            $.post(ajaxurl, {
                action: 'aipg_list_studio_projects',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : ''
            }, function (res) {
                if (res.success) {
                    self.renderProjectsList(res.data.projects, res.data.active_id);
                } else {
                    $('#ws-projects-list').html('<p>Error loading projects.</p>');
                }
            });
        },

        renderProjectsList: function (projects, activeId) {
            if (!projects || projects.length === 0) {
                $('#ws-projects-list').html('<p style="text-align:center; padding: 40px; color:#666;">No projects saved yet. Go through the wizard to architect your first one!</p>');
                return;
            }

            const html = `
                <div class="ws-template-grid" style="margin-top:20px;">
                    ${projects.map(pj => `
                        <div class="ws-template-card ${pj.id === activeId ? 'active' : ''}">
                            <div class="ws-template-header">
                                <h3 class="ws-template-name">${pj.name}</h3>
                                <p class="ws-template-desc">Saved on ${new Date(pj.timestamp * 1000).toLocaleDateString()}</p>
                            </div>
                            <div style="margin-top:15px; display:flex; gap:10px;">
                                <button class="ws-btn ws-btn-primary ws-btn-deploy-pj" data-id="${pj.id}" style="flex:1; justify-content:center;">
                                    ${pj.id === activeId ? 'Re-Deploy' : 'Deploy Now'}
                                </button>
                                <button class="ws-btn ws-btn-secondary ws-btn-remove-pj" data-id="${pj.id}" style="color:#d93025; border-color:#d93025;">
                                    Cleanup
                                </button>
                            </div>
                            ${pj.id === activeId ? '<div style="margin-top:10px; font-size:12px; color:#2d6a4f; font-weight:bold;">● ACTIVE DEPLOYMENT</div>' : ''}
                        </div>
                    `).join('')}
                </div>
            `;
            $('#ws-projects-list').removeClass('ws-ai-loading').html(html);
        },

        saveToLibrary: function (template, $btn) {
            const self = this;
            const originalText = $btn.text();
            $btn.text('Saving...').prop('disabled', true);

            // First generate the code if not already present
            this.prepareProjectCode(template).then(code => {
                $.post(ajaxurl, {
                    action: 'aipg_save_studio_project',
                    nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                    template_name: template.name,
                    code: code
                }, function (res) {
                    if (res.success) {
                        $btn.text('Saved! View in Library').addClass('ws-btn-primary').removeClass('ws-btn-secondary');
                        setTimeout(() => { $btn.text(originalText).prop('disabled', false).removeClass('ws-btn-primary').addClass('ws-btn-secondary'); }, 3000);
                    } else {
                        alert('Save failed: ' + res.data);
                        $btn.text(originalText).prop('disabled', false);
                    }
                });
            }).catch(err => {
                alert('Generation error: ' + err);
                $btn.text(originalText).prop('disabled', false);
            });
        },

        prepareProjectCode: async function (template) {
            const res = await this.callAiStudio('generate-prototype', {
                template_name: template.name,
                prototype_prompt: template.prototype_prompt,
                palette: this.data.palette.variation
            });
            if (res.status === 'COMPLETED') return res.response;
            throw new Error('AI Generation failed');
        },

        deployProject: function (pjId) {
            const self = this;
            const $btn = $(`.ws-btn-deploy-pj[data-id="${pjId}"]`);
            const originalText = $btn.text();
            $btn.text('Deploying...').prop('disabled', true);

            // Re-fetch project list from server to get the code for deployment
            $.post(ajaxurl, {
                action: 'aipg_list_studio_projects',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : ''
            }, function (res) {
                if (res.success) {
                    const pj = res.data.projects.find(p => p.id === pjId);
                    if (!pj) return;

                    $.post(ajaxurl, {
                        action: 'aipg_install_prototype',
                        nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                        code: pj.code,
                        project_id: pj.id,
                        template_name: pj.name
                    }, function (installRes) {
                        if (installRes.success) {
                            $btn.text('Success!').css('background', '#2d6a4f');
                            setTimeout(() => { location.reload(); }, 1500);
                        } else {
                            alert('Deploy failed: ' + installRes.data);
                            $btn.text(originalText).prop('disabled', false);
                        }
                    });
                }
            });
        },

        removeProject: function (pjId) {
            const $btn = $(`.ws-btn-remove-pj[data-id="${pjId}"]`);
            const originalText = $btn.text();
            $btn.text('Deactivating...').prop('disabled', true);

            $.post(ajaxurl, {
                action: 'aipg_remove_studio_project',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                project_id: pjId,
                delete_history: false // Keep in library by default
            }, function (res) {
                if (res.success) {
                    location.reload();
                } else {
                    alert('Cleanup failed: ' + res.data);
                    $btn.text(originalText).prop('disabled', false);
                }
            });
        },

        callAiStudio: async function (endpoint, payload) {
            let baseApiUrl = (typeof aipg_wizard_data !== 'undefined' && aipg_wizard_data.api_url)
                ? aipg_wizard_data.api_url.replace(/\/$/, '')
                : 'http://localhost:8000';

            // SMART REMAPPING: host.docker.internal works INSIDE containers, but 
            // the browser (OUTSIDE containers) needs 'localhost' or '127.0.0.1'.
            let requestUrl = baseApiUrl;
            if (requestUrl.includes('host.docker.internal')) {
                console.log('%c[AI Studio] Remapping host.docker.internal -> localhost for browser accessibility', 'color: #f39c12; font-weight: bold;');
                requestUrl = requestUrl.replace('host.docker.internal', 'localhost');
            }

            const apiUrl = requestUrl + '/api/ai-studio/' + endpoint;

            console.log(`[AI Studio] Fetching from AI: ${apiUrl}`, payload);
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[AI Studio] HTTP ${response.status} Error:`, errorText);
                    try {
                        const errJson = JSON.parse(errorText);
                        throw new Error(errJson.detail || `HTTP ${response.status}`);
                    } catch (e) {
                        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
                    }
                }

                const responseText = await response.text();
                try {
                    const parsed = JSON.parse(responseText);
                    console.log(`[AI Studio] ${endpoint} success:`, parsed);
                    return parsed;
                } catch (jsonErr) {
                    console.error('[AI Studio] JSON Parse Error. Raw response:', responseText);
                    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                        throw {
                            code: 'invalid_json',
                            message: 'Server returned HTML (likely a 404/500 proxy error). Check if backend is running.',
                            raw: responseText.substring(0, 500)
                        };
                    }
                    throw {
                        code: 'invalid_json',
                        message: 'The response is not a valid JSON response.',
                        raw: responseText.substring(0, 500)
                    };
                }
            } catch (e) {
                console.error('[AI Studio] Fetch Error:', e);
                throw e;
            }
        }
    };

    $(document).ready(function () {
        if ($('#wp-studio-wizard-root').length) {
            WPStudioWizard.init();
        }
    });

    // Expose to global scope for inline onclick handlers
    window.WPStudioWizard = WPStudioWizard;

})(jQuery);
