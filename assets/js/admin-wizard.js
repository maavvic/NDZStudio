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
            themeStrategy: '',
            siteName: '',
            industry: '',
            brief: '',
            style: '',
            pages: [],
            palette: {
                base: [],
                variation: []
            },
            template: null,
            error: null,
            industryName: '',
            styleName: ''
        },

        industries: [
            { id: 'business', title: 'Business / Company', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 21h18M3 7v14M21 7v14M9 21V10l3-3 3 3v11m-6-3h6"/></svg>' },
            { id: 'ecommerce', title: 'Online Store', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' },
            { id: 'portfolio', title: 'Portfolio / Creator', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
            { id: 'blog', title: 'Blog / Magazine', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>' },
            { id: 'restaurant', title: 'Food & Drink', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>' },
            { id: 'realestate', title: 'Real Estate', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>' },
            { id: 'health', title: 'Health & Wellness', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' },
            { id: 'education', title: 'Education / Course', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>' },
            { id: 'agency', title: 'Agency / Consulting', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' },
            { id: 'local', title: 'Local Service', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>' },
            { id: 'charity', title: 'Charity / NGO', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/><path d="M12 5.5s.5-3 3-3c2 0 3.5 1.5 3.5 3.5 0 2.5-3.5 6.5-6.5 9.5-3-3-6.5-7-6.5-9.5 0-2 1.5-3.5 3.5-3.5 2.5 0 3 3 3 3z"/></svg>' },
            { id: 'saas', title: 'Tech / SaaS', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>' }
        ],
        styles: [
            { id: 'minimal', title: 'Minimalist', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>' },
            { id: 'modern', title: 'Modern', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4.43a1.67 1.67 0 0 1 2.4 0L9 8z"></path><path d="M12 15v5s3.03-.55 4.43-2.03a1.67 1.67 0 0 0 0-2.43L16 15z"></path></svg>' },
            { id: 'classic', title: 'Classic', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>' },
            { id: 'bold', title: 'Bold & Vibrant', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>' },
            { id: 'luxury', title: 'Luxury & Elegant', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' },
            { id: 'tech', title: 'Tech & Futuristic', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>' },
            { id: 'organic', title: 'Organic & Natural', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8a8 8 0 0 1-10 10z"></path></svg>' },
            { id: 'brutalist', title: 'Brutalist Raw', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>' },
            { id: 'retro', title: 'Retro / Vintage', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="M12 8l-4 4 4 4M16 12H8"></path></svg>' },
            { id: 'industrial', title: 'Industrial / Loft', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M3 9h18M9 21V9"></path></svg>' },
            { id: 'playful', title: 'Playful & Fun', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>' },
            { id: 'dark', title: 'Dark / Night', icon: '<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>' }
        ],

        steps: [
            {
                title: 'Foundation Approach',
                subtitle: 'How would you like to build your new AI-powered pages?',
                render: function () {
                    return `
                        <div class="ws-option-grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div class="ws-option-card ${WPStudioWizard.data.themeStrategy === 'blank_theme' ? 'active' : ''}" data-id="blank_theme" style="padding: 30px; text-align: left;">
                                <div style="font-size: 32px; margin-bottom: 15px;">✨</div>
                                <h3 style="margin: 0 0 10px 0; font-size: 18px;">Start from Scratch (Recommended)</h3>
                                <p style="color: var(--ws-text-secondary); font-size: 14px; line-height: 1.5; margin: 0;">We will install a clean, blank WordPress theme to guarantee 100% pixel-perfect design fidelity. Best for new projects.</p>
                            </div>
                            <div class="ws-option-card ${WPStudioWizard.data.themeStrategy === 'normalize_css' ? 'active' : ''}" data-id="normalize_css" style="padding: 30px; text-align: left;">
                                <div style="font-size: 32px; margin-bottom: 15px;">🧩</div>
                                <h3 style="margin: 0 0 10px 0; font-size: 18px;">Add to Existing Website</h3>
                                <p style="color: var(--ws-text-secondary); font-size: 14px; line-height: 1.5; margin: 0;">Keep your current theme. We will try our best to normalize margins and padding on AI pages to prevent conflicts.</p>
                            </div>
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
                    if (!WPStudioWizard.data.themeStrategy) return 'Please select how you want to build your site.';
                    return true;
                }
            },
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
                    const industries = WPStudioWizard.industries;
                    return `
                        <div class="ws-option-grid">
                            ${industries.map(ind => `
                                <div class="ws-option-card ${WPStudioWizard.data.industry === ind.id ? 'active' : ''}" data-id="${ind.id}" data-title="${ind.title}">
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
                title: 'Let\'s Write Your Brief',
                subtitle: 'Give the AI some context so it can generate exactly what you need.',
                render: function () {
                    return `
                        <div class="ws-form-group">
                            <label class="ws-label">What is the primary goal of your website?</label>
                            <textarea id="ws-brief-input" class="ws-input" rows="4" placeholder="e.g. My goal is to sell cupcakes and take online orders...">${WPStudioWizard.data.brief}</textarea>
                        </div>
                    `;
                },
                validate: function () {
                    const val = $('#ws-brief-input').val().trim();
                    if (!val) return 'Please tell us a bit about your website goal.';
                    WPStudioWizard.data.brief = val;
                    return true;
                }
            },
            {
                title: 'The Visual Signature',
                subtitle: 'Select an aesthetic soul for your brand.',
                render: function () {
                    const styles = WPStudioWizard.styles;
                    return `
                        <div class="ws-option-grid">
                            ${styles.map(s => `
                                <div class="ws-option-card ${WPStudioWizard.data.style === s.id ? 'active' : ''}" data-id="${s.id}" data-title="${s.title}">
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
                subtitle: 'Choose a primary palette or build your own with AI assistance.',
                render: function () {
                    const self = WPStudioWizard;
                    const palettes = [
                        { label: 'Onyx & Gold', colors: ['#1a1a1a', '#d4af37', '#ffffff'] },
                        { label: 'Ocean Breeze', colors: ['#0077b6', '#90e0ef', '#caf0f8'] },
                        { label: 'Nordic Forest', colors: ['#2d6a4f', '#74c69d', '#d8f3dc'] },
                        { label: 'Berry Bliss', colors: ['#800f2f', '#ff4d6d', '#fff0f3'] },
                        { label: 'Cyber Punk', colors: ['#130f40', '#f0932b', '#eb4d4b'] },
                        { label: 'Zen Minimal', colors: ['#3d405b', '#e07a5f', '#f4f1de'] },
                        { label: 'Midnight Gold', colors: ['#000000', '#FFD700', '#F5F5F5'] },
                        { label: 'Emerald City', colors: ['#064e3b', '#10b981', '#ecfdf5'] },
                        { label: 'Sunset Glow', colors: ['#4c1d95', '#f43f5e', '#fff1f2'] },
                        { label: 'Deep Sea', colors: ['#0c4a6e', '#0ea5e9', '#f0f9ff'] },
                        { label: 'Rustic Autumn', colors: ['#78350f', '#f59e0b', '#fffbeb'] },
                        { label: 'Slate Tech', colors: ['#0f172a', '#64748b', '#f8fafc'] },
                        { label: 'Forest Edge', colors: ['#14532d', '#22c55e', '#f0fdf4'] },
                        { label: 'Royal Velvet', colors: ['#581c87', '#a855f7', '#faf5ff'] },
                        { label: 'Desert Rose', colors: ['#881337', '#fb7185', '#fff1f2'] },
                        { label: 'Industrial Ash', colors: ['#27272a', '#71717a', '#f4f4f5'] },
                        { label: 'Tropical Teal', colors: ['#134e4a', '#14b8a6', '#f0fdfa'] },
                        { label: 'Vintage Wine', colors: ['#4c0519', '#be123c', '#fff1f2'] },
                        { label: 'Modern Graphite', colors: ['#18181b', '#52525b', '#fafafa'] },
                        { label: 'Minty Fresh', colors: ['#065f46', '#34d399', '#f0fdfa'] },
                        { label: 'Amber Warmth', colors: ['#92400e', '#fbbf24', '#fffbeb'] },
                        { label: 'Shadow Cobalt', colors: ['#1e3a8a', '#3b82f6', '#eff6ff'] },
                        { label: 'Crimson Night', colors: ['#7f1d1d', '#ef4444', '#fef2f2'] },
                        { label: 'Golden Orchid', colors: ['#4c1d95', '#8b5cf6', '#ede9fe'] },
                        { label: 'Deep Moss', colors: ['#064e3b', '#65a30d', '#f7fee7'] },
                        { label: 'Slate Blue', colors: ['#1e1b4b', '#4338ca', '#eef2ff'] },
                        { label: 'Burnt Sienna', colors: ['#431407', '#ea580c', '#fff7ed'] },
                        { label: 'Charcoal Sky', colors: ['#171717', '#404040', '#ededed'] },
                        { label: 'Emerald Isle', colors: ['#14532d', '#16a34a', '#f0fdf4'] },
                        { label: 'Electric Indigo', colors: ['#312e81', '#6366f1', '#e0e7ff'] },
                        { label: 'Warm Espresso', colors: ['#422006', '#d97706', '#fffbeb'] },
                        { label: 'Nordic Snow', colors: ['#0f172a', '#94a3b8', '#f1f5f9'] },
                        { label: 'Plum Passion', colors: ['#4c1d95', '#c084fc', '#faf5ff'] },
                        { label: 'Icy Arctic', colors: ['#082f49', '#0ea5e9', '#f0f9ff'] },
                        { label: 'Golden Hour', colors: ['#7c2d12', '#f97316', '#fff7ed'] },
                        { label: 'Olive Branch', colors: ['#365314', '#a3e635', '#f7fee7'] },
                        { label: 'Deep Navy', colors: ['#172554', '#2563eb', '#eff6ff'] },
                        { label: 'Rose Quartz', colors: ['#4c0519', '#fb7185', '#fff1f2'] },
                        { label: 'Steel Grey', colors: ['#111827', '#4b5563', '#f3f4f6'] },
                        { label: 'Turquoise Gem', colors: ['#134e4a', '#2dd4bf', '#f0fdfa'] },
                        { label: 'Violet Dusk', colors: ['#1e1b4b', '#7c3aed', '#f5f3ff'] },
                        { label: 'Peach Sorbet', colors: ['#7c2d12', '#fb923c', '#fff7ed'] },
                        { label: 'Sage Garden', colors: ['#14532d', '#4ade80', '#f0fdf4'] },
                        { label: 'Cloud Blue', colors: ['#1e3a8a', '#60a5fa', '#eff6ff'] },
                        { label: 'Velvet Maroon', colors: ['#450a0a', '#dc2626', '#fef2f2'] },
                        { label: 'Mystic Purple', colors: ['#2e1065', '#a855f7', '#faf5ff'] },
                        { label: 'Lime Burst', colors: ['#064e3b', '#84cc16', '#f7fee7'] },
                        { label: 'Classic Blue', colors: ['#1e3a8a', '#3b82f6', '#eff6ff'] },
                        { label: 'Sunset Orange', colors: ['#7c2d12', '#f97316', '#fff7ed'] },
                        { label: 'Deep Mauve', colors: ['#4c1d95', '#d8b4fe', '#faf5ff'] },
                        { label: 'Ocean Tide', colors: ['#0c4a6e', '#38bdf8', '#f0f9ff'] },
                        { label: 'Earthy Clay', colors: ['#431407', '#d97706', '#fffbeb'] },
                        { label: 'Cool Mint', colors: ['#065f46', '#6ee7b7', '#f0fdf4'] },
                        { label: 'Midnight Blue', colors: ['#1e1b4b', '#4f46e5', '#eef2ff'] },
                        { label: 'Warm Toffee', colors: ['#422006', '#f59e0b', '#fffbeb'] },
                        { label: 'Soft Lavender', colors: ['#2e1065', '#c084fc', '#faf5ff'] },
                        { label: 'Arctic Ice', colors: ['#082f49', '#7dd3fc', '#f0f9ff'] },
                        { label: 'Harvest Gold', colors: ['#713f12', '#eab308', '#fefce8'] },
                        { label: 'Deep Emerald', colors: ['#064e3b', '#10b981', '#ecfdf5'] },
                        { label: 'Shadow Indigo', colors: ['#312e81', '#4338ca', '#eef2ff'] },
                        { label: 'Copper Glow', colors: ['#431407', '#f97316', '#fff7ed'] },
                        { label: 'Grey Mist', colors: ['#18181b', '#a1a1aa', '#fafafa'] },
                        { label: 'Seafoam Green', colors: ['#134e4a', '#5eead4', '#f0fdfa'] },
                        { label: 'Regal Magenta', colors: ['#4c0519', '#e11d48', '#fff1f2'] },
                        { label: 'Tech Silver', colors: ['#0f172a', '#cbd5e1', '#f8fafc'] },
                        { label: 'Fresh Apple', colors: ['#14532d', '#86efac', '#f0fdf4'] },
                        { label: 'Deep Orchid', colors: ['#581c87', '#d8b4fe', '#faf5ff'] },
                        { label: 'Salmon Sky', colors: ['#7c2d12', '#fda4af', '#fff1f2'] },
                        { label: 'Charcoal Dust', colors: ['#27272a', '#d4d4d8', '#f4f4f5'] },
                        { label: 'Electric Lime', colors: ['#1a2e05', '#bef264', '#f7fee7'] },
                        { label: 'Deep Ruby', colors: ['#45062e', '#e11d48', '#fff1f2'] },
                        { label: 'Polar Night', colors: ['#020617', '#38bdf8', '#f8fafc'] }
                    ];
                    return `
                        <div class="ws-palette-gallery-container infinite-gallery" style="position:relative; margin-bottom: 30px;">
                            <div class="ws-carousel-wrapper">
                                <button type="button" class="ws-carousel-btn prev" onclick="WPStudioWizard.scrollCarousel('ws-base-palettes', 'prev')">
                                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>
                                <div class="ws-carousel-viewport ws-palette-grid-carousel-3x3" id="ws-base-palettes">
                                    ${palettes.map((p, idx) => `
                                        <div class="ws-palette-card ${JSON.stringify(WPStudioWizard.data.palette.base) === JSON.stringify(p.colors) ? 'active' : ''}" data-idx="${idx}" data-colors='${JSON.stringify(p.colors)}'>
                                            <div class="ws-swatch-container">
                                                ${p.colors.map(c => `<div class="ws-swatch" style="background:${c}"></div>`).join('')}
                                            </div>
                                            <div class="ws-palette-label">${p.label}</div>
                                        </div>
                                    `).join('')}
                                </div>
                                <button type="button" class="ws-carousel-btn next" onclick="WPStudioWizard.scrollCarousel('ws-base-palettes', 'next')">
                                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                            </div>
                        </div>

                        <div class="ws-custom-color-panel">
                            <div class="ws-custom-color-header">
                                <label class="ws-label">Smart Color Picker</label>
                                <span class="ws-custom-color-desc">Pick your brand color and use "Match" to let AI find the perfect secondary and accent colors.</span>
                            </div>
                            
                            <div class="ws-custom-colors-container">
                                <div class="ws-color-picker-group">
                                    <span class="ws-color-picker-label">Primary / Background</span>
                                    <div class="ws-color-picker-wrapper">
                                        <input type="color" id="ws-custom-color-1" class="ws-color-picker-input" value="${WPStudioWizard.data.palette.base[0] || '#ffffff'}">
                                    </div>
                                </div>
                                
                                <div class="ws-color-picker-group">
                                    <div class="ws-picker-label-row">
                                        <span class="ws-color-picker-label">Secondary / Text</span>
                                        <button type="button" class="ws-btn-ai-match" onclick="WPStudioWizard.matchColor(2)" id="ws-match-btn-2">
                                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> 
                                            <span>Suggest with AI</span>
                                        </button>
                                    </div>
                                    <div class="ws-color-picker-wrapper">
                                        <input type="color" id="ws-custom-color-2" class="ws-color-picker-input" value="${WPStudioWizard.data.palette.base[1] || '#1a1a1a'}">
                                    </div>
                                </div>
                                
                                <div class="ws-color-picker-group">
                                    <div class="ws-picker-label-row">
                                        <span class="ws-color-picker-label">Accent / Buttons</span>
                                        <button type="button" class="ws-btn-ai-match" onclick="WPStudioWizard.matchColor(3)" id="ws-match-btn-3">
                                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> 
                                            <span>Suggest with AI</span>
                                        </button>
                                    </div>
                                    <div class="ws-color-picker-wrapper">
                                        <input type="color" id="ws-custom-color-3" class="ws-color-picker-input" value="${WPStudioWizard.data.palette.base[2] || '#0071e3'}">
                                    </div>
                                </div>
                            </div>
                            
                            <div id="ai-loading-indicator" style="display:none;" class="ws-ai-loading">
                                <div class="ws-mini-spinner"></div> AI is finding the perfect match...
                            </div>
                        </div>
                    `;
                },
                onEnter: function () {
                    // No AI fetch needed for base gallery anymore
                },
                validate: function () {
                    if (WPStudioWizard.data.palette.base.length === 0) return 'Please select a palette.';
                    // Sync custom colors before proceeding
                    const c1 = $('#ws-custom-color-1').val();
                    const c2 = $('#ws-custom-color-2').val();
                    const c3 = $('#ws-custom-color-3').val();
                    WPStudioWizard.data.palette.base = [c1, c2, c3];
                    WPStudioWizard.data.palette.variation = [c1, c2, c3]; // Use same for variation since we merged
                    return true;
                }
            },
            {
                title: 'The Architectural Soul',
                subtitle: 'Which structure speaks most to your vision? AI has prepared bespoke concepts.',
                render: function () {
                    if (WPStudioWizard.data.error) {
                        return `<div class="ws-error-container"><div class="ws-error-icon">⚠️</div><div class="ws-error-message">${WPStudioWizard.data.error}</div><button class="ws-btn ws-btn-secondary" onclick="WPStudioWizard.retry()">Try Again</button></div>`;
                    }
                    if (!WPStudioWizard.templates || WPStudioWizard.templates.length === 0) {
                        const pct = WPStudioWizard.data.templateProgress || 0;
                        const statusTxt = `Architecting your options... ${pct}%`;
                        return `<div class="ws-ai-loading">
                                    <div class="ws-mini-spinner"></div> 
                                    <div id="ws-step5-status-text">${statusTxt}</div>
                                </div>`;
                    }
                    return `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                            <h3 style="margin:0; font-size:16px; font-weight:600;">AI Proposals</h3>
                            <button class="ws-btn ws-btn-secondary ws-btn-sm" onclick="WPStudioWizard.regenerateTemplates()" id="ws-btn-regenerate" style="padding: 8px 15px;">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:5px;"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                                Regenerate Proposals
                            </button>
                        </div>
                        <div class="ws-template-grid">
                            ${WPStudioWizard.templates.map((t, idx) => `
                                <div class="ws-template-card ${WPStudioWizard.data.template && WPStudioWizard.data.template.name === t.name ? 'active' : ''}" data-idx="${idx}">
                                    <div class="ws-template-header">
                                        <h3 class="ws-template-name">${t.name}</h3>
                                        <div class="ws-template-palette">
                                            ${WPStudioWizard.data.palette.variation.map(c => `<div class="ws-template-swatch" style="background:${c}" title="${c}"></div>`).join('')}
                                        </div>
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
                                        <div class="ws-preview-status" style="display:none; margin-top: 10px;">
                                            <div style="font-size: 13px; color: var(--ws-text-secondary); margin-bottom: 5px;" class="ws-status-text">Allocating tokens...</div>
                                            <div class="ws-progress-track" style="width:100%; height:6px; background: rgba(0,0,0,0.05); border-radius:3px; overflow:hidden;">
                                                <div class="ws-progress-fill" style="width:0%; height:100%; background: var(--ws-primary); transition: width 0.3s ease;"></div>
                                            </div>
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
                                <div class="ws-summary-card" style="background: rgba(0, 113, 227, 0.02); padding: 40px; border-radius: 32px; border: 1px solid rgba(0,0,0,0.05); position: relative; overflow: hidden;">
                                    <div style="position: absolute; top: -20px; right: -20px; font-size: 140px; opacity: 0.03; font-family: var(--ws-font-serif);">”</div>
                                    
                                    <h3 style="font-family: var(--ws-font-serif); font-size: 24px; margin-top: 0; margin-bottom: 24px; color: var(--ws-text);">The Master Brief</h3>
                                    
                                    <div class="ws-madlibs-brief" style="font-size: 20px; line-height: 1.8; color: var(--ws-text-secondary); margin-bottom: 30px;">
                                        "I am building a <strong style="color:var(--ws-text); border-bottom: 2px solid var(--ws-primary); padding-bottom: 2px;">${industryMap[WPStudioWizard.data.industry] || WPStudioWizard.data.industry}</strong> 
                                        website named <strong style="color:var(--ws-text); border-bottom: 2px solid var(--ws-primary); padding-bottom: 2px;">${WPStudioWizard.data.siteName}</strong>. 
                                        I want to achieve a <strong style="color:var(--ws-text); border-bottom: 2px solid var(--ws-primary); padding-bottom: 2px;">${styleMap[WPStudioWizard.data.style] || WPStudioWizard.data.style}</strong> aesthetic 
                                        using the <strong style="color:var(--ws-text); border-bottom: 2px solid var(--ws-primary); padding-bottom: 2px;">${WPStudioWizard.data.template ? WPStudioWizard.data.template.name : 'Selected Concept'}</strong> architecture."
                                    </div>

                                    <div style="background: #fff; border-radius: 20px; padding: 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                                        <div>
                                            <label class="ws-mini-label" style="margin-bottom: 8px;">Selected Palette</label>
                                            <div class="ws-swatch-container" style="justify-content: flex-start;">
                                                ${p.map(c => `<div class="ws-swatch" style="background:${c}; width:40px; height:40px;"></div>`).join('')}
                                            </div>
                                        </div>
                                        <div style="text-align: right;">
                                            <label class="ws-mini-label" style="margin-bottom: 8px;">Generated Pages</label>
                                            <div class="ws-page-chips" style="justify-content: flex-end;">
                                                ${WPStudioWizard.data.template ? WPStudioWizard.data.template.pages.map(pg => `<span class="ws-page-chip" style="background: #f8fafc; border-color: transparent;">${pg.title}</span>`).join('') : ''}
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>
                    `;
                },
                validate: function () { return true; }
            }
        ],

        init: function () {
            try {
                console.log('%c[Wizard] Init Started. Loading state...', 'color: #0071e3; font-weight: bold;');

                this.loadState();

                console.log('[Wizard] State loaded. Current step:', this.currentStep);
                this.goToStep(this.currentStep);
                this.bindEvents();
            } catch (e) {
                console.error('%c[Wizard Init Error]', 'color: white; background: red; padding: 5px;', e);
            }
        },

        saveState: function () {
            const state = {
                currentStep: this.currentStep,
                data: this.data
            };
            localStorage.setItem('aipg_wizard_state', JSON.stringify(state));
            console.log('[Wizard] State saved to localStorage.');
        },

        loadState: function () {
            const saved = localStorage.getItem('aipg_wizard_state');
            if (saved) {
                try {
                    const state = JSON.parse(saved);
                    // Merge saved data with default to handle schema changes
                    this.data = $.extend(true, {}, this.data, state.data);
                    this.currentStep = state.currentStep || 0;
                    return true;
                } catch (e) {
                    console.error('[Wizard] Failed to parse saved state:', e);
                }
            }
            return false;
        },

        clearState: function () {
            localStorage.removeItem('aipg_wizard_state');
            console.log('[Wizard] State cleared.');
        },

        goToStep: function (stepIdx) {
            this.currentStep = stepIdx;
            const step = this.steps[this.currentStep];
            console.log(`[Wizard] Moving to Step: ${this.currentStep} -> ${step.title}`);

            // Save progress
            this.saveState();

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
                        <div style="display:flex; gap:10px;">
                            <button class="ws-btn ws-btn-secondary ws-btn-sm" id="ws-btn-start-over" title="Start from scratch">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:5px;"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                                Start Over
                            </button>
                            <button class="ws-btn ws-btn-secondary ws-btn-sm" id="ws-btn-my-projects">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:5px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                My Projects
                            </button>
                        </div>
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
                const title = $(this).data('title') || '';
                const step = self.steps[self.currentStep];

                if (self.currentStep === 0) self.data.themeStrategy = id;
                if (self.currentStep === 2) {
                    self.data.industry = id;
                    self.data.industryName = title;
                }
                if (self.currentStep === 4) {
                    self.data.style = id;
                    self.data.styleName = title;
                }

                $('.ws-option-card').removeClass('active');
                $(this).addClass('active');

                // Save selection immediately
                self.saveState();
            });

            $(document).on('click', '.ws-palette-card', function () {
                const colors = $(this).data('colors');
                const $this = $(this);

                if ($this.hasClass('variation')) {
                    self.data.palette.variation = colors;
                } else {
                    self.data.palette.base = colors;
                    self.data.palette.variation = [...colors];

                    // Sync manual inputs for immediate feedback
                    if (colors && colors.length >= 3) {
                        $('#ws-custom-color-1').val(colors[0]);
                        $('#ws-custom-color-2').val(colors[1]);
                        $('#ws-custom-color-3').val(colors[2]);
                    }
                }

                $this.parent().find('.ws-palette-card').removeClass('active');
                $this.addClass('active');

                // Save palette
                self.saveState();
            });

            $(document).on('click', '.ws-template-card', function () {
                const idx = $(this).data('idx');
                self.data.template = self.templates[idx];
                $('.ws-template-card').removeClass('active').find('.ws-template-actions').hide();
                $(this).addClass('active').find('.ws-template-actions').fadeIn();

                // Save template selection
                self.saveState();
            });

            $(document).on('click', '.ws-btn-preview', function (e) {
                e.stopPropagation();
                const idx = $(this).data('idx');
                if (idx === undefined) return;
                const template = self.templates[idx];
                self.generatePrototype(template, $(this).closest('.ws-template-card'));
            });

            $(document).on('click', '#ws-btn-ai-suggest', function () {
                const c1 = $('#ws-custom-color-1').val();
                const c2 = $('#ws-custom-color-2').val();
                const c3 = $('#ws-custom-color-3').val();
                let selectedCols = [c1, c2, c3];
                // Fallback to ensuring at least one color is passed
                if (!c1) selectedCols = ['#d94e28', '#ffffff', '#000000'];

                self.data.palette.base = selectedCols;
                self.fetchAiOptions(3, selectedCols); // Using fine-tuning step 3 for the 36 variations
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

            $(document).on('click', '#ws-btn-start-over', function () {
                if (confirm('Are you sure you want to start over? All current selections will be cleared.')) {
                    self.clearState();
                    location.reload(); // Refresh to clean reset state
                }
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
                    
                    <div class="ws-progress-container" style="width: 100%; max-width: 400px; background: rgba(0,0,0,0.05); height: 8px; border-radius: 4px; margin: 20px auto; overflow: hidden;" id="ws-finish-progress-bar">
                        <div id="ws-finish-progress-fill" style="width: 0%; height: 100%; background: var(--ws-primary); transition: width 0.5s ease;"></div>
                    </div>
                    <p id="ws-finish-percentage" style="font-weight: 600; color: var(--ws-primary); font-size: 14px; margin-top: 10px;">0%</p>
                </div>
            `);

            const layoutId = Math.random().toString(36).substring(2, 8);
            console.log('[Wizard] Starting Final Generation for:', template.name, 'with Layout ID:', layoutId);

            const payload = {
                action: 'aipg_generate_studio_prototype',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                template_name: template.name,
                prototype_prompt: template.prototype_prompt,
                brief: self.data.brief,
                palette: self.data.palette.variation
            };

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: payload,
                timeout: 30000,
                success: function (res) {
                    if (res.success && res.data.job_id) {
                        self.pollStudioJob(res.data.job_id, layoutId);
                    } else if (res.success && res.data.status === 'COMPLETED') {
                        // Instant completion fallback
                        self.installArchitecture(res.data.response, template.name, layoutId);
                    } else {
                        const errorMsg = (res && res.data) ? res.data : 'The AI engine might be busy.';
                        self.showError('Generation initiation failed: ' + errorMsg, true);
                    }
                },
                error: function (jqXHR) {
                    self.showError('Connection error while initiating generation.', true);
                }
            });
        },

        pollStudioJob: function (jobId, layoutId) {
            const self = this;
            const template = this.data.template;

            $.post(ajaxurl, {
                action: 'aipg_check_studio_generation_status',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                job_id: jobId
            }, function (res) {
                if (res.success) {
                    const status = res.data.status;
                    const tokens = res.data.completion_tokens || 0;

                    // Tiered Baseline: Align with the 13k-15k actual outputs
                    let baseline = (tokens > 10000) ? 15000 : 10000;
                    let pct = Math.round((tokens / baseline) * 100);

                    // Safety: Never let progress jump backward if baseline shifts
                    const prevPct = parseInt($('#ws-finish-percentage').text()) || 0;
                    if (pct < prevPct && status !== 'COMPLETED') {
                        pct = Math.min(prevPct + 1, 99);
                    }
                    pct = Math.min(99, pct);

                    if (status === 'COMPLETED') {
                        $('#ws-finish-progress-fill').css('width', '100%');
                        $('#ws-finish-percentage').text('100%');
                        $('#ws-finish-status').text('Installing your custom WordPress environment...');
                        self.installArchitecture(res.data.response, template.name, layoutId);
                    } else if (status === 'FAILED') {
                        self.showError('AI Generation failed. The server might be overloaded or returned invalid data.', true);
                    } else {
                        // Still processing
                        $('#ws-finish-progress-fill').css('width', pct + '%');
                        $('#ws-finish-percentage').text(pct + '%');

                        // Dynamic status updates
                        if (tokens === 0) $('#ws-finish-status').text('AI is thinking and architecting the concept...');
                        else if (pct > 80) $('#ws-finish-status').text('Finalizing the multi-page structure...');
                        else if (pct > 40) $('#ws-finish-status').text('Generating block content and layouts...');
                        else $('#ws-finish-status').text('Streaming visual vision from AI...');

                        setTimeout(() => self.pollStudioJob(jobId, layoutId), 3000);
                    }
                } else {
                    console.error('[Wizard] Polling error:', res.data);
                    // Silent retry for network blips
                    setTimeout(() => self.pollStudioJob(jobId, layoutId), 5000);
                }
            });
        },

        installArchitecture: function (code, templateName, layoutId) {
            const self = this;
            $.post(ajaxurl, {
                action: 'aipg_install_prototype',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                code: code,
                template_name: templateName,
                theme_strategy: self.data.themeStrategy,
                layout_id: layoutId
            }, function (installRes) {
                if (installRes.success) {
                    // Success! Clear state as the task is finished
                    self.clearState();
                    self.showSuccess(installRes.data.preview_url);
                } else {
                    self.showError('Installation failed: ' + installRes.data);
                }
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

        showError: function (msg, allowRetry = false) {
            let retryBtn = allowRetry ? `<button class="ws-btn ws-btn-secondary" onclick="WPStudioWizard.showStep(5)">Try Generation Again</button>` : '';

            $('#wp-studio-wizard-root').html(`
                <div class="ws-wizard-step" style="text-align:center; align-items:center;">
                    <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
                    <h2 class="ws-title">Architecture Interrupted</h2>
                    <p class="ws-subtitle">${msg}</p>
                    <div style="display:flex; flex-direction:column; align-items:center; gap: 10px; margin-top:20px;">
                        <button class="ws-btn ws-btn-primary" onclick="location.reload()">Restart Wizard</button>
                        ${retryBtn}
                    </div>
                </div>
            `);
        },

        scrollCarousel: function (id, direction) {
            const el = document.getElementById(id);
            if (!el) return;
            const scrollAmount = el.clientWidth;
            if (direction === 'next') {
                if (Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth) {
                    el.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            } else {
                if (el.scrollLeft <= 0) {
                    el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
                } else {
                    el.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                }
            }
        },

        fetchAiOptions: function (step, baseColor = null) {
            const self = this;
            if (this.isFetching) return;
            this.isFetching = true;

            const payload = {
                step: step,
                base_color: baseColor,
                count: 72,
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
                        self.baseOptions = res.options;
                        // Pre-select the first one if none selected
                        if (!self.data.palette.base || self.data.palette.base.length === 0) {
                            self.data.palette.base = res.options[0].colors;
                            self.data.palette.variation = res.options[0].colors;
                        }
                        self.render();
                    }
                } else {
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

        matchColor: function (targetStep) {
            const self = this;
            const c1 = $('#ws-custom-color-1').val();
            const c2 = $('#ws-custom-color-2').val();

            let currentColors = targetStep === 2 ? [c1] : [c1, c2];

            const $btn = $(`#ws-match-btn-${targetStep}`);
            const originalHtml = $btn.html();
            $btn.html('<div class="ws-mini-spinner" style="width:12px; height:12px; border-width:2px; margin-right:5px;"></div> Suggesting...').prop('disabled', true);

            this.callAiStudio('match-colors', { current_colors: currentColors }).then(res => {
                console.log('[Wizard] AI Color Match Result:', res);
                $btn.html(originalHtml).prop('disabled', false);

                if (res && res.suggested_color) {
                    let color = res.suggested_color.trim().toLowerCase(); // MUST be lowercase for type="color"
                    if (!color.startsWith('#')) color = '#' + color;

                    // Normalize to 7-character HEX
                    if (color.length === 4) {
                        color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
                    }

                    const $input = $(`#ws-custom-color-${targetStep}`);
                    if ($input.length > 0) {
                        $input.val(color).trigger('input').trigger('change');

                        // Ensure internal model is an array of 3
                        if (!self.data.palette.base || self.data.palette.base.length < 3) {
                            self.data.palette.base = [$('#ws-custom-color-1').val(), $('#ws-custom-color-2').val(), $('#ws-custom-color-3').val()];
                        }
                        self.data.palette.base[targetStep - 1] = color;
                        self.data.palette.variation = [...self.data.palette.base];

                        // Visual feedback: pulse the field
                        $input.closest('.ws-color-picker-wrapper').addClass('ws-pulse-highlight');
                        setTimeout(() => {
                            $('.ws-color-picker-wrapper').removeClass('ws-pulse-highlight');
                        }, 1000);

                        console.log(`[Wizard] Success! Updated manual input ${targetStep} to ${color}`);
                    }
                }
            }).catch(err => {
                console.error('[Wizard] AI Match Error:', err);
                $btn.html(originalHtml).prop('disabled', false);
            });
        },

        fetchTemplates: function () {
            const self = this;
            if (this.isFetching) return;
            this.isFetching = true;
            this.data.templateProgress = 0;

            const payload = {
                site_name: self.data.siteName,
                industry: self.data.industry,
                industry_name: self.data.industryName,
                style: self.data.style,
                style_name: self.data.styleName,
                brief: self.data.brief,
                palette: self.data.palette.variation,
                model_tier: localStorage.getItem('aipg_model_tier') || 'claude_haiku'
            };

            this.data.error = null;
            this.callAiStudio('suggest-templates', payload).then(res => {
                if (res.job_id) {
                    self.pollTemplatesJob(res.job_id);
                } else if (res.templates) {
                    self.templates = res.templates || [];
                    self.isFetching = false;
                    self.render();
                } else {
                    throw new Error("Invalid response from AI Studio");
                }
            }).catch(err => {
                console.error('Template Fetch Error:', err);
                self.data.error = "The AI failed to architect your templates. This might be a temporary connection issue.";
                self.isFetching = false;
                self.render();
            });
        },

        pollTemplatesJob: function (jobId) {
            const self = this;

            $.post(ajaxurl, {
                action: 'aipg_check_studio_generation_status',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                job_id: jobId
            }, function (res) {
                if (res.success) {
                    const status = res.data.status;
                    const tokens = res.data.completion_tokens || 0;

                    // Estimate percentage (3 templates are around 3000 tokens)
                    let percent = Math.min(99, Math.round((tokens / 3000) * 100));
                    if (percent > self.data.templateProgress || tokens === 0) {
                        self.data.templateProgress = percent;

                        // Direct DOM update to prevent full re-render "jump"
                        const $statusText = $('#ws-step5-status-text');
                        if ($statusText.length > 0) {
                            const txt = percent > 0 ? `Architecting your options... ${percent}%` : `AI is thinking and architecting...`;
                            $statusText.text(txt);
                        } else {
                            // Fallback if the element isn't in DOM yet for some reason
                            self.render();
                        }
                    }

                    if (status === 'COMPLETED') {
                        const payload = JSON.parse(res.data.response);
                        self.templates = payload.templates || [];
                        self.isFetching = false;
                        self.render();
                    } else if (status === 'FAILED') {
                        self.data.error = "Layout architecting failed. Please try again.";
                        self.isFetching = false;
                        self.render();
                    } else {
                        setTimeout(() => self.pollTemplatesJob(jobId), 3000);
                    }
                } else {
                    setTimeout(() => self.pollTemplatesJob(jobId), 5000);
                }
            });
        },
        regenerateTemplates: function () {
            this.templates = null;
            this.data.template = null;
            this.data.templateProgress = 0;
            this.saveState();
            this.fetchTemplates();
            this.render();
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
            $status.show();
            $status.find('.ws-mini-spinner').show();
            $status.find('.ws-status-text').text('Initiating AI Generation...');

            // Polling interval array to safely clear on components
            if (window.aipgStudioPolls) {
                window.aipgStudioPolls.forEach(clearInterval);
            }
            window.aipgStudioPolls = [];

            const payload = {
                action: 'aipg_generate_studio_prototype',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                template_name: template.name,
                prototype_prompt: template.prototype_prompt,
                site_name: self.data.siteName,
                industry_name: self.data.industryName,
                style_name: self.data.styleName,
                brief: self.data.brief,
                palette: self.data.palette.variation,
                model_tier: localStorage.getItem('aipg_model_tier') || 'claude_sonnet'
            };

            console.log('[Wizard] Generating Prototype for:', template.name, 'Payload:', payload);

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: payload,
                timeout: 1500000, // 25 minutes for massive AI generation
                success: function (res) {
                    console.log('[Wizard] Prototype Response:', res);
                    // The backend returns the `job_id` object directly as res.data inside of wp_send_json_success
                    if (res.success && res.data && res.data.job_id) {
                        const jobId = res.data.job_id;
                        $status.find('.ws-status-text').text('AI is thinking...');
                        self.pollGenerationStatus(jobId, template.name, $card, template.id);
                    } else if (res.success && res.data.status === 'COMPLETED') {
                        // Fallback in case the hook returned it completely sync (unlikely)
                        $status.find('.ws-status-text').text('Installing Prototype...');
                        self.installPrototype(res.data.response, template.name, $card, template.id);
                    } else {
                        const data = (res && res.data) ? res.data : 'The AI engine might be busy or returning malformed data.';
                        let errorMsg = typeof data === 'object' ? (data.msg || JSON.stringify(data)) : data;

                        $status.find('.ws-mini-spinner').hide();
                        $status.find('.ws-status-text').text('Generation Error');
                        console.error('[Wizard] Prototype Generation Error:', data);
                        alert('Generation Failed: ' + errorMsg);
                        $btn.prop('disabled', false).css('opacity', 1);
                    }
                },
                error: function (jqXHR, textStatus) {
                    console.error('[Wizard] Prototype Request Failed:', jqXHR, textStatus);
                    let msg = 'Connection error during prototype generation.';
                    if (textStatus === 'timeout') msg = 'The AI took too long to generate the code (Timeout). Please try again.';

                    $status.find('.ws-status-text').text('Generation Timeout');
                    alert(msg);
                    $btn.prop('disabled', false).css('opacity', 1);
                }
            });
        },

        pollGenerationStatus: function (jobId, templateName, $card, templateRecordId) {
            const self = this;
            const $status = $card.find('.ws-preview-status');
            const $btn = $card.find('.ws-btn-preview');
            let currentProgress = 0;

            $status.find('.ws-progress-fill').css('width', currentProgress + '%');

            const pollId = setInterval(() => {
                $.post(ajaxurl, {
                    action: 'aipg_check_studio_generation_status',
                    nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                    job_id: jobId
                }, function (pollRes) {
                    if (pollRes.success && pollRes.data) {
                        const sData = pollRes.data;
                        if (sData.status === 'COMPLETED') {
                            clearInterval(pollId);
                            $status.find('.ws-progress-fill').css('width', '100%');
                            $status.find('.ws-status-text').text('Installing the prototype...');
                            if (sData.response) {
                                // Standardize layout_id for isolation (jobId is a solid fallback)
                                const isolationId = sData.layout_id || jobId;
                                self.installPrototype(sData.response, templateName, $card, isolationId);
                            } else {
                                alert("AI completed successfully but no payload was returned.");
                            }
                        } else if (sData.status === 'FAILED') {
                            clearInterval(pollId);
                            $status.find('.ws-mini-spinner').hide();
                            $status.find('.ws-status-text').text('Generation Failed on Server');
                            $btn.prop('disabled', false).css('opacity', 1);
                        } else {
                            const tokens = sData.completion_tokens || 0;
                            const updatedAt = sData.updated_at ? new Date(sData.updated_at) : null;
                            const now = new Date();
                            const isStalled = updatedAt && (now - updatedAt > 60000); // 1 minute without update

                            if (tokens > 0) {
                                // Tiered Baseline: Start with 10k, shift to 15k if exceeds
                                let baseline = (tokens > 10000) ? 15000 : 10000;
                                let pct = Math.floor((tokens / baseline) * 100);
                                if (pct > 99) pct = 99;

                                // Ensure progress never goes backward
                                if (pct > currentProgress) {
                                    currentProgress = pct;
                                    $status.find('.ws-progress-fill').css('width', currentProgress + '%');
                                    $status.find('.ws-status-text').text(`Populating pages... ${currentProgress}%`);
                                } else if (isStalled) {
                                    $status.find('.ws-status-text').text(`Refining details... ${currentProgress}%`);
                                }
                            } else {
                                $status.find('.ws-status-text').text('AI is architecting... ');
                            }
                        }
                    } else {
                        // Polling failure, but maybe the main request is still running. We'll wait.
                        console.warn("[Wizard] Poll returned error:", pollRes);
                    }
                }).fail(function () {
                    // Server might be busy processing, ignore single 500s during long polls.
                    console.warn("[Wizard] Poll AJAX request failed.");
                });
            }, 3000);

            window.aipgStudioPolls.push(pollId);
        },

        installPrototype: function (code, name, $card, project_id) {
            const self = this;
            const $status = $card.find('.ws-preview-status');

            $.post(ajaxurl, {
                action: 'aipg_install_prototype',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                code: code,
                template_name: name,
                layout_id: project_id, // Standardized key for backend
                theme_strategy: self.data.themeStrategy
            }, function (res) {
                if (res.success) {
                    $status.show().html(`
                        <a href="${res.data.preview_url}" target="_blank" class="ws-btn ws-btn-primary ws-btn-launch" style="text-decoration:none; display:inline-flex;">
                            Launch Live Preview
                        </a>
                    `);
                    $card.find('.ws-btn-preview').hide();
                } else {
                    const err = res.data || 'Unknown error during installation.';
                    alert('Installation failed: ' + err);
                    $status.find('.ws-status-text').text('Installation Failed');
                }
            }).fail(function (jqXHR, textStatus) {
                console.error('[Wizard] Installation AJAX Failed:', textStatus);
                $status.find('.ws-status-text').text('Server Hang / Error');
                alert('The server took too long to install the prototype. Please check your "My Projects" list in a moment to see if it completed in the background.');
            });
        },

        fetchRecentProjects: function () {
            const self = this;
            $.post(ajaxurl, {
                action: 'aipg_list_studio_projects',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : ''
            }, function (res) {
                if (res.success) {
                    self.renderRecentProjects(res.data.local || [], res.data.cloud || []);
                } else {
                    $('#ws-recent-projects-list').html('<p style="color:#999; font-size:13px; font-style:italic;">No saved projects found. Your first design journey starts here!</p>');
                }
            });
        },

        renderRecentProjects: function (local, cloud) {
            if (!local.length && !cloud.length) {
                $('#ws-recent-projects-list').html('<p style="color:#999; font-size:13px; font-style:italic;">No saved projects found. Your first design journey starts here!</p>');
                return;
            }

            let tableHtml = `
                <table class="ws-library-table">
                    <thead>
                        <tr>
                            <th>Concept / Prototype</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th style="text-align:right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            // Extract job_ids from local snapshots to detect if a cloud project is installed
            const installedCloudIds = local.map(pj => {
                try {
                    const snap = JSON.parse(pj.snapshot);
                    return snap.job_id || null;
                } catch (e) { return null; }
            }).filter(id => id !== null);

            // 1. Render Local (Installed)
            local.forEach(pj => {
                tableHtml += `
                    <tr>
                        <td>
                            <strong>${pj.name}</strong><br/>
                            <span style="font-size:11px; color:#888;">Installed on this site</span>
                        </td>
                        <td><span class="ws-badge ws-badge-installed">Installed</span></td>
                        <td>${new Date(pj.timestamp).toLocaleDateString()} ${new Date(pj.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style="text-align:right">
                            <button class="ws-btn ws-btn-sm ws-btn-primary ws-btn-load-project" data-id="${pj.id}">Open Editor</button>
                            <button class="ws-btn ws-btn-sm ws-btn-danger ws-btn-delete-project" data-id="${pj.id}" title="Delete">×</button>
                        </td>
                    </tr>
                `;
            });

            // 2. Render Cloud (Remote Only)
            cloud.forEach(pj => {
                if (installedCloudIds.includes(pj.id)) return;
                tableHtml += `
                    <tr>
                        <td>
                            <strong>${pj.name}</strong><br/>
                            <span style="font-size:11px; color:#888;">${pj.industry} | ${pj.style}</span>
                        </td>
                        <td><span class="ws-badge ws-badge-cloud">Cloud Ready</span></td>
                        <td>${new Date(pj.timestamp).toLocaleDateString()} ${new Date(pj.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style="text-align:right">
                            <button class="ws-btn ws-btn-sm ws-btn-secondary ws-btn-load-project" data-id="${pj.id}" data-source="cloud">Restore & Install</button>
                        </td>
                    </tr>
                `;
            });

            tableHtml += `</tbody></table>`;
            $('#ws-recent-projects-list').html(tableHtml);
        },

        loadProject: function (id) {
            const self = this;
            const $btn = $(`.ws-btn-load-project[data-id="${id}"]`);
            const isCloud = $btn.data('source') === 'cloud';

            $btn.text(isCloud ? 'Installing...' : 'Loading...').prop('disabled', true);

            $.post(ajaxurl, {
                action: 'aipg_load_project',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                project_id: id
            }, function (res) {
                if (res.success) {
                    if (res.data.snapshot) {
                        try {
                            const snapshot = JSON.parse(res.data.snapshot);
                            if (snapshot.is_cloud) {
                                // Triggers the installation flow for a cloud job
                                return self.installFromCloud(snapshot.job_id, snapshot.code, $btn);
                            }
                        } catch (e) {
                            console.error("[Wizard] Failed to parse snapshot:", e);
                        }
                    }

                    // Standard local restore logic (or fallback if parsing failed/not cloud)
                    if (res.data.redirect_url) {
                        window.location.href = res.data.redirect_url;
                    } else {
                        alert('Project restored, but no redirect URL found.');
                        $btn.text('Open Editor').prop('disabled', false);
                    }
                } else {
                    alert('Failed to load project: ' + (typeof res.data === 'string' ? res.data : 'Unknown error'));
                    $btn.text(isCloud ? 'Restore & Install' : 'Open Editor').prop('disabled', false);
                }
            });
        },

        installFromCloud: function (jobId, code, $btn) {
            const self = this;
            $.post(ajaxurl, {
                action: 'aipg_install_prototype',
                nonce: (typeof aipg_wizard_data !== 'undefined') ? aipg_wizard_data.nonce : '',
                code: code,
                layout_id: jobId
            }, function (installRes) {
                if (installRes.success) {
                    // Once installed, we re-fetch to update the table
                    self.fetchRecentProjects();
                    alert('Success! Concept restored and installed as a new layout.');
                } else {
                    alert('Installation failed: ' + installRes.data);
                    $btn.text('Restore & Install').prop('disabled', false);
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
                brief: this.data.brief,
                palette: this.data.palette.variation,
                model_tier: localStorage.getItem('aipg_model_tier') || 'claude_sonnet'
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
                    headers: {
                        'Content-Type': 'application/json'
                    },
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
