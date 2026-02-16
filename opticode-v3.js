// Opticode v3.0 - Enhanced Features Module
// Made by Cozytustudios
// Adds: Chatbot/Code mode switch, Extra Thinking (100 credits), 
// Voice mode overlay, Image attach in chat, AI fixes, UI polish

const OpticodeV3 = {
    currentChatMode: 'code', // 'chatbot' or 'code'
    extraThinkingEnabled: false,
    voiceOverlay: null,
    voiceLang: 'en-US',
    recognition: null,
    voiceTranscript: '',
    attachedImageData: null,
    chatbotHistory: [],

    init() {
        this.setupModeSwitcher();
        this.setupExtraThinking();
        this.setupVoiceMode();
        this.setupImageAttach();
        this.fixAIIntegration();
        this.patchSendMessage();
        this.enhanceUI();
        console.log('✨ Opticode v3.0 module loaded');
    },

    // ==================== MODE SWITCHER ====================
    setupModeSwitcher() {
        const switcher = document.getElementById('chat-mode-switcher');
        if (!switcher) return;

        switcher.querySelectorAll('.chat-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.chatmode;
                this.switchMode(mode);
            });
        });
    },

    switchMode(mode) {
        this.currentChatMode = mode;
        
        // Update button states
        document.querySelectorAll('.chat-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.chatmode === mode);
        });

        // Show/hide extra thinking toggle
        const extraThinkingEl = document.getElementById('extra-thinking-toggle');
        if (extraThinkingEl) {
            if (mode === 'chatbot') {
                extraThinkingEl.classList.remove('hidden');
            } else {
                extraThinkingEl.classList.add('hidden');
                this.extraThinkingEnabled = false;
                extraThinkingEl.classList.remove('active');
                const check = document.getElementById('extra-thinking-check');
                if (check) check.innerHTML = '<i class="fas fa-check"></i>';
            }
        }

        // Show/hide code-specific controls
        const modeToggleBtn = document.getElementById('mode-toggle-btn');
        const thinkingSelector = document.querySelector('.thinking-selector');
        const creditPill = document.getElementById('thinking-credit-pill');
        const previewBtn = document.getElementById('preview-quick-btn');

        if (mode === 'chatbot') {
            // Hide code-specific controls
            if (modeToggleBtn) modeToggleBtn.style.display = 'none';
            if (thinkingSelector) thinkingSelector.style.display = 'none';
            if (previewBtn) previewBtn.style.display = 'none';
            if (creditPill) {
                creditPill.textContent = this.extraThinkingEnabled ? 'Cost: 100 credits' : 'Cost: 1 credit';
                creditPill.style.display = '';
            }

            // Update placeholder
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.placeholder = 'Ask me anything... I can help with questions, explanations, and more';
            }
        } else {
            // Show code controls
            if (modeToggleBtn) modeToggleBtn.style.display = '';
            if (thinkingSelector) thinkingSelector.style.display = '';
            if (previewBtn) previewBtn.style.display = '';
            
            // Restore code mode placeholder and credit pill
            if (typeof App !== 'undefined') {
                App.applyAIModeUI();
                App.applyThinkingUI();
            }
        }
    },

    // ==================== EXTRA THINKING ====================
    setupExtraThinking() {
        const toggle = document.getElementById('extra-thinking-toggle');
        if (!toggle) return;

        toggle.addEventListener('click', () => {
            this.extraThinkingEnabled = !this.extraThinkingEnabled;
            toggle.classList.toggle('active', this.extraThinkingEnabled);
            
            const creditPill = document.getElementById('thinking-credit-pill');
            if (creditPill) {
                creditPill.textContent = this.extraThinkingEnabled ? 'Cost: 100 credits' : 'Cost: 1 credit';
            }
        });
    },

    // ==================== VOICE MODE ====================
    setupVoiceMode() {
        // Override App.toggleVoiceInput to use our enhanced voice overlay
        if (typeof App !== 'undefined') {
            App.toggleVoiceInput = () => {
                this.showVoiceOverlay();
            };
        }
    },

    showVoiceOverlay() {
        // Check for speech recognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            if (typeof Utils !== 'undefined') {
                Utils.showToast('Voice input is not supported in your browser. Try Chrome.', 'warning');
            }
            return;
        }

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'voice-overlay';
        overlay.id = 'voice-overlay';
        overlay.innerHTML = `
            <div class="voice-visual">
                <i class="fas fa-microphone"></i>
            </div>
            <div class="voice-status">Tap to start listening</div>
            <div class="voice-transcript" id="voice-transcript-text">...</div>
            <div class="voice-lang-toggle">
                <button class="voice-lang-btn ${this.voiceLang === 'en-US' ? 'active' : ''}" data-lang="en-US">🇺🇸 English</button>
                <button class="voice-lang-btn ${this.voiceLang === 'bn-BD' ? 'active' : ''}" data-lang="bn-BD">🇧🇩 বাংলা</button>
            </div>
            <div class="voice-actions">
                <button class="voice-action-btn voice-cancel-btn" id="voice-cancel-btn">Cancel</button>
                <button class="voice-action-btn voice-send-btn" id="voice-send-btn" disabled>Send</button>
            </div>
        `;

        document.body.appendChild(overlay);
        this.voiceOverlay = overlay;
        this.voiceTranscript = '';

        // Setup language buttons
        overlay.querySelectorAll('.voice-lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.voiceLang = btn.dataset.lang;
                overlay.querySelectorAll('.voice-lang-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Restart recognition with new language
                if (this.recognition) {
                    this.recognition.stop();
                    setTimeout(() => this.startVoiceRecognition(), 300);
                }
            });
        });

        // Cancel button
        overlay.querySelector('#voice-cancel-btn').addEventListener('click', () => {
            this.closeVoiceOverlay();
        });

        // Send button
        overlay.querySelector('#voice-send-btn').addEventListener('click', () => {
            if (this.voiceTranscript.trim()) {
                const chatInput = document.getElementById('chat-input');
                if (chatInput) {
                    chatInput.value = this.voiceTranscript.trim();
                    if (typeof Utils !== 'undefined') Utils.autoResizeTextarea(chatInput, 200);
                }
                this.closeVoiceOverlay();
                // Auto send
                if (typeof App !== 'undefined') {
                    App.sendMessage();
                }
            }
        });

        // Click on the visual to start/stop
        overlay.querySelector('.voice-visual').addEventListener('click', () => {
            if (overlay.classList.contains('listening')) {
                if (this.recognition) this.recognition.stop();
            } else {
                this.startVoiceRecognition();
            }
        });

        // Start listening automatically
        setTimeout(() => this.startVoiceRecognition(), 400);
    },

    startVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        this.recognition = new SpeechRecognition();
        this.recognition.lang = this.voiceLang;
        this.recognition.interimResults = true;
        this.recognition.continuous = true;
        this.recognition.maxAlternatives = 1;

        const overlay = this.voiceOverlay;
        if (!overlay) return;

        const statusEl = overlay.querySelector('.voice-status');
        const transcriptEl = overlay.querySelector('#voice-transcript-text');
        const sendBtn = overlay.querySelector('#voice-send-btn');

        this.recognition.onstart = () => {
            overlay.classList.add('listening');
            statusEl.textContent = 'Listening...';
        };

        this.recognition.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            this.voiceTranscript = final + interim;
            transcriptEl.textContent = this.voiceTranscript || '...';
            if (this.voiceTranscript.trim()) {
                sendBtn.disabled = false;
            }
        };

        this.recognition.onend = () => {
            overlay.classList.remove('listening');
            statusEl.textContent = this.voiceTranscript ? 'Tap mic to continue, or Send' : 'Tap mic to start';
        };

        this.recognition.onerror = (event) => {
            if (event.error === 'no-speech') {
                statusEl.textContent = 'No speech detected. Tap mic to try again.';
            } else if (event.error === 'not-allowed') {
                statusEl.textContent = 'Microphone access denied.';
            } else {
                statusEl.textContent = 'Error: ' + event.error;
            }
            overlay.classList.remove('listening');
        };

        this.recognition.start();
    },

    closeVoiceOverlay() {
        if (this.recognition) {
            try { this.recognition.stop(); } catch (e) {}
            this.recognition = null;
        }
        if (this.voiceOverlay) {
            this.voiceOverlay.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => {
                this.voiceOverlay.remove();
                this.voiceOverlay = null;
            }, 200);
        }
    },

    // ==================== IMAGE ATTACH ====================
    setupImageAttach() {
        const attachBtn = document.getElementById('attach-file-btn');
        const imageInput = document.getElementById('image-input');
        if (!attachBtn || !imageInput) return;

        // We enhance the existing image handler to show preview
        const originalHandler = imageInput.onchange;
        
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file || !file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = () => {
                this.attachedImageData = reader.result;
                this.showImagePreview(reader.result, file.name);
            };
            reader.readAsDataURL(file);
        });
    },

    showImagePreview(dataUrl, fileName) {
        // Remove existing preview
        this.removeImagePreview();

        const container = document.querySelector('.chat-deck-container');
        if (!container) return;

        const preview = document.createElement('div');
        preview.className = 'attached-image-preview';
        preview.id = 'attached-image-preview';
        preview.innerHTML = `
            <img src="${dataUrl}" alt="${fileName}">
            <button class="remove-image" title="Remove image">
                <i class="fas fa-times"></i>
            </button>
        `;

        preview.querySelector('.remove-image').addEventListener('click', () => {
            this.removeImagePreview();
        });

        // Insert before the deck
        const deck = container.querySelector('.chat-deck');
        if (deck) {
            deck.parentNode.insertBefore(preview, deck);
        }
    },

    removeImagePreview() {
        const preview = document.getElementById('attached-image-preview');
        if (preview) preview.remove();
        this.attachedImageData = null;
        const imageInput = document.getElementById('image-input');
        if (imageInput) imageInput.value = '';
    },

    // ==================== FIX AI INTEGRATION ====================
    fixAIIntegration() {
        // Ensure the API key from env.js is used if no custom key is set
        if (typeof Storage !== 'undefined' && typeof ENV !== 'undefined') {
            const settings = Storage.getSettings ? Storage.getSettings() : {};
            
            // If no API key is configured in settings, use the env default
            if (!settings.deepseekApiKey && ENV.DEEPSEEK_API_KEY) {
                Storage.updateSetting('deepseekApiKey', ENV.DEEPSEEK_API_KEY);
            }
            
            // If no API URL is configured, use the env default
            if (!settings.deepseekApiUrl && ENV.DEEPSEEK_API_URL) {
                Storage.updateSetting('deepseekApiUrl', ENV.DEEPSEEK_API_URL);
            }
        }
    },

    // ==================== PATCH SEND MESSAGE ====================
    patchSendMessage() {
        if (typeof App === 'undefined') return;

        const self = this;
        const originalSendMessage = App.sendMessage.bind(App);

        App.sendMessage = async function() {
            if (self.currentChatMode === 'chatbot') {
                await self.handleChatbotSend();
            } else {
                // Include attached image info if present
                if (self.attachedImageData) {
                    const imageMessage = {
                        role: 'user',
                        content: `[Image attached as design inspiration]`,
                        imageData: self.attachedImageData,
                        createdAt: Date.now()
                    };
                    App.addMessageToChat(imageMessage);
                    if (App.currentProject) {
                        Storage.addChatMessage(App.currentProject.id, imageMessage);
                    }
                    App.latestImageInspirationName = 'user-image';
                    self.removeImagePreview();
                }
                await originalSendMessage();
            }
        };
    },

    async handleChatbotSend() {
        const input = document.getElementById('chat-input');
        const message = input?.value?.trim();
        if (!message || App.isProcessing) return;

        App.persistAPISettingsFromInputs();

        // Calculate cost
        const cost = this.extraThinkingEnabled ? 100 : 1;

        // Check credits
        if (!Storage.canMakeRequest(cost)) {
            const info = Storage.getUsageInfo(cost);
            Utils.showToast(`Not enough credits (${info.used}/${info.limit} used). Need ${cost} credit(s).`, 'warning');
            return;
        }

        Utils.playSound('sound-click');
        Utils.triggerHaptic('light');

        // Clear input
        input.value = '';
        Utils.autoResizeTextarea(input, 200);

        // Handle attached image
        let imageContext = '';
        if (this.attachedImageData) {
            const imageMessage = {
                role: 'user',
                content: `[Image attached]`,
                imageData: this.attachedImageData,
                createdAt: Date.now()
            };
            App.addMessageToChat(imageMessage);
            if (App.currentProject) {
                Storage.addChatMessage(App.currentProject.id, imageMessage);
            }
            imageContext = '\n\n(User has attached an image for reference.)';
            this.removeImagePreview();
        }

        // Add user message
        const userMessage = {
            role: 'user',
            content: message,
            createdAt: Date.now()
        };
        App.addMessageToChat(userMessage);

        if (App.currentProject) {
            Storage.addChatMessage(App.currentProject.id, userMessage);
        }

        App.isProcessing = true;
        App.startTaskClock(0.5, this.extraThinkingEnabled ? 'Deep Thinking' : 'Chatting');

        try {
            const modelSelect = document.getElementById('model-select');
            const selectedModel = modelSelect?.value || ENV.DEFAULT_MODEL || 'OPTICHAIN_THINKING_15';
            const model = ENV.MODELS[selectedModel] ? selectedModel : 'OPTICHAIN_PRO';

            // Build context from previous messages
            const context = App.chatMessages.slice(0, -1).slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));

            let systemPrompt = AI.getChatPrompt(model);
            
            if (this.extraThinkingEnabled) {
                systemPrompt += '\n\nEXTRA THINKING MODE ACTIVE: Provide extremely detailed, thorough, and comprehensive answers. Consider all angles, edge cases, and nuances. Structure your response with clear sections. Think step by step and explain your reasoning deeply.';
            }

            const finalMessage = message + imageContext;

            let fullResponse = '';
            const responseDiv = App.createAssistantMessageElement();

            await AI.callAPI(
                context.concat([{ role: 'user', content: finalMessage }]),
                model,
                (chunk, accumulated) => {
                    fullResponse = accumulated;
                    App.updateAssistantMessage(responseDiv, accumulated);
                },
                {
                    usageCost: cost,
                    systemPrompt: systemPrompt,
                    fallback: 'chat'
                }
            );

            // Save assistant response
            const assistantMessage = {
                role: 'assistant',
                content: fullResponse,
                createdAt: Date.now()
            };
            App.chatMessages.push(assistantMessage);

            if (App.currentProject) {
                Storage.addChatMessage(App.currentProject.id, assistantMessage);
            }

            App.updateUsageDisplay();
            Utils.triggerHaptic('success');
            App.stopTaskClock(true);

        } catch (error) {
            App.stopTaskClock(false);
            Utils.showToast(error.message || 'Failed to get response', 'error');
            Utils.triggerHaptic('error');
        } finally {
            App.isProcessing = false;
        }
    },

    // ==================== UI ENHANCEMENTS ====================
    enhanceUI() {
        // Fix all logo references
        document.querySelectorAll('img[src="Iconxx.png"]').forEach(img => {
            img.src = 'images/logo.png';
        });

        // Add smooth hover effects to all icon buttons
        document.querySelectorAll('.icon-btn').forEach(btn => {
            btn.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        });

        // Enhance chat input with better auto-resize
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.style.transition = 'height 0.15s ease';
        }

        // Make sure the chat-messages container has smooth scrolling
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.style.scrollBehavior = 'smooth';
        }
    }
};

// Initialize when DOM is ready and App is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for App to initialize first
    const initV3 = () => {
        if (typeof App !== 'undefined' && typeof AI !== 'undefined' && typeof Storage !== 'undefined') {
            OpticodeV3.init();
        } else {
            setTimeout(initV3, 100);
        }
    };
    setTimeout(initV3, 500);
});
