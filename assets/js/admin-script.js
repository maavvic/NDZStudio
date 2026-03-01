jQuery(document).ready(function ($) {
    // Dynamic Loading Messages
    const aipgLoadingMessages = aipg_vars.i18n.loadingMessages;
    let aipgMessageInterval = null;
    let confirmAction = null;
    let confirmData = null;
    let lastGeneratedPlugin = null;

    function reloadWithHighlight(pluginId) {
        const url = new URL(window.location.href);
        url.searchParams.set('highlighted_plugin', pluginId);
        window.location.href = url.toString();
    }

    function aipgStartLoadingMessages(targetSelector) {
        const $target = $(targetSelector);
        let index = 0;

        // Initial message
        $target.fadeOut(200, function () {
            $(this).text(aipgLoadingMessages[index]).fadeIn(200);
        });

        aipgMessageInterval = setInterval(function () {
            index = (index + 1) % aipgLoadingMessages.length;
            $target.fadeOut(400, function () {
                $(this).text(aipgLoadingMessages[index]).fadeIn(400);
            });
        }, 5000);
    }

    function aipgStopLoadingMessages() {
        if (aipgMessageInterval) {
            clearInterval(aipgMessageInterval);
            aipgMessageInterval = null;
        }
    }

    function aipg_prepend_plugin_row(p) {
        $('#aipg-no-plugins-row').remove();

        const dateStr = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date());

        const rowHtml = `
            <tr class="aipg-row-highlight aipg-remote-row" 
                data-plugin-id="${p.plugin_id}" 
                data-description="${p.plugin_prompt}" 
                data-project-id="${p.project_id}" 
                data-active-version-id="${p.version_id}">
                <td><input type="checkbox" class="plugin-checkbox" value="${p.plugin_id}"></td>
                <td><strong style="font-weight: 500; font-size: 15px;">${p.plugin_name}</strong></td>
                <td><span class="aipg-status-badge remote">${aipg_vars.i18n.remote}</span></td>
                <td><span style="background: #f2f2f5; padding: 2px 8px; border-radius: 12px; font-size: 12px; color: #666;">1.0.0</span></td>
                <td><code style="background: none; color: #d6336c; font-size: 12px;">${p.plugin_slug}</code></td>
                <td style="color: #6e6e73; font-size: 13px;">${dateStr}</td>
                <td style="color: #6e6e73; font-size: 13px;">${dateStr}</td>
                <td>
                    <button type="button" class="aipg-button-primary install-plugin-btn" data-plugin-id="${p.plugin_id}">${aipg_vars.i18n.install}</button>
                    <button type="button" class="aipg-button-secondary view-history-btn" data-plugin-id="${p.plugin_id}">${aipg_vars.i18n.history}</button>
                </td>
            </tr>
        `;

        $('#aipg-plugins-table-body').prepend(rowHtml);
    }

    // Sync Projects from AI Studio
    $('#sync-projects-btn').click(function () {
        const $btn = $(this);
        const originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="aipg-spinner"></span> ' + aipg_vars.i18n.syncing);

        $.post(ajaxurl, {
            action: 'aipg_sync_remote_projects',
            nonce: aipg_vars.nonce
        }, function (response) {
            if (response.success) {
                location.reload();
            } else if (response.data && response.data.code === 'legal_consent_required') {
                $btn.prop('disabled', false).html(originalHtml);
                handleLegalConsentRequired(response.data.missing, () => $('#sync-projects-btn').click());
            } else {
                const errorData = (response && response.data) ? (response.data.message || response.data) : (response || 'Unknown error');
                alert(aipg_vars.i18n.syncFailed + errorData);
                $btn.prop('disabled', false).html(originalHtml);
            }
        }).fail(function () {
            alert(aipg_vars.i18n.syncServerError);
            $btn.prop('disabled', false).html(originalHtml);
        });
    });

    // Install Remote Plugin
    $(document).on('click', '.install-plugin-btn', function () {
        const $btn = $(this);
        const pluginId = $btn.data('plugin-id');
        const originalHtml = $btn.html();

        $btn.prop('disabled', true).html('<span class="aipg-spinner"></span> ' + aipg_vars.i18n.installing);

        $.post(ajaxurl, {
            action: 'aipg_install_remote_plugin',
            plugin_id: pluginId,
            nonce: aipg_vars.nonce
        }, function (response) {
            if (response.success) {
                location.reload();
            } else {
                alert(aipg_vars.i18n.installFailed + (response.data.message || response.data));
                $btn.prop('disabled', false).html(originalHtml);
            }
        }).fail(function () {
            alert(aipg_vars.i18n.installServerError);
            $btn.prop('disabled', false).html(originalHtml);
        });
    });

    // Delete Local Plugin
    $(document).on('click', '.aipg-delete-generated-plugin-btn', function () {
        const $btn = $(this);
        const pluginId = $btn.data('plugin-id');
        const name = $btn.closest('tr').find('strong').text();

        confirmData = { plugin_id: pluginId };
        confirmAction = 'delete';

        $('#confirm-modal-icon-bg').css('background', '#fff2f2');
        $('#confirm-modal-icon').css('color', '#d70015');
        $('#confirm-modal-title').text(aipg_vars.i18n.deletePluginTitle);
        $('#confirm-modal-message').text(aipg_vars.i18n.deletePluginMsg.replace('%s', name));
        $('#confirm-modal-submit').text(aipg_vars.i18n.delete).removeClass('aipg-button-primary').addClass('aipg-button-danger');

        openModal('#confirmation-modal');
    });

    // Toggle Settings
    $('#aipg-toggle-settings').click(function () {
        $('#aipg-settings-panel').toggleClass('active');
        $(this).toggleClass('active');
    });

    // Real-time Validation for Plugin Description
    function validateText(text, minChars, minWords) {
        const charCount = text.length;
        const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
        return {
            valid: charCount >= minChars && wordCount >= minWords,
            chars: charCount,
            words: wordCount
        };
    }

    $('#plugin_prompt').on('input', function () {
        const result = validateText($(this).val(), 100, 10);
        const $stats = $('#plugin_prompt_counter .v-stats');
        $stats.text(result.chars + ' / 100 ' + aipg_vars.i18n.chars);

        if (result.valid) {
            $('#plugin_prompt_counter').addClass('valid');
            $('#aipg-generate-submit').prop('disabled', false);
        } else {
            $('#plugin_prompt_counter').removeClass('valid');
            $('#aipg-generate-submit').prop('disabled', true);
        }
    });

    $('#modification-prompt').on('input', function () {
        const result = validateText($(this).val(), 50, 5);
        const $stats = $('#modification_prompt_counter .v-stats');
        $stats.text(result.chars + ' / 50 ' + aipg_vars.i18n.chars);

        if (result.valid) {
            $('#modification_prompt_counter').addClass('valid');
            $('#submit-modification').prop('disabled', false);
        } else {
            $('#modification_prompt_counter').removeClass('valid');
            $('#submit-modification').prop('disabled', true);
        }
    });

    // Handle Form Submission
    $('#aipg-generate-form').on('submit', function (e) {
        e.preventDefault();
        const $form = $(this);
        const $submitBtn = $form.find('input[type="submit"]');
        const $status = $('#generation-status');
        const prompt = $('#plugin_prompt').val();

        $status.html(`
            <div class="aipg-streaming-container">
                <div class="aipg-streaming-header">
                    <div class="aipg-spinner"></div>
                    <span id="aipg-streaming-title">${aipg_vars.i18n.analyzing || 'Analyzing request...'}</span>
                </div>
                <div id="aipg-retry-notification" style="display:none;" class="aipg-error-msg">
                    <span class="dashicons dashicons-warning" style="margin-right: 12px; font-size: 20px; width: 20px; height: 20px;"></span>
                    <span id="aipg-retry-text"></span>
                </div>
                <pre class="aipg-streaming-code aipg-code-block"><code id="aipg-streaming-content"></code></pre>
            </div>
        `);
        $submitBtn.prop('disabled', true);

        // Initiate Job
        $.post(ajaxurl, {
            action: 'aipg_generate_plugin',
            plugin_prompt: prompt,
            nonce: aipg_vars.nonce
        }, function (initResponse) {
            if (initResponse.success) {
                const jobId = initResponse.data.job_id;
                let currentCorrectionCount = 0;
                $('#aipg-streaming-title').text(aipg_vars.i18n.generating || 'Writing plugin code...');

                const pollInterval = setInterval(function () {
                    $.post(ajaxurl, {
                        action: 'aipg_check_generation_status',
                        job_id: jobId,
                        plugin_prompt: prompt, // Keep passing the prompt
                        nonce: aipg_vars.nonce
                    }, function (pollResponse) {
                        if (pollResponse.success) {
                            if (pollResponse.data.status === 'COMPLETED') {
                                clearInterval(pollInterval);
                                renderSuccess(pollResponse.data, prompt, $status, $submitBtn);
                            } else {
                                // PROCESSING or PENDING
                                const partial = pollResponse.data.response || '';
                                const newCorrectionCount = pollResponse.data.correction_count || 0;

                                if (newCorrectionCount > currentCorrectionCount) {
                                    currentCorrectionCount = newCorrectionCount;
                                    $('#aipg-retry-notification').show();
                                    $('#aipg-retry-text').text(`Generation error detected by AI. Attempting auto-correction (${currentCorrectionCount})...`);
                                    $('#aipg-streaming-content').empty();
                                }

                                if (partial) {
                                    const codeEl = $('#aipg-streaming-content');
                                    codeEl.text(partial);
                                    const container = codeEl.parent()[0];
                                    container.scrollTop = container.scrollHeight;
                                }
                            }
                        } else {
                            clearInterval(pollInterval);
                            renderError(pollResponse.data, $status, $submitBtn);
                        }
                    }).fail(function () {
                        clearInterval(pollInterval);
                        renderError('Server error while checking status.', $status, $submitBtn);
                    });
                }, 2000);

            } else if (initResponse.data && initResponse.data.code === 'legal_consent_required') {
                $status.empty();
                $submitBtn.prop('disabled', false);
                handleLegalConsentRequired(initResponse.data.missing, () => $('#aipg-generate-form').submit());
            } else {
                renderError(initResponse.data, $status, $submitBtn);
            }
        }).fail(function () {
            renderError('Server error while initiating job.', $status, $submitBtn);
        });
    });

    function renderSuccess(data, prompt, $status, $submitBtn) {
        $status.html('<div class="aipg-updated-msg"><span class="dashicons dashicons-yes" style="margin-right: 12px; font-size: 24px; width: 24px; height: 24px;"></span><div><span style="font-size: 14px; font-weight: 500;">' + data.message + '</span></div></div>');
        $('#plugin_prompt').val('');
        if (data.tokens_remaining !== null) {
            $('#aipg-token-count').text(new Intl.NumberFormat().format(data.tokens_remaining));
            if (data.tokens_remaining < 2000) {
                $('#aipg-token-container').addClass('low-tokens');
                $('#aipg-low-token-warning').css('display', 'flex');
            }
        }

        data.plugin_prompt = prompt;
        aipg_prepend_plugin_row(data);

        lastGeneratedPlugin = data;
        $('#new-plugin-name-display').text(lastGeneratedPlugin.plugin_name);

        const $scanContainer = $('#aipg-scan-results-container');
        const $scanHeader = $('#aipg-scan-header');
        $scanContainer.empty().hide();
        $scanHeader.hide();

        if (lastGeneratedPlugin.test_results && lastGeneratedPlugin.test_results.length > 0) {
            lastGeneratedPlugin.test_results.forEach(test => {
                const statusClass = test.status === 'success' ? 'success' : (test.status === 'warning' ? 'warning' : 'error');
                const statusLabel = test.status === 'success' ? aipg_vars.i18n.passed : (test.status === 'warning' ? aipg_vars.i18n.warning : aipg_vars.i18n.failed);

                let icon = 'yes-alt';
                const lowerName = test.name.toLowerCase();
                if (lowerName.includes('security')) icon = 'shield';
                else if (lowerName.includes('performance')) icon = 'performance';
                else if (lowerName.includes('stability') || lowerName.includes('code')) icon = 'editor-code';
                else if (lowerName.includes('ui') || lowerName.includes('style')) icon = 'art';

                const tooltipHtml = test.description ? `<div class="tooltip"><strong>${test.name}</strong><br>${test.description}</div>` : '';
                const infoIcon = test.description ? '<span class="dashicons dashicons-info" style="font-size: 14px; width: 14px; height: 14px; margin-left: 4px; opacity: 0.5;"></span>' : '';

                $scanContainer.append(`
                    <div class="aipg-status-card ${statusClass}">
                        <div class="aipg-status-icon-wrap">
                            <span class="dashicons dashicons-${icon}"></span>
                        </div>
                        <div class="aipg-status-name" style="display: flex; align-items: center;">${test.name}${infoIcon}</div>
                        <div class="aipg-status-label">
                            <div class="aipg-status-dot-small"></div>
                            ${statusLabel}
                        </div>
                        ${tooltipHtml}
                    </div>
                `);
            });
            $scanHeader.show();
            $scanContainer.show();
        }

        setTimeout(() => {
            $status.empty();
        }, 3000);
        if ($submitBtn) $submitBtn.prop('disabled', false);
        openModal('#post-generation-modal');
    }

    function renderError(message, $status, $submitBtn) {
        const errorMsg = message.message || message;
        $status.html('<div class="aipg-error-msg"><span class="dashicons dashicons-warning" style="margin-right: 12px; font-size: 24px; width: 24px; height: 24px;"></span><div><span style="font-size: 14px; font-weight: 500;">' + errorMsg + '</span></div></div>');
        if ($submitBtn) $submitBtn.prop('disabled', false);
    }

    // Modal Handling
    function openModal(selector) {
        $(selector).addClass('active');
        $('body').addClass('aipg-modal-open');
    }

    function closeModal(selector) {
        $(selector).removeClass('active');
        $('body').removeClass('aipg-modal-open');
    }

    $('.close-modal').click(function () {
        const target = $(this).data('target');
        closeModal(target);
        // No longer reloading here as we prepend the row dynamically
    });

    // Modification Logic
    let currentPluginId = null;
    $('.modify-plugin-btn').click(function () {
        const $row = $(this).closest('tr');
        currentPluginId = $row.data('plugin-id');
        const name = $row.find('strong').text();
        const lastPrompt = $row.data('description');

        $('#selected-plugin-info').html(aipg_vars.i18n.modifying + ' <strong>' + name + '</strong>');
        $('#last-prompt-display').text(lastPrompt ? lastPrompt : aipg_vars.i18n.noPrevPrompt);
        $('#modification-prompt').val('');
        $('#modification-status').empty();
        $('#modification_prompt_counter .v-stats').text('0 / 50 ' + aipg_vars.i18n.chars);
        $('#modification_prompt_counter').removeClass('valid');
        $('#submit-modification').prop('disabled', true);

        openModal('#modification-modal');
    });

    // Post-Generation Actions
    $('#gen-action-review').click(function () {
        if (!lastGeneratedPlugin) return;
        const $content = $('#code-content');
        $content.html('<div class="aipg-loading"><div class="aipg-spinner"></div>' + aipg_vars.i18n.loadingCode + '</div>');

        $('#install-from-code-viewer').show().data('plugin-id', lastGeneratedPlugin.plugin_id);
        closeModal('#post-generation-modal');
        openModal('#code-viewer-modal');

        $.post(ajaxurl, {
            action: 'aipg_get_plugin_code',
            plugin_id: lastGeneratedPlugin.plugin_id,
            nonce: aipg_vars.nonce
        }, function (response) {
            if (response.success) {
                $content.text(response.data);
            } else {
                $content.html('<div class="aipg-error-msg">' + aipg_vars.i18n.error + response.data + '</div>');
            }
        });
    });

    // Direct Install and Activate from success modal
    $('#gen-action-install-activate').off('click').on('click', function () {
        if (!lastGeneratedPlugin) return;
        const $btn = $(this);
        const originalText = $btn.text();
        $btn.prop('disabled', true).text(aipg_vars.i18n.installing);

        $.post(ajaxurl, {
            action: 'aipg_install_remote_plugin',
            plugin_id: lastGeneratedPlugin.plugin_id,
            activate: 'true',
            nonce: aipg_vars.nonce
        }, function (response) {
            if (response.success) {
                reloadWithHighlight(lastGeneratedPlugin.plugin_id);
            } else {
                const errorData = (response && response.data) ? (response.data.message || response.data) : (response || 'Unknown error');
                alert(aipg_vars.i18n.error + errorData);
                $btn.prop('disabled', false).text(originalText);
            }
        });
    });

    $('#gen-action-install').off('click').on('click', function () {
        if (!lastGeneratedPlugin) return;
        const $btn = $(this);
        const originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="aipg-spinner"></span> ' + aipg_vars.i18n.installing);

        $.post(ajaxurl, {
            action: 'aipg_install_remote_plugin',
            plugin_id: lastGeneratedPlugin.plugin_id,
            nonce: aipg_vars.nonce
        }, function (response) {
            if (response.success) {
                reloadWithHighlight(lastGeneratedPlugin.plugin_id);
            } else {
                alert(aipg_vars.i18n.installFailed + (response.data.message || response.data));
                $btn.prop('disabled', false).html(originalHtml);
            }
        });
    });

    $('#install-from-code-viewer').click(function () {
        const pluginId = $(this).data('plugin-id');
        const $btn = $(this);
        const originalHtml = $btn.html();

        $btn.prop('disabled', true).html('<span class="aipg-spinner"></span> Installing...');

        $.post(ajaxurl, {
            action: 'aipg_install_remote_plugin',
            plugin_id: pluginId,
            nonce: aipg_vars.nonce
        }, function (response) {
            if (response.success) {
                reloadWithHighlight(pluginId);
            } else {
                alert(aipg_vars.i18n.installFailed + (response.data.message || response.data));
                $btn.prop('disabled', false).html(originalHtml);
            }
        }).fail(function () {
            alert(aipg_vars.i18n.installServerError);
            $btn.prop('disabled', false).html(originalHtml);
        });
    });

    $('#submit-modification').click(function () {
        const prompt = $('#modification-prompt').val();
        const $status = $('#modification-status');
        const $btn = $(this);

        $status.html(`
            <div class="aipg-streaming-container">
                <div class="aipg-streaming-header">
                    <div class="aipg-spinner"></div>
                    <span id="aipg-mod-streaming-title">${aipg_vars.i18n.analyzing || 'Analyzing modifying request...'}</span>
                </div>
                <div id="aipg-mod-retry-notification" style="display:none;" class="aipg-error-msg">
                    <span class="dashicons dashicons-warning" style="margin-right: 12px; font-size: 20px; width: 20px; height: 20px;"></span>
                    <span id="aipg-mod-retry-text"></span>
                </div>
                <pre class="aipg-streaming-code"><code id="aipg-mod-streaming-content"></code></pre>
            </div>
        `);
        $btn.prop('disabled', true);

        $.post(ajaxurl, {
            action: 'aipg_modify_plugin',
            plugin_id: currentPluginId,
            modification_prompt: prompt,
            nonce: aipg_vars.nonce
        }, function (initResponse) {
            if (initResponse.success) {
                const jobId = initResponse.data.job_id;
                let currentCorrectionCount = 0;
                $('#aipg-mod-streaming-title').text(aipg_vars.i18n.updating || 'Updating plugin code...');

                const pollInterval = setInterval(function () {
                    $.post(ajaxurl, {
                        action: 'aipg_check_modification_status',
                        job_id: jobId,
                        plugin_id: currentPluginId,
                        modification_prompt: prompt,
                        nonce: aipg_vars.nonce
                    }, function (pollResponse) {
                        if (pollResponse.success) {
                            if (pollResponse.data.status === 'COMPLETED') {
                                clearInterval(pollInterval);
                                $status.html('<div class="aipg-updated-msg"><span class="dashicons dashicons-yes" style="margin-right: 12px; font-size: 24px; width: 24px; height: 24px;"></span><div><span style="font-size: 14px; font-weight: 500;">' + pollResponse.data.message + '</span></div></div>');
                                if (pollResponse.data.tokens_remaining !== null && $('#aipg-token-count').length) {
                                    $('#aipg-token-count').text(new Intl.NumberFormat().format(pollResponse.data.tokens_remaining));
                                }
                                setTimeout(() => location.reload(), 2000);
                            } else {
                                const partial = pollResponse.data.response || '';
                                const newCorrectionCount = pollResponse.data.correction_count || 0;

                                if (newCorrectionCount > currentCorrectionCount) {
                                    currentCorrectionCount = newCorrectionCount;
                                    $('#aipg-mod-retry-notification').show();
                                    $('#aipg-mod-retry-text').text(`Error detected. Auto-correcting (${currentCorrectionCount})...`);
                                    $('#aipg-mod-streaming-content').empty();
                                }

                                if (partial) {
                                    const codeEl = $('#aipg-mod-streaming-content');
                                    codeEl.text(partial);
                                    const container = codeEl.parent()[0];
                                    container.scrollTop = container.scrollHeight;
                                }
                            }
                        } else {
                            clearInterval(pollInterval);
                            renderError(pollResponse.data, $status, $btn);
                        }
                    }).fail(function () {
                        clearInterval(pollInterval);
                        renderError('Server error while checking modify status.', $status, $btn);
                    });
                }, 2000);

            } else if (initResponse.data && initResponse.data.code === 'legal_consent_required') {
                $status.empty();
                $btn.prop('disabled', false);
                handleLegalConsentRequired(initResponse.data.missing, () => $('#submit-modification').click());
            } else {
                renderError(initResponse.data, $status, $btn);
            }
        }).fail(function () {
            renderError('Server error while initiating modify job.', $status, $btn);
        });
    });

    // Legal Consent Flow
    let retryCallback = null;
    let legalData = null;

    function handleLegalConsentRequired(missing, onComplete) {
        retryCallback = onComplete;
        openModal('#legal-consent-modal');
        $('#legal-status').html('<div class="aipg-loading"><div class="aipg-spinner"></div>' + aipg_vars.i18n.loadingPolicies + '</div>');

        $.post(ajaxurl, {
            action: 'aipg_get_legal_content',
            nonce: aipg_vars.nonce
        }, function (response) {
            if (response.success) {
                $('#legal-status').empty();
                legalData = response.data;

                if (missing.includes('TOS') && legalData.tos) {
                    $('#tos-section').show();
                    $('#tos-version').text('v' + legalData.tos.version);
                    $('#tos-content').html(legalData.tos.content);
                } else {
                    $('#tos-section').hide();
                    $('#tos-checkbox').prop('checked', true);
                }

                if (missing.includes('PRIVACY_POLICY') && legalData.privacy_policy) {
                    $('#privacy-policy-section').show();
                    $('#pp-version').text('v' + legalData.privacy_policy.version);
                    $('#pp-content').html(legalData.privacy_policy.content);
                } else {
                    $('#privacy-policy-section').hide();
                    $('#pp-checkbox').prop('checked', true);
                }

                validateConsentCheckboxes();
            } else {
                $('#legal-status').html('<div class="aipg-error-msg">' + aipg_vars.i18n.errorPolicies + response.data + '</div>');
            }
        });
    }

    $('.legal-checkbox').change(validateConsentCheckboxes);

    function validateConsentCheckboxes() {
        const tosAccepted = $('#tos-checkbox').is(':checked');
        const ppAccepted = $('#pp-checkbox').is(':checked');
        $('#submit-legal-consent').prop('disabled', !(tosAccepted && ppAccepted));
    }

    $('#submit-legal-consent').click(function () {
        const $btn = $(this);
        const $status = $('#legal-status');

        const acceptedIds = [];
        if ($('#tos-section').is(':visible')) acceptedIds.push(legalData.tos.id);
        if ($('#privacy-policy-section').is(':visible')) acceptedIds.push(legalData.privacy_policy.id);

        $status.html('<div class="aipg-loading"><div class="aipg-spinner"></div>' + aipg_vars.i18n.savingPref + '</div>');
        $btn.prop('disabled', true);

        $.post(ajaxurl, {
            action: 'aipg_accept_legal_terms',
            accepted_version_ids: acceptedIds,
            nonce: aipg_vars.nonce
        }, function (response) {
            if (response.success) {
                closeModal('#legal-consent-modal');
                if (retryCallback) retryCallback();
            } else {
                $status.html('<div class="aipg-error-msg">' + aipg_vars.i18n.error + response.data + '</div>');
                $btn.prop('disabled', false);
            }
        });
    });

    // Copy to Clipboard Logic
    $('#aipg-copy-code').click(function () {
        const $btn = $(this);
        const code = $('#code-content').text();
        const originalHtml = $btn.html();

        if (!code || $btn.hasClass('success')) return;

        navigator.clipboard.writeText(code).then(function () {
            $btn.addClass('success').find('.copy-text').text('Copied!');
            $btn.find('.dashicons').removeClass('dashicons-clipboard').addClass('dashicons-yes');

            setTimeout(function () {
                $btn.removeClass('success').html(originalHtml);
            }, 2000);
        }, function (err) {
            console.error('Could not copy text: ', err);
        });
    });

    // View Code Logic
    $('.view-code-btn').click(function () {
        const $row = $(this).closest('tr');
        const pluginId = $row.data('plugin-id');
        const isRemote = $row.hasClass('aipg-remote-row');
        const $content = $('#code-content');
        const $copyBtn = $('#aipg-copy-code');

        if (isRemote) {
            $('#install-from-code-viewer').show().data('plugin-id', pluginId);
        } else {
            $('#install-from-code-viewer').hide();
        }

        $copyBtn.hide(); // Hide until code is loaded
        $content.html('<div class="aipg-loading" style="background:transparent; color:#94a3b8;"><div class="aipg-spinner" style="border-top-color:#38bdf8;"></div>' + aipg_vars.i18n.loadingCode + '</div>');
        openModal('#code-viewer-modal');

        $.post(ajaxurl, {
            action: 'aipg_get_plugin_code',
            plugin_id: pluginId,
            nonce: aipg_vars.nonce
        }, function (response) {
            if (response.success) {
                $content.text(response.data);
                $copyBtn.fadeIn();
            } else {
                $content.html('<div class="aipg-error-msg" style="margin:20px; background:rgba(215,0,21,0.1); border-color:rgba(215,0,21,0.2); color:#ffd6d6;"><span class="dashicons dashicons-warning" style="margin-right: 12px; font-size: 24px; width: 24px; height: 24px;"></span><div><span style="font-size: 14px; font-weight: 500;">' + response.data + '</span></div></div>');
            }
        });
    });

    // History and Rollback
    $('.view-history-btn').click(function () {
        const $row = $(this).closest('tr');
        const pluginId = $row.data('plugin-id');
        const projectId = $row.data('project-id');
        const $content = $('#history-content');
        const $status = $('#history-status');

        $content.empty();
        $status.html('<div class="aipg-loading"><div class="aipg-spinner"></div>' + aipg_vars.i18n.loadingHistory + '</div>');
        openModal('#history-viewer-modal');

        $.post(ajaxurl, {
            action: 'aipg_get_version_history',
            project_id: projectId,
            nonce: aipg_vars.nonce
        }, function (response) {
            $status.empty();
            if (response.success) {
                if (response.data.length === 0) {
                    $content.append('<tr><td colspan="4" style="text-align:center;">' + aipg_vars.i18n.noHistory + '</td></tr>');
                } else {
                    const activeVersionId = $row.data('active-version-id');
                    response.data.forEach(function (ver) {
                        const isCurrent = (ver.id === activeVersionId || ver.version_id === activeVersionId);
                        const btnLabel = isCurrent ? aipg_vars.i18n.active : aipg_vars.i18n.restore;
                        const btnDisabled = isCurrent ? 'disabled' : '';
                        const btnOpacity = isCurrent ? '0.5' : '1';

                        $content.append(`
                            <tr>
                                <td><span style="background: #f2f2f5; padding: 2px 8px; border-radius: 12px; font-size: 11px;">v${ver.version_number}</span></td>
                                <td><div style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px;" title="${ver.prompt}">${ver.prompt}</div></td>
                                <td style="font-size:12px; color:#6e6e73;">${ver.created_at}</td>
                                <td><button class="aipg-button-secondary rollback-trigger" data-version-id="${ver.id}" data-plugin-id="${pluginId}" style="padding: 4px 8px; font-size: 11px; opacity: ${btnOpacity};" ${btnDisabled}>${btnLabel}</button></td>
                            </tr>
                        `);
                    });
                }
            } else {
                $status.html('<div class="aipg-error-msg"><span class="dashicons dashicons-warning" style="margin-right: 12px; font-size: 24px; width: 24px; height: 24px;"></span><div><span style="font-size: 14px; font-weight: 500;">' + response.data + '</span></div></div>');
            }
        });
    });

    $(document).on('click', '.rollback-trigger', function () {
        confirmData = {
            version_id: $(this).data('version-id'),
            plugin_id: $(this).data('plugin-id')
        };
        confirmAction = 'rollback';

        $('#confirm-modal-icon-bg').css('background', '#fbfbfd');
        $('#confirm-modal-icon').css('color', '#007aff');
        $('#confirm-modal-title').text(aipg_vars.i18n.restoreTitle);
        $('#confirm-modal-message').text(aipg_vars.i18n.restoreMsg);
        $('#confirm-modal-submit').text(aipg_vars.i18n.restore).removeClass('aipg-button-danger').addClass('aipg-button-primary');

        openModal('#confirmation-modal');
    });

    $('#confirm-modal-submit').click(function () {
        const $btn = $(this);
        const originalText = $btn.text();

        if (confirmAction === 'rollback') {
            const $status = $('#history-status');
            $btn.prop('disabled', true).text(aipg_vars.i18n.restoring);

            $.post(ajaxurl, {
                action: 'aipg_rollback_version',
                plugin_id: confirmData.plugin_id,
                version_id: confirmData.version_id,
                nonce: aipg_vars.nonce
            }, function (response) {
                if (response.success) {
                    $status.html('<div class="aipg-updated-msg"><span class="dashicons dashicons-yes" style="margin-right: 12px; font-size: 24px; width: 24px; height: 24px;"></span><div><span style="font-size: 14px; font-weight: 500;">Successfully restored! Reloading...</span></div></div>');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    alert(aipg_vars.i18n.error + response.data);
                    $btn.prop('disabled', false).text(originalText);
                    closeModal('#confirmation-modal');
                }
            });
        } else if (confirmAction === 'delete') {
            $btn.prop('disabled', true).html('<span class="aipg-spinner"></span>');

            $.post(ajaxurl, {
                action: 'aipg_remove_plugin_files',
                plugin_id: confirmData.plugin_id,
                nonce: aipg_vars.nonce
            }, function (response) {
                if (response.success) {
                    location.reload();
                } else {
                    alert(aipg_vars.i18n.deletionFailed + response.data);
                    $btn.prop('disabled', false).text(originalText);
                    closeModal('#confirmation-modal');
                }
            }).fail(function () {
                alert(aipg_vars.i18n.deletionServerError);
                $btn.prop('disabled', false).text(originalText);
                closeModal('#confirmation-modal');
            });
        }
    });
});
