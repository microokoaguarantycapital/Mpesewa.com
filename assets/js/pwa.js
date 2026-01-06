/**
 * Progressive Web App functionality for M-Pesewa
 * Handles service worker registration, install prompts, and offline features
 */

class MPesewaPWA {
    constructor() {
        this.deferredPrompt = null;
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone;
        this.serviceWorker = null;
        
        this.initialize();
    }
    
    /**
     * Initialize PWA functionality
     */
    initialize() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupOfflineDetection();
        this.addToHomeScreen();
        this.setupUpdateChecks();
    }
    
    /**
     * Register service worker for offline functionality
     */
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service workers are not supported');
            return;
        }
        
        try {
            this.serviceWorker = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });
            
            console.log('Service Worker registered:', this.serviceWorker);
            
            // Listen for updates
            this.serviceWorker.addEventListener('updatefound', () => {
                const newWorker = this.serviceWorker.installing;
                console.log('New service worker found:', newWorker);
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateAvailable();
                    }
                });
            });
            
            // Check for updates periodically
            setInterval(() => {
                this.serviceWorker.update();
            }, 60 * 60 * 1000); // Check every hour
            
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
    
    /**
     * Setup install prompt handling
     */
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            
            // Stash the event so it can be triggered later
            this.deferredPrompt = e;
            
            // Show install button or banner
            this.showInstallBanner();
            
            // Log install availability
            console.log('PWA install prompt available');
        });
        
        // Track successful installation
        window.addEventListener('appinstalled', (evt) => {
            console.log('PWA was installed successfully');
            this.deferredPrompt = null;
            this.hideInstallBanner();
            
            // Track installation
            this.trackInstallation();
        });
    }
    
    /**
     * Setup offline/online detection
     */
    setupOfflineDetection() {
        // Update UI based on connectivity
        const updateOnlineStatus = () => {
            const isOnline = navigator.onLine;
            document.documentElement.classList.toggle('offline', !isOnline);
            
            if (!isOnline) {
                this.showOfflineNotification();
            } else {
                this.hideOfflineNotification();
            }
        };
        
        // Listen for online/offline events
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        // Set initial state
        updateOnlineStatus();
    }
    
    /**
     * Show install banner
     */
    showInstallBanner() {
        // Check if already installed
        if (this.isStandalone || this.isInstalled()) {
            return;
        }
        
        // Create banner if it doesn't exist
        let banner = document.getElementById('pwaBanner');
        if (!banner) {
            banner = this.createInstallBanner();
            document.body.appendChild(banner);
        }
        
        // Show banner with animation
        setTimeout(() => {
            banner.classList.add('visible');
        }, 3000); // Show after 3 seconds
        
        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            if (banner.classList.contains('visible')) {
                this.hideInstallBanner();
            }
        }, 30000);
    }
    
    /**
     * Create install banner
     * @returns {HTMLElement} Banner element
     */
    createInstallBanner() {
        const banner = document.createElement('div');
        banner.id = 'pwaBanner';
        banner.className = 'pwa-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <div class="banner-icon">📱</div>
                <div class="banner-text">
                    <h4>Install M-Pesewa App</h4>
                    <p>Get faster access, work offline, and receive notifications</p>
                </div>
            </div>
            <div class="banner-actions">
                <button class="btn btn-outline btn-small" id="dismissBanner">Later</button>
                <button class="btn btn-primary btn-small" id="installApp">Install</button>
            </div>
        `;
        
        // Add event listeners
        banner.querySelector('#installApp').addEventListener('click', () => this.promptInstall());
        banner.querySelector('#dismissBanner').addEventListener('click', () => this.hideInstallBanner());
        
        return banner;
    }
    
    /**
     * Hide install banner
     */
    hideInstallBanner() {
        const banner = document.getElementById('pwaBanner');
        if (banner) {
            banner.classList.remove('visible');
            setTimeout(() => {
                if (banner.parentNode) {
                    banner.parentNode.removeChild(banner);
                }
            }, 300);
        }
    }
    
    /**
     * Prompt user to install PWA
     */
    async promptInstall() {
        if (!this.deferredPrompt) {
            console.log('Install prompt not available');
            return;
        }
        
        try {
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            const choiceResult = await this.deferredPrompt.userChoice;
            
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            
            // Clear the deferred prompt
            this.deferredPrompt = null;
            
            // Hide banner
            this.hideInstallBanner();
            
        } catch (error) {
            console.error('Error showing install prompt:', error);
        }
    }
    
    /**
     * Check if app is installed
     * @returns {boolean} True if app is installed
     */
    isInstalled() {
        return this.isStandalone || 
               window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone;
    }
    
    /**
     * Show offline notification
     */
    showOfflineNotification() {
        // Create notification if it doesn't exist
        let notification = document.getElementById('offlineNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'offlineNotification';
            notification.className = 'offline-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <div class="notification-icon">📶</div>
                    <div class="notification-text">
                        <h5>You are offline</h5>
                        <p>Using cached content. Some features may be limited.</p>
                    </div>
                </div>
            `;
            document.body.appendChild(notification);
        }
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('visible');
        }, 100);
    }
    
    /**
     * Hide offline notification
     */
    hideOfflineNotification() {
        const notification = document.getElementById('offlineNotification');
        if (notification) {
            notification.classList.remove('visible');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }
    
    /**
     * Show update available notification
     */
    showUpdateAvailable() {
        // Create update notification
        const notification = document.createElement('div');
        notification.id = 'updateNotification';
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">🔄</div>
                <div class="notification-text">
                    <h5>Update Available</h5>
                    <p>A new version of M-Pesewa is available.</p>
                </div>
                <button class="btn btn-primary btn-small" id="reloadApp">Update Now</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('visible');
        }, 100);
        
        // Add event listener for reload button
        notification.querySelector('#reloadApp').addEventListener('click', () => {
            this.reloadApp();
        });
        
        // Auto-hide after 30 seconds
        setTimeout(() => {
            if (notification.classList.contains('visible')) {
                this.hideUpdateNotification();
            }
        }, 30000);
    }
    
    /**
     * Hide update notification
     */
    hideUpdateNotification() {
        const notification = document.getElementById('updateNotification');
        if (notification) {
            notification.classList.remove('visible');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }
    
    /**
     * Reload app to apply updates
     */
    reloadApp() {
        if (this.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
        
        window.location.reload();
    }
    
    /**
     * Setup periodic update checks
     */
    setupUpdateChecks() {
        // Check for updates every 4 hours
        setInterval(() => {
            if (this.serviceWorker) {
                this.serviceWorker.update();
            }
        }, 4 * 60 * 60 * 1000);
        
        // Listen for controller change (update applied)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('New service worker activated');
            this.showUpdateAppliedNotification();
        });
    }
    
    /**
     * Show update applied notification
     */
    showUpdateAppliedNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-applied-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">✅</div>
                <div class="notification-text">
                    <h5>App Updated</h5>
                    <p>M-Pesewa has been updated to the latest version.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('visible');
        }, 100);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
    
    /**
     * Track installation for analytics
     */
    trackInstallation() {
        // Store installation flag in localStorage
        localStorage.setItem('mpesewa_installed', 'true');
        localStorage.setItem('mpesewa_install_date', new Date().toISOString());
        
        // Send analytics event (placeholder)
        console.log('PWA installation tracked');
    }
    
    /**
     * Add to home screen functionality
     */
    addToHomeScreen() {
        // Only show on mobile devices
        if (!this.isMobile()) return;
        
        // Check if already shown recently
        const lastShown = localStorage.getItem('mpesewa_addToHome_shown');
        if (lastShown) {
            const lastShownDate = new Date(lastShown);
            const daysSinceShown = (new Date() - lastShownDate) / (1000 * 60 * 60 * 24);
            if (daysSinceShown < 7) return; // Only show once per week
        }
        
        // Show add to home screen instructions
        setTimeout(() => {
            this.showAddToHomeInstructions();
            localStorage.setItem('mpesewa_addToHome_shown', new Date().toISOString());
        }, 10000); // Show after 10 seconds
    }
    
    /**
     * Check if device is mobile
     * @returns {boolean} True if mobile device
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * Show add to home screen instructions
     */
    showAddToHomeInstructions() {
        if (this.isInstalled()) return;
        
        const instructions = document.createElement('div');
        instructions.id = 'addToHomeInstructions';
        instructions.className = 'add-to-home-instructions';
        
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        if (isIOS) {
            instructions.innerHTML = `
                <div class="instructions-content">
                    <div class="instructions-icon">📱</div>
                    <div class="instructions-text">
                        <h5>Add to Home Screen</h5>
                        <p>Tap <span class="share-icon">⎋</span> then "Add to Home Screen"</p>
                    </div>
                    <button class="btn btn-outline btn-small" id="closeInstructions">Got it</button>
                </div>
                <div class="instructions-arrow">↑</div>
            `;
        } else {
            instructions.innerHTML = `
                <div class="instructions-content">
                    <div class="instructions-icon">📱</div>
                    <div class="instructions-text">
                        <h5>Install App</h5>
                        <p>Tap the menu button and select "Install app"</p>
                    </div>
                    <button class="btn btn-outline btn-small" id="closeInstructions">Got it</button>
                </div>
            `;
        }
        
        document.body.appendChild(instructions);
        
        // Show instructions
        setTimeout(() => {
            instructions.classList.add('visible');
        }, 100);
        
        // Add event listener for close button
        instructions.querySelector('#closeInstructions').addEventListener('click', () => {
            instructions.classList.remove('visible');
            setTimeout(() => {
                if (instructions.parentNode) {
                    instructions.parentNode.removeChild(instructions);
                }
            }, 300);
        });
        
        // Auto-hide after 15 seconds
        setTimeout(() => {
            if (instructions.classList.contains('visible')) {
                instructions.classList.remove('visible');
                setTimeout(() => {
                    if (instructions.parentNode) {
                        instructions.parentNode.removeChild(instructions);
                    }
                }, 300);
            }
        }, 15000);
    }
    
    /**
     * Check cache status
     * @returns {Promise<Object>} Cache information
     */
    async checkCacheStatus() {
        if (!('caches' in window)) {
            return { supported: false };
        }
        
        try {
            const cacheNames = await caches.keys();
            const cacheInfo = [];
            
            for (const cacheName of cacheNames) {
                const cache = await caches.open(cacheName);
                const requests = await cache.keys();
                cacheInfo.push({
                    name: cacheName,
                    size: requests.length,
                    urls: requests.map(req => req.url)
                });
            }
            
            return {
                supported: true,
                caches: cacheInfo,
                totalCaches: cacheInfo.length
            };
            
        } catch (error) {
            console.error('Error checking cache:', error);
            return { supported: false, error: error.message };
        }
    }
    
    /**
     * Clear all caches
     * @returns {Promise<boolean>} True if successful
     */
    async clearAllCaches() {
        if (!('caches' in window)) return false;
        
        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log('All caches cleared');
            return true;
        } catch (error) {
            console.error('Error clearing caches:', error);
            return false;
        }
    }
    
    /**
     * Get storage usage estimate
     * @returns {Promise<Object>} Storage estimate
     */
    async getStorageEstimate() {
        if (!('storage' in navigator && 'estimate' in navigator.storage)) {
            return { supported: false };
        }
        
        try {
            const estimate = await navigator.storage.estimate();
            return {
                supported: true,
                usage: estimate.usage,
                quota: estimate.quota,
                usagePercentage: estimate.quota ? (estimate.usage / estimate.quota * 100).toFixed(2) : 0
            };
        } catch (error) {
            console.error('Error getting storage estimate:', error);
            return { supported: false, error: error.message };
        }
    }
    
    /**
     * Request persistent storage
     * @returns {Promise<boolean>} True if persistent storage granted
     */
    async requestPersistentStorage() {
        if (!('storage' in navigator && 'persist' in navigator.storage)) {
            return false;
        }
        
        try {
            const isPersisted = await navigator.storage.persist();
            console.log('Persistent storage granted:', isPersisted);
            return isPersisted;
        } catch (error) {
            console.error('Error requesting persistent storage:', error);
            return false;
        }
    }
    
    /**
     * Send push notification (placeholder for future implementation)
     * @param {Object} options - Notification options
     */
    async sendNotification(options) {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return;
        }
        
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('Notification permission denied');
                return;
            }
        }
        
        if (Notification.permission === 'granted') {
            const notification = new Notification(options.title || 'M-Pesewa', {
                body: options.body || '',
                icon: options.icon || '/assets/images/logo.svg',
                badge: options.badge || '/assets/images/badge.png',
                tag: options.tag || 'mpesewa-notification',
                requireInteraction: options.requireInteraction || false,
                data: options.data || {}
            });
            
            notification.onclick = (event) => {
                event.preventDefault();
                window.focus();
                notification.close();
                
                if (options.onClick) {
                    options.onClick();
                }
            };
            
            return notification;
        }
    }
    
    /**
     * Check notification permission
     * @returns {string} Permission status
     */
    checkNotificationPermission() {
        if (!('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission;
    }
    
    /**
     * Request notification permission
     * @returns {Promise<string>} Permission status
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            return 'unsupported';
        }
        
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission;
        }
        
        return Notification.permission;
    }
}

// Initialize PWA when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.MPesewaPWA = new MPesewaPWA();
    });
} else {
    window.MPesewaPWA = new MPesewaPWA();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MPesewaPWA;
}