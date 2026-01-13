document.addEventListener('DOMContentLoaded', () => {
    // ... (Existing variables)
    const mainView = document.getElementById('main-view');
    const settingsView = document.getElementById('settings-view');
    const settingsBtn = document.getElementById('settingsBtn');
    const backBtn = document.getElementById('backBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const generateBtn = document.getElementById('generateBtn');
    const downloadHistoryBtn = document.getElementById('downloadHistoryBtn');
    const apiKeyInput = document.getElementById('apiKey');
    const modelSelect = document.getElementById('model');
    const settingsStatus = document.getElementById('settingsStatus');
    const status = document.getElementById('status');
    const toneSelect = document.getElementById('tone');
    const promptInput = document.getElementById('prompt');

    // Add Close Button Logic
    // We can add a close button dynamically or assume user clicks header.
    // Let's create a close button element to be sure.
    const header = document.querySelector('header');
    if (header && !document.getElementById('closeSidebarBtn')) {
        const closeBtn = document.createElement('button');
        closeBtn.id = 'closeSidebarBtn';
        closeBtn.innerHTML = '×';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.color = '#5f6368';
        closeBtn.style.marginLeft = 'auto'; // Push to right
        closeBtn.style.marginRight = '10px';

        // Insert before settings button or at end
        header.insertBefore(closeBtn, settingsBtn);

        closeBtn.onclick = () => {
            window.parent.postMessage({ action: 'closeSidebar' }, '*');
        };
    }

    // Load Settings
    chrome.storage.local.get(['apiKey', 'model'], (result) => {
        if (result.apiKey) apiKeyInput.value = result.apiKey;
        if (result.model) modelSelect.value = result.model;
    });

    // Navigation
    settingsBtn.addEventListener('click', () => {
        mainView.classList.add('hidden');
        settingsView.classList.remove('hidden');
    });

    backBtn.addEventListener('click', () => {
        settingsView.classList.add('hidden');
        mainView.classList.remove('hidden');
    });

    // Save Settings
    saveSettingsBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        const model = modelSelect.value;

        if (!apiKey) {
            showStatus(settingsStatus, 'Please enter an API Key', 'error');
            return;
        }

        chrome.storage.local.set({ apiKey, model }, () => {
            showStatus(settingsStatus, 'Settings saved!', 'success');
            setTimeout(() => {
                settingsView.classList.add('hidden');
                mainView.classList.remove('hidden');
                settingsStatus.textContent = '';
            }, 1000);
        });
    });

    // Generate Email
    generateBtn.addEventListener('click', async () => {
        const tone = toneSelect.value;
        const prompt = promptInput.value.trim();

        if (!prompt) {
            showStatus(status, 'Please enter a prompt', 'error');
            return;
        }

        chrome.storage.local.get(['apiKey', 'model'], async (result) => {
            if (!result.apiKey) {
                showStatus(status, 'API Key missing. Go to Settings.', 'error');
                return;
            }

            const apiKey = result.apiKey;
            const model = result.model || 'mistralai/mistral-7b-instruct:free';

            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';
            status.textContent = '';

            try {
                const generatedText = await callOpenRouter(apiKey, model, tone, prompt);

                // Send to content script
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0].url && tabs[0].url.includes('mail.google.com')) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'insertText',
                            text: generatedText
                        }, (response) => {
                            if (chrome.runtime.lastError) {
                                // If we are in iframe, chrome.tabs might fail or behave differently if not careful? 
                                // Wait, popup.js running in iframe via chrome-extension:// URL acts as an extension page.
                                // It HAS access to chrome.tabs.
                                showStatus(status, 'Refresh Gmail tab.', 'error');
                            } else {
                                // Don't close window automatically in sidebar mode
                                showStatus(status, 'Inserted!', 'success');
                            }
                        });
                    } else {
                        showStatus(status, 'Please open Gmail.', 'error');
                    }
                });

            } catch (error) {
                console.error(error);
                showStatus(status, 'Generation failed.', 'error');
            } finally {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate Email';
            }
        });
    });

    // Summarize Email
    summarizeBtn.addEventListener('click', () => {
        chrome.storage.local.get(['apiKey', 'model'], async (result) => {
            if (!result.apiKey) {
                showStatus(status, 'API Key missing. Go to Settings.', 'error');
                return;
            }

            summarizeBtn.disabled = true;
            summarizeBtn.textContent = 'Reading Email...';
            summaryResult.textContent = '';

            // 1. Get content from page
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'readEmail' }, async (response) => {
                    if (chrome.runtime.lastError || !response) {
                        summarizeBtn.disabled = false;
                        summarizeBtn.textContent = '📝 Summarize Current Email';
                        showStatus(status, 'Could not read email. Reload page?', 'error');
                        return;
                    }

                    const { subject, body } = response;

                    if (!body || body.length < 10) {
                        summarizeBtn.disabled = false;
                        summarizeBtn.textContent = '📝 Summarize Current Email';
                        showStatus(status, 'No email body found.', 'error');
                        return;
                    }

                    // 2. Call AI
                    summarizeBtn.textContent = 'Summarizing...';
                    try {
                        const summary = await callOpenRouterForSummary(result.apiKey, result.model, subject, body);
                        summaryResult.innerHTML = cleanSummaryOutput(summary);
                        showStatus(status, 'Done!', 'success');
                    } catch (error) {
                        console.error(error);
                        showStatus(status, 'Summarization failed.', 'error');
                        summaryResult.textContent = 'Error: ' + error.message;
                    } finally {
                        summarizeBtn.disabled = false;
                        summarizeBtn.textContent = '📝 Summarize Current Email';
                    }
                });
            });
        });
    });

    downloadHistoryBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'downloadHistory' });
    });

    function showStatus(element, message, type) {
        element.textContent = message;
        element.className = 'status-msg ' + type;
    }

    async function callOpenRouter(apiKey, model, tone, userPrompt) {
        const systemPrompt = `You are a helpful email assistant. Write a ${tone} email based on the prompt. Return ONLY the body.`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/MailMon',
                'X-Title': 'MailMon Extension'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            })
        });

        if (!response.ok) throw new Error(response.status);
        const data = await response.json();
        return data.choices[0].message.content;
    }

    async function callOpenRouterForSummary(apiKey, model, subject, body) {
        // Truncate body if too long to save tokens/money
        const truncatedBody = body.substring(0, 10000);

        // Strict prompt: No markdown symbols allowed, only dashes for lists.
        const systemPrompt = `You are a precise email summarizer. 
        Output a CLEAN, PLAIN TEXT summary.
        Rules:
        1. NO asterisks (**bold**), NO hashes (## header), NO underscores.
        2. Use ONLY dashes (-) for bullet points.
        3. Do not use sections or headers. Just the list.
        4. Keep it visual and airy.
        5. Subject: ${subject}`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/MailMon',
                'X-Title': 'MailMon Extension'
            },
            body: JSON.stringify({
                model: model || 'mistralai/mistral-7b-instruct:free',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: truncatedBody }
                ]
            })
        });

        if (!response.ok) throw new Error(response.status);
        const data = await response.json();
        return data.choices[0].message.content;
    }

    function cleanSummaryOutput(text) {
        // Post-processing to remove any rogue markdown symbols if AI disobeys
        let clean = text
            .replace(/\*\*/g, '')   // Remove bold **
            .replace(/##/g, '')     // Remove headers ##
            .replace(/__/g, '')     // Remove italics __
            .replace(/###/g, '');   // Remove headers ###

        // Convert newlines to breaks and dashes to styled items
        let html = clean
            .replace(/^- (.*)/gm, '<div class="summary-item">• $1</div>') // Dash to bullet
            .replace(/\n/g, '<br>'); // Keep layout

        return html;
    }
});
