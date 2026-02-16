// Opticode - Internationalization Module
// Made by Cozytustudios - Bangla & English Support

const I18n = {
    currentLang: 'en',

    translations: {
        en: {
            // Auth
            auth_subtitle: 'Sign in to start vibe coding',
            login: 'Login',
            register: 'Register',
            create_account: 'Create Account',
            
            // Navigation
            welcome_msg: 'Welcome to Opticode',
            assistant: 'Assistant',
            model: 'Model',
            thinking: 'Thinking',
            
            // Actions
            start_coding: 'Start Coding',
            import_project: 'Import Project',
            chat_research: 'Chat & Research',
            documentation: 'Documentation',
            
            // Plans
            plans: 'Plans',
            plans_desc: "Choose a plan that's right for you. Pause or cancel anytime.",
            upgrade: 'Upgrade',
            
            // Settings
            settings: 'Settings',
            appearance: 'Appearance',
            theme: 'Theme',
            ui_size: 'UI Size',
            language: 'Language',
            onboarding: 'Onboarding',
            walkthrough: 'Need a quick walkthrough again?',
            replay_tutorial: 'Replay Tutorial',
            sound_haptics: 'Sound & Haptics',
            sound_effects: 'Sound Effects',
            haptic_feedback: 'Haptic Feedback',
            ai_settings: 'AI Settings',
            default_model: 'Default Model',
            default_thinking: 'Default Thinking',
            import_export: 'Import / Export',
            export_all: 'Export All Projects',
            import_btn: 'Import Project',
            account: 'Account',
            current_plan: 'Current Plan',
            about: 'About',
            
            // Chat
            ai_welcome: "Hello! I'm Optichain, your AI coding assistant. Describe what you want to build and I'll help you create it!",
            task_list: 'Task List',
            
            // Research
            research_welcome: 'What would you like to explore?',
            research_desc: 'Use Chat, Deep Research, or Web Search mode to get comprehensive answers.',
            
            // Project
            create_project: 'Create New Project',
            
            // Todo
            todo_completed: 'completed',
            todo_in_progress: 'in progress',
            todo_pending: 'pending'
        },
        bn: {
            // Auth
            auth_subtitle: 'ভাইব কোডিং শুরু করতে সাইন ইন করুন',
            login: 'লগইন',
            register: 'রেজিস্টার',
            create_account: 'অ্যাকাউন্ট তৈরি করুন',
            
            // Navigation
            welcome_msg: 'Opticode-এ স্বাগতম',
            assistant: 'সহকারী',
            model: 'মডেল',
            thinking: 'চিন্তন স্তর',
            
            // Actions
            start_coding: 'কোডিং শুরু করুন',
            import_project: 'প্রকল্প আমদানি',
            chat_research: 'চ্যাট ও গবেষণা',
            documentation: 'ডকুমেন্টেশন',
            
            // Plans
            plans: 'প্ল্যান',
            plans_desc: 'আপনার জন্য সেরা প্ল্যান বেছে নিন। যেকোনো সময় বন্ধ করুন।',
            upgrade: 'আপগ্রেড',
            
            // Settings
            settings: 'সেটিংস',
            appearance: 'রূপ',
            theme: 'থিম',
            ui_size: 'UI আকার',
            language: 'ভাষা',
            onboarding: 'অনবোর্ডিং',
            walkthrough: 'আবার দেখতে চান?',
            replay_tutorial: 'টিউটোরিয়াল দেখুন',
            sound_haptics: 'শব্দ ও হ্যাপটিক',
            sound_effects: 'শব্দ ইফেক্ট',
            haptic_feedback: 'হ্যাপটিক ফিডব্যাক',
            ai_settings: 'AI সেটিংস',
            default_model: 'ডিফল্ট মডেল',
            default_thinking: 'ডিফল্ট চিন্তন',
            import_export: 'আমদানি / রপ্তানি',
            export_all: 'সব প্রকল্প রপ্তানি',
            import_btn: 'প্রকল্প আমদানি',
            account: 'অ্যাকাউন্ট',
            current_plan: 'বর্তমান প্ল্যান',
            about: 'সম্পর্কে',
            
            // Chat
            ai_welcome: 'হ্যালো! আমি Optichain, আপনার AI কোডিং সহকারী। আপনি কী তৈরি করতে চান তা বর্ণনা করুন, আমি সাহায্য করব!',
            task_list: 'কাজের তালিকা',
            
            // Research
            research_welcome: 'কী জানতে চান?',
            research_desc: 'চ্যাট, ডিপ রিসার্চ বা ওয়েব সার্চ মোড ব্যবহার করুন।',
            
            // Project
            create_project: 'নতুন প্রকল্প তৈরি করুন',
            
            // Todo
            todo_completed: 'সম্পন্ন',
            todo_in_progress: 'চলমান',
            todo_pending: 'অপেক্ষমাণ'
        }
    },

    init() {
        const saved = localStorage.getItem('opticode_lang') || 'en';
        this.setLanguage(saved);
    },

    setLanguage(lang) {
        if (!this.translations[lang]) lang = 'en';
        this.currentLang = lang;
        localStorage.setItem('opticode_lang', lang);
        document.documentElement.lang = lang;
        this.applyAll();
    },

    t(key) {
        return this.translations[this.currentLang]?.[key] 
            || this.translations['en']?.[key] 
            || key;
    },

    applyAll() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key);
            if (text) el.textContent = text;
        });
    },

    toggle() {
        const next = this.currentLang === 'en' ? 'bn' : 'en';
        this.setLanguage(next);
    }
};
