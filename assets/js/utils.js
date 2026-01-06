/**
 * Shared utility functions for M-Pesewa
 */

class MPesewaUtils {
    constructor() {
        this.countries = {
            kenya: { code: 'KE', currency: 'KSh', symbol: 'KSh', language: 'en' },
            uganda: { code: 'UG', currency: 'UGX', symbol: 'USh', language: 'en' },
            tanzania: { code: 'TZ', currency: 'TZS', symbol: 'TSh', language: 'sw' },
            rwanda: { code: 'RW', currency: 'RWF', symbol: 'RF', language: ['en', 'fr'] },
            burundi: { code: 'BI', currency: 'BIF', symbol: 'FBu', language: ['fr', 'rn'] },
            somalia: { code: 'SO', currency: 'SOS', symbol: 'S', language: ['so', 'ar'] },
            'south-sudan': { code: 'SS', currency: 'SSP', symbol: '£', language: 'en' },
            ethiopia: { code: 'ET', currency: 'ETB', symbol: 'Br', language: 'am' },
            drc: { code: 'CD', currency: 'CDF', symbol: 'FC', language: 'fr' },
            nigeria: { code: 'NG', currency: 'NGN', symbol: '₦', language: 'en' },
            'south-africa': { code: 'ZA', currency: 'ZAR', symbol: 'R', language: ['en', 'af', 'zu', 'xh'] },
            ghana: { code: 'GH', currency: 'GHS', symbol: 'GH₵', language: 'en' }
        };
        
        this.emergencyCategories = [
            { id: 'fare', name: 'M-pesewa Fare', icon: '🚌', tagline: 'Move on, don\'t stall—borrow for your journey.' },
            { id: 'data', name: 'M-pesewa Data', icon: '📱', tagline: 'Stay connected, stay informed—borrow when your bundle runs out.' },
            { id: 'wifi', name: 'M-pesewa Wifi', icon: '🌐', tagline: 'Stay online when it matters most.' },
            { id: 'advance', name: 'M-pesewa Advance', icon: '💼', tagline: 'Bridge the gap until payday.' },
            { id: 'cooking-gas', name: 'M-pesewa Cooking Gas', icon: '🔥', tagline: 'Cook with confidence—borrow when your gas is low.' },
            { id: 'food', name: 'M-pesewa Food', icon: '🍲', tagline: 'Don\'t sleep hungry when paycheck is delayed—borrow and eat today.' },
            { id: 'credo', name: 'M-pesewa credo', icon: '🛠️', tagline: 'Fix it fast—borrow for urgent repairs or tools.' },
            { id: 'water-bill', name: 'M-pesewa Water Bill', icon: '💧', tagline: 'Stay hydrated—borrow for water needs or bills.' },
            { id: 'fuel', name: 'M-pesewa Bike Car Tuktuk Fuel', icon: '⛽', tagline: 'Keep moving—borrow for fuel, no matter your ride.' },
            { id: 'repair', name: 'M-pesewa Bike Car Tuktuk Repair', icon: '🔧', tagline: 'Fix it quick—borrow for minor repairs and keep going.' },
            { id: 'medicine', name: 'M-pesewa Medicine', icon: '💊', tagline: 'Health first—borrow for urgent medicines.' },
            { id: 'electricity', name: 'M-pesewa Electricity Tokens', icon: '💡', tagline: 'Stay lit, stay powered—borrow tokens when you need it.' },
            { id: 'school-fees', name: 'M-pesewa school fees', icon: '🎓', tagline: 'Education comes first—borrow for urgent school fees.' },
            { id: 'tv-subscription', name: 'M-pesewa TV Subscription', icon: '📺', tagline: 'Stay informed—borrow for TV subscriptions.' },
            { id: 'daily-sales', name: 'M-Pesa Daily Sales Advance', icon: '💰', tagline: 'Small Loan advance for everyday business.' },
            { id: 'working-capital', name: 'M-Pesa Working Capital Advance', icon: '🏢', tagline: 'Working capital when your business needs it.' }
        ];
        
        this.tierConfig = {
            basic: {
                weeklyLimit: 1500,
                subscription: {
                    monthly: 50,
                    biAnnual: 250,
                    annual: 500
                },
                crb: false,
                features: ['No CRB check', 'Basic verification', 'Max ₵1,500 per loan']
            },
            premium: {
                weeklyLimit: 5000,
                subscription: {
                    monthly: 250,
                    biAnnual: 1500,
                    annual: 2500
                },
                crb: false,
                features: ['No CRB check', 'Enhanced verification', 'Max ₵5,000 per loan']
            },
            super: {
                weeklyLimit: 20000,
                subscription: {
                    monthly: 1000,
                    biAnnual: 5000,
                    annual: 8500
                },
                crb: true,
                features: ['CRB check required', 'Full verification', 'Max ₵20,000 per loan']
            },
            lenderOfLenders: {
                weeklyLimit: 50000,
                subscription: {
                    monthly: 500,
                    biAnnual: 3500,
                    annual: 6500
                },
                crb: true,
                features: ['CRB check required', 'Lend to other lenders', 'Max ₵50,000 per loan', 'Custom interest rates']
            }
        };
    }
    
    /**
     * Format currency based on country
     * @param {number} amount - Amount to format
     * @param {string} country - Country code
     * @param {boolean} showSymbol - Whether to show currency symbol
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount, country = 'kenya', showSymbol = true) {
        const countryConfig = this.countries[country];
        if (!countryConfig) {
            return `₵${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }
        
        const symbol = showSymbol ? countryConfig.symbol : '';
        const formatted = amount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        
        return `${symbol}${formatted}`;
    }
    
    /**
     * Normalize date to local format
     * @param {Date|string} date - Date to normalize
     * @param {string} format - Output format
     * @returns {string} Formatted date
     */
    formatDate(date, format = 'medium') {
        if (!date) return '';
        
        const dateObj = date instanceof Date ? date : new Date(date);
        
        if (isNaN(dateObj.getTime())) {
            return 'Invalid date';
        }
        
        const options = {
            short: {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            },
            medium: {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
            },
            long: {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit'
            },
            timeOnly: {
                hour: '2-digit',
                minute: '2-digit'
            }
        };
        
        const formatOptions = options[format] || options.medium;
        return dateObj.toLocaleDateString('en-US', formatOptions);
    }
    
    /**
     * Calculate days between two dates
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {number} Number of days
     */
    daysBetween(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Reset time portion
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Add days to a date
     * @param {Date} date - Start date
     * @param {number} days - Days to add
     * @returns {Date} New date
     */
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    
    /**
     * Validate phone number
     * @param {string} phone - Phone number to validate
     * @param {string} country - Country code
     * @returns {boolean} True if valid
     */
    validatePhone(phone, country = 'kenya') {
        if (!phone) return false;
        
        // Remove any non-digit characters except leading +
        const cleaned = phone.replace(/[^\d+]/g, '');
        
        const patterns = {
            kenya: /^(\+?254|0)?[17]\d{8}$/,
            uganda: /^(\+?256|0)?[7]\d{8}$/,
            tanzania: /^(\+?255|0)?[67]\d{8}$/,
            rwanda: /^(\+?250|0)?[7]\d{8}$/,
            ghana: /^(\+?233|0)?[235]\d{8}$/,
            nigeria: /^(\+?234|0)?[789]\d{9}$/,
            'south-africa': /^(\+?27|0)?[678]\d{8}$/,
            default: /^\+?[1-9]\d{7,14}$/
        };
        
        const pattern = patterns[country] || patterns.default;
        return pattern.test(cleaned);
    }
    
    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    validateEmail(email) {
        if (!email) return true; // Email is optional
        
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
    }
    
    /**
     * Validate national ID
     * @param {string} id - ID to validate
     * @param {string} country - Country code
     * @returns {boolean} True if valid
     */
    validateNationalId(id, country = 'kenya') {
        if (!id) return false;
        
        const patterns = {
            kenya: /^\d{8}$/, // Kenya ID: 8 digits
            uganda: /^[A-Z]{2}\d{7}$/, // Uganda: 2 letters + 7 digits
            tanzania: /^\d{9}$/, // Tanzania: 9 digits
            ghana: /^GHA-\d{9}-\d$/, // Ghana: GHA-000000000-0
            nigeria: /^\d{11}$/, // Nigeria: 11 digits
            'south-africa': /^\d{13}$/, // South Africa: 13 digits
            default: /^.{6,20}$/ // Default: 6-20 characters
        };
        
        const pattern = patterns[country] || patterns.default;
        return pattern.test(id.trim());
    }
    
    /**
     * Generate unique ID
     * @param {number} length - Length of ID
     * @returns {string} Unique ID
     */
    generateId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    }
    
    /**
     * Generate secure token
     * @param {number} length - Token length
     * @returns {string} Secure token
     */
    generateToken(length = 32) {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        
        return Array.from(array, byte => 
            byte.toString(16).padStart(2, '0')
        ).join('');
    }
    
    /**
     * Safe localStorage wrapper
     */
    storage = {
        /**
         * Set item in localStorage
         * @param {string} key - Storage key
         * @param {any} value - Value to store
         */
        set: (key, value) => {
            try {
                const serialized = JSON.stringify(value);
                localStorage.setItem(`mpesewa_${key}`, serialized);
            } catch (error) {
                console.error('Error saving to localStorage:', error);
            }
        },
        
        /**
         * Get item from localStorage
         * @param {string} key - Storage key
         * @param {any} defaultValue - Default value if not found
         * @returns {any} Stored value or default
         */
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(`mpesewa_${key}`);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error reading from localStorage:', error);
                return defaultValue;
            }
        },
        
        /**
         * Remove item from localStorage
         * @param {string} key - Storage key
         */
        remove: (key) => {
            try {
                localStorage.removeItem(`mpesewa_${key}`);
            } catch (error) {
                console.error('Error removing from localStorage:', error);
            }
        },
        
        /**
         * Clear all app data from localStorage
         */
        clear: () => {
            try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith('mpesewa_')) {
                        localStorage.removeItem(key);
                    }
                });
            } catch (error) {
                console.error('Error clearing localStorage:', error);
            }
        },
        
        /**
         * Check if key exists
         * @param {string} key - Storage key
         * @returns {boolean} True if exists
         */
        has: (key) => {
            return localStorage.getItem(`mpesewa_${key}`) !== null;
        }
    };
    
    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Deep clone object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
        
        return obj;
    }
    
    /**
     * Merge objects deeply
     * @param {...Object} objects - Objects to merge
     * @returns {Object} Merged object
     */
    deepMerge(...objects) {
        const result = {};
        
        objects.forEach(obj => {
            if (!obj) return;
            
            Object.keys(obj).forEach(key => {
                if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                    result[key] = this.deepMerge(result[key] || {}, obj[key]);
                } else {
                    result[key] = obj[key];
                }
            });
        });
        
        return result;
    }
    
    /**
     * Format file size
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Parse query parameters from URL
     * @param {string} url - URL to parse
     * @returns {Object} Query parameters
     */
    parseQueryParams(url = window.location.href) {
        const query = {};
        const urlParts = url.split('?');
        
        if (urlParts.length < 2) return query;
        
        const params = urlParts[1].split('&');
        
        params.forEach(param => {
            const [key, value] = param.split('=');
            if (key) {
                query[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });
        
        return query;
    }
    
    /**
     * Create query string from object
     * @param {Object} params - Parameters object
     * @returns {string} Query string
     */
    createQueryString(params) {
        return Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
    }
    
    /**
     * Sanitize HTML string
     * @param {string} html - HTML to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitizeHTML(html) {
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    }
    
    /**
     * Escape regex special characters
     * @param {string} string - String to escape
     * @returns {string} Escaped string
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * Capitalize first letter of each word
     * @param {string} text - Text to capitalize
     * @returns {string} Capitalized text
     */
    capitalizeWords(text) {
        return text.replace(/\b\w/g, char => char.toUpperCase());
    }
    
    /**
     * Truncate text with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
    
    /**
     * Get browser information
     * @returns {Object} Browser info
     */
    getBrowserInfo() {
        const ua = navigator.userAgent;
        
        return {
            userAgent: ua,
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
            isChrome: /Chrome/.test(ua) && !/Edge/.test(ua),
            isFirefox: /Firefox/.test(ua),
            isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
            isEdge: /Edge/.test(ua),
            isIE: /Trident/.test(ua),
            supportsServiceWorker: 'serviceWorker' in navigator,
            supportsWebPush: 'PushManager' in window,
            supportsIndexedDB: 'indexedDB' in window,
            supportsLocalStorage: 'localStorage' in window
        };
    }
    
    /**
     * Detect network status
     * @returns {Promise<Object>} Network information
     */
    async getNetworkStatus() {
        if (!navigator.onLine) {
            return {
                online: false,
                type: 'offline',
                downlink: 0,
                effectiveType: 'unknown'
            };
        }
        
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return {
                online: true,
                type: connection.type,
                downlink: connection.downlink,
                effectiveType: connection.effectiveType,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        
        return {
            online: true,
            type: 'unknown',
            downlink: 0,
            effectiveType: 'unknown'
        };
    }
    
    /**
     * Load script dynamically
     * @param {string} url - Script URL
     * @returns {Promise} Promise that resolves when script loads
     */
    loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            
            script.onload = resolve;
            script.onerror = reject;
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Load CSS dynamically
     * @param {string} url - CSS URL
     * @returns {Promise} Promise that resolves when CSS loads
     */
    loadCSS(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            
            link.onload = resolve;
            link.onerror = reject;
            
            document.head.appendChild(link);
        });
    }
    
    /**
     * Create UUID v4
     * @returns {string} UUID
     */
    createUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Get country flag emoji
     * @param {string} countryCode - Country code
     * @returns {string} Flag emoji
     */
    getCountryFlag(countryCode) {
        const flags = {
            kenya: '🇰🇪',
            uganda: '🇺🇬',
            tanzania: '🇹🇿',
            rwanda: '🇷🇼',
            burundi: '🇧🇮',
            somalia: '🇸🇴',
            'south-sudan': '🇸🇸',
            ethiopia: '🇪🇹',
            drc: '🇨🇩',
            nigeria: '🇳🇬',
            'south-africa': '🇿🇦',
            ghana: '🇬🇭'
        };
        
        return flags[countryCode] || '🏳️';
    }
    
    /**
     * Get emergency category by ID
     * @param {string} categoryId - Category ID
     * @returns {Object} Category information
     */
    getCategoryInfo(categoryId) {
        return this.emergencyCategories.find(cat => cat.id === categoryId) || 
               { id: categoryId, name: 'Unknown Category', icon: '❓', tagline: '' };
    }
    
    /**
     * Get tier configuration
     * @param {string} tierId - Tier ID
     * @returns {Object} Tier configuration
     */
    getTierConfig(tierId) {
        return this.tierConfig[tierId] || this.tierConfig.basic;
    }
    
    /**
     * Calculate subscription expiry date
     * @param {string} period - Subscription period
     * @param {Date} startDate - Start date
     * @returns {Date} Expiry date
     */
    calculateSubscriptionExpiry(period, startDate = new Date()) {
        const date = new Date(startDate);
        
        switch (period) {
            case 'monthly':
                // Expires on 28th of next month
                date.setMonth(date.getMonth() + 1);
                date.setDate(28);
                break;
            case 'bi-annual':
                // Expires on 28th of month, 6 months later
                date.setMonth(date.getMonth() + 6);
                date.setDate(28);
                break;
            case 'annual':
                // Expires on 28th of month, 12 months later
                date.setFullYear(date.getFullYear() + 1);
                date.setDate(28);
                break;
            default:
                // Default to monthly
                date.setMonth(date.getMonth() + 1);
                date.setDate(28);
        }
        
        return date;
    }
    
    /**
     * Check if subscription is expired
     * @param {Date} expiryDate - Expiry date
     * @returns {boolean} True if expired
     */
    isSubscriptionExpired(expiryDate) {
        return new Date() > new Date(expiryDate);
    }
    
    /**
     * Days until subscription expiry
     * @param {Date} expiryDate - Expiry date
     * @returns {number} Days until expiry
     */
    daysUntilExpiry(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        
        const diffTime = expiry - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Format time ago
     * @param {Date} date - Date to format
     * @returns {string} Time ago string
     */
    timeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const seconds = Math.floor((now - past) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return interval + ' year' + (interval === 1 ? '' : 's') + ' ago';
        
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return interval + ' month' + (interval === 1 ? '' : 's') + ' ago';
        
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return interval + ' day' + (interval === 1 ? '' : 's') + ' ago';
        
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return interval + ' hour' + (interval === 1 ? '' : 's') + ' ago';
        
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return interval + ' minute' + (interval === 1 ? '' : 's') + ' ago';
        
        return 'just now';
    }
    
    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} True if successful
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            return false;
        }
    }
    
    /**
     * Show toast notification
     * @param {Object} options - Toast options
     */
    showToast(options) {
        const defaults = {
            message: '',
            type: 'info', // info, success, warning, error
            duration: 3000,
            position: 'bottom-right'
        };
        
        const config = { ...defaults, ...options };
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${config.type} toast-${config.position}`;
        toast.textContent = config.message;
        
        // Add to document
        document.body.appendChild(toast);
        
        // Show with animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto-remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, config.duration);
    }
    
    /**
     * Get current geolocation
     * @returns {Promise<Object>} Geolocation coordinates
     */
    getGeolocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                position => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    });
                },
                error => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }
}

// Create singleton instance
const utils = new MPesewaUtils();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
} else {
    // Make available globally
    window.MPesewaUtils = utils;
}