// ============================================
// APP.JS - Main application bootstrap, routing, global state
// ============================================

'use strict';

// Global state
const AppState = {
    currentUser: null,
    currentRole: null,
    currentCountry: null,
    isLoggedIn: false,
    isOnline: true,
    pwaInstalled: false
};

// DOM Elements
const DOM = {
    // Navigation
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileMenu: document.getElementById('mobileMenu'),
    closeMenuBtn: document.getElementById('closeMenuBtn'),
    
    // Auth
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
    loginModal: document.getElementById('loginModal'),
    closeLoginModal: document.getElementById('closeLoginModal'),
    
    // Country Selector
    countrySelect: document.getElementById('countrySelect'),
    
    // Registration Forms
    roleTabs: document.querySelectorAll('.role-tab'),
    borrowerForm: document.getElementById('borrowerForm'),
    lenderForm: document.getElementById('lenderForm'),
    
    // PWA
    pwaBanner: document.getElementById('pwaBanner'),
    dismissBanner: document.getElementById('dismissBanner'),
    installApp: document.getElementById('installApp'),
    
    // Calculator
    calcAmount: document.getElementById('calcAmount'),
    calcDays: document.getElementById('calcDays'),
    amountDisplay: document.getElementById('amountDisplay'),
    daysDisplay: document.getElementById('daysDisplay'),
    principalAmount: document.getElementById('principalAmount'),
    interestAmount: document.getElementById('interestAmount'),
    totalRepayment: document.getElementById('totalRepayment'),
    dailyRepayment: document.getElementById('dailyRepayment'),
    tierButtons: document.querySelectorAll('.tier-btn'),
    amountButtons: document.querySelectorAll('.btn-amount'),
    daysButtons: document.querySelectorAll('.btn-days'),
    
    // Tier Selection
    tierCards: document.querySelectorAll('.tier-card'),
    selectedTier: document.getElementById('selectedTier'),
    
    // Forms
    borrowerRegistration: document.getElementById('borrowerRegistration'),
    lenderRegistration: document.getElementById('lenderRegistration'),
    loginForm: document.getElementById('loginForm')
};

// Initialize the application
function initApp() {
    console.log('M-Pesewa PWA initializing...');
    
    // Check online status
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initialize event listeners
    initEventListeners();
    
    // Check authentication state
    checkAuthState();
    
    // Initialize calculator
    initCalculator();
    
    // Initialize PWA
    initPWA();
    
    // Load demo data if needed
    loadDemoData();
    
    // Initialize service worker
    initServiceWorker();
    
    console.log('M-Pesewa PWA initialized');
}

// Event Listeners
function initEventListeners() {
    // Mobile Menu
    DOM.mobileMenuBtn?.addEventListener('click', toggleMobileMenu);
    DOM.closeMenuBtn?.addEventListener('click', toggleMobileMenu);
    
    // Auth Modals
    DOM.loginBtn?.addEventListener('click', () => openModal('login'));
    DOM.registerBtn?.addEventListener('click', () => openModal('register'));
    DOM.closeLoginModal?.addEventListener('click', () => closeModal('login'));
    
    // Role Tabs
    DOM.roleTabs?.forEach(tab => {
        tab.addEventListener('click', () => {
            const role = tab.dataset.role;
            switchRegistrationForm(role);
        });
    });
    
    // Tier Selection
    DOM.tierCards?.forEach(card => {
        card.addEventListener('click', () => {
            const tier = card.dataset.tier;
            selectTier(tier);
        });
    });
    
    // Country Selector
    DOM.countrySelect?.addEventListener('change', (e) => {
        const country = e.target.value;
        if (country) {
            window.location.href = `/pages/countries/${country}.html`;
        }
    });
    
    // Calculator
    if (DOM.calcAmount && DOM.calcDays) {
        DOM.calcAmount.addEventListener('input', updateCalculator);
        DOM.calcDays.addEventListener('input', updateCalculator);
        
        DOM.amountButtons?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = e.target.dataset.amount;
                setCalculatorAmount(parseInt(amount));
            });
        });
        
        DOM.daysButtons?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const days = e.target.dataset.days;
                setCalculatorDays(parseInt(days));
            });
        });
        
        DOM.tierButtons?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tier = e.target.dataset.tier;
                const maxAmount = parseInt(e.target.dataset.max);
                selectCalculatorTier(tier, maxAmount);
            });
        });
    }
    
    // Form Submissions
    DOM.borrowerRegistration?.addEventListener('submit', handleBorrowerRegistration);
    DOM.lenderRegistration?.addEventListener('submit', handleLenderRegistration);
    DOM.loginForm?.addEventListener('submit', handleLogin);
    
    // PWA
    DOM.dismissBanner?.addEventListener('click', dismissPWABanner);
    DOM.installApp?.addEventListener('click', installPWA);
    
    // Close modals on outside click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Close mobile menu on link click
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', toggleMobileMenu);
    });
}

// Mobile Menu
function toggleMobileMenu() {
    if (!DOM.mobileMenu) return;
    
    if (DOM.mobileMenu.classList.contains('active')) {
        DOM.mobileMenu.classList.remove('active');
        document.body.style.overflow = 'auto';
    } else {
        DOM.mobileMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Modal Management
function openModal(modalType) {
    const modal = document.getElementById(`${modalType}Modal`);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalType) {
    const modal = document.getElementById(`${modalType}Modal`);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Registration Form Switching
function switchRegistrationForm(role) {
    // Update active tab
    DOM.roleTabs?.forEach(tab => {
        if (tab.dataset.role === role) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Show appropriate form
    switch (role) {
        case 'borrower':
            DOM.borrowerForm?.classList.add('active');
            DOM.lenderForm?.classList.remove('active');
            break;
        case 'lender':
            DOM.borrowerForm?.classList.remove('active');
            DOM.lenderForm?.classList.add('active');
            break;
        case 'both':
            // For both, show lender form first (requires subscription)
            DOM.borrowerForm?.classList.remove('active');
            DOM.lenderForm?.classList.add('active');
            break;
    }
}

// Tier Selection
function selectTier(tier) {
    DOM.tierCards?.forEach(card => {
        if (card.dataset.tier === tier) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
    
    if (DOM.selectedTier) {
        DOM.selectedTier.value = tier;
    }
}

// Authentication
function checkAuthState() {
    const user = localStorage.getItem('mpesewa_user');
    if (user) {
        try {
            AppState.currentUser = JSON.parse(user);
            AppState.currentRole = localStorage.getItem('mpesewa_role');
            AppState.currentCountry = localStorage.getItem('mpesewa_country');
            AppState.isLoggedIn = true;
            updateAuthUI();
        } catch (e) {
            console.error('Error parsing user data:', e);
            clearAuth();
        }
    }
}

function updateAuthUI() {
    if (AppState.isLoggedIn) {
        DOM.loginBtn.textContent = 'Dashboard';
        DOM.registerBtn.textContent = 'Logout';
        
        // Update event listeners
        DOM.loginBtn.removeEventListener('click', () => openModal('login'));
        DOM.loginBtn.addEventListener('click', () => {
            window.location.href = `/pages/dashboard/${AppState.currentRole}-dashboard.html`;
        });
        
        DOM.registerBtn.removeEventListener('click', () => openModal('register'));
        DOM.registerBtn.addEventListener('click', logout);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const country = document.getElementById('loginCountry')?.value;
    const phone = document.getElementById('loginPhone')?.value;
    const password = document.getElementById('loginPassword')?.value;
    
    if (!country || !phone || !password) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    // Mock authentication - in production, this would call an API
    const mockUser = {
        id: 'user_' + Date.now(),
        phone: phone,
        country: country,
        name: 'Demo User',
        role: 'borrower', // Default role
        subscription: null
    };
    
    // Save to localStorage
    localStorage.setItem('mpesewa_user', JSON.stringify(mockUser));
    localStorage.setItem('mpesewa_role', 'borrower');
    localStorage.setItem('mpesewa_country', country);
    
    // Update state
    AppState.currentUser = mockUser;
    AppState.currentRole = 'borrower';
    AppState.currentCountry = country;
    AppState.isLoggedIn = true;
    
    // Update UI
    updateAuthUI();
    
    // Close modal
    closeModal('login');
    
    // Show success message
    showNotification('Login successful! Redirecting to dashboard...', 'success');
    
    // Redirect to dashboard after delay
    setTimeout(() => {
        window.location.href = `/pages/dashboard/borrower-dashboard.html`;
    }, 1500);
}

async function handleBorrowerRegistration(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        fullName: document.getElementById('borrowerFullName')?.value,
        nationalId: document.getElementById('borrowerNationalId')?.value,
        phone: document.getElementById('borrowerPhone')?.value,
        email: document.getElementById('borrowerEmail')?.value,
        country: document.getElementById('borrowerCountry')?.value,
        location: document.getElementById('borrowerLocation')?.value,
        occupation: document.getElementById('borrowerOccupation')?.value,
        nextOfKinPhone: document.getElementById('nextOfKinPhone')?.value,
        guarantor1Name: document.getElementById('guarantor1Name')?.value,
        guarantor1Phone: document.getElementById('guarantor1Phone')?.value,
        guarantor2Name: document.getElementById('guarantor2Name')?.value,
        guarantor2Phone: document.getElementById('guarantor2Phone')?.value,
        categories: Array.from(document.querySelectorAll('input[name="borrowerCategories"]:checked')).map(cb => cb.value)
    };
    
    // Validate required fields
    const required = ['fullName', 'nationalId', 'phone', 'country', 'location', 'occupation', 'nextOfKinPhone'];
    for (const field of required) {
        if (!formData[field]) {
            showNotification(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
            return;
        }
    }
    
    // Validate guarantors
    if (!formData.guarantor1Name || !formData.guarantor1Phone || 
        !formData.guarantor2Name || !formData.guarantor2Phone) {
        showNotification('Please provide both guarantors with phone numbers', 'error');
        return;
    }
    
    // Create user object
    const user = {
        id: 'borrower_' + Date.now(),
        ...formData,
        role: 'borrower',
        rating: 5.0,
        blacklisted: false,
        groups: [],
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('mpesewa_user', JSON.stringify(user));
    localStorage.setItem('mpesewa_role', 'borrower');
    localStorage.setItem('mpesewa_country', formData.country);
    
    // Update state
    AppState.currentUser = user;
    AppState.currentRole = 'borrower';
    AppState.currentCountry = formData.country;
    AppState.isLoggedIn = true;
    
    // Update UI
    updateAuthUI();
    
    // Show success message
    showNotification('Borrower registration successful! Redirecting to dashboard...', 'success');
    
    // Redirect to dashboard after delay
    setTimeout(() => {
        window.location.href = `/pages/dashboard/borrower-dashboard.html`;
    }, 1500);
}

async function handleLenderRegistration(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        fullName: document.getElementById('lenderFullName')?.value,
        brandName: document.getElementById('lenderBrandName')?.value,
        phone: document.getElementById('lenderPhone')?.value,
        email: document.getElementById('lenderEmail')?.value,
        country: document.getElementById('lenderCountry')?.value,
        location: document.getElementById('lenderLocation')?.value,
        tier: DOM.selectedTier?.value || 'premium',
        categories: Array.from(document.querySelectorAll('input[name="lenderCategories"]:checked')).map(cb => cb.value)
    };
    
    // Validate required fields
    const required = ['fullName', 'phone', 'country', 'location', 'tier'];
    for (const field of required) {
        if (!formData[field]) {
            showNotification(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
            return;
        }
    }
    
    // Create user object
    const user = {
        id: 'lender_' + Date.now(),
        ...formData,
        role: 'lender',
        subscription: {
            tier: formData.tier,
            status: 'pending_payment',
            expiry: null
        },
        ledgers: [],
        totalLent: 0,
        totalOutstanding: 0,
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('mpesewa_user', JSON.stringify(user));
    localStorage.setItem('mpesewa_role', 'lender');
    localStorage.setItem('mpesewa_country', formData.country);
    
    // Update state
    AppState.currentUser = user;
    AppState.currentRole = 'lender';
    AppState.currentCountry = formData.country;
    AppState.isLoggedIn = true;
    
    // Update UI
    updateAuthUI();
    
    // Show subscription payment notice
    showNotification('Lender registration successful! Please complete subscription payment.', 'info');
    
    // Simulate redirect to payment page
    setTimeout(() => {
        window.location.href = `/pages/subscriptions.html?tier=${formData.tier}`;
    }, 2000);
}

function logout() {
    clearAuth();
    showNotification('Logged out successfully', 'success');
    window.location.reload();
}

function clearAuth() {
    localStorage.removeItem('mpesewa_user');
    localStorage.removeItem('mpesewa_role');
    localStorage.removeItem('mpesewa_country');
    
    AppState.currentUser = null;
    AppState.currentRole = null;
    AppState.currentCountry = null;
    AppState.isLoggedIn = false;
    
    // Reset UI
    DOM.loginBtn.textContent = 'Login';
    DOM.registerBtn.textContent = 'Get Started';
    
    // Reset event listeners
    DOM.loginBtn.removeEventListener('click', () => {
        window.location.href = `/pages/dashboard/${AppState.currentRole}-dashboard.html`;
    });
    DOM.loginBtn.addEventListener('click', () => openModal('login'));
    
    DOM.registerBtn.removeEventListener('click', logout);
    DOM.registerBtn.addEventListener('click', () => openModal('register'));
}

// Loan Calculator
function initCalculator() {
    if (!DOM.calcAmount || !DOM.calcDays) return;
    
    // Set initial values
    updateCalculator();
    
    // Set initial tier
    const activeTierBtn = document.querySelector('.tier-btn.active');
    if (activeTierBtn) {
        const maxAmount = parseInt(activeTierBtn.dataset.max);
        DOM.calcAmount.max = maxAmount;
        if (parseInt(DOM.calcAmount.value) > maxAmount) {
            DOM.calcAmount.value = maxAmount;
            updateCalculator();
        }
    }
}

function updateCalculator() {
    if (!DOM.calcAmount || !DOM.calcDays) return;
    
    const amount = parseInt(DOM.calcAmount.value);
    const days = parseInt(DOM.calcDays.value);
    
    // Update displays
    if (DOM.amountDisplay) {
        DOM.amountDisplay.textContent = formatCurrency(amount);
    }
    
    if (DOM.daysDisplay) {
        DOM.daysDisplay.textContent = `${days} day${days !== 1 ? 's' : ''}`;
    }
    
    // Calculate values
    const interestRate = 0.10; // 10% weekly
    const interest = amount * interestRate * (days / 7);
    const total = amount + interest;
    const daily = days > 0 ? total / days : 0;
    
    // Update result displays
    if (DOM.principalAmount) {
        DOM.principalAmount.textContent = formatCurrency(amount);
    }
    if (DOM.interestAmount) {
        DOM.interestAmount.textContent = formatCurrency(interest);
    }
    if (DOM.totalRepayment) {
        DOM.totalRepayment.textContent = formatCurrency(total);
    }
    if (DOM.dailyRepayment) {
        DOM.dailyRepayment.textContent = formatCurrency(daily);
    }
}

function setCalculatorAmount(amount) {
    if (!DOM.calcAmount) return;
    
    // Check against current tier max
    const activeTierBtn = document.querySelector('.tier-btn.active');
    if (activeTierBtn) {
        const maxAmount = parseInt(activeTierBtn.dataset.max);
        amount = Math.min(amount, maxAmount);
    }
    
    DOM.calcAmount.value = amount;
    updateCalculator();
}

function setCalculatorDays(days) {
    if (!DOM.calcDays) return;
    DOM.calcDays.value = days;
    updateCalculator();
}

function selectCalculatorTier(tier, maxAmount) {
    // Update active tier button
    DOM.tierButtons?.forEach(btn => {
        if (btn.dataset.tier === tier) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update calculator max
    if (DOM.calcAmount) {
        DOM.calcAmount.max = maxAmount;
        if (parseInt(DOM.calcAmount.value) > maxAmount) {
            DOM.calcAmount.value = maxAmount;
        }
        updateCalculator();
    }
}

// PWA Functions
function initPWA() {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        AppState.pwaInstalled = true;
        if (DOM.pwaBanner) {
            DOM.pwaBanner.style.display = 'none';
        }
    }
    
    // Listen for beforeinstallprompt event
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        
        // Show install banner if not dismissed
        if (!localStorage.getItem('pwaBannerDismissed') && DOM.pwaBanner) {
            DOM.pwaBanner.style.display = 'flex';
        }
    });
    
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
        AppState.pwaInstalled = true;
        if (DOM.pwaBanner) {
            DOM.pwaBanner.style.display = 'none';
        }
        showNotification('App installed successfully!', 'success');
    });
}

function dismissPWABanner() {
    if (DOM.pwaBanner) {
        DOM.pwaBanner.style.display = 'none';
        localStorage.setItem('pwaBannerDismissed', 'true');
    }
}

async function installPWA() {
    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        window.deferredPrompt = null;
    }
}

// Service Worker
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        });
    }
}

// Online/Offline Status
function updateOnlineStatus() {
    AppState.isOnline = navigator.onLine;
    
    if (!AppState.isOnline) {
        showNotification('You are offline. Some features may be limited.', 'warning');
    }
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Add icon based on type
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Add show class after a delay
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });
}

// Utility Functions
function formatCurrency(amount, country = AppState.currentCountry || 'kenya') {
    const currencies = {
        kenya: { symbol: 'KSh', decimal: 2 },
        uganda: { symbol: 'UGX', decimal: 0 },
        tanzania: { symbol: 'TZS', decimal: 0 },
        rwanda: { symbol: 'RWF', decimal: 0 },
        burundi: { symbol: 'BIF', decimal: 0 },
        somalia: { symbol: 'SOS', decimal: 0 },
        'south-sudan': { symbol: 'SSP', decimal: 2 },
        ethiopia: { symbol: 'ETB', decimal: 2 },
        drc: { symbol: 'CDF', decimal: 2 },
        nigeria: { symbol: '₦', decimal: 2 },
        'south-africa': { symbol: 'R', decimal: 2 },
        ghana: { symbol: '₵', decimal: 2 }
    };
    
    const config = currencies[country] || { symbol: '₵', decimal: 2 };
    const formatted = amount.toFixed(config.decimal).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    return `${config.symbol}${formatted}`;
}

function loadDemoData() {
    // Check if demo data is already loaded
    if (localStorage.getItem('demoDataLoaded')) {
        return;
    }
    
    // Load demo data from JSON files (mocked for now)
    const demoData = {
        countries: [],
        subscriptions: [],
        categories: [],
        collectors: [],
        groups: [],
        users: [],
        ledgers: []
    };
    
    // Save flag to localStorage
    localStorage.setItem('demoDataLoaded', 'true');
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Make AppState available globally for debugging
window.AppState = AppState;
window.DOM = DOM;

// Export utility functions
window.formatCurrency = formatCurrency;
window.showNotification = showNotification;
function trackEvent(category, action, label) {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      'event_category': category,
      'event_label': label
    });
  }
}





