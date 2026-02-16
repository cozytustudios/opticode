// Opticode Environment Configuration
// Made by Cozytustudios - Specially for Cozytustudios Team

const ENV = {
    // DeepSeek API Configuration
    DEEPSEEK_API_KEY: 'sk-754bb6539fad446eb7653fa44f68ec95',
    DEEPSEEK_API_URL: 'https://api.deepseek.com/v1/chat/completions',

    // App Configuration
    APP_NAME: 'Opticode',
    APP_VERSION: '2.0.0',
    MADE_BY: 'Cozytustudios',

    // AI Models
    MODELS: {
        OPTICHAIN_THINKING_15: {
            id: 'deepseek-reasoner',
            name: 'Optichain Thinking 1.5',
            description: 'Advanced reasoning with deep thinking capabilities',
            tier: 'default',
            creditCost: 3
        },
        OPTICHAIN_PRO: {
            id: 'deepseek-chat',
            name: 'Optichain Pro',
            description: 'Fast and efficient code generation',
            tier: 'fast',
            creditCost: 1
        },
        OPTICHAIN_600B: {
            id: 'deepseek-reasoner',
            name: 'Optichain 600B',
            description: 'Most powerful model — 600B parameters, unmatched quality and depth',
            tier: 'ultimate',
            creditCost: 100
        },
        EXAKIO_SONE: {
            id: 'deepseek-reasoner',
            name: 'Exakio Sone',
            description: 'Research-focused model with internet-backed context and citations',
            tier: 'research',
            webResearch: true,
            creditCost: 5
        }
    },

    // Default model
    DEFAULT_MODEL: 'OPTICHAIN_THINKING_15',

    // Subscription Plans
    PLANS: {
        FREE: {
            name: 'Free',
            price: 0,
            currency: 'BDT',
            period: 'forever',
            dailyLimit: 5,
            monthlyCredits: 0,
            coupon: null
        },
        NEO: {
            name: 'Neo',
            price: 200,
            currency: 'BDT',
            period: 'weekly',
            dailyLimit: 30,
            monthlyCredits: 1000,
            coupon: 'hellopie90'
        },
        PLUS: {
            name: 'Plus',
            price: 500,
            currency: 'BDT',
            period: 'monthly',
            dailyLimit: 50,
            monthlyCredits: 5000,
            coupon: 'Gelipotiliesy60'
        },
        ULTRA: {
            name: 'Ultra',
            price: 1500,
            currency: 'BDT',
            period: 'monthly',
            dailyLimit: 100,
            monthlyCredits: 20000,
            coupon: 'Gelipotiliesy789'
        },
        ULTRA_AGENT: {
            name: 'Agentic Ultra',
            price: 7500,
            currency: 'BDT',
            period: 'monthly',
            dailyLimit: 500,
            monthlyCredits: 70000,
            coupon: 'Zenioziti'
        }
    },

    // Thinking levels
    THINKING_LEVELS: {
        low: { credits: 1, label: 'Low' },
        mid: { credits: 3, label: 'Mid' },
        high: { credits: 5, label: 'High' },
        'extra-high': { credits: 50, label: 'Extra High' },
        'ultra-thinking': { credits: 100, label: 'Ultra Thinking' }
    },

    // Chat & Research mode cost
    CHAT_RESEARCH_COST: 50,

    // Language options
    LANGUAGES: {
        en: 'English',
        bn: 'বাংলা'
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ENV;
}
