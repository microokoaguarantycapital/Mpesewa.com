// ============================================
// AUTH.JS - Login, signup, role switching (UI only)
// ============================================

'use strict';

// Authentication Module
const AuthModule = {
    // Current user session
    currentSession: null,
    
    // User roles
    roles: ['borrower', 'lender', 'admin'],
    
    // Initialize auth module
    init: function() {
        this.loadSession();
        this.setupEventListeners();
        this.updateAuthUI();
        console.log('Auth module initialized');
    },
    
    // Load session from localStorage
    loadSession: function() {
        try {
            const session = localStorage.getItem('mpesewa_session');
            if (session) {
                this.currentSession = JSON.parse(session);
                console.log('Session loaded:', this.currentSession);
            }
        } catch (error) {
            console.error('Error loading session:', error);
            this.clearSession();
        }
    },
    
    // Save session to localStorage
    saveSession: function() {
        if (this.currentSession) {
            localStorage.setItem('mpesewa_session', JSON.stringify(this.currentSession));
        }
    },
    
    // Clear session
    clearSession: function() {
        this.currentSession = null;
        localStorage.removeItem('mpesewa_session');
        console.log('Session cleared');
    },
    
    // Check if user is authenticated
    isAuthenticated: function() {
        return !!this.currentSession;
    },
    
    // Check if user has specific role
    hasRole: function(role) {
        if (!this.currentSession) return false;
        return this.currentSession.role === role;
    },
    
    // Check if user is borrower
    isBorrower: function() {
        return this.hasRole('borrower');
    },
    
    // Check if user is lender
    isLender: function() {
        return this.hasRole('lender');
    },
    
    // Check if user is admin
    isAdmin: function() {
        return this.hasRole('admin');
    },
    
    // Get current user ID
    getUserId: function() {
        return this.currentSession?.id;
    },
    
    // Get current user country
    getUserCountry: function() {
        return this.currentSession?.country;
    },
    
    // Login function
    login: function(credentials) {
        // Validate credentials
        if (!this.validateLoginCredentials(credentials)) {
            return {
                success: false,
                message: 'Invalid login credentials'
            };
        }
        
        // Mock login - in production, this would call an API
        const user = this.findUserByPhone(credentials.phone, credentials.country);
        
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        
        // Check password (mock validation)
        if (credentials.password !== user.password) {
            return {
                success: false,
                message: 'Invalid password'
            };
        }
        
        // Check if user is blacklisted
        if (user.blacklisted) {
            return {
                success: false,
                message: 'Account is blacklisted. Please contact support.'
            };
        }
        
        // Create session
        this.currentSession = {
            id: user.id,
            phone: user.phone,
            email: user.email,
            name: user.name,
            role: user.role,
            country: user.country,
            subscription: user.subscription,
            lastLogin: new Date().toISOString(),
            ipAddress: this.getClientIP()
        };
        
        // Save session
        this.saveSession();
        
        // Update UI
        this.updateAuthUI();
        
        console.log('User logged in:', this.currentSession);
        
        return {
            success: true,
            message: 'Login successful',
            user: user,
            redirect: this.getDashboardRedirect(user.role)
        };
    },
    
    // Signup function
    signup: function(userData, role) {
        // Validate user data
        const validation = this.validateSignupData(userData, role);
        if (!validation.valid) {
            return {
                success: false,
                message: validation.message
            };
        }
        
        // Check if user already exists
        if (this.userExists(userData.phone, userData.country)) {
            return {
                success: false,
                message: 'User with this phone number already exists'
            };
        }
        
        // Create user object
        const user = this.createUserObject(userData, role);
        
        // Save user to mock database
        this.saveUser(user);
        
        // Create and save session
        this.currentSession = {
            id: user.id,
            phone: user.phone,
            email: user.email,
            name: user.name,
            role: user.role,
            country: user.country,
            subscription: user.subscription,
            lastLogin: new Date().toISOString(),
            ipAddress: this.getClientIP()
        };
        
        this.saveSession();
        
        // Update UI
        this.updateAuthUI();
        
        console.log('User signed up:', user);
        
        return {
            success: true,
            message: 'Registration successful',
            user: user,
            redirect: role === 'lender' ? '/pages/subscriptions.html' : this.getDashboardRedirect(role)
        };
    },
    
    // Logout function
    logout: function() {
        if (this.currentSession) {
            console.log('User logging out:', this.currentSession.name);
        }
        
        this.clearSession();
        this.updateAuthUI();
        
        return {
            success: true,
            message: 'Logged out successfully',
            redirect: '/index.html'
        };
    },
    
    // Switch role (UI only - requires new registration)
    switchRole: function(newRole) {
        if (!this.currentSession) {
            return {
                success: false,
                message: 'Please login first'
            };
        }
        
        // Show role switching instructions
        const message = `To become a ${newRole}, you need to register separately for that role. Please logout and register as a ${newRole}.`;
        
        return {
            success: false,
            message: message,
            action: 'register_new_role'
        };
    },
    
    // Validate login credentials
    validateLoginCredentials: function(credentials) {
        if (!credentials.phone || !credentials.password || !credentials.country) {
            return false;
        }
        
        // Basic phone validation
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(credentials.phone)) {
            return false;
        }
        
        // Basic password validation (min 6 chars)
        if (credentials.password.length < 6) {
            return false;
        }
        
        return true;
    },
    
    // Validate signup data
    validateSignupData: function(userData, role) {
        // Required fields for all roles
        const requiredFields = ['fullName', 'phone', 'country', 'location'];
        
        // Additional fields for borrowers
        if (role === 'borrower') {
            requiredFields.push('nationalId', 'occupation', 'nextOfKinPhone');
        }
        
        // Check required fields
        for (const field of requiredFields) {
            if (!userData[field]) {
                return {
                    valid: false,
                    message: `Please provide ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`
                };
            }
        }
        
        // Validate phone
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(userData.phone)) {
            return {
                valid: false,
                message: 'Invalid phone number format'
            };
        }
        
        // Validate email if provided
        if (userData.email && !this.validateEmail(userData.email)) {
            return {
                valid: false,
                message: 'Invalid email address'
            };
        }
        
        // Validate guarantors for borrowers
        if (role === 'borrower') {
            if (!userData.guarantor1Name || !userData.guarantor1Phone ||
                !userData.guarantor2Name || !userData.guarantor2Phone) {
                return {
                    valid: false,
                    message: 'Please provide both guarantors with their phone numbers'
                };
            }
            
            // Validate guarantor phones
            if (!phoneRegex.test(userData.guarantor1Phone) || !phoneRegex.test(userData.guarantor2Phone)) {
                return {
                    valid: false,
                    message: 'Invalid guarantor phone number(s)'
                };
            }
            
            // Check guarantors are different from borrower
            if (userData.guarantor1Phone === userData.phone || 
                userData.guarantor2Phone === userData.phone) {
                return {
                    valid: false,
                    message: 'Guarantors cannot be the same as the borrower'
                };
            }
        }
        
        // Validate subscription tier for lenders
        if (role === 'lender' && !userData.subscriptionTier) {
            return {
                valid: false,
                message: 'Please select a subscription tier'
            };
        }
        
        return {
            valid: true,
            message: 'Validation passed'
        };
    },
    
    // Validate email format
    validateEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Check if user exists (mock function)
    userExists: function(phone, country) {
        const users = this.getMockUsers();
        return users.some(user => user.phone === phone && user.country === country);
    },
    
    // Find user by phone (mock function)
    findUserByPhone: function(phone, country) {
        const users = this.getMockUsers();
        return users.find(user => user.phone === phone && user.country === country);
    },
    
    // Create user object
    createUserObject: function(userData, role) {
        const userId = `${role}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const baseUser = {
            id: userId,
            fullName: userData.fullName,
            phone: userData.phone,
            email: userData.email || '',
            country: userData.country,
            location: userData.location,
            role: role,
            rating: role === 'borrower' ? 5.0 : null,
            blacklisted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (role === 'borrower') {
            return {
                ...baseUser,
                nationalId: userData.nationalId,
                occupation: userData.occupation,
                nextOfKinPhone: userData.nextOfKinPhone,
                guarantor1: {
                    name: userData.guarantor1Name,
                    phone: userData.guarantor1Phone
                },
                guarantor2: {
                    name: userData.guarantor2Name,
                    phone: userData.guarantor2Phone
                },
                loanCategories: userData.categories || [],
                groups: [],
                activeLoans: [],
                loanHistory: [],
                totalBorrowed: 0,
                totalRepaid: 0,
                defaults: 0
            };
        } else if (role === 'lender') {
            return {
                ...baseUser,
                brandName: userData.brandName || '',
                subscription: {
                    tier: userData.subscriptionTier,
                    status: 'pending_payment',
                    expiryDate: null,
                    paymentHistory: []
                },
                loanCategories: userData.categories || [],
                groups: [],
                ledgers: [],
                borrowers: [],
                totalLent: 0,
                totalOutstanding: 0,
                totalInterestEarned: 0,
                lenderRating: 5.0
            };
        }
        
        return baseUser;
    },
    
    // Save user to mock database
    saveUser: function(user) {
        const users = this.getMockUsers();
        users.push(user);
        localStorage.setItem('mpesewa_users', JSON.stringify(users));
    },
    
    // Get mock users from localStorage
    getMockUsers: function() {
        try {
            const users = localStorage.getItem('mpesewa_users');
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    },
    
    // Get dashboard redirect URL
    getDashboardRedirect: function(role) {
        switch(role) {
            case 'borrower':
                return '/pages/dashboard/borrower-dashboard.html';
            case 'lender':
                return '/pages/dashboard/lender-dashboard.html';
            case 'admin':
                return '/pages/dashboard/admin-dashboard.html';
            default:
                return '/index.html';
        }
    },
    
    // Get client IP (mock function)
    getClientIP: function() {
        // This is a mock function - in production, this would get the real IP
        return '127.0.0.1';
    },
    
    // Setup event listeners for auth forms
    setupEventListeners: function() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLoginForm(e));
        }
        
        // Borrower registration form
        const borrowerForm = document.getElementById('borrowerRegistration');
        if (borrowerForm) {
            borrowerForm.addEventListener('submit', (e) => this.handleBorrowerSignup(e));
        }
        
        // Lender registration form
        const lenderForm = document.getElementById('lenderRegistration');
        if (lenderForm) {
            lenderForm.addEventListener('submit', (e) => this.handleLenderSignup(e));
        }
        
        // Logout buttons
        const logoutButtons = document.querySelectorAll('.logout-btn');
        logoutButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleLogout(e));
        });
        
        // Role switching buttons
        const switchRoleButtons = document.querySelectorAll('.switch-role-btn');
        switchRoleButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleRoleSwitch(e));
        });
    },
    
    // Handle login form submission
    handleLoginForm: function(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const credentials = {
            phone: formData.get('phone'),
            password: formData.get('password'),
            country: formData.get('country')
        };
        
        const result = this.login(credentials);
        
        if (result.success) {
            showNotification(result.message, 'success');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = result.redirect;
            }, 1500);
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle borrower signup
    handleBorrowerSignup: function(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const userData = {
            fullName: formData.get('fullName'),
            nationalId: formData.get('nationalId'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            country: formData.get('country'),
            location: formData.get('location'),
            occupation: formData.get('occupation'),
            nextOfKinPhone: formData.get('nextOfKinPhone'),
            guarantor1Name: formData.get('guarantor1Name'),
            guarantor1Phone: formData.get('guarantor1Phone'),
            guarantor2Name: formData.get('guarantor2Name'),
            guarantor2Phone: formData.get('guarantor2Phone'),
            categories: Array.from(form.querySelectorAll('input[name="borrowerCategories"]:checked')).map(cb => cb.value)
        };
        
        const result = this.signup(userData, 'borrower');
        
        if (result.success) {
            showNotification(result.message, 'success');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = result.redirect;
            }, 1500);
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle lender signup
    handleLenderSignup: function(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const userData = {
            fullName: formData.get('fullName'),
            brandName: formData.get('brandName'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            country: formData.get('country'),
            location: formData.get('location'),
            subscriptionTier: formData.get('subscriptionTier') || document.getElementById('selectedTier')?.value,
            categories: Array.from(form.querySelectorAll('input[name="lenderCategories"]:checked')).map(cb => cb.value)
        };
        
        const result = this.signup(userData, 'lender');
        
        if (result.success) {
            showNotification(result.message, 'success');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = result.redirect;
            }, 1500);
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle logout
    handleLogout: function(e) {
        e.preventDefault();
        
        const result = this.logout();
        
        if (result.success) {
            showNotification(result.message, 'success');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = result.redirect;
            }, 1500);
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle role switching
    handleRoleSwitch: function(e) {
        e.preventDefault();
        
        const newRole = e.target.dataset.role;
        const result = this.switchRole(newRole);
        
        if (result.success) {
            showNotification(result.message, 'success');
            
            if (result.redirect) {
                setTimeout(() => {
                    window.location.href = result.redirect;
                }, 1500);
            }
        } else {
            if (result.action === 'register_new_role') {
                // Show confirmation dialog
                if (confirm(result.message + '\n\nWould you like to logout and register as ' + newRole + '?')) {
                    this.logout();
                    // Redirect to registration page
                    setTimeout(() => {
                        window.location.href = '/index.html#registration';
                    }, 500);
                }
            } else {
                showNotification(result.message, 'error');
            }
        }
    },
    
    // Update authentication UI based on session state
    updateAuthUI: function() {
        const isAuthenticated = this.isAuthenticated();
        
        // Update header auth buttons
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userMenu = document.getElementById('userMenu');
        
        if (isAuthenticated) {
            // User is logged in
            if (loginBtn) {
                loginBtn.textContent = 'Dashboard';
                loginBtn.href = this.getDashboardRedirect(this.currentSession.role);
                loginBtn.onclick = null;
            }
            
            if (registerBtn) {
                registerBtn.textContent = 'Logout';
                registerBtn.href = '#';
                registerBtn.onclick = (e) => {
                    e.preventDefault();
                    this.handleLogout(e);
                };
            }
            
            // Show user menu if exists
            if (userMenu) {
                userMenu.style.display = 'block';
                this.updateUserMenu();
            }
            
            // Update user welcome message
            const userWelcome = document.getElementById('userWelcome');
            if (userWelcome) {
                userWelcome.textContent = `Welcome, ${this.currentSession.name}`;
                userWelcome.style.display = 'block';
            }
        } else {
            // User is not logged in
            if (loginBtn) {
                loginBtn.textContent = 'Login';
                loginBtn.href = '#';
                loginBtn.onclick = () => openModal('login');
            }
            
            if (registerBtn) {
                registerBtn.textContent = 'Get Started';
                registerBtn.href = '#registration';
                registerBtn.onclick = null;
            }
            
            // Hide user menu
            if (userMenu) {
                userMenu.style.display = 'none';
            }
            
            // Hide user welcome
            const userWelcome = document.getElementById('userWelcome');
            if (userWelcome) {
                userWelcome.style.display = 'none';
            }
        }
    },
    
    // Update user menu with user info
    updateUserMenu: function() {
        if (!this.currentSession) return;
        
        const userMenu = document.getElementById('userMenu');
        if (!userMenu) return;
        
        userMenu.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">${this.getUserInitials()}</div>
                <div class="user-details">
                    <div class="user-name">${this.currentSession.name}</div>
                    <div class="user-role">${this.currentSession.role.toUpperCase()}</div>
                    <div class="user-country">${this.getCountryFlag()} ${this.currentSession.country}</div>
                </div>
            </div>
            <div class="user-menu-actions">
                <a href="${this.getDashboardRedirect(this.currentSession.role)}" class="menu-item">
                    <span class="menu-icon">📊</span> Dashboard
                </a>
                <a href="/pages/profile.html" class="menu-item">
                    <span class="menu-icon">👤</span> Profile
                </a>
                ${this.currentSession.role !== 'lender' ? `
                <a href="#" class="menu-item switch-role-btn" data-role="lender">
                    <span class="menu-icon">💰</span> Become a Lender
                </a>
                ` : ''}
                ${this.currentSession.role !== 'borrower' ? `
                <a href="#" class="menu-item switch-role-btn" data-role="borrower">
                    <span class="menu-icon">🤲</span> Become a Borrower
                </a>
                ` : ''}
                <div class="menu-divider"></div>
                <a href="#" class="menu-item logout-btn">
                    <span class="menu-icon">🚪</span> Logout
                </a>
            </div>
        `;
        
        // Reattach event listeners
        const logoutBtn = userMenu.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }
        
        const switchRoleBtns = userMenu.querySelectorAll('.switch-role-btn');
        switchRoleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleRoleSwitch(e));
        });
    },
    
    // Get user initials for avatar
    getUserInitials: function() {
        if (!this.currentSession?.name) return '?';
        
        const names = this.currentSession.name.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return names[0][0].toUpperCase();
    },
    
    // Get country flag emoji
    getCountryFlag: function() {
        const country = this.currentSession?.country;
        if (!country) return '🏳️';
        
        const flags = {
            'kenya': '🇰🇪',
            'uganda': '🇺🇬',
            'tanzania': '🇹🇿',
            'rwanda': '🇷🇼',
            'burundi': '🇧🇮',
            'somalia': '🇸🇴',
            'south-sudan': '🇸🇸',
            'ethiopia': '🇪🇹',
            'drc': '🇨🇩',
            'nigeria': '🇳🇬',
            'south-africa': '🇿🇦',
            'ghana': '🇬🇭'
        };
        
        return flags[country] || '🏳️';
    },
    
    // Get user session data for API calls (mock)
    getAuthHeaders: function() {
        if (!this.currentSession) return {};
        
        return {
            'Authorization': `Bearer ${this.currentSession.id}`,
            'X-User-ID': this.currentSession.id,
            'X-User-Role': this.currentSession.role,
            'X-User-Country': this.currentSession.country
        };
    },
    
    // Check subscription status for lenders
    checkSubscriptionStatus: function() {
        if (!this.currentSession || this.currentSession.role !== 'lender') {
            return {
                active: false,
                message: 'Not a lender'
            };
        }
        
        const user = this.findUserByPhone(this.currentSession.phone, this.currentSession.country);
        if (!user || !user.subscription) {
            return {
                active: false,
                message: 'No subscription found'
            };
        }
        
        const subscription = user.subscription;
        
        if (subscription.status === 'active') {
            // Check expiry
            const expiryDate = new Date(subscription.expiryDate);
            const today = new Date();
            
            if (expiryDate < today) {
                return {
                    active: false,
                    message: 'Subscription expired',
                    expired: true,
                    expiryDate: expiryDate
                };
            }
            
            return {
                active: true,
                message: 'Subscription active',
                tier: subscription.tier,
                expiryDate: expiryDate
            };
        }
        
        return {
            active: false,
            message: 'Subscription not active',
            status: subscription.status
        };
    }
};

// Initialize auth module when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AuthModule.init());
} else {
    AuthModule.init();
}

// Make AuthModule available globally
window.AuthModule = AuthModule;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthModule;
}