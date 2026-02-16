# Opticode v3.0 - Professional AI-Powered Vibe Coding Platform

**Made by Cozytustudios** | Founder: Sajid Hossain | 🇧🇩 Made in Bangladesh

---

## Overview

Opticode is a professional AI-powered vibe coding platform — a Cursor alternative that lets you build web applications through natural language descriptions. Powered by DeepSeek AI with multiple Optichain models. Now with a completely redesigned UI, dual-mode chat system, and premium voice capabilities.

---

## ✅ Completed Features (v3.0)

### 🎨 Major UI Overhaul
- **Premium glassmorphic design** throughout the entire app
- **Redesigned chat section** with ChatGPT-like message bubbles
- **Upgraded activity bar** with active indicator glow effects
- **Enhanced auth screen** with gradient backgrounds and smooth animations
- **Polished modal dialogs** with backdrop blur and modern borders
- **Better scrollbars** with purple accent theming
- **Responsive design** for all screen sizes
- **12 beautiful themes**: Dark, Light, Midnight, Forest, Ocean, Sunset, Cozy, Cozy Green, Cozy Sepia, Cozy Night, Red, Pink

### 💬 Dual Chat Modes
- **Chatbot Mode**: For general conversations, Q&A, explanations (1 credit per message)
- **Code Mode**: For code generation with Plan+Build or Code Fast modes
- Seamless mode switching via toggle bar above the chat input
- Each mode has appropriate UI controls shown/hidden

### 🧠 Extra Thinking (100 Credits)
- Available in Chatbot mode only
- Toggle on/off with a visual checkbox
- Activates deep reasoning mode for comprehensive, detailed responses
- Shows cost indicator (100 credits) when enabled

### 🤖 AI Models (Fixed & Working)
- **Optichain Thinking 1.5** (Default) — Advanced reasoning with deep thinking (3 credits)
- **Optichain Pro** — Fast and efficient code generation (1 credit)
- **Optichain 600B** — Most powerful model, 600B parameters (100 credits/request)
- **Exakio Sone** — Research-focused model with web-backed context & citations (5 credits)

### 🔧 AI Integration Fix
- Fixed API key loading from environment config
- Storage defaults now properly pull from `ENV.DEEPSEEK_API_KEY`
- API URL defaults properly to `ENV.DEEPSEEK_API_URL`
- Streaming response with fallback to non-streaming
- Friendly error messages for connectivity issues

### ✏️ Smart Editing
- AI edits only the parts that need changing instead of rewriting entire files
- Uses `<<<EDIT>>>` markers for surgical find-and-replace operations
- Automatically detects edit requests and switches to smart edit mode

### 🎤 Voice Mode
- Full-screen voice overlay with visual feedback
- **Language support**: English (en-US) and Bangla (bn-BD)
- Real-time speech transcription
- Pulsing microphone animation while listening
- One-tap send after voice capture
- Works across Chatbot and Code modes

### 📷 Image Attach in Chat
- Attach images via paperclip button
- Visual preview of attached image before sending
- Remove attached image with X button
- Image used as design inspiration for code generation
- Works in both Chatbot and Code modes

### 🗂️ Project Management
- Create, edit, delete projects
- File tree explorer
- Import/Export projects as JSON
- Project picker on startup
- Chat history per project

### 🌐 Internationalization
- English and Bangla (বাংলা) language support
- Toggle language from activity bar or settings

### 📊 Usage & Plans
- Free plan: 5 credits/day
- Neo plan: 1,000 monthly credits (200 BDT/week)
- Plus plan: 5,000 monthly credits (500 BDT/month)
- Ultra plan: 20,000 monthly credits (1,500 BDT/month)
- Agentic Ultra: 70,000 monthly credits (7,500 BDT/month)
- Coupon code redemption for plan activation

---

## 📁 File Structure

```
index.html          → Main HTML (auth, app, modals, tutorial)
style.css           → Base styles (variables, layout, components)
themes.css          → 12 theme definitions
animations.css      → Keyframe animations
enhanced-ui.css     → Activity bar, panel styles
ui-upgrade.css      → ChatGPT-inspired chat, global upgrades
opticode-v3.css     → v3.0 premium UI overhaul (NEW)
opticode-v3.js      → v3.0 features module (NEW)
env.js              → API keys, model config, plans
app.js              → Main application logic
ai.js               → DeepSeek API integration
editor.js           → Code editor module
storage.js          → localStorage persistence
auth.js             → Authentication module
utils.js            → Utility functions
i18n.js             → Internationalization
chat-enhanced.js    → Code block copy features
SECURITY.md         → Security policy
```

---

## 🚀 Entry Points

| Path | Description |
|------|-------------|
| `index.html` | Main application entry point |

---

## 🔑 Key Changes in v3.0

1. **Removed** the "Quick response / Deep research / Improve code" suggestion cards from the coding chat input area
2. **Added** Chatbot vs Code mode switcher above the chat input
3. **Added** Extra Thinking toggle (100 credits) visible only in Chatbot mode
4. **Added** premium voice overlay with language switching
5. **Added** image preview for attached files in chat
6. **Fixed** AI API integration — API key now properly loaded from env.js defaults
7. **Complete UI overhaul** — every component redesigned with premium feel

---

## 🛠️ Recommended Next Steps

1. **Add logo image** at `images/logo.png` for splash screen and branding
2. **Add real authentication** backend for production use
3. **Add payment integration** for subscription plans (bKash, Nagad, etc.)
4. **Add file download** — allow exporting generated code as .zip
5. **Add collaboration** — real-time multi-user editing
6. **Add mobile app** — PWA support for mobile devices
7. **Add syntax highlighting** — integrate Monaco Editor or CodeMirror
8. **Add project templates** — starter templates for common web apps

---

## 📝 Data Models

### User (localStorage)
- name, email, plan, planActivatedAt

### Project (localStorage)
- id, name, description, files (html/css/js), createdAt, updatedAt

### Settings (localStorage)
- theme, layout, soundEnabled, hapticEnabled, defaultModel, defaultThinkingLevel, aiMode, uiScale, deepseekApiUrl, deepseekApiKey

### Usage (localStorage)
- Daily credit tracking per date key

### Chat History (localStorage)
- Per-project message history with role, content, imageData, timestamp

---

**Made with ❤️ by Cozytustudios | Founder: Sajid Hossain | 🇧🇩 Bangladesh**
