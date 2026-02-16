// Opticode - Storage Manager
// Made by Cozytustudios

const Storage = {
    KEYS: {
        USER: 'opticode_user',
        PROJECTS: 'opticode_projects',
        SETTINGS: 'opticode_settings',
        USAGE: 'opticode_usage',
        CHAT_HISTORY: 'opticode_chat_history'
    },

    // ==================== USER ====================

    getUser() {
        const data = localStorage.getItem(this.KEYS.USER);
        return data ? JSON.parse(data) : null;
    },

    setUser(user) {
        localStorage.setItem(this.KEYS.USER, JSON.stringify(user));
    },

    clearUser() {
        localStorage.removeItem(this.KEYS.USER);
    },

    updateUserPlan(plan) {
        const user = this.getUser();
        if (user) {
            user.plan = plan;
            user.planActivatedAt = Date.now();
            this.setUser(user);
        }
        return user;
    },

    // ==================== PROJECTS ====================

    getProjects() {
        const data = localStorage.getItem(this.KEYS.PROJECTS);
        return data ? JSON.parse(data) : [];
    },

    setProjects(projects) {
        localStorage.setItem(this.KEYS.PROJECTS, JSON.stringify(projects));
    },

    addProject(project) {
        const projects = this.getProjects();
        project.id = project.id || Utils.generateId();
        project.createdAt = Date.now();
        project.updatedAt = Date.now();
        projects.unshift(project);
        this.setProjects(projects);
        return project;
    },

    updateProject(projectId, updates) {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            projects[index] = { ...projects[index], ...updates, updatedAt: Date.now() };
            this.setProjects(projects);
            return projects[index];
        }
        return null;
    },

    deleteProject(projectId) {
        const projects = this.getProjects();
        const filtered = projects.filter(p => p.id !== projectId);
        this.setProjects(filtered);
    },

    getProject(projectId) {
        const projects = this.getProjects();
        return projects.find(p => p.id === projectId) || null;
    },

    // ==================== SETTINGS ====================

    getSettings() {
        const data = localStorage.getItem(this.KEYS.SETTINGS);
        const defaults = {
            theme: 'cozy',
            layout: 'default',
            layoutMode: 'codex',
            soundEnabled: true,
            hapticEnabled: true,
            defaultModel: 'OPTICHAIN_THINKING_15',
            defaultThinkingLevel: 'mid',
            aiMode: 'CODE_FAST',
            uiScale: 'normal',
            fontSize: 14,
            autoSave: true,
            deepseekApiUrl: (typeof ENV !== 'undefined' && ENV.DEEPSEEK_API_URL)
                ? ENV.DEEPSEEK_API_URL
                : 'https://api.deepseek.com/v1/chat/completions',
            deepseekApiKey: (typeof ENV !== 'undefined' && ENV.DEEPSEEK_API_KEY)
                ? ENV.DEEPSEEK_API_KEY
                : ''
        };
        return data ? { ...defaults, ...JSON.parse(data) } : defaults;
    },

    setSettings(settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    },

    updateSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        this.setSettings(settings);
        return settings;
    },

    // ==================== USAGE TRACKING ====================

    getUsage() {
        const data = localStorage.getItem(this.KEYS.USAGE);
        return data ? JSON.parse(data) : {};
    },

    setUsage(usage) {
        localStorage.setItem(this.KEYS.USAGE, JSON.stringify(usage));
    },

    normalizeUsageEntry(entry) {
        if (typeof entry === 'number') {
            return { credits: entry };
        }
        if (entry && typeof entry === 'object') {
            return { credits: Number(entry.credits) || 0 };
        }
        return { credits: 0 };
    },

    getTodayUsage() {
        const usage = this.getUsage();
        const today = Utils.getTodayKey();
        return this.normalizeUsageEntry(usage[today]).credits;
    },

    incrementUsage(amount = 1) {
        const usage = this.getUsage();
        const today = Utils.getTodayKey();
        const normalized = this.normalizeUsageEntry(usage[today]);
        normalized.credits += Math.max(1, Number(amount) || 1);
        usage[today] = normalized;
        this.setUsage(usage);
        return normalized.credits;
    },

    resetUsage() {
        const today = Utils.getTodayKey();
        const usage = { [today]: { credits: 0 } };
        this.setUsage(usage);
    },

    canMakeRequest(requiredCredits = 1) {
        const user = this.getUser();
        const plan = user?.plan || 'FREE';

        // Free plan now has permanent 5 daily credits, no 2-day expiry.

        const limit = ENV.PLANS[plan]?.dailyLimit || 5;
        const used = this.getTodayUsage();
        const needed = Math.max(1, Number(requiredCredits) || 1);
        return used + needed <= limit;
    },

    getRemainingRequests() {
        const user = this.getUser();
        const plan = user?.plan || 'FREE';
        const limit = ENV.PLANS[plan]?.dailyLimit || 5;
        const used = this.getTodayUsage();
        return Math.max(0, limit - used);
    },

    getUsageInfo(requiredCredits = 1) {
        const user = this.getUser();
        const plan = user?.plan || 'FREE';
        const limit = ENV.PLANS[plan]?.dailyLimit || 5;
        const used = this.getTodayUsage();
        const expiredFree = false; // logic removed
        const needed = Math.max(1, Number(requiredCredits) || 1);
        return {
            used,
            limit,
            needed,
            remaining: Math.max(0, limit - used),
            canAfford: used + needed <= limit,
            expiredFree
        };
    },

    // ==================== CHAT HISTORY ====================

    getChatHistory(projectId) {
        const data = localStorage.getItem(this.KEYS.CHAT_HISTORY);
        const history = data ? JSON.parse(data) : {};
        return history[projectId] || [];
    },

    saveChatHistory(projectId, messages) {
        const data = localStorage.getItem(this.KEYS.CHAT_HISTORY);
        const history = data ? JSON.parse(data) : {};
        history[projectId] = messages;
        localStorage.setItem(this.KEYS.CHAT_HISTORY, JSON.stringify(history));
    },

    addChatMessage(projectId, message) {
        const messages = this.getChatHistory(projectId);
        message.id = message.id || Utils.generateId();
        message.timestamp = Date.now();
        messages.push(message);
        this.saveChatHistory(projectId, messages);
        // Keep the project "recent" when chats happen
        this.updateProject(projectId, {});
        return message;
    },

    clearChatHistory(projectId) {
        const data = localStorage.getItem(this.KEYS.CHAT_HISTORY);
        const history = data ? JSON.parse(data) : {};
        delete history[projectId];
        localStorage.setItem(this.KEYS.CHAT_HISTORY, JSON.stringify(history));
    },

    // ==================== EXPORT/IMPORT ====================

    exportAllData() {
        const data = {
            version: '1.0',
            exportedAt: Date.now(),
            user: this.getUser(),
            projects: this.getProjects(),
            settings: this.getSettings(),
            chatHistory: localStorage.getItem(this.KEYS.CHAT_HISTORY)
                ? JSON.parse(localStorage.getItem(this.KEYS.CHAT_HISTORY))
                : {}
        };
        return JSON.stringify(data, null, 2);
    },

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (data.projects) {
                this.setProjects(data.projects);
            }

            if (data.settings) {
                this.setSettings(data.settings);
            }

            if (data.chatHistory) {
                localStorage.setItem(this.KEYS.CHAT_HISTORY, JSON.stringify(data.chatHistory));
            }

            return { success: true, message: 'Data imported successfully' };
        } catch (error) {
            return { success: false, message: 'Failed to import data: ' + error.message };
        }
    },

    exportProject(projectId) {
        const project = this.getProject(projectId);
        if (!project) return null;

        const chatHistory = this.getChatHistory(projectId);

        return JSON.stringify({
            version: '1.0',
            exportedAt: Date.now(),
            project,
            chatHistory
        }, null, 2);
    },

    importProject(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.project) {
                return { success: false, message: 'Invalid project data' };
            }

            // Create new project with new ID
            const project = {
                ...data.project,
                id: Utils.generateId(),
                name: data.project.name + ' (imported)',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            this.addProject(project);

            // Import chat history if available
            if (data.chatHistory) {
                this.saveChatHistory(project.id, data.chatHistory);
            }

            return { success: true, message: 'Project imported successfully', project };
        } catch (error) {
            return { success: false, message: 'Failed to import project: ' + error.message };
        }
    },

    // ==================== CLEAR ALL ====================

    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};

// Make Storage global
window.Storage = Storage;
