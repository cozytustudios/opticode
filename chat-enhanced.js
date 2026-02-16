// Opticode v2.5 - Enhanced Chat & Voice Module
// Made by Cozytustudios
// Adds: Voice with Bangla/English, Image attach preview, ChatGPT-like features

const ChatEnhanced = {
    voiceLang: 'en-US',
    recognition: null,
    voiceOverlay: null,
    voiceTranscript: '',
    attachedImage: null,

    init() {
        // Voice and image now handled by OpticodeV3 module
        // Keep only chat features (code block copy etc.)
        this.addChatFeatures();
        this.fixLogoReferences();
        console.log('✨ ChatEnhanced module loaded (v3 compat)');
    },

    // Fix all logo references from Iconxx.png to images/logo.png
    fixLogoReferences() {
        document.querySelectorAll('img[src="Iconxx.png"]').forEach(img => {
            img.src = 'images/logo.png';
        });
    },

    // ==================== VOICE INPUT OVERHAUL ====================
    patchVoiceInput() {
        // Override the original toggleVoiceInput to remove plan gate and add language support
        if (typeof App !== 'undefined') {
            App.toggleVoiceInput = () => {
                this.openVoiceOverlay();
            };
        }
    },

    openVoiceOverlay() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            Utils.showToast('Voice input not supported in this browser. Try Chrome.', 'warning');
            return;
        }

        // Create voice overlay
        this.voiceTranscript = '';
        const overlay = document.createElement('div');
        overlay.className = 'voice-overlay';
        overlay.id = 'voice-overlay';
        overlay.innerHTML = `
            <div class="voice-lang-toggle">
                <button class="voice-lang-btn ${this.voiceLang === 'en-US' ? 'active' : ''}" data-lang="en-US">
                    🇬🇧 English
                </button>
                <button class="voice-lang-btn ${this.voiceLang === 'bn-BD' ? 'active' : ''}" data-lang="bn-BD">
                    🇧🇩 বাংলা
                </button>
            </div>
            <button class="voice-circle" id="voice-circle-btn">
                <i class="fas fa-microphone"></i>
            </button>
            <div class="voice-text">Tap to start listening...</div>
            <div class="voice-transcript" id="voice-transcript-display">
                <span style="color: rgba(160,160,176,0.5)">Your speech will appear here</span>
            </div>
            <div class="voice-actions">
                <button class="voice-action-btn voice-cancel-btn" id="voice-cancel-btn">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="voice-action-btn voice-send-btn" id="voice-use-btn">
                    <i class="fas fa-check"></i> Use Text
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
        this.voiceOverlay = overlay;

        // Language toggle
        overlay.querySelectorAll('.voice-lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                overlay.querySelectorAll('.voice-lang-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.voiceLang = btn.dataset.lang;
                // Restart recognition with new language
                if (this.recognition) {
                    this.recognition.stop();
                    setTimeout(() => this.startListening(), 200);
                }
            });
        });

        // Circle button - toggle listening
        const circleBtn = overlay.querySelector('#voice-circle-btn');
        circleBtn.addEventListener('click', () => {
            if (this.recognition) {
                this.recognition.stop();
                this.recognition = null;
                circleBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                overlay.querySelector('.voice-text').textContent = 'Tap to start listening...';
            } else {
                this.startListening();
            }
        });

        // Cancel
        overlay.querySelector('#voice-cancel-btn').addEventListener('click', () => {
            this.closeVoiceOverlay();
        });

        // Use text
        overlay.querySelector('#voice-use-btn').addEventListener('click', () => {
            const text = this.voiceTranscript.trim();
            if (text) {
                const input = document.getElementById('chat-input');
                if (input) {
                    input.value = text;
                    if (typeof Utils !== 'undefined') Utils.autoResizeTextarea(input, 200);
                    input.focus();
                }
            }
            this.closeVoiceOverlay();
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeVoiceOverlay();
            }
        });

        // Auto-start listening
        setTimeout(() => this.startListening(), 300);
    },

    startListening() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = this.voiceLang;
        this.recognition.continuous = true;
        this.recognition.interimResults = true;

        const overlay = this.voiceOverlay;
        if (!overlay) return;

        const circleBtn = overlay.querySelector('#voice-circle-btn');
        const voiceText = overlay.querySelector('.voice-text');
        const transcriptDisplay = overlay.querySelector('#voice-transcript-display');

        circleBtn.innerHTML = '<i class="fas fa-stop"></i>';
        circleBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        voiceText.textContent = this.voiceLang === 'bn-BD' ? 'শুনছি... কথা বলুন' : 'Listening... speak now';

        let finalTranscript = '';

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            this.voiceTranscript = finalTranscript + interimTranscript;
            transcriptDisplay.innerHTML = 
                (finalTranscript ? `<span style="color: var(--text-bright)">${finalTranscript}</span>` : '') +
                (interimTranscript ? `<span style="color: var(--text-muted); font-style: italic">${interimTranscript}</span>` : '') ||
                '<span style="color: rgba(160,160,176,0.5)">Your speech will appear here</span>';
        };

        this.recognition.onerror = (event) => {
            if (event.error === 'no-speech') {
                voiceText.textContent = this.voiceLang === 'bn-BD' ? 'কোনো শব্দ পাওয়া যায়নি' : 'No speech detected. Try again.';
            } else {
                voiceText.textContent = `Error: ${event.error}`;
            }
            circleBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            circleBtn.style.background = 'var(--accent-gradient)';
            this.recognition = null;
        };

        this.recognition.onend = () => {
            if (circleBtn) {
                circleBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                circleBtn.style.background = 'var(--accent-gradient)';
            }
            if (voiceText) {
                voiceText.textContent = this.voiceTranscript.trim() 
                    ? (this.voiceLang === 'bn-BD' ? 'সম্পন্ন! টেক্সট ব্যবহার করুন' : 'Done! Tap "Use Text" to continue')
                    : (this.voiceLang === 'bn-BD' ? 'আবার চেষ্টা করুন' : 'Tap to start listening...');
            }
            this.recognition = null;
        };

        this.recognition.start();
    },

    closeVoiceOverlay() {
        if (this.recognition) {
            this.recognition.stop();
            this.recognition = null;
        }
        if (this.voiceOverlay) {
            this.voiceOverlay.style.animation = 'fadeOut 0.2s ease forwards';
            setTimeout(() => {
                this.voiceOverlay?.remove();
                this.voiceOverlay = null;
            }, 200);
        }
    },

    // ==================== ENHANCED IMAGE ATTACH ====================
    enhanceImageAttach() {
        // Patch image input handler to show preview
        const imageInput = document.getElementById('image-input');
        if (!imageInput) return;

        // Remove existing listeners by cloning
        const newInput = imageInput.cloneNode(true);
        imageInput.parentNode.replaceChild(newInput, imageInput);

        newInput.addEventListener('change', (e) => {
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
                this.attachedImage = { name: file.name, dataUrl };
                this.showImagePreview(file.name, dataUrl);
                App.latestImageInspirationName = file.name;
                Utils.showToast(`Image attached: ${file.name}`, 'success');
                e.target.value = '';
            };
            reader.readAsDataURL(file);
        });
    },

    showImagePreview(name, dataUrl) {
        // Remove existing preview
        this.removeImagePreview();

        const preview = document.createElement('div');
        preview.className = 'image-attach-preview';
        preview.id = 'image-attach-preview';
        preview.innerHTML = `
            <img src="${dataUrl}" alt="${name}">
            <div class="attach-info">
                <strong>${name}</strong>
                <div style="font-size: 11px; color: var(--text-muted)">Ready to send with your message</div>
            </div>
            <button class="attach-remove" title="Remove">
                <i class="fas fa-times"></i>
            </button>
        `;

        preview.querySelector('.attach-remove').addEventListener('click', () => {
            this.removeImagePreview();
        });

        // Insert before chat-deck
        const deck = document.querySelector('.chat-deck');
        if (deck && deck.parentNode) {
            deck.parentNode.insertBefore(preview, deck);
        }
    },

    removeImagePreview() {
        this.attachedImage = null;
        App.latestImageInspirationName = '';
        const existing = document.getElementById('image-attach-preview');
        if (existing) existing.remove();
    },

    // ==================== CHAT FEATURES ====================
    addChatFeatures() {
        // Add copy button to code blocks on click
        document.addEventListener('click', (e) => {
            const codeBlock = e.target.closest('.code-block');
            if (codeBlock) {
                const code = codeBlock.querySelector('code');
                if (code) {
                    navigator.clipboard.writeText(code.textContent).then(() => {
                        if (typeof Utils !== 'undefined') Utils.showToast('Code copied!', 'success');
                    }).catch(() => {
                        // Fallback
                        const range = document.createRange();
                        range.selectNodeContents(code);
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                        document.execCommand('copy');
                        sel.removeAllRanges();
                        if (typeof Utils !== 'undefined') Utils.showToast('Code copied!', 'success');
                    });
                }
            }
        });

        // Image handling and sendMessage patching now done by OpticodeV3
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for App to initialize
    setTimeout(() => {
        ChatEnhanced.init();
    }, 1500);
});
