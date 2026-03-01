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
                variation: [],
                fineTuned: []
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
                    `;
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
                    if (!WPStudioWizard.aiOptions || WPStudioWizard.aiOptions.length === 0) {
                        if (WPStudioWizard.data.error) {
                            return `<div class="ws-error-container"><div class="ws-error-message">${WPStudioWizard.data.error}</div><button class="ws-btn ws-btn-secondary ws-btn-sm" onclick="WPStudioWizard.retry()">Retry AI</button></div>`;
                        }
                        return '<div class="ws-ai-loading"><div class="ws-mini-spinner"></div> Loading variations...</div>';
                    }
                    return `
                        <div class="ws-palette-grid">
                            ${WPStudioWizard.aiOptions.map((p, idx) => `
                                <div class="ws-palette-card variation ${JSON.stringify(WPStudioWizard.data.palette.variation) === JSON.stringify(p.colors) ? 'active' : ''}" data-idx="${idx}" data-colors='${JSON.stringify(p.colors)}'>
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
                    if (!WPStudioWizard.aiOptions || WPStudioWizard.lastBase !== JSON.stringify(WPStudioWizard.data.palette.base)) {
                        WPStudioWizard.fetchAiOptions(2);
                    }
                },
                validate: function () {
                    if (WPStudioWizard.data.palette.variation.length === 0) return 'Please select a variation.';
                    return true;
                }
            },
            {
                title: 'The Perfect Tone',
                subtitle: 'Almost there. Pick the final refinement for your Studio.',
                render: function () {
                    if (!WPStudioWizard.aiFineOptions || WPStudioWizard.aiFineOptions.length === 0) {
                        if (WPStudioWizard.data.error) {
                            return `<div class="ws-error-container"><div class="ws-error-message">${WPStudioWizard.data.error}</div><button class="ws-btn ws-btn-secondary ws-btn-sm" onclick="WPStudioWizard.retry()">Retry AI</button></div>`;
                        }
                        return '<div class="ws-ai-loading"><div class="ws-mini-spinner"></div> Refining tones...</div>';
                    }
                    return `
                        <div class="ws-palette-grid">
                            ${WPStudioWizard.aiFineOptions.map((p, idx) => `
                                <div class="ws-palette-card fine ${JSON.stringify(WPStudioWizard.data.palette.fineTuned) === JSON.stringify(p.colors) ? 'active' : ''}" data-idx="${idx}" data-colors='${JSON.stringify(p.colors)}'>
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
                    if (!WPStudioWizard.aiFineOptions || WPStudioWizard.lastVariation !== JSON.stringify(WPStudioWizard.data.palette.variation)) {
                        WPStudioWizard.fetchAiOptions(3);
                    }
                },
                validate: function () {
                    if (WPStudioWizard.data.palette.fineTuned.length === 0) return 'Please select your final tones.';
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
                                    <div class="ws-template-actions" style="margin-top: 15px; display: none;">
                                        <button class="ws-btn ws-btn-secondary ws-btn-sm ws-btn-preview" data-idx="${idx}">
                                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:8px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            Preview Prototype
                                        </button>
                                        <div class="ws-preview-status" style="display:none; margin-top:10px; font-size:12px; color:var(--ws-accent);">
                                            <div class="ws-mini-spinner"></div> <span class="ws-status-text">Generating...</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                },
                onEnter: function () {
                    if (!WPStudioWizard.templates) {
                        WPStudioWizard.fetchTemplates();
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
                    const p = WPStudioWizard.data.palette.fineTuned;
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
                this.render();
                this.bindEvents();
            } catch (e) {
                console.error('%c[Wizard Init Error]', 'color: white; background: red; padding: 5px;', e);
            }
        },

        render: function () {
            const step = this.steps[this.currentStep];
            const isLast = this.currentStep === this.steps.length - 1;
            const progress = ((this.currentStep + 1) / this.steps.length) * 100;

            console.log(`[Wizard] Rendering Step: ${this.currentStep} -> ${step.title}`);
            if (step.onEnter) {
                console.log(`%c[Wizard] Executing onEnter for Step: ${this.currentStep}`, 'color: #8e44ad; font-weight: bold;');
                step.onEnter();
            }

            const html = `
                <div class="ws-wizard-step" key="${this.currentStep}">
                    <h2 class="ws-title">${step.title}</h2>
                    <p class="ws-subtitle">${step.subtitle}</p>
                    
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
                } else if ($this.hasClass('fine')) {
                    self.data.palette.fineTuned = colors;
                } else {
                    self.data.palette.base = colors;
                    self.data.palette.variation = []; // Reset sub-choices
                    self.data.palette.fineTuned = [];
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
                    self.currentStep++;
                    self.render();
                } else {
                    self.finish();
                }
            });

            $(document).on('click', '#ws-prev', function () {
                if (self.currentStep > 0) {
                    self.currentStep--;
                    self.render();
                }
            });
        },

        finish: function () {
            $('#wp-studio-wizard-root').html(`
                <div class="aipg-wizard-loading">
                    <div class="aipg-spinner"></div>
                    <h2 class="ws-title">Generating your Studio...</h2>
                    <p class="ws-subtitle">Our AI is crafting a beautiful template based on your choices.</p>
                </div>
            `);

            // This is where we would call the AI Engine
            console.log('Wizard Data:', this.data);

            // For now, let's simulate a success and redirect to the dashboard
            setTimeout(() => {
                alert('Studio generated successfully! (Simulation)');
                window.location.href = '?page=ai-generator';
            }, 3000);
        },

        fetchAiOptions: function (step, baseColor = null) {
            const self = this;
            const payload = {
                step: step,
                base_color: baseColor,
                current_palette: step === 2 ? self.data.palette.base : (step === 3 ? self.data.palette.variation : null)
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
                        self.render(); // Re-render step 3 with new AI suggested base options
                    }
                } else if (step === 2) {
                    self.aiOptions = res.options;
                    self.lastBase = JSON.stringify(self.data.palette.base);
                    self.render();
                } else if (step === 3) {
                    self.aiFineOptions = res.options;
                    self.lastVariation = JSON.stringify(self.data.palette.variation);
                    self.render();
                }
            }).catch(err => {
                console.error('AI Error:', err);
                if (step === 1) $('#ai-loading-indicator').hide();
            });
        },

        fetchTemplates: function () {
            const self = this;
            const payload = {
                site_name: self.data.siteName,
                industry: self.data.industry,
                style: self.data.style,
                palette: self.data.palette.fineTuned
            };

            this.data.error = null;
            this.callAiStudio('suggest-templates', payload).then(res => {
                self.templates = res.templates || [];
                self.render();
            }).catch(err => {
                console.error('Template Fetch Error:', err);
                self.data.error = "The AI failed to architect your templates. This might be a temporary connection issue.";
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
                palette: self.data.palette.fineTuned
            };

            $.post(ajaxurl, payload, function (res) {
                if (res.success && res.data.status === 'COMPLETED') {
                    $status.find('.ws-status-text').text('Installing Prototype...');
                    self.installPrototype(res.data.response, template.name, $card);
                } else {
                    $status.find('.ws-status-text').text('Generation Error');
                    $btn.prop('disabled', false).css('opacity', 1);
                }
            }).fail(function () {
                alert('Connection error during prototype generation.');
                $btn.prop('disabled', false).css('opacity', 1);
            });
        },

        installPrototype: function (code, name, $card) {
            const self = this;
            const $status = $card.find('.ws-preview-status');

            $.post(ajaxurl, {
                action: 'aipg_install_prototype',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                code: code,
                template_name: name
            }, function (res) {
                if (res.success) {
                    $status.html(`
                        <a href="${res.data.preview_url}" target="_blank" class="ws-btn ws-btn-primary ws-btn-sm" style="margin-top:5px; width:100%; text-decoration:none; display:inline-block; text-align:center;">
                            View Live Prototype
                        </a>
                    `);
                } else {
                    alert('Installation failed: ' + res.data);
                }
            });
        },

        callAiStudio: async function (endpoint, payload) {
            console.warn(`[AI Studio] callAiStudio stack trace for ${endpoint}:`, new Error().stack);

            let baseApiUrl = (typeof aipg_wizard_data !== 'undefined' && aipg_wizard_data.api_url)
                ? aipg_wizard_data.api_url.replace(/\/$/, '')
                : 'https://app.nodevzone.com';

            baseApiUrl = baseApiUrl.replace('host.docker.internal', 'localhost');
            const apiUrl = baseApiUrl + '/api/ai-studio/' + endpoint;

            console.log(`[AI Studio] Calling ${endpoint} with payload:`, payload);
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

})(jQuery);
