// Opticode - Main Application
// Made by Cozytustudios - Professional Vibe Coding App

const App = {
    currentProject: null,
    chatMessages: [],
    isProcessing: false,
    persona: '',
    sessionStart: Date.now(),
    tutorialListenersBound: false,
    tutorialStep: 1,
    aiMode: 'CODE_FAST',
    thinkingLevel: 'mid',
    latestImageInspirationName: '',
    taskTimerInterval: null,
    taskMeta: null,
    streamingRaf: null,
    streamingBuffer: null,
    streamingDebounceTimeout: null,
    layoutMode: 'codex',
    chatHistoryQuery: '',

    // Initialize application
    async init() {
        console.log('🚀 Initializing Opticode by Cozytustudios...');

        // Show splash screen
        await this.showSplashScreen();

        // Initialize modules
        Auth.init();
        Editor.init();

        // Apply saved settings
        this.applySettings();

        // Start session timer
        this.startSessionTimer();

        // Check authentication
        const authState = Auth.checkAuth();

        if (authState.authenticated) {
            // Check if user has selected a plan
            if (!authState.user.plan || authState.user.plan === 'FREE') {
                // User can use free plan
                this.showMainApp();
            } else {
                this.showMainApp();
            }
        } else {
            this.showAuthScreen();
        }

        // Initialize resizers
        this.initResizers();

        // Check for first-time user and show tutorial
        this.checkFirstTimeUser();

        // Setup global event listeners
        this.setupEventListeners();

        // Initialize i18n
        if (typeof I18n !== 'undefined') {
            I18n.init();
        }

        // Setup new features
        this.setupActivityBar();
        this.setupChatResearch();
        this.setupTodoFeature();
        this.setupLanguageToggle();

        // Register Service Worker for PWA
        this.registerServiceWorker();
    },

    // Register Service Worker
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => console.log('✅ Service Worker registered', reg))
                    .catch(err => console.error('❌ Service Worker registration failed', err));
            });
        }
    },

    // Show splash screen with animation
    showSplashScreen() {
        return new Promise(resolve => {
            const splash = document.getElementById('splash-screen');

            setTimeout(() => {
                splash.classList.add('fade-out');
                setTimeout(() => {
                    splash.classList.add('hidden');
                    resolve();
                }, 300);
            }, 1000);
        });
    },

    // Show auth screen
    showAuthScreen() {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('auth-screen').classList.add('animate-fade-in');
    },

    // Show main app
    showMainApp() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('subscription-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('main-app').classList.add('animate-fade-in');

        // Update user info
        this.updateUserInfo();
        this.updateUsageDisplay();
        this.loadProjects();
        this.applyAIModeUI();
        this.setAIStatus('Idle', 'idle');
        this.promptProjectSelection();
        this.setView('code');
    },

    // Apply saved settings
    applySettings() {
        const settings = Storage.getSettings();

        // Apply theme and density
        this.applyThemeClass(settings.theme);
        this.applyUIScale(settings.uiScale || 'normal');
        this.changeLayout(settings.layout, { persist: false, silent: true });

        // Update theme select if exists
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = settings.theme;
        }
        this.updateThemeOptionSelection(settings.theme);
        const savedModel = ENV.MODELS[settings.defaultModel] ? settings.defaultModel : (ENV.DEFAULT_MODEL || 'OPTICHAIN_THINKING_15');
        const uiScaleSelect = document.getElementById('ui-scale-select');
        if (uiScaleSelect) {
            uiScaleSelect.value = settings.uiScale || 'normal';
        }
        const modelSelect = document.getElementById('model-select');
        const defaultModelSelect = document.getElementById('default-model-select');
        if (modelSelect) {
            modelSelect.value = savedModel;
        }
        if (defaultModelSelect) {
            defaultModelSelect.value = savedModel;
        }
        this.updateModelTierBadge(savedModel);
        this.thinkingLevel = settings.defaultThinkingLevel || 'mid';
        this.applyThinkingUI();

        const deepseekUrlInput = document.getElementById('deepseek-url-input');
        if (deepseekUrlInput) {
            const currentUrl = settings.deepseekApiUrl || ENV.DEEPSEEK_API_URL || '';
            deepseekUrlInput.value = AI.normalizeApiUrl ? AI.normalizeApiUrl(currentUrl) : currentUrl;
        }
        const deepseekKeyInput = document.getElementById('deepseek-key-input');
        if (deepseekKeyInput) {
            deepseekKeyInput.value = settings.deepseekApiKey || '';
        }

        // Update toggles
        const soundToggle = document.getElementById('sound-toggle');
        const hapticToggle = document.getElementById('haptic-toggle');

        if (soundToggle) soundToggle.checked = settings.soundEnabled;
        if (hapticToggle) hapticToggle.checked = settings.hapticEnabled;

        // Apply AI mode preferences
        const allowedModes = ['PLAN_BUILD', 'CODE_FAST'];
        this.aiMode = allowedModes.includes(settings.aiMode) ? settings.aiMode : 'CODE_FAST';
        Storage.updateSetting('aiMode', this.aiMode);
        this.applyAIModeUI();
        this.setAIStatus('Idle', 'idle');
        this.applyLayoutMode('codex', { persist: false, silent: true });
    },

    // Setup event listeners
    setupEventListeners() {
        // Welcome screen actions
        document.getElementById('start-coding-btn')?.addEventListener('click', () => {
            this.startNewProject();
        });

        document.getElementById('import-project-btn')?.addEventListener('click', () => {
            this.importProject();
        });

        document.getElementById('delete-project-btn')?.addEventListener('click', () => {
            this.deleteCurrentProject();
        });
        document.getElementById('view-docs-btn')?.addEventListener('click', () => {
            Utils.showToast('Use Plan + Build mode for structured AI execution.', 'info');
        });

        // Chat history button
        document.getElementById('history-btn')?.addEventListener('click', () => {
            this.showHistory();
        });

        // Hide/show panels via top toggle (kept for keyboard UX)
        document.getElementById('toggle-code-btn')?.addEventListener('click', () => {
            this.setView('code');
        });
        document.getElementById('toggle-preview-btn')?.addEventListener('click', () => {
            this.setView('preview');
        });
        document.querySelectorAll('#view-toggle .view-btn')?.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setView(btn.dataset.view);
            });
        });

        // Workspace tab strip (Preview / Code / Files)
        document.querySelectorAll('.workspace-tab')?.forEach(tab => {
            tab.addEventListener('click', () => {
                this.setWorkspacePane(tab.dataset.view);
            });
        });

        // Buy premium buttons
        document.getElementById('buy-premium-btn')?.addEventListener('click', () => {
            window.open('https://web.facebook.com/profile.php?id=61560074175677', '_blank');
        });
        document.getElementById('ultra-agent-buy')?.addEventListener('click', () => {
            window.open('https://web.facebook.com/profile.php?id=61560074175677', '_blank');
        });

        // New project button
        document.getElementById('new-project-btn')?.addEventListener('click', () => {
            this.showNewProjectModal();
        });

        // Create project button in modal
        document.getElementById('create-project-btn')?.addEventListener('click', () => {
            this.createProject();
        });

        // Chat input
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.addEventListener('input', () => {
                Utils.autoResizeTextarea(chatInput, 200);
            });

            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Send button
        document.getElementById('send-btn')?.addEventListener('click', () => {
            this.sendMessage();
        });

        document.querySelectorAll('#input-suggestions .suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const input = document.getElementById('chat-input');
                if (!input) return;
                const prompt = chip.dataset.prompt || chip.textContent.trim();
                input.value = prompt;
                Utils.autoResizeTextarea(input, 200);
                input.focus();
                Utils.showToast('Prompt ready. Press Enter to send.', 'info');
            });
        });

        document.getElementById('preview-quick-btn')?.addEventListener('click', () => {
            this.setWorkspacePane('preview');
        });
        document.getElementById('mode-toggle-btn')?.addEventListener('click', () => {
            this.cycleAIMode();
        });
        document.getElementById('thinking-select')?.addEventListener('change', (e) => {
            this.thinkingLevel = e.target.value;
            Storage.updateSetting('defaultThinkingLevel', this.thinkingLevel);
            const defaultThinkingSelect = document.getElementById('default-thinking-select');
            if (defaultThinkingSelect) {
                defaultThinkingSelect.value = this.thinkingLevel;
            }
            this.applyThinkingUI();
        });
        document.getElementById('model-select')?.addEventListener('change', (e) => {
            const selectedModel = e.target.value;
            Storage.updateSetting('defaultModel', selectedModel);
            const defaultModelSelect = document.getElementById('default-model-select');
            if (defaultModelSelect) {
                defaultModelSelect.value = selectedModel;
            }
            this.updateModelTierBadge(selectedModel);
        });

        // Image attach
        document.getElementById('attach-file-btn')?.addEventListener('click', () => {
            document.getElementById('image-input')?.click();
        });
        document.getElementById('image-input')?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                Utils.showToast('Please select an image file', 'warning');
                e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result;
                const imageMessage = {
                    role: 'user',
                    content: `Attached image: ${file.name}`,
                    imageData: dataUrl,
                    createdAt: Date.now()
                };
                this.addMessageToChat(imageMessage);
                if (this.currentProject) {
                    Storage.addChatMessage(this.currentProject.id, imageMessage);
                }
                this.latestImageInspirationName = file.name;
                Utils.showToast(`Image inspiration ready: ${file.name}`, 'success');
                e.target.value = '';
            };
            reader.readAsDataURL(file);
        });

        // Persona builder
        document.getElementById('persona-btn')?.addEventListener('click', () => {
            const persona = prompt('Describe the persona to assist your coding vibe:');
            if (persona) {
                this.persona = persona;
                Utils.showToast('Persona set for chats', 'success');
            }
        });

        // Clear chat button
        document.getElementById('clear-chat-btn')?.addEventListener('click', () => {
            this.clearChat();
        });

        // Voice input
        document.getElementById('voice-input-btn')?.addEventListener('click', () => {
            this.toggleVoiceInput();
        });

        // Settings button
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showSettingsModal();
        });

        // Theme button
        document.getElementById('theme-btn')?.addEventListener('click', () => {
            this.showThemeModal();
        });

        // Layout button removed from UI
        document.getElementById('picker-new-btn')?.addEventListener('click', () => {
            document.getElementById('project-picker-modal')?.classList.add('hidden');
            this.showNewProjectModal();
        });
        document.getElementById('picker-import-btn')?.addEventListener('click', () => {
            document.getElementById('project-picker-modal')?.classList.add('hidden');
            this.importProject();
        });

        // Theme options
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                this.changeTheme(option.dataset.theme);
            });
        });

        // Settings toggles
        document.getElementById('sound-toggle')?.addEventListener('change', (e) => {
            Storage.updateSetting('soundEnabled', e.target.checked);
        });

        document.getElementById('haptic-toggle')?.addEventListener('change', (e) => {
            Storage.updateSetting('hapticEnabled', e.target.checked);
        });

        document.getElementById('theme-select')?.addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });
        document.getElementById('ui-scale-select')?.addEventListener('change', (e) => {
            this.applyUIScale(e.target.value);
            Storage.updateSetting('uiScale', e.target.value);
            Utils.showToast(`UI size set to ${e.target.value}`, 'success');
        });
        document.getElementById('default-model-select')?.addEventListener('change', (e) => {
            Storage.updateSetting('defaultModel', e.target.value);
            const modelSelect = document.getElementById('model-select');
            if (modelSelect) {
                modelSelect.value = e.target.value;
            }
            this.updateModelTierBadge(e.target.value);
            Utils.showToast('Default model updated', 'success');
        });
        document.getElementById('default-thinking-select')?.addEventListener('change', (e) => {
            this.thinkingLevel = e.target.value;
            Storage.updateSetting('defaultThinkingLevel', this.thinkingLevel);
            this.applyThinkingUI();
            Utils.showToast('Default thinking level updated', 'success');
        });

        const deepseekUrlInput = document.getElementById('deepseek-url-input');
        if (deepseekUrlInput) {
            deepseekUrlInput.addEventListener('change', () => {
                this.persistAPISettingsFromInputs({ notify: true });
            });
        }

        const deepseekKeyInput = document.getElementById('deepseek-key-input');
        if (deepseekKeyInput) {
            deepseekKeyInput.addEventListener('change', () => {
                this.persistAPISettingsFromInputs({ notify: true });
            });
        }

        document.getElementById('toggle-deepseek-key-btn')?.addEventListener('click', () => {
            const input = document.getElementById('deepseek-key-input');
            const btn = document.getElementById('toggle-deepseek-key-btn');
            if (!input || !btn) return;
            const next = input.type === 'password' ? 'text' : 'password';
            input.type = next;
            btn.textContent = next === 'password' ? 'Show' : 'Hide';
        });

        document.getElementById('test-deepseek-btn')?.addEventListener('click', async () => {
            await this.testDeepSeekConnection();
        });

        // Export/Import in settings
        document.getElementById('export-all-btn')?.addEventListener('click', () => {
            this.exportAllProjects();
        });

        document.getElementById('import-btn')?.addEventListener('click', () => {
            this.importProject();
        });
        document.getElementById('replay-tutorial-btn')?.addEventListener('click', () => {
            this.showTutorial();
            Utils.showToast('Tutorial restarted', 'info');
        });

        // Upgrade plan button
        document.getElementById('upgrade-plan-btn')?.addEventListener('click', () => {
            this.closeModal('settings-modal');
            Auth.showSubscriptionScreen();
            Utils.showToast('Choose a plan to continue', 'info');
        });

        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        });

        // Plans close button
        document.getElementById('close-plans-btn')?.addEventListener('click', () => {
            document.getElementById('subscription-screen').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
        });

        // Maximize editor button
        document.getElementById('maximize-editor-btn')?.addEventListener('click', () => {
            this.toggleMaximizeEditor();
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    },

    getAIModeConfig(mode = this.aiMode) {
        const modes = {
            PLAN_BUILD: {
                id: 'PLAN_BUILD',
                label: 'Plan + Build',
                icon: 'fa-diagram-project',
                placeholder: 'Describe your app idea. AI will plan first, then code.',
                hint: 'AI mode: planning first, then implementation'
            },
            CODE_FAST: {
                id: 'CODE_FAST',
                label: 'Code Fast',
                icon: 'fa-bolt',
                placeholder: 'Describe what to build. AI will generate code directly.',
                hint: 'AI mode: direct code generation'
            }
        };
        return modes[mode] || modes.PLAN_BUILD;
    },

    getThinkingConfig(level = this.thinkingLevel) {
        const map = {
            low: {
                id: 'low',
                credits: 1,
                guidance: 'Use fast iteration and keep the solution straightforward.'
            },
            mid: {
                id: 'mid',
                credits: 3,
                guidance: 'Balance speed and quality with solid structure.'
            },
            high: {
                id: 'high',
                credits: 5,
                guidance: 'Reason carefully, handle edge cases, and polish UX details.'
            },
            'extra-high': {
                id: 'extra-high',
                credits: 50,
                guidance: 'Use deep planning, stronger architecture, and enhanced prompt interpretation.'
            }
        };
        return map[level] || map.mid;
    },

    applyThinkingUI() {
        const thinkingSelect = document.getElementById('thinking-select');
        const defaultThinkingSelect = document.getElementById('default-thinking-select');
        const creditPill = document.getElementById('thinking-credit-pill');
        const config = this.getThinkingConfig(this.thinkingLevel);

        if (thinkingSelect && thinkingSelect.value !== this.thinkingLevel) {
            thinkingSelect.value = this.thinkingLevel;
        }
        if (defaultThinkingSelect && defaultThinkingSelect.value !== this.thinkingLevel) {
            defaultThinkingSelect.value = this.thinkingLevel;
        }
        if (creditPill) {
            creditPill.textContent = `Cost: ${config.credits} credit${config.credits > 1 ? 's' : ''}`;
        }
    },

    buildPromptForThinking(message, thinkingConfig) {
        const sections = [
            `Thinking mode: ${thinkingConfig.id.toUpperCase()} (${thinkingConfig.credits} credits). ${thinkingConfig.guidance}`
        ];

        if (this.persona) {
            sections.push(`Persona guidance: ${this.persona}`);
        }

        if (this.latestImageInspirationName) {
            sections.push(`Image inspiration attached: "${this.latestImageInspirationName}". Use it as style inspiration for layout, colors, and composition.`);
        }

        if (thinkingConfig.id === 'extra-high') {
            sections.push('Extra High mode directive: enhance the user prompt, infer missing requirements responsibly, and return a production-ready solution with clear structure.');
        }

        sections.push(`User request:\n${message}`);
        return sections.join('\n\n');
    },

    applyAIModeUI() {
        const config = this.getAIModeConfig();
        const modeBtn = document.getElementById('mode-toggle-btn');
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');

        if (modeBtn) {
            modeBtn.classList.remove('hidden');
            modeBtn.disabled = false;
            modeBtn.innerHTML = `<i class="fas ${config.icon}"></i> ${config.label}`;
            modeBtn.title = config.hint;
        }
        if (chatInput) {
            chatInput.placeholder = config.placeholder;
            chatInput.disabled = false;
        }
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.title = 'Send';
        }
    },

    cycleAIMode() {
        const order = ['PLAN_BUILD', 'CODE_FAST'];
        const currentIndex = order.indexOf(this.aiMode);
        this.aiMode = order[(currentIndex + 1) % order.length];
        Storage.updateSetting('aiMode', this.aiMode);
        this.applyAIModeUI();

        const config = this.getAIModeConfig();
        this.setAIStatus('Idle', 'idle');
        Utils.showToast(config.hint, 'info');
    },

    persistAPISettingsFromInputs(options = {}) {
        const { notify = false } = options;
        const settings = Storage.getSettings();
        const urlInput = document.getElementById('deepseek-url-input');
        const keyInput = document.getElementById('deepseek-key-input');

        const typedUrl = (urlInput?.value ?? settings.deepseekApiUrl ?? '').toString().trim();
        const typedKey = (keyInput?.value ?? settings.deepseekApiKey ?? '').toString().trim();
        const normalizeUrl = (value) => {
            if (typeof AI !== 'undefined' && typeof AI.normalizeApiUrl === 'function') {
                return AI.normalizeApiUrl(value);
            }
            return String(value || '').trim();
        };
        const normalizedTypedUrl = normalizeUrl(typedUrl);
        const normalizedSavedUrl = normalizeUrl(settings.deepseekApiUrl || '');
        const normalizedEnvUrl = normalizeUrl(ENV.DEEPSEEK_API_URL || '');
        const nextUrl = normalizedTypedUrl || normalizedSavedUrl || normalizedEnvUrl;
        const nextKey = typedKey;
        const invalidTypedUrl = Boolean(typedUrl) && !normalizedTypedUrl;

        let changed = false;
        if (nextUrl !== (settings.deepseekApiUrl || '')) {
            Storage.updateSetting('deepseekApiUrl', nextUrl);
            changed = true;
        }
        if (nextKey !== (settings.deepseekApiKey || '')) {
            Storage.updateSetting('deepseekApiKey', nextKey);
            changed = true;
        }

        if (notify) {
            if (invalidTypedUrl) {
                Utils.showToast('API URL format looked invalid. Reverted to a safe endpoint.', 'warning');
            }
            if (changed) {
                Utils.showToast(nextKey ? 'API settings saved' : 'API settings updated', 'success');
            } else {
                Utils.showToast('API settings already up to date', 'info');
            }
        }

        if (urlInput && nextUrl && urlInput.value !== nextUrl) {
            urlInput.value = nextUrl;
        }

        return { url: nextUrl, key: nextKey };
    },

    async testDeepSeekConnection() {
        Utils.playSound('sound-click');
        const btn = document.getElementById('test-deepseek-btn');
        if (btn) btn.disabled = true;

        try {
            this.persistAPISettingsFromInputs();
            const modelSelect = document.getElementById('model-select');
            const selectedModel = modelSelect?.value || Storage.getSettings().defaultModel || (ENV.DEFAULT_MODEL || 'OPTICHAIN_THINKING_15');
            const model = ENV.MODELS[selectedModel] ? selectedModel : (ENV.DEFAULT_MODEL || 'OPTICHAIN_THINKING_15');

            await AI.callAPI(
                [{ role: 'user', content: 'Reply with exactly: OK' }],
                model,
                null,
                { countUsage: false, systemPrompt: AI.getChatPrompt(model), fallback: 'none', usageCost: 1 }
            );

            Utils.showToast('API connection OK', 'success');
        } catch (error) {
            Utils.showToast(error.message || 'API test failed', 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    },

    formatDuration(totalSeconds) {
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    },

    setAIStatus(text, state = 'idle') {
        const statusEl = document.getElementById('ai-status');
        if (!statusEl) return;
        statusEl.className = `ai-status ${state}`;
        statusEl.textContent = text;
    },

    updateTaskClock() {
        if (!this.taskMeta) return;
        const elapsedSeconds = Math.floor((Date.now() - this.taskMeta.startTime) / 1000);
        const remainingSeconds = Math.max(0, this.taskMeta.estimateSeconds - elapsedSeconds);

        const taskTimeEl = document.getElementById('task-time');
        if (taskTimeEl) {
            taskTimeEl.textContent = `${this.taskMeta.phase} ${this.formatDuration(elapsedSeconds)} • ETA ${this.formatDuration(remainingSeconds)}`;
        }
        this.setAIStatus(`${this.taskMeta.phase} ${this.formatDuration(elapsedSeconds)}`, 'working');
    },

    startTaskClock(estimateMinutes, phase = 'Thinking') {
        if (this.taskTimerInterval) {
            clearInterval(this.taskTimerInterval);
            this.taskTimerInterval = null;
        }
        this.taskMeta = {
            startTime: Date.now(),
            estimateSeconds: Math.max(30, Math.round(estimateMinutes * 60)),
            phase
        };
        this.updateTaskClock();
        this.taskTimerInterval = setInterval(() => this.updateTaskClock(), 1000);
    },

    setTaskPhase(phase) {
        if (!this.taskMeta) return;
        this.taskMeta.phase = phase;
        this.updateTaskClock();
    },

    stopTaskClock(success = true) {
        if (this.taskTimerInterval) {
            clearInterval(this.taskTimerInterval);
            this.taskTimerInterval = null;
        }

        const elapsedSeconds = this.taskMeta ? Math.floor((Date.now() - this.taskMeta.startTime) / 1000) : 0;
        const taskTimeEl = document.getElementById('task-time');
        if (taskTimeEl) {
            taskTimeEl.textContent = success
                ? `Done in ${this.formatDuration(elapsedSeconds)}`
                : 'Request failed';
        }
        this.setAIStatus(success ? `Done in ${this.formatDuration(elapsedSeconds)}` : 'Error', success ? 'success' : 'error');
        this.taskMeta = null;
    },

    // Initialize workspace resizer (chat vs dev panels)
    initResizers() {
        const resizer = document.getElementById('workspace-resizer');
        const chatPanel = document.getElementById('chat-panel');
        const devPanel = document.getElementById('dev-panel');

        if (!resizer || !chatPanel || !devPanel) return;

        let startX, startChatWidth, startDevWidth;

        const onMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            const newChatWidth = Math.max(420, startChatWidth + deltaX);
            const newDevWidth = Math.max(560, startDevWidth - deltaX);

            // apply widths using flex-basis so grid reflows smoothly
            chatPanel.style.flexBasis = `${newChatWidth}px`;
            devPanel.style.flexBasis = `${newDevWidth}px`;
        };

        const onMouseUp = () => {
            resizer.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            Editor.updatePreview();
        };

        resizer.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startChatWidth = chatPanel.offsetWidth;
            startDevWidth = devPanel.offsetWidth;

            resizer.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        });
    },

    toggleMaximizeEditor() {
        const workspace = document.getElementById('coding-workspace');
        const btn = document.getElementById('maximize-editor-btn');
        const icon = btn.querySelector('i');

        const isMaximized = workspace.classList.toggle('maximized-editor');
        btn.classList.toggle('active', isMaximized);

        if (isMaximized) {
            icon.classList.replace('fa-expand-arrows-alt', 'fa-compress-arrows-alt');
            Utils.showToast('Editor maximized', 'info');
        } else {
            icon.classList.replace('fa-compress-arrows-alt', 'fa-expand-arrows-alt');
            Utils.showToast('Restored workspace', 'info');
        }

        Editor.updatePreview();
    },

    // Check if first time user
    checkFirstTimeUser() {
        const hasCompletedTutorial = localStorage.getItem('opticode_tutorial_complete');
        if (!hasCompletedTutorial) {
            this.showTutorial();
        }
    },

    // Show tutorial overlay
    showTutorial() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            this.resetTutorial();
            this.setupTutorialListeners();
        }
    },

    resetTutorial() {
        const steps = document.querySelectorAll('.tutorial-step');
        const dots = document.querySelectorAll('.tutorial-dots .dot');
        const nextBtn = document.getElementById('tutorial-next-btn');
        const finishBtn = document.getElementById('tutorial-finish-btn');
        this.tutorialStep = 1;

        steps.forEach((step, index) => step.classList.toggle('active', index === 0));
        dots.forEach((dot, index) => dot.classList.toggle('active', index === 0));
        nextBtn?.classList.remove('hidden');
        finishBtn?.classList.add('hidden');
    },

    // Setup tutorial step listeners
    setupTutorialListeners() {
        if (this.tutorialListenersBound) return;
        const overlay = document.getElementById('tutorial-overlay');
        const nextBtn = document.getElementById('tutorial-next-btn');
        const finishBtn = document.getElementById('tutorial-finish-btn');
        const steps = document.querySelectorAll('.tutorial-step');
        const dots = document.querySelectorAll('.tutorial-dots .dot');

        const updateStep = (stepNum) => {
            steps.forEach(s => s.classList.remove('active'));
            dots.forEach(d => d.classList.remove('active'));

            const activeStep = document.querySelector(`.tutorial-step[data-step="${stepNum}"]`);
            if (activeStep) activeStep.classList.add('active');
            if (dots[stepNum - 1]) dots[stepNum - 1].classList.add('active');

            if (stepNum === steps.length) {
                nextBtn.classList.add('hidden');
                finishBtn.classList.remove('hidden');
            } else {
                nextBtn.classList.remove('hidden');
                finishBtn.classList.add('hidden');
            }
        };

        nextBtn?.addEventListener('click', () => {
            if (this.tutorialStep < steps.length) {
                this.tutorialStep++;
            }
            updateStep(this.tutorialStep);
            Utils.playSound('sound-click');
        });

        finishBtn?.addEventListener('click', () => {
            overlay.classList.add('hidden');
            localStorage.setItem('opticode_tutorial_complete', 'true');
            Utils.playSound('sound-success');
            Utils.showToast('Tutorial complete! Have fun coding.', 'success');
        });
        this.tutorialListenersBound = true;
    },

    // Update user info display
    updateUserInfo() {
        const user = Auth.getCurrentUser();
        if (!user) return;

        document.getElementById('user-name').textContent = user.name;
        document.getElementById('user-plan').textContent = ENV.PLANS[user.plan || 'FREE'].name + ' Plan';

        const settingsPlan = document.getElementById('settings-plan');
        if (settingsPlan) {
            settingsPlan.textContent = ENV.PLANS[user.plan || 'FREE'].name;
        }

        // Hide Buy Premium button if user has a paid plan
        const buyPremiumBtn = document.getElementById('buy-premium-btn');
        if (buyPremiumBtn) {
            if (user.plan && user.plan !== 'FREE') {
                buyPremiumBtn.classList.add('hidden');
            } else {
                buyPremiumBtn.classList.remove('hidden');
            }
        }
    },

    // Update usage display
    updateUsageDisplay() {
        const info = Storage.getUsageInfo();
        const progress = document.getElementById('usage-progress');
        const text = document.getElementById('usage-text');

        if (progress) {
            const percentage = (info.used / info.limit) * 100;
            progress.style.width = `${Math.min(percentage, 100)}%`;

            // Change color based on usage
            if (percentage >= 90) {
                progress.style.background = 'var(--danger)';
            } else if (percentage >= 70) {
                progress.style.background = 'var(--warning)';
            } else {
                progress.style.background = 'linear-gradient(90deg, var(--primary), var(--secondary))';
            }
        }

        if (text) {
            const plan = Auth.getCurrentUser()?.plan || 'FREE';
            const monthlyCredits = ENV.PLANS[plan]?.monthlyCredits || 0;
            const planLabel = monthlyCredits > 0
                ? `${ENV.PLANS[plan]?.name || 'Free'} • ${monthlyCredits.toLocaleString()} monthly credits`
                : `${ENV.PLANS[plan]?.name || 'Free'} • ${ENV.PLANS[plan]?.dailyLimit || 5} credits/day`;
            text.textContent = `${planLabel} — ${info.used}/${info.limit} used${info.expiredFree ? ' (Free access expired)' : ''}`;
        }
    },

    // Load projects
    loadProjects() {
        this.refreshProjectLists();
    },

    refreshProjectLists() {
        const projects = Storage.getProjects();
        this.renderProjectList(projects);
        this.renderChatHistorySidebar(projects);
    },

    // Force user to pick a project when entering main app
    promptProjectSelection() {
        const projects = Storage.getProjects();
        const picker = document.getElementById('project-picker-modal');
        const list = document.getElementById('project-picker-list');

        if (!picker || !list) return;

        list.innerHTML = '';

        if (!projects || projects.length === 0) {
            picker.classList.remove('hidden');
            list.innerHTML = `<p class="text-muted">No projects yet. Create a new one to start coding.</p>`;
            return;
        }

        projects.forEach(project => {
            const item = document.createElement('div');
            item.className = 'project-picker-card';
            item.innerHTML = `
                <div class="info">
                    <span class="name">${project.name}</span>
                    <span class="meta">${new Date(project.updatedAt || project.createdAt || Date.now()).toLocaleString()}</span>
                </div>
                <button class="open-btn"><i class="fas fa-play"></i> Open</button>
            `;
            item.querySelector('.open-btn').addEventListener('click', () => {
                picker.classList.add('hidden');
                this.openProject(project.id);
            });
            list.appendChild(item);
        });

        picker.classList.remove('hidden');
    },

    // Render project list
    renderProjectList(projects) {
        const container = document.getElementById('project-list');
        if (!container) return;

        const sorted = [...(projects || [])].sort((a, b) => {
            const aTime = a.updatedAt || a.createdAt || 0;
            const bTime = b.updatedAt || b.createdAt || 0;
            return bTime - aTime;
        });

        container.innerHTML = sorted.map(project => `
            <div class="project-item ${this.currentProject?.id === project.id ? 'active' : ''}" 
                 data-project-id="${project.id}">
                <i class="fas fa-folder"></i>
                <span>${project.name}</span>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.project-item').forEach(item => {
            item.addEventListener('click', () => {
                this.openProject(item.dataset.projectId);
            });
        });
    },

    setChatHistoryOpen(open) {
        const shouldOpen = !!open;
        document.body.classList.toggle('history-open', shouldOpen);
        if (shouldOpen) {
            document.getElementById('chat-history-search')?.focus();
        }
    },

    toggleChatHistoryPanel() {
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
        if (isMobile) {
            this.setChatHistoryOpen(!document.body.classList.contains('history-open'));
            return;
        }

        document.body.classList.toggle('history-collapsed');
        if (!document.body.classList.contains('history-collapsed')) {
            document.getElementById('chat-history-search')?.focus();
        }
    },

    renderChatHistorySidebar(projects = Storage.getProjects()) {
        const container = document.getElementById('chat-history-list');
        if (!container) return;

        const query = (this.chatHistoryQuery || '').trim().toLowerCase();
        const now = new Date();

        const formatSidebarTime = (timestamp) => {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            const sameDay = date.toDateString() === now.toDateString();
            return sameDay
                ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        };

        const sanitizeSnippet = (text) => {
            const raw = (text || '').toString().replace(/\s+/g, ' ').trim();
            return raw.length > 140 ? `${raw.slice(0, 140)}…` : raw;
        };

        const enriched = (projects || []).map(project => {
            const history = Storage.getChatHistory(project.id);
            const last = history[history.length - 1] || null;
            const lastText = last?.content || project.description || '';
            const lastAt = last?.createdAt || last?.timestamp || project.updatedAt || project.createdAt || 0;
            return {
                project,
                lastText,
                lastAt
            };
        }).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));

        const filtered = query
            ? enriched.filter(({ project, lastText }) => {
                const name = (project?.name || '').toLowerCase();
                const snippet = (lastText || '').toLowerCase();
                return name.includes(query) || snippet.includes(query);
            })
            : enriched;

        if (filtered.length === 0) {
            container.innerHTML = `<div class="chat-history-empty">${query ? 'No chats match your search.' : 'No chats yet. Create a new chat to begin.'}</div>`;
            return;
        }

        container.innerHTML = filtered.map(({ project, lastText, lastAt }) => {
            const active = this.currentProject?.id === project.id ? 'active' : '';
            return `
                <div class="chat-history-item ${active}" data-project-id="${project.id}">
                    <div class="chat-history-row">
                        <div class="chat-history-name">${Utils.escapeHtml(project.name)}</div>
                        <div class="chat-history-time">${Utils.escapeHtml(formatSidebarTime(lastAt))}</div>
                    </div>
                    <div class="chat-history-snippet">${Utils.escapeHtml(sanitizeSnippet(lastText) || 'No messages yet')}</div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.chat-history-item').forEach(item => {
            item.addEventListener('click', () => {
                const projectId = item.dataset.projectId;
                if (!projectId) return;
                this.openProject(projectId);
                this.setChatHistoryOpen(false);
            });
        });
    },

    // Render file tree
    renderFileTree() {
        const container = document.getElementById('file-tree');
        if (!container || !this.currentProject) return;

        const files = this.currentProject.files || [];

        container.innerHTML = files.map(file => `
            <div class="file-item" data-file-id="${file.id}">
                <i class="${Utils.getFileIcon(file.name)}"></i>
                <span>${file.name}</span>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                const file = files.find(f => f.id === item.dataset.fileId);
                if (file) {
                    Editor.openFile(file);

                    // Update active state
                    container.querySelectorAll('.file-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                }
            });
        });
    },

    // Workspace views: preview / code / files (desktop only)
    setWorkspacePane(view = 'code') {
        const panes = {
            preview: document.getElementById('preview-panel'),
            code: document.getElementById('editor-panel'),
            files: document.getElementById('files-pane')
        };
        const tabs = document.querySelectorAll('.workspace-tab');

        Object.entries(panes).forEach(([key, pane]) => {
            if (!pane) return;
            pane.classList.toggle('hidden', key !== view);
        });

        tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.view === view));

        // Sync top bar toggle for backwards compatibility
        const viewButtons = document.querySelectorAll('#view-toggle .view-btn');
        viewButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
        const previewIcon = document.querySelector('#toggle-preview-btn i');
        if (previewIcon) {
            previewIcon.classList.toggle('fa-eye', view !== 'preview');
            previewIcon.classList.toggle('fa-eye-slash', view === 'preview');
        }

        if (view === 'preview') {
            Editor.updatePreview();
        }
    },

    // Two-state shortcut, now delegates to workspace panes
    setView(view = 'code') {
        this.setWorkspacePane(view);
    },

    // Show new project modal
    showNewProjectModal() {
        Utils.playSound('sound-click');
        const modal = document.getElementById('new-project-modal');
        modal.classList.remove('hidden');
        document.getElementById('project-name-input').focus();
    },

    // Create new project
    createProject() {
        const nameInput = document.getElementById('project-name-input');
        const descInput = document.getElementById('project-desc-input');

        const name = nameInput.value.trim();
        const description = descInput.value.trim();

        if (!name) {
            Utils.showToast('Please enter a project name', 'error');
            return;
        }

        const project = Storage.addProject({
            name,
            description,
            files: []
        });

        // Close modal
        document.getElementById('new-project-modal').classList.add('hidden');
        nameInput.value = '';
        descInput.value = '';

        // Open project
        this.openProject(project.id);

        Utils.showToast('Project created: ' + name, 'success');
    },

    // Delete current project
    deleteCurrentProject() {
        if (!this.currentProject) {
            Utils.showToast('No project selected', 'warning');
            return;
        }
        const confirmed = confirm(`Delete project "${this.currentProject.name}"? This cannot be undone.`);
        if (!confirmed) return;

        Storage.deleteProject(this.currentProject.id);
        this.currentProject = null;
        this.chatMessages = [];
        const projects = Storage.getProjects();
        this.renderProjectList(projects);
        this.renderChatHistorySidebar(projects);
        this.renderFileTree();
        Editor.clear();
        document.getElementById('breadcrumb').textContent = 'Welcome to Opticode';
        document.getElementById('welcome-panel').classList.remove('hidden');
        document.getElementById('coding-workspace').classList.add('hidden');
        Utils.showToast('Project deleted', 'success');
    },

    // Start new project (quick action)
    startNewProject() {
        Utils.playSound('sound-click');
        Utils.triggerHaptic('light');

        // Create default project
        const project = Storage.addProject({
            name: 'New Project',
            description: 'Created with Opticode',
            files: []
        });

        this.openProject(project.id);
    },

    // Open project
    openProject(projectId) {
        Utils.playSound('sound-click');

        const project = Storage.getProject(projectId);
        if (!project) {
            Utils.showToast('Project not found', 'error');
            return;
        }

        this.currentProject = project;
        document.getElementById('project-picker-modal')?.classList.add('hidden');

        // Update UI
        document.getElementById('welcome-panel').classList.add('hidden');
        document.getElementById('coding-workspace').classList.remove('hidden');
        document.getElementById('breadcrumb').textContent = project.name;

        // Load files
        this.renderFileTree();
        const projects = Storage.getProjects();
        this.renderProjectList(projects);
        this.renderChatHistorySidebar(projects);

        // Load chat history
        this.chatMessages = Storage.getChatHistory(projectId);
        this.renderChatHistory();

        // Clear editor
        Editor.clear();

        // Open first file if exists
        if (project.files && project.files.length > 0) {
            Editor.openFile(project.files[0]);
        }

    },

    // Send message to AI
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message || this.isProcessing) return;
        this.persistAPISettingsFromInputs();

        const effectiveMode = this.aiMode === 'PLAN_BUILD' ? 'PLAN_BUILD' : 'CODE_FAST';
        const isChatResponse = false;
        const generationCost = this.getThinkingConfig(this.thinkingLevel).credits;

        // Show task time estimate (skip heavy messaging for chat-only)
        const mins = isChatResponse ? 0.5 : Utils.estimateTaskMinutes(message);
        if (!isChatResponse) {
            Utils.showToast(`Estimated time to code: ~${Math.max(1, Math.round(mins))} min${mins > 1 ? 's' : ''}`, 'info', 2500);
        }

        const thinkingConfig = this.getThinkingConfig(this.thinkingLevel);

        // Check usage limit
        const requiredCredits = generationCost;
        if (!Storage.canMakeRequest(requiredCredits)) {
            const info = Storage.getUsageInfo(requiredCredits);
            if (info.expiredFree) {
                Utils.showToast('Free access ended after 2 days. Please upgrade to continue.', 'error');
            } else {
                Utils.showToast(`Not enough credits (${info.used}/${info.limit} used). Need ${requiredCredits} credit${requiredCredits > 1 ? 's' : ''} for this mode.`, 'warning');
            }
            return;
        }

        Utils.playSound('sound-click');
        Utils.triggerHaptic('light');

        // Clear input
        input.value = '';
        Utils.autoResizeTextarea(input, 200);

        // Add user message to chat
        const userMessage = {
            role: 'user',
            content: message,
            createdAt: Date.now()
        };
        this.addMessageToChat(userMessage);

        // Save to history
        if (this.currentProject) {
            Storage.addChatMessage(this.currentProject.id, userMessage);
            this.refreshProjectLists();
        }

        this.isProcessing = true;
        this.startTaskClock(mins, effectiveMode === 'PLAN_BUILD' ? 'Planning' : (isChatResponse ? 'Chatting' : 'Generating'));

        try {
            // Get selected model
            const modelSelect = document.getElementById('model-select');
            const selectedModel = modelSelect?.value || (ENV.DEFAULT_MODEL || 'OPTICHAIN_THINKING_15');
            const model = ENV.MODELS[selectedModel] ? selectedModel : (ENV.DEFAULT_MODEL || 'OPTICHAIN_THINKING_15');
            Storage.updateSetting('defaultModel', model);
            const defaultModelSelect = document.getElementById('default-model-select');
            if (defaultModelSelect) {
                defaultModelSelect.value = model;
            }
            this.updateModelTierBadge(model);

            // Build context from previous messages (exclude the current user message)
            const context = this.chatMessages.slice(0, -1).slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));

            // Call AI with selected mode
            let fullResponse = '';
            let responseDiv = null;
            const finalMessage = this.buildPromptForThinking(message, thinkingConfig);

            if (effectiveMode === 'PLAN_BUILD') {
                this.setTaskPhase('Planning');
                const planningModel = model === 'OPTICHAIN_THINKING_15' ? model : 'OPTICHAIN_THINKING_15';
                const plan = await AI.generatePlan(finalMessage, context, planningModel);

                this.setTaskPhase('Building');
                responseDiv = this.createAssistantMessageElement();
                await AI.generateCodeFromPlan(
                    finalMessage,
                    plan,
                    context,
                    model,
                    { usageCost: generationCost, fallback: 'none' },
                    (chunk, accumulated) => {
                        fullResponse = accumulated;
                        this.updateAssistantMessage(responseDiv, accumulated);
                    }
                );
            } else {
                this.setTaskPhase('Generating');
                responseDiv = this.createAssistantMessageElement();
                await AI.generateCode(
                    finalMessage,
                    context,
                    model,
                    { usageCost: generationCost, fallback: 'none' },
                    (chunk, accumulated) => {
                        fullResponse = accumulated;
                        this.updateAssistantMessage(responseDiv, accumulated);
                    }
                );
            }

            if (this.looksLikeChecklistReply(fullResponse)) {
                this.setTaskPhase('Refining');
                await AI.generateCode(
                    `${message}\n\nReturn complete runnable code now. Do not return any checklist or plan text.`,
                    context,
                    model,
                    { countUsage: false, fallback: 'none' },
                    (chunk, accumulated) => {
                        fullResponse = accumulated;
                        this.updateAssistantMessage(responseDiv, accumulated);
                    }
                );
            }

            // Save assistant response
            const assistantMessage = {
                role: 'assistant',
                content: fullResponse,
                createdAt: Date.now()
            };
            // Ensure user gets runnable code even if AI returned plain text
            if (Utils.extractCode(fullResponse).length === 0) {
                const scaffold = Utils.quickScaffold(message);
                fullResponse += `\n\n\`\`\`html\n${scaffold.html}\n\`\`\`\n\`\`\`css\n${scaffold.css}\n\`\`\`\n\`\`\`javascript\n${scaffold.js}\n\`\`\`\n`;
                if (responseDiv) {
                    this.updateAssistantMessage(responseDiv, fullResponse);
                }
                assistantMessage.content = fullResponse;
            }
            this.chatMessages.push(assistantMessage);

            if (this.currentProject) {
                Storage.addChatMessage(this.currentProject.id, assistantMessage);
                this.refreshProjectLists();
            }

            // Update usage display
            this.updateUsageDisplay();

            // Extract and set code only in build/code modes
            Editor.setCodeFromResponse(fullResponse);

            // Show summary of what was created
            this.showCodeCreatedSummary(message, fullResponse);

            this.setWorkspacePane('preview');

            Utils.triggerHaptic('success');
            this.stopTaskClock(true);

        } catch (error) {
            this.stopTaskClock(false);
            Utils.showToast(error.message || 'Failed to generate response', 'error');
            Utils.triggerHaptic('error');
        } finally {
            this.isProcessing = false;
        }
    },

    // Edit current code with AI - allows iterating on code multiple times
    async editCodeWithAI() {
        const codeEditor = document.getElementById('code-editor');
        const currentCode = codeEditor?.value || '';

        if (!currentCode.trim()) {
            Utils.showToast('No code to edit. Generate some code first!', 'warning');
            return;
        }

        const instructions = prompt('What changes would you like to make to this code?');
        if (!instructions || !instructions.trim()) return;

        // Construct the edit message
        const editMessage = `Please modify the following code based on these instructions: "${instructions}"

Here is the current code:
\`\`\`${Editor.currentFile?.language || 'html'}
${currentCode}
\`\`\`

Please provide the complete updated code with the requested changes.`;

        // Set the message in the chat input and send it
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.value = editMessage;
            await this.sendMessage();
        }
    },

    getMessageRoleLabel(role) {
        if (role === 'user') return 'You';
        if (role === 'assistant') return 'Optichain';
        return 'System';
    },

    formatMessageTimestamp(timestamp = Date.now()) {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    renderMessageInner(message, { streaming = false } = {}) {
        const isUser = message.role === 'user';
        const icon = isUser ? 'fa-user' : 'fa-robot';
        const messageTime = message.createdAt || message.timestamp || Date.now();
        const body = streaming
            ? '<span class="streaming-cursor">|</span>'
            : this.formatMessageContent(message.content || '');

        return `
            <div class="message-avatar">
                <i class="fas ${icon}"></i>
            </div>
            <div class="message-content">
                <div class="message-meta">
                    <span class="message-role">${this.getMessageRoleLabel(message.role)}</span>
                    <span class="message-time">${this.formatMessageTimestamp(messageTime)}</span>
                </div>
                <div class="message-text">
                    ${body}
                    ${message.imageData ? `<img src="${message.imageData}" alt="attachment" class="chat-image">` : ''}
                </div>
            </div>
        `;
    },

    // Add message to chat display
    addMessageToChat(message) {
        this.chatMessages.push(message);

        const container = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role} animate-slide-up`;
        messageDiv.innerHTML = this.renderMessageInner(message);

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    },

    // Create assistant message element for streaming
    createAssistantMessageElement() {
        const container = document.getElementById('chat-messages');

        // Remove typing indicator
        this.hideTypingIndicator();

        const message = {
            role: 'assistant',
            content: '',
            createdAt: Date.now()
        };
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant animate-slide-up';
        messageDiv.innerHTML = this.renderMessageInner(message, { streaming: true });

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;

        return messageDiv;
    },

    // Update assistant message during streaming
    updateAssistantMessage(messageDiv, content) {
        // Throttle DOM writes to avoid flashing during streaming
        // Use a 50ms debounce to batch rapid updates
        this.streamingBuffer = { messageDiv, content };

        if (this.streamingDebounceTimeout) {
            clearTimeout(this.streamingDebounceTimeout);
        }

        this.streamingDebounceTimeout = setTimeout(() => {
            const payload = this.streamingBuffer;
            this.streamingDebounceTimeout = null;
            if (!payload) return;

            const { messageDiv, content } = payload;
            const contentDiv = messageDiv.querySelector('.message-text');
            if (contentDiv) {
                // Use requestAnimationFrame for smooth rendering
                requestAnimationFrame(() => {
                    contentDiv.innerHTML = this.formatMessageContent(content) + '<span class="streaming-cursor">|</span>';
                    const container = document.getElementById('chat-messages');
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                });
            }
        }, 50);
    },

    // Show a summary of what code was created after generation completes
    showCodeCreatedSummary(userPrompt, aiResponse) {
        // Extract what was created from the response
        const codeBlocks = Utils.extractCode(aiResponse);
        if (codeBlocks.length === 0) return;

        // Analyze what was created
        const hasHtml = codeBlocks.some(b => b.language === 'html');
        const hasCss = codeBlocks.some(b => b.language === 'css');
        const hasJs = codeBlocks.some(b => b.language === 'javascript' || b.language === 'js');

        // Build summary based on user prompt and files created
        const fileTypes = [];
        if (hasHtml) fileTypes.push('HTML');
        if (hasCss) fileTypes.push('CSS');
        if (hasJs) fileTypes.push('JavaScript');

        // Create a brief summary message
        const filesText = fileTypes.length > 0 ? fileTypes.join(', ') : 'code';
        const promptPreview = userPrompt.length > 50 ? userPrompt.substring(0, 50) + '...' : userPrompt;

        const summaryHtml = `
            <div class="code-summary-card animate-fade-in">
                <div class="summary-header">
                    <i class="fas fa-check-circle"></i>
                    <span>Code Generated Successfully!</span>
                </div>
                <div class="summary-body">
                    <p><strong>Request:</strong> ${Utils.escapeHtml(promptPreview)}</p>
                    <p><strong>Created:</strong> ${filesText} files</p>
                    <p class="summary-tip"><i class="fas fa-lightbulb"></i> You can now edit the code in the editor panel on the right, or ask me to make changes!</p>
                </div>
            </div>
        `;

        const container = document.getElementById('chat-messages');
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'message system animate-slide-up';
        summaryDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-info-circle"></i>
            </div>
            <div class="message-content">
                ${summaryHtml}
            </div>
        `;

        container.appendChild(summaryDiv);
        container.scrollTop = container.scrollHeight;
    },

    looksLikeChecklistReply(text = '') {
        const normalized = text.toLowerCase();
        if (normalized.includes('implementation plan') || normalized.includes('todo') || normalized.includes('to-do')) {
            return true;
        }
        const bulletLike = text.split('\n').filter(line => /^\s*(?:\d+[.)]|[-*])\s+/.test(line)).length;
        return bulletLike >= 4 && Utils.extractCode(text).length === 0;
    },

    // Format message content (convert markdown, code blocks, etc.)
    formatMessageContent(content) {
        const blocks = [];
        const masked = content.replace(/```([^\n`]*)\n([\s\S]*?)```/g, (match, header, code) => {
            const token = (header || '').trim().split(/\s+/).filter(Boolean)[0] || '';
            const lang = token.includes('.') ? Utils.getLanguage(token) : token;
            const key = `@@CODE_BLOCK_${blocks.length}@@`;
            blocks.push(`<pre class="code-block" data-lang="${lang || 'code'}"><code>${Utils.escapeHtml(code.trim())}</code></pre>`);
            return key;
        });

        let formatted = Utils.escapeHtml(masked);
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/\n/g, '<br>');
        blocks.forEach((html, i) => {
            formatted = formatted.replace(`@@CODE_BLOCK_${i}@@`, html);
        });

        return formatted;
    },

    // Show typing indicator
    showTypingIndicator() {
        const container = document.getElementById('chat-messages');

        const indicator = document.createElement('div');
        indicator.className = 'message assistant';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-meta">
                    <span class="message-role">Optichain</span>
                    <span class="message-time">${this.formatMessageTimestamp(Date.now())}</span>
                </div>
                <div class="message-text">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(indicator);
        container.scrollTop = container.scrollHeight;
    },

    // Hide typing indicator
    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    },

    // Render chat history
    renderChatHistory() {
        const container = document.getElementById('chat-messages');
        const intro = {
            role: 'assistant',
            content: "Hello! I'm Optichain, your AI coding assistant. Describe what you want to build and I'll help you create it!",
            createdAt: Date.now()
        };
        container.innerHTML = `<div class="message assistant">${this.renderMessageInner(intro)}</div>`;

        this.chatMessages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.role}`;
            messageDiv.innerHTML = this.renderMessageInner(msg);
            container.appendChild(messageDiv);
        });

        container.scrollTop = container.scrollHeight;
    },

    // Clear chat
    clearChat() {
        Utils.playSound('sound-click');

        if (this.currentProject) {
            Storage.clearChatHistory(this.currentProject.id);
            this.refreshProjectLists();
        }

        this.chatMessages = [];
        this.latestImageInspirationName = '';
        this.renderChatHistory();

        Utils.showToast('Chat cleared', 'info');
    },

    // Toggle voice input
    toggleVoiceInput() {
        // Voice input now handled by ChatEnhanced module (no plan gate)
        if (typeof ChatEnhanced !== 'undefined') {
            ChatEnhanced.openVoiceOverlay();
            return;
        }

        const btn = document.getElementById('voice-input-btn');

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            Utils.showToast('Voice input not supported in this browser', 'warning');
            return;
        }

        if (btn.classList.contains('recording')) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    },

    // Start voice input
    startVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        // Support both English and Bangla based on settings
        const settings = Storage.getSettings();
        this.recognition.lang = settings.language === 'bn' ? 'bn-BD' : 'en-US';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;

        const btn = document.getElementById('voice-input-btn');
        const input = document.getElementById('chat-input');

        btn.classList.add('recording');
        Utils.triggerHaptic('medium');

        this.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            input.value = transcript;
            Utils.autoResizeTextarea(input, 200);
        };

        this.recognition.onerror = (event) => {
            Utils.showToast('Voice recognition error: ' + event.error, 'error');
            this.stopVoiceInput();
        };

        this.recognition.onend = () => {
            this.stopVoiceInput();
        };

        this.recognition.start();
        Utils.showToast('Listening...', 'info');
    },

    // Stop voice input
    stopVoiceInput() {
        const btn = document.getElementById('voice-input-btn');
        btn.classList.remove('recording');

        if (this.recognition) {
            this.recognition.stop();
            this.recognition = null;
        }
    },

    applyThemeClass(theme) {
        const classes = Array.from(document.body.classList).filter(c => !c.startsWith('theme-'));
        document.body.className = [...classes, `theme-${theme}`].join(' ').trim();
    },

    updateThemeOptionSelection(theme) {
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === theme);
        });
    },

    applyUIScale(size = 'normal') {
        const allowed = ['small', 'normal', 'large'];
        const value = allowed.includes(size) ? size : 'normal';
        document.body.classList.remove('ui-scale-small', 'ui-scale-normal', 'ui-scale-large');
        document.body.classList.add(`ui-scale-${value}`);
    },

    // Change theme
    changeTheme(theme) {
        Utils.playSound('sound-click');
        this.applyThemeClass(theme);
        Storage.updateSetting('theme', theme);
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect && themeSelect.value !== theme) {
            themeSelect.value = theme;
        }
        this.updateThemeOptionSelection(theme);
        this.closeModal('theme-modal');
        Utils.showToast(`Theme changed to ${theme}`, 'success');
    },

    updateModelTierBadge(modelKey = (ENV.DEFAULT_MODEL || 'OPTICHAIN_THINKING_15')) {
        const badge = document.getElementById('model-tier-pill');
        if (!badge) return;

        badge.classList.remove('power', 'research', 'balanced', 'ultimate');

        if (modelKey === 'OPTICHAIN_600B') {
            badge.textContent = '600B Ultimate';
            badge.classList.add('ultimate');
            return;
        }

        if (modelKey === 'EXAKIO_SONE') {
            badge.textContent = 'Web Research';
            badge.classList.add('research');
            return;
        }

        if (modelKey === 'OPTICHAIN_THINKING_15') {
            badge.textContent = 'Deep Reasoning';
            badge.classList.add('balanced');
            return;
        }

        if (modelKey === 'OPTICHAIN_PRO') {
            badge.textContent = 'Fast Build';
            badge.classList.add('power');
            return;
        }

        badge.textContent = 'AI Ready';
        badge.classList.add('balanced');
    },

    applyLayoutMode(mode = 'codex', options = {}) {
        const { persist = true, silent = false } = options;
        const nextMode = 'codex';
        this.layoutMode = nextMode;

        document.body.classList.remove('layout-chatbot');
        document.body.classList.add('layout-codex');
        document.body.classList.remove('history-open', 'history-collapsed');

        const suggestions = document.getElementById('input-suggestions');
        if (suggestions) {
            suggestions.classList.add('hidden');
        }

        this.setChatHistoryOpen(false);
        this.setAIStatus('Idle', 'idle');

        this.applyAIModeUI();

        if (persist) {
            Storage.updateSetting('layoutMode', nextMode);
        }

        if (!silent) {
            Utils.showToast('Switched to codex layout', 'info');
        }
    },

    // Change layout
    changeLayout(layout, options = {}) {
        if (layout === 'codex' || layout === 'chatbot') {
            this.applyLayoutMode(layout, options);
            return;
        }

        const { persist = true, silent = false } = options;
        if (!silent) {
            Utils.playSound('sound-click');
        }

        // Desktop layout: simply switch pane emphasis
        const shouldShowPreview = layout === 'preview';
        this.setWorkspacePane(shouldShowPreview ? 'preview' : 'code');

        if (persist) {
            Storage.updateSetting('layout', layout);
        }
        // layout modal removed
    },

    // Show settings modal
    showSettingsModal() {
        Utils.playSound('sound-click');
        document.getElementById('settings-modal').classList.remove('hidden');
    },

    // Show theme modal
    showThemeModal() {
        Utils.playSound('sound-click');
        const theme = Storage.getSettings().theme || 'cozy';
        this.updateThemeOptionSelection(theme);
        document.getElementById('theme-modal').classList.remove('hidden');
    },

    // Close modal
    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    },

    // Export all projects
    exportAllProjects() {
        Utils.playSound('sound-click');

        const data = Storage.exportAllData();
        Utils.downloadFile(data, 'opticode-backup.json', 'application/json');

        Utils.showToast('Backup downloaded', 'success');
    },

    // Show chat history in a quick modal
    showHistory() {
        if (!this.currentProject) {
            Utils.showToast('Open a project to view history', 'warning');
            return;
        }
        const history = Storage.getChatHistory(this.currentProject.id);
        const formatted = history.map(msg => `${msg.role === 'user' ? '🧑' : '🤖'} ${msg.content}`).join('\n\n');
        alert(formatted || 'No history yet for this project.');
    },

    // Session timer
    startSessionTimer() {
        const timerEl = document.getElementById('session-timer');
        const tick = () => {
            const diff = Date.now() - this.sessionStart;
            const hrs = Math.floor(diff / 3600000).toString().padStart(2, '0');
            const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
            const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            if (timerEl) timerEl.textContent = `${hrs}:${mins}:${secs}`;
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    },

    // Import project
    importProject() {
        Utils.playSound('sound-click');

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const result = Storage.importProject(event.target.result);

                if (result.success) {
                    Utils.showToast('Project imported successfully', 'success');
                    this.loadProjects();

                    if (result.project) {
                        this.openProject(result.project.id);
                    }
                } else {
                    Utils.showToast(result.message, 'error');
                }
            };
            reader.readAsText(file);
        };

        input.click();
    },

    // ==================== ACTIVITY BAR ====================
    setupActivityBar() {
        document.querySelectorAll('.activity-icon[data-panel]').forEach(btn => {
            btn.addEventListener('click', () => {
                const panel = btn.dataset.panel;
                this.handleActivityPanel(panel);
                document.querySelectorAll('.activity-icon[data-panel]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    },

    handleActivityPanel(panel) {
        switch (panel) {
            case 'code':
                this.setWorkspacePane('code');
                break;
            case 'chat':
                // Focus the chat input
                const chatInput = document.getElementById('chat-input');
                if (chatInput) chatInput.focus();
                break;
            case 'chat-research':
                this.openChatResearch();
                break;
            case 'files':
                this.setWorkspacePane('files');
                break;
            case 'todo':
                this.toggleTodoPanel();
                break;
        }
    },

    // ==================== CHAT & RESEARCH MODE ====================
    researchMode: 'chat',
    researchMessages: [],

    setupChatResearch() {
        // Open research button
        document.getElementById('open-research-btn')?.addEventListener('click', () => {
            this.openChatResearch();
        });

        // Close research button
        document.getElementById('close-research-btn')?.addEventListener('click', () => {
            this.closeChatResearch();
        });

        // Research mode buttons
        document.querySelectorAll('.research-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.research-mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.researchMode = btn.dataset.rmode;
            });
        });

        // Research send
        document.getElementById('research-send-btn')?.addEventListener('click', () => {
            this.sendResearchMessage();
        });

        // Research input enter
        const researchInput = document.getElementById('research-input');
        if (researchInput) {
            researchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendResearchMessage();
                }
            });
            researchInput.addEventListener('input', () => {
                Utils.autoResizeTextarea(researchInput, 120);
            });
        }

        // Research suggestion chips
        document.querySelectorAll('.research-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const input = document.getElementById('research-input');
                if (input) {
                    input.value = chip.dataset.prompt;
                    input.focus();
                }
            });
        });
    },

    openChatResearch() {
        Utils.playSound('sound-click');
        document.getElementById('research-window')?.classList.remove('hidden');
    },

    closeChatResearch() {
        document.getElementById('research-window')?.classList.add('hidden');
    },

    async sendResearchMessage() {
        const input = document.getElementById('research-input');
        const message = input?.value?.trim();
        if (!message) return;

        const cost = ENV.CHAT_RESEARCH_COST || 50;

        // Check credits
        if (!Storage.canMakeRequest(cost)) {
            Utils.showToast(`Not enough credits. Chat & Research costs ${cost} credits per request.`, 'warning');
            return;
        }

        // Clear input
        input.value = '';

        // Hide welcome
        const welcome = document.querySelector('.research-welcome');
        if (welcome) welcome.style.display = 'none';

        // Add user message to UI
        const messagesContainer = document.getElementById('research-messages');
        this.addResearchMessage(messagesContainer, 'user', message);

        // Add loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'research-msg assistant loading';
        loadingDiv.innerHTML = '<div class="research-msg-avatar"><i class="fas fa-robot"></i></div><div class="research-msg-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
        messagesContainer.appendChild(loadingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const context = this.researchMessages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await AI.chatResearch(message, this.researchMode, context);

            // Remove loading
            loadingDiv.remove();

            // Add response
            this.addResearchMessage(messagesContainer, 'assistant', response);

            // Store messages
            this.researchMessages.push(
                { role: 'user', content: message },
                { role: 'assistant', content: response }
            );

            this.updateUsageDisplay();

        } catch (error) {
            loadingDiv.remove();
            this.addResearchMessage(messagesContainer, 'assistant', `Error: ${error.message}`);
        }
    },

    addResearchMessage(container, role, content) {
        const div = document.createElement('div');
        div.className = `research-msg ${role}`;

        const avatar = role === 'user'
            ? '<i class="fas fa-user"></i>'
            : '<i class="fas fa-robot"></i>';

        // Simple markdown rendering
        let rendered = content
            .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');

        div.innerHTML = `
            <div class="research-msg-avatar">${avatar}</div>
            <div class="research-msg-content">${rendered}</div>
        `;

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    // ==================== TODO LIST FEATURE ====================
    todoItems: [],
    todoVisible: false,

    setupTodoFeature() {
        document.getElementById('close-todo-panel')?.addEventListener('click', () => {
            this.toggleTodoPanel();
        });
    },

    toggleTodoPanel() {
        const panel = document.getElementById('todo-panel');
        if (!panel) return;
        this.todoVisible = !this.todoVisible;
        panel.classList.toggle('hidden', !this.todoVisible);
    },

    // Check if prompt is large enough to need a todo list
    isLargePrompt(message) {
        return message.length > 200 || message.split('\n').length > 5;
    },

    async generateAndShowTodoList(message) {
        try {
            const tasks = await AI.generateTodoList(message);
            this.todoItems = tasks.map((t, i) => ({
                id: i,
                text: t.task,
                priority: t.priority || 'medium',
                status: 'pending'
            }));

            this.renderTodoList();

            // Show todo panel
            const panel = document.getElementById('todo-panel');
            if (panel) {
                panel.classList.remove('hidden');
                this.todoVisible = true;
            }
        } catch (e) {
            console.warn('Could not generate todo list:', e);
        }
    },

    renderTodoList() {
        const container = document.getElementById('todo-items');
        if (!container) return;

        container.innerHTML = this.todoItems.map(item => `
            <div class="todo-item ${item.status}" data-id="${item.id}">
                <button class="todo-check" title="Toggle status">
                    <i class="fas ${item.status === 'completed' ? 'fa-check-circle' : item.status === 'in_progress' ? 'fa-spinner fa-spin' : 'fa-circle'}"></i>
                </button>
                <span class="todo-text">${item.text}</span>
                <span class="todo-priority ${item.priority}">${item.priority}</span>
            </div>
        `).join('');

        // Click handlers
        container.querySelectorAll('.todo-check').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.closest('.todo-item').dataset.id);
                this.cycleTodoStatus(id);
            });
        });
    },

    cycleTodoStatus(id) {
        const item = this.todoItems.find(t => t.id === id);
        if (!item) return;

        const states = ['pending', 'in_progress', 'completed'];
        const currentIndex = states.indexOf(item.status);
        item.status = states[(currentIndex + 1) % states.length];

        this.renderTodoList();
    },

    markTodoCompleted(index) {
        if (this.todoItems[index]) {
            this.todoItems[index].status = 'completed';
            this.renderTodoList();
        }
    },

    markTodoInProgress(index) {
        if (this.todoItems[index]) {
            this.todoItems[index].status = 'in_progress';
            this.renderTodoList();
        }
    },

    // ==================== LANGUAGE TOGGLE ====================
    setupLanguageToggle() {
        document.getElementById('lang-toggle-btn')?.addEventListener('click', () => {
            if (typeof I18n !== 'undefined') {
                I18n.toggle();
                const lang = I18n.currentLang === 'bn' ? 'বাংলা' : 'English';
                Utils.showToast(`Language: ${lang}`, 'info');
            }
        });

        document.getElementById('language-select')?.addEventListener('change', (e) => {
            if (typeof I18n !== 'undefined') {
                I18n.setLanguage(e.target.value);
                const lang = e.target.value === 'bn' ? 'বাংলা' : 'English';
                Utils.showToast(`Language: ${lang}`, 'info');
            }
        });
    },

    // ==================== SMART EDITING ====================
    // Override sendMessage to support smart editing and todo list
    _originalSendMessage: null
};

// Monkey-patch sendMessage to add smart edit + todo list logic
(function () {
    const originalSendMessage = App.sendMessage;

    App.sendMessage = async function () {
        const input = document.getElementById('chat-input');
        const message = input?.value?.trim();

        if (!message || this.isProcessing) return;

        // Check if this is a large prompt and generate todo list
        if (this.isLargePrompt(message)) {
            this.generateAndShowTodoList(message);
        }

        // Check if this looks like an edit request and we have existing code
        const codeEditor = document.getElementById('code-editor');
        const currentCode = codeEditor?.value || '';
        const editKeywords = /\b(edit|change|modify|fix|update|replace|add|remove|delete|rename|move|tweak|adjust|make it|convert)\b/i;
        const isEditRequest = editKeywords.test(message) && currentCode.trim().length > 50;

        if (isEditRequest) {
            // Use smart editing mode
            this.persistAPISettingsFromInputs();

            const generationCost = this.getThinkingConfig(this.thinkingLevel).credits;

            if (!Storage.canMakeRequest(generationCost)) {
                const info = Storage.getUsageInfo(generationCost);
                Utils.showToast(`Not enough credits (${info.used}/${info.limit} used).`, 'warning');
                return;
            }

            Utils.playSound('sound-click');
            input.value = '';
            Utils.autoResizeTextarea(input, 200);

            const userMessage = { role: 'user', content: message, createdAt: Date.now() };
            this.addMessageToChat(userMessage);
            if (this.currentProject) {
                Storage.addChatMessage(this.currentProject.id, userMessage);
            }

            this.isProcessing = true;
            this.startTaskClock(1, 'Smart Editing');

            try {
                const modelSelect = document.getElementById('model-select');
                const selectedModel = modelSelect?.value || (ENV.DEFAULT_MODEL || 'OPTICHAIN_THINKING_15');
                const model = ENV.MODELS[selectedModel] ? selectedModel : (ENV.DEFAULT_MODEL || 'OPTICHAIN_THINKING_15');

                const context = this.chatMessages.slice(0, -1).slice(-6).map(m => ({
                    role: m.role,
                    content: m.content
                }));

                const responseDiv = this.createAssistantMessageElement();
                let fullResponse = '';

                await AI.smartEdit(message, currentCode, context, model, (chunk, accumulated) => {
                    fullResponse = accumulated;
                    this.updateAssistantMessage(responseDiv, accumulated);
                });

                // Try to apply edits
                const edits = AI.parseEditBlocks(fullResponse);
                if (edits.length > 0) {
                    const updatedCode = AI.applyEdits(currentCode, edits);
                    if (codeEditor) {
                        codeEditor.value = updatedCode;
                        Editor.handleCodeChange();
                    }
                    Utils.showToast(`Applied ${edits.length} smart edit(s)`, 'success');
                } else {
                    // Fallback: try full code extraction
                    Editor.setCodeFromResponse(fullResponse);
                }

                const assistantMessage = { role: 'assistant', content: fullResponse, createdAt: Date.now() };
                this.chatMessages.push(assistantMessage);
                if (this.currentProject) {
                    Storage.addChatMessage(this.currentProject.id, assistantMessage);
                }

                this.updateUsageDisplay();
                this.stopTaskClock(true);
                Utils.triggerHaptic('success');

            } catch (error) {
                this.stopTaskClock(false);
                Utils.showToast(error.message || 'Smart edit failed', 'error');
            } finally {
                this.isProcessing = false;
            }
            return;
        }

        // Otherwise, use the original sendMessage
        return originalSendMessage.call(this);
    };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Make App global
window.App = App;
