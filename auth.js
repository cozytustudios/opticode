// Opticode - Authentication Module
// Made by Cozytustudios

const Auth = {
    // Initialize auth module
    init() {
        this.setupEventListeners();
        return this.checkAuth();
    },

    // Setup event listeners
    setupEventListeners() {
        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchAuthTab(e.target.dataset.tab);
            });
        });

        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Subscription plan selection
        document.querySelectorAll('.select-plan').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planCard = e.target.closest('.plan-card');
                const plan = e.target.dataset.plan || planCard?.dataset.plan;
                if (!plan || !ENV.PLANS[plan]) {
                    Utils.showToast('Plan unavailable. Please try again.', 'error');
                    return;
                }
                this.handlePlanSelection(plan);
            });
        });

        // Coupon modal
        const cancelCoupon = document.getElementById('cancel-coupon');
        const applyCoupon = document.getElementById('apply-coupon');
        
        if (cancelCoupon) {
            cancelCoupon.addEventListener('click', () => {
                this.hideCouponModal();
            });
        }
        
        if (applyCoupon) {
            applyCoupon.addEventListener('click', () => {
                this.handleCouponApply();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    },

    // Check if user is authenticated
    checkAuth() {
        const user = Storage.getUser();
        if (user) {
            return { authenticated: true, user };
        }
        return { authenticated: false, user: null };
    },

    // Switch auth tabs
    switchAuthTab(tab) {
        Utils.playSound('sound-click');
        Utils.triggerHaptic('light');

        document.querySelectorAll('.auth-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
        document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
    },

    // Handle login
    handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            Utils.showToast('Please fill in all fields', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            Utils.showToast('Please enter a valid email', 'error');
            return;
        }

        // Check if user exists in localStorage
        const existingUsers = JSON.parse(localStorage.getItem('opticode_users') || '[]');
        const user = existingUsers.find(u => u.email === email && u.password === password);

        if (!user) {
            // For demo purposes, create user if not exists
            Utils.showToast('Invalid credentials. Try registering first.', 'error');
            return;
        }

        // Login successful
        Storage.setUser(user);
        Utils.showToast('Welcome back, ' + user.name + '!', 'success');
        Utils.triggerHaptic('success');

        // Show appropriate screen
        setTimeout(() => {
            if (!user.plan || user.plan === 'FREE') {
                this.showSubscriptionScreen();
            } else {
                App.showMainApp();
            }
        }, 500);
    },

    // Handle registration
    handleRegister() {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;

        // Validation
        if (!name || !email || !password || !confirm) {
            Utils.showToast('Please fill in all fields', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            Utils.showToast('Please enter a valid email', 'error');
            return;
        }

        if (password.length < 6) {
            Utils.showToast('Password must be at least 6 characters', 'error');
            return;
        }

        if (password !== confirm) {
            Utils.showToast('Passwords do not match', 'error');
            return;
        }

        // Check if email already exists
        const existingUsers = JSON.parse(localStorage.getItem('opticode_users') || '[]');
        if (existingUsers.some(u => u.email === email)) {
            Utils.showToast('Email already registered', 'error');
            return;
        }

        // Create user
        const user = {
            id: Utils.generateId(),
            name,
            email,
            password, // In production, this should be hashed
            plan: 'FREE',
            createdAt: Date.now()
        };

        // Save to users list
        existingUsers.push(user);
        localStorage.setItem('opticode_users', JSON.stringify(existingUsers));

        // Set as current user
        Storage.setUser(user);
        
        Utils.showToast('Account created successfully!', 'success');
        Utils.triggerHaptic('success');

        // Show subscription screen
        setTimeout(() => {
            this.showSubscriptionScreen();
        }, 500);
    },

    // Validate email
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // Show subscription screen
    showSubscriptionScreen() {
        const authScreen = document.getElementById('auth-screen');
        const subscription = document.getElementById('subscription-screen');
        const mainApp = document.getElementById('main-app');
        const settingsModal = document.getElementById('settings-modal');

        authScreen?.classList.add('hidden');
        mainApp?.classList.add('hidden'); // ensure subscription screen is visible over app
        settingsModal?.classList.add('hidden');

        subscription?.classList.remove('hidden');
        subscription?.classList.add('animate-fade-in');

        // Scroll to top and focus first plan for accessibility
        subscription?.scrollTo({ top: 0, behavior: 'smooth' });
        const firstPlanBtn = subscription?.querySelector('.plan-card .select-plan');
        firstPlanBtn?.focus();
    },

    // Handle plan selection
    handlePlanSelection(plan) {
        Utils.playSound('sound-click');
        Utils.triggerHaptic('medium');

        if (plan === 'FREE') {
            // Activate free plan directly
            this.activatePlan('FREE');
        } else {
            // Show coupon modal
            this.showCouponModal(plan);
        }
    },

    // Show coupon modal
    showCouponModal(plan) {
        const modal = document.getElementById('coupon-modal');
        const planName = document.getElementById('coupon-plan-name');
        const input = document.getElementById('coupon-input');

        planName.textContent = `Activate ${ENV.PLANS[plan].name} Plan`;
        input.value = '';
        input.dataset.plan = plan;

        modal.classList.remove('hidden');
        modal.classList.add('animate-fade-in');
        input.focus();
    },

    // Hide coupon modal
    hideCouponModal() {
        const modal = document.getElementById('coupon-modal');
        modal.classList.add('hidden');
    },

    // Handle coupon apply
    handleCouponApply() {
        const input = document.getElementById('coupon-input');
        const coupon = input.value.trim();
        const plan = input.dataset.plan;

        if (!coupon) {
            Utils.showToast('Please enter a coupon code', 'error');
            return;
        }

        if (!plan || !ENV.PLANS[plan]) {
            Utils.showToast('Select a plan before applying a coupon', 'error');
            return;
        }

        // Validate coupon
        const planConfig = ENV.PLANS[plan];
        if (coupon === planConfig.coupon) {
            this.activatePlan(plan);
            this.hideCouponModal();
        } else {
            Utils.showToast('Invalid coupon code', 'error');
            Utils.triggerHaptic('error');
            input.classList.add('animate-shake');
            setTimeout(() => input.classList.remove('animate-shake'), 300);
        }
    },

    // Activate plan
    activatePlan(plan) {
        const user = Storage.updateUserPlan(plan);
        
        Utils.showToast(`${ENV.PLANS[plan].name} plan activated!`, 'success');
        Utils.triggerHaptic('success');

        // Reset daily usage on plan change
        Storage.resetUsage();

        // Show main app
        setTimeout(() => {
            App.showMainApp();
        }, 500);
    },

    // Handle logout
    handleLogout() {
        Utils.playSound('sound-click');
        Utils.triggerHaptic('light');

        Storage.clearUser();
        
        Utils.showToast('Logged out successfully', 'info');

        // Redirect to auth screen
        setTimeout(() => {
            window.location.reload();
        }, 500);
    },

    // Get current user
    getCurrentUser() {
        return Storage.getUser();
    },

    // Check if user has specific plan or higher
    hasPlan(requiredPlan) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const planOrder = ['FREE', 'NEO', 'PLUS', 'ULTRA', 'ULTRA_AGENT'];
        const userPlanIndex = planOrder.indexOf(user.plan || 'FREE');
        const requiredPlanIndex = planOrder.indexOf(requiredPlan);

        return userPlanIndex >= requiredPlanIndex;
    }
};

// Make Auth global
window.Auth = Auth;
