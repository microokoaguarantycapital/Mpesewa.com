// /assets/js/subscriptions.js

/**
 * M-Pesewa Subscription Management System
 * Handles subscription tiers, expiry dates, payment tracking, and lender access control
 * Strict rule: Subscription expires 28th of each month, expired = no access
 */

class SubscriptionSystem {
    constructor() {
        this.storageKey = 'mpesewa-subscriptions';
        this.lendersKey = 'mpesewa-lenders';
        this.transactionsKey = 'mpesewa-subscription-transactions';
        this.currentPage = 1;
        this.itemsPerPage = 15;
        this.currentFilter = 'all';
        this.initialize();
    }

    initialize() {
        this.loadSubscriptions();
        this.loadLenders();
        this.loadTransactions();
        this.setupEventListeners();
        this.renderSubscriptionsTable();
        this.renderUpcomingRenewals();
        this.updateStats();
        this.checkExpirations();
        this.setupAutoCheck();
    }

    // Subscription Tier Definitions
    getTierDefinitions() {
        return {
            'basic': {
                name: 'Basic Tier',
                description: 'Entry-level lending for small emergency loans',
                weeklyLimit: 1500,
                monthlyLimit: 6000,
                annualLimit: 78000,
                pricing: {
                    monthly: 50,
                    biAnnual: 250,
                    annual: 500
                },
                features: [
                    'Max ₵1,500 per loan',
                    'No CRB checks required',
                    'Basic borrower verification',
                    'Up to 10 active loans',
                    'Standard support'
                ],
                color: '#0A65FC',
                icon: '📊',
                crbRequired: false,
                borrowerSubscription: false
            },
            'premium': {
                name: 'Premium Tier',
                description: 'Enhanced lending for medium-sized emergency loans',
                weeklyLimit: 5000,
                monthlyLimit: 20000,
                annualLimit: 260000,
                pricing: {
                    monthly: 250,
                    biAnnual: 1500,
                    annual: 2500
                },
                features: [
                    'Max ₵5,000 per loan',
                    'No CRB checks required',
                    'Enhanced borrower verification',
                    'Up to 25 active loans',
                    'Priority support',
                    'Advanced analytics'
                ],
                color: '#20BF6F',
                icon: '⭐',
                crbRequired: false,
                borrowerSubscription: false
            },
            'super': {
                name: 'Super Tier',
                description: 'Professional lending for larger emergency loans',
                weeklyLimit: 20000,
                monthlyLimit: 80000,
                annualLimit: 1040000,
                pricing: {
                    monthly: 1000,
                    biAnnual: 5000,
                    annual: 8500
                },
                features: [
                    'Max ₵20,000 per loan',
                    'CRB checks included',
                    'Full borrower verification',
                    'Unlimited active loans',
                    'Dedicated support',
                    'Advanced reporting',
                    'Early access to features'
                ],
                color: '#FF9F1C',
                icon: '🚀',
                crbRequired: true,
                borrowerSubscription: true
            },
            'lender-of-lenders': {
                name: 'Lender of Lenders',
                description: 'Elite tier for institutional and high-volume lending',
                weeklyLimit: 50000,
                monthlyLimit: 200000,
                annualLimit: 2600000,
                pricing: {
                    monthly: 3500,
                    biAnnual: 6500,
                    annual: 8500
                },
                features: [
                    'Max ₵50,000 per loan',
                    'CRB checks included',
                    'Institutional verification',
                    'Unlimited active loans',
                    '24/7 dedicated support',
                    'Custom reporting API',
                    'Whitelabel options',
                    'Priority debt collection'
                ],
                color: '#061257',
                icon: '👑',
                crbRequired: true,
                borrowerSubscription: true,
                specialRules: true
            }
        };
    }

    loadSubscriptions() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            this.subscriptions = JSON.parse(stored);
        } else {
            this.subscriptions = this.getDemoSubscriptions();
            this.saveSubscriptions();
        }
        
        this.filteredSubscriptions = this.filterSubscriptions();
    }

    loadLenders() {
        const stored = localStorage.getItem(this.lendersKey);
        if (stored) {
            this.lenders = JSON.parse(stored);
        } else {
            this.lenders = {};
            // Try to load from demo users
            try {
                const demoUsers = JSON.parse(localStorage.getItem('mpesewa-users') || '[]');
                this.lenders = demoUsers.filter(u => u.role === 'lender').reduce((acc, lender) => {
                    acc[lender.id] = lender;
                    return acc;
                }, {});
            } catch (e) {
                this.lenders = {};
            }
        }
    }

    loadTransactions() {
        const stored = localStorage.getItem(this.transactionsKey);
        if (stored) {
            this.transactions = JSON.parse(stored);
        } else {
            this.transactions = this.getDemoTransactions();
            this.saveTransactions();
        }
    }

    getDemoSubscriptions() {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        
        // Create subscriptions for demo lenders
        const subscriptions = [];
        const tiers = ['basic', 'premium', 'super', 'lender-of-lenders'];
        const periods = ['monthly', 'biAnnual', 'annual'];
        
        for (let i = 0; i < 20; i++) {
            const tier = tiers[i % 4];
            const period = periods[i % 3];
            const lenderId = `lender-${i + 1}`;
            const startDate = new Date(currentYear, currentMonth - (i % 6), 1 + (i % 28));
            
            // Calculate expiry date based on period
            let expiryDate = new Date(startDate);
            if (period === 'monthly') {
                expiryDate.setMonth(expiryDate.getMonth() + 1);
                // Set to 28th of the month
                expiryDate.setDate(28);
            } else if (period === 'biAnnual') {
                expiryDate.setMonth(expiryDate.getMonth() + 6);
                expiryDate.setDate(28);
            } else if (period === 'annual') {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                expiryDate.setDate(28);
                expiryDate.setMonth(11); // December
            }
            
            // Some subscriptions are expired
            const isExpired = i % 5 === 0 && new Date() > expiryDate;
            
            subscriptions.push({
                id: `sub-${Date.now()}-${i}`,
                lenderId: lenderId,
                lenderName: `Lender ${i + 1}`,
                tier: tier,
                period: period,
                amount: this.getTierDefinitions()[tier].pricing[period],
                status: isExpired ? 'expired' : 'active',
                startDate: startDate.toISOString(),
                expiryDate: expiryDate.toISOString(),
                lastPaymentDate: startDate.toISOString(),
                nextPaymentDate: this.calculateNextPaymentDate(startDate, period),
                autoRenew: i % 3 !== 0,
                paymentMethod: ['mpesa', 'bank-transfer', 'card'][i % 3],
                transactionId: `txn-${Date.now()}-${i}`,
                country: ['kenya', 'uganda', 'tanzania', 'rwanda', 'ghana'][i % 5],
                createdAt: startDate.toISOString(),
                updatedAt: new Date().toISOString(),
                notes: i % 4 === 0 ? 'Early renewal discount applied' : ''
            });
        }
        
        return subscriptions;
    }

    getDemoTransactions() {
        const transactions = [];
        const today = new Date();
        
        for (let i = 0; i < 50; i++) {
            const tier = ['basic', 'premium', 'super', 'lender-of-lenders'][i % 4];
            const period = ['monthly', 'biAnnual', 'annual'][i % 3];
            const amount = this.getTierDefinitions()[tier].pricing[period];
            const date = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
            
            transactions.push({
                id: `txn-${Date.now()}-${i}`,
                subscriptionId: `sub-${i}`,
                lenderId: `lender-${i % 20 + 1}`,
                lenderName: `Lender ${i % 20 + 1}`,
                tier: tier,
                period: period,
                amount: amount,
                paymentMethod: ['mpesa', 'bank-transfer', 'card'][i % 3],
                status: ['completed', 'pending', 'failed'][i % 10 === 0 ? 2 : i % 5 === 0 ? 1 : 0],
                date: date.toISOString(),
                reference: `REF${String(1000000 + i).slice(1)}`,
                currency: 'KES',
                country: ['kenya', 'uganda', 'tanzania', 'rwanda', 'ghana'][i % 5],
                createdAt: date.toISOString(),
                updatedAt: date.toISOString()
            });
        }
        
        return transactions;
    }

    saveSubscriptions() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.subscriptions));
    }

    saveTransactions() {
        localStorage.setItem(this.transactionsKey, JSON.stringify(this.transactions));
    }

    calculateNextPaymentDate(startDate, period) {
        const date = new Date(startDate);
        const today = new Date();
        
        if (period === 'monthly') {
            // Next payment is 28th of next month
            const nextMonth = today.getMonth() + 1;
            const nextDate = new Date(today.getFullYear(), nextMonth, 28);
            return nextDate.toISOString();
        } else if (period === 'biAnnual') {
            // Next payment is 28th of 6 months from start
            date.setMonth(date.getMonth() + 6);
            date.setDate(28);
            return date.toISOString();
        } else if (period === 'annual') {
            // Next payment is 28th of December next year
            date.setFullYear(date.getFullYear() + 1);
            date.setMonth(11); // December
            date.setDate(28);
            return date.toISOString();
        }
        
        return date.toISOString();
    }

    filterSubscriptions() {
        let filtered = this.subscriptions;
        
        // Filter by status
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(sub => sub.status === this.currentFilter);
        }
        
        // Filter by search if active
        if (this.currentSearch) {
            const searchTerm = this.currentSearch.toLowerCase();
            filtered = filtered.filter(sub => 
                sub.lenderName.toLowerCase().includes(searchTerm) ||
                sub.tier.toLowerCase().includes(searchTerm) ||
                sub.country.toLowerCase().includes(searchTerm) ||
                sub.id.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filter by current user if not admin
        const currentUser = window.mpesewa?.state?.currentUser;
        if (currentUser && currentUser.role !== 'admin') {
            filtered = filtered.filter(sub => sub.lenderId === currentUser.id);
        }
        
        return filtered;
    }

    setupEventListeners() {
        // Filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.subscription-filter-btn')) {
                const filter = e.target.closest('.subscription-filter-btn').dataset.filter;
                this.setFilter(filter);
            }
            
            if (e.target.closest('.subscription-renew-btn')) {
                const subId = e.target.closest('.subscription-renew-btn').dataset.id;
                this.showRenewalModal(subId);
            }
            
            if (e.target.closest('.subscription-upgrade-btn')) {
                const subId = e.target.closest('.subscription-upgrade-btn').dataset.id;
                this.showUpgradeModal(subId);
            }
            
            if (e.target.closest('.subscription-view-btn')) {
                const subId = e.target.closest('.subscription-view-btn').dataset.id;
                this.showSubscriptionDetails(subId);
            }
            
            if (e.target.closest('.subscription-pay-btn')) {
                const subId = e.target.closest('.subscription-pay-btn').dataset.id;
                this.processPayment(subId);
            }
            
            if (e.target.closest('.tier-select-btn')) {
                const tier = e.target.closest('.tier-select-btn').dataset.tier;
                this.selectTierForRegistration(tier);
            }
        });
        
        // Search
        const searchInput = document.getElementById('subscriptionSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchSubscriptions(e.target.value);
            });
        }
        
        // Tier selection in registration
        document.addEventListener('change', (e) => {
            if (e.target.name === 'subscriptionTier') {
                this.updateTierDisplay(e.target.value);
            }
            
            if (e.target.name === 'subscriptionPeriod') {
                this.updatePriceDisplay();
            }
        });
        
        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.closest('.page-btn')) {
                const page = parseInt(e.target.closest('.page-btn').dataset.page);
                this.goToPage(page);
            }
            
            if (e.target.closest('.prev-page-btn')) {
                this.goToPage(this.currentPage - 1);
            }
            
            if (e.target.closest('.next-page-btn')) {
                this.goToPage(this.currentPage + 1);
            }
        });
        
        // Admin actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.admin-extend-btn')) {
                const subId = e.target.closest('.admin-extend-btn').dataset.id;
                this.extendSubscription(subId);
            }
            
            if (e.target.closest('.admin-cancel-btn')) {
                const subId = e.target.closest('.admin-cancel-btn').dataset.id;
                this.cancelSubscription(subId);
            }
        });
        
        // Auto-renew toggle
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('auto-renew-toggle')) {
                const subId = e.target.dataset.id;
                const autoRenew = e.target.checked;
                this.updateAutoRenew(subId, autoRenew);
            }
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filteredSubscriptions = this.filterSubscriptions();
        this.currentPage = 1;
        this.renderSubscriptionsTable();
        this.updateStats();
        
        // Update active filter button
        document.querySelectorAll('.subscription-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    }

    searchSubscriptions(query) {
        this.currentSearch = query;
        this.filteredSubscriptions = this.filterSubscriptions();
        this.currentPage = 1;
        this.renderSubscriptionsTable();
        this.updateStats();
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredSubscriptions.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderSubscriptionsTable();
        this.updatePagination();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredSubscriptions.length / this.itemsPerPage);
        const paginationEl = document.getElementById('subscriptionPagination');
        
        if (!paginationEl || totalPages <= 1) {
            if (paginationEl) paginationEl.innerHTML = '';
            return;
        }
        
        let html = `
            <button class="btn btn-outline prev-page-btn ${this.currentPage === 1 ? 'disabled' : ''}">
                Previous
            </button>
            <div class="page-numbers">
        `;
        
        const pagesToShow = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pagesToShow.push(i);
        } else {
            pagesToShow.push(1);
            if (this.currentPage > 3) pagesToShow.push('...');
            if (this.currentPage > 2) pagesToShow.push(this.currentPage - 1);
            if (this.currentPage > 1 && this.currentPage < totalPages) pagesToShow.push(this.currentPage);
            if (this.currentPage < totalPages - 1) pagesToShow.push(this.currentPage + 1);
            if (this.currentPage < totalPages - 2) pagesToShow.push('...');
            if (totalPages > 1) pagesToShow.push(totalPages);
        }
        
        pagesToShow.forEach(page => {
            if (page === '...') {
                html += `<span class="page-dots">...</span>`;
            } else {
                html += `
                    <button class="page-btn ${page === this.currentPage ? 'active' : ''}" 
                            data-page="${page}">
                        ${page}
                    </button>
                `;
            }
        });
        
        html += `
            </div>
            <button class="btn btn-outline next-page-btn ${this.currentPage === totalPages ? 'disabled' : ''}">
                Next
            </button>
        `;
        
        paginationEl.innerHTML = html;
    }

    renderSubscriptionsTable() {
        const tableBody = document.getElementById('subscriptionTableBody');
        if (!tableBody) return;
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const subscriptionsToShow = this.filteredSubscriptions.slice(startIndex, endIndex);
        
        if (subscriptionsToShow.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="no-data">
                        <div class="empty-state">
                            <div class="empty-icon">💰</div>
                            <h3>No subscriptions found</h3>
                            <p>${this.currentFilter !== 'all' ? `No ${this.currentFilter} subscriptions` : 'No subscriptions found for the current filters'}</p>
                            <button class="btn btn-primary" onclick="window.location.href='pages/lending.html'">
                                Become a Lender
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        const now = new Date();
        const isAdmin = this.isAdmin();
        
        subscriptionsToShow.forEach(sub => {
            const expiryDate = new Date(sub.expiryDate);
            const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
            const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
            const isExpired = daysRemaining <= 0;
            
            const tierInfo = this.getTierDefinitions()[sub.tier];
            const statusBadge = this.getStatusBadge(sub.status, daysRemaining);
            const tierBadge = this.getTierBadge(sub.tier);
            const countryFlag = this.getCountryFlag(sub.country);
            
            html += `
                <tr class="subscription-row ${isExpired ? 'expired' : isExpiringSoon ? 'expiring' : ''}" data-id="${sub.id}">
                    <td>
                        <div class="lender-info">
                            <div class="lender-name">
                                <strong>${sub.lenderName}</strong>
                                ${countryFlag}
                            </div>
                            <div class="text-small">${sub.lenderId}</div>
                            <div class="text-small">${sub.country.toUpperCase()}</div>
                        </div>
                    </td>
                    <td>
                        <div class="tier-info">
                            ${tierBadge}
                            <div class="text-small">${sub.period}</div>
                        </div>
                    </td>
                    <td class="text-right">
                        <div class="amount-info">
                            <strong>${this.formatCurrency(sub.amount)}</strong>
                            <div class="text-small">${this.getPeriodLabel(sub.period)}</div>
                        </div>
                    </td>
                    <td>
                        <div class="date-info">
                            <div>${this.formatDate(sub.startDate)}</div>
                            <div class="text-small">Started</div>
                        </div>
                    </td>
                    <td>
                        <div class="date-info ${isExpiringSoon ? 'text-warning' : isExpired ? 'text-danger' : ''}">
                            <div>${this.formatDate(expiryDate)}</div>
                            <div class="text-small">
                                ${isExpired ? 'Expired' : isExpiringSoon ? 'Expiring soon' : 'Expires'} 
                                (${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? 'day' : 'days'} ${isExpired ? 'ago' : 'left'})
                            </div>
                        </div>
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="auto-renew-info">
                            <label class="toggle-switch">
                                <input type="checkbox" class="auto-renew-toggle" 
                                       data-id="${sub.id}" ${sub.autoRenew ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                            <div class="text-small">Auto-renew</div>
                        </div>
                    </td>
                    <td>
                        <div class="subscription-actions">
                            <button class="btn-icon subscription-view-btn" data-id="${sub.id}" title="View Details">
                                👁️
                            </button>
                            ${!isExpired ? `
                                <button class="btn-icon subscription-renew-btn" data-id="${sub.id}" title="Renew Now">
                                    🔄
                                </button>
                            ` : `
                                <button class="btn-icon subscription-pay-btn" data-id="${sub.id}" title="Pay Now">
                                    💰
                                </button>
                            `}
                            ${!isExpired && sub.tier !== 'lender-of-lenders' ? `
                                <button class="btn-icon subscription-upgrade-btn" data-id="${sub.id}" title="Upgrade Tier">
                                    ⬆️
                                </button>
                            ` : ''}
                            ${isAdmin ? `
                                <button class="btn-icon btn-success admin-extend-btn" data-id="${sub.id}" title="Extend Subscription">
                                    ➕
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        this.updatePagination();
    }

    renderUpcomingRenewals() {
        const container = document.getElementById('upcomingRenewals');
        if (!container) return;
        
        const now = new Date();
        const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
        
        const upcoming = this.subscriptions.filter(sub => {
            if (sub.status !== 'active') return false;
            const expiry = new Date(sub.expiryDate);
            return expiry > now && expiry <= nextWeek;
        }).slice(0, 5);
        
        if (upcoming.length === 0) {
            container.innerHTML = `
                <div class="empty-state small">
                    <div class="empty-icon">✅</div>
                    <h4>No upcoming renewals</h4>
                    <p>All subscriptions are up to date</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="renewal-list">';
        upcoming.forEach(sub => {
            const expiry = new Date(sub.expiryDate);
            const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            const tierInfo = this.getTierDefinitions()[sub.tier];
            
            html += `
                <div class="renewal-item">
                    <div class="renewal-header">
                        <div class="renewal-lender">
                            <strong>${sub.lenderName}</strong>
                            <span class="tier-badge small">${tierInfo.name}</span>
                        </div>
                        <div class="renewal-amount">${this.formatCurrency(sub.amount)}</div>
                    </div>
                    <div class="renewal-details">
                        <div class="renewal-date">
                            <span class="date-icon">📅</span>
                            Expires in ${days} ${days === 1 ? 'day' : 'days'}
                        </div>
                        <button class="btn btn-sm btn-outline subscription-renew-btn" data-id="${sub.id}">
                            Renew
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    getStatusBadge(status, daysRemaining) {
        if (daysRemaining <= 0) {
            return '<span class="badge badge-danger">Expired</span>';
        }
        
        const badges = {
            'active': '<span class="badge badge-success">Active</span>',
            'expired': '<span class="badge badge-danger">Expired</span>',
            'pending': '<span class="badge badge-warning">Pending</span>',
            'cancelled': '<span class="badge badge-secondary">Cancelled</span>',
            'suspended': '<span class="badge badge-warning">Suspended</span>'
        };
        
        return badges[status] || `<span class="badge">${status}</span>`;
    }

    getTierBadge(tier) {
        const tierInfo = this.getTierDefinitions()[tier];
        if (!tierInfo) return `<span class="badge">${tier}</span>`;
        
        return `
            <span class="tier-badge" style="background-color: ${tierInfo.color}20; color: ${tierInfo.color}; border-color: ${tierInfo.color}">
                ${tierInfo.icon} ${tierInfo.name}
            </span>
        `;
    }

    getCountryFlag(country) {
        const flags = {
            'kenya': '🇰🇪',
            'uganda': '🇺🇬',
            'tanzania': '🇹🇿',
            'rwanda': '🇷🇼',
            'burundi': '🇧🇮',
            'somalia': '🇸🇴',
            'south-sudan': '🇸🇸',
            'ethiopia': '🇪🇹',
            'DRC': '🇨🇩',
            'nigeria': '🇳🇬',
            'south-africa': '🇿🇦',
            'ghana': '🇬🇭'
        };
        return `<span class="country-flag">${flags[country] || ''}</span>`;
    }

    formatDate(date) {
        if (!(date instanceof Date)) date = new Date(date);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    formatCurrency(amount) {
        const country = window.mpesewa?.state?.currentCountry || 'kenya';
        const currencies = {
            'kenya': 'KSh',
            'uganda': 'UGX',
            'tanzania': 'TZS',
            'rwanda': 'RWF',
            'burundi': 'BIF',
            'somalia': 'SOS',
            'south-sudan': 'SSP',
            'ethiopia': 'ETB',
            'DRC': 'CDF',
            'nigeria': 'NGN',
            'south-africa': 'ZAR',
            'ghana': 'GHS'
        };
        
        const currency = currencies[country] || '₵';
        return `${currency} ${amount.toLocaleString()}`;
    }

    getPeriodLabel(period) {
        const labels = {
            'monthly': 'Monthly',
            'biAnnual': 'Bi-Annual',
            'annual': 'Annual'
        };
        return labels[period] || period;
    }

    updateStats() {
        const stats = {
            total: this.subscriptions.length,
            active: this.subscriptions.filter(s => s.status === 'active').length,
            expired: this.subscriptions.filter(s => s.status === 'expired').length,
            pending: this.subscriptions.filter(s => s.status === 'pending').length,
            revenueThisMonth: this.calculateMonthlyRevenue(),
            renewalsDue: this.calculateRenewalsDue(),
            byTier: this.getStatsByTier(),
            byCountry: this.getStatsByCountry()
        };
        
        // Update stats display
        const updateStat = (id, value, isCurrency = false) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = isCurrency ? this.formatCurrency(value) : value;
            }
        };
        
        updateStat('statTotalSubscriptions', stats.total);
        updateStat('statActiveSubscriptions', stats.active);
        updateStat('statExpiredSubscriptions', stats.expired);
        updateStat('statMonthlyRevenue', stats.revenueThisMonth, true);
        updateStat('statRenewalsDue', stats.renewalsDue);
        
        // Update charts
        this.updateCharts(stats);
    }

    calculateMonthlyRevenue() {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        
        return this.transactions
            .filter(tx => {
                const txDate = new Date(tx.date);
                return tx.status === 'completed' &&
                       txDate.getMonth() === thisMonth &&
                       txDate.getFullYear() === thisYear;
            })
            .reduce((sum, tx) => sum + tx.amount, 0);
    }

    calculateRenewalsDue() {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
        
        return this.subscriptions.filter(sub => {
            if (sub.status !== 'active') return false;
            const expiry = new Date(sub.expiryDate);
            return expiry > now && expiry <= nextWeek;
        }).length;
    }

    getStatsByTier() {
        const byTier = {};
        this.subscriptions.forEach(sub => {
            byTier[sub.tier] = (byTier[sub.tier] || 0) + 1;
        });
        return byTier;
    }

    getStatsByCountry() {
        const byCountry = {};
        this.subscriptions.forEach(sub => {
            byCountry[sub.country] = (byCountry[sub.country] || 0) + 1;
        });
        return byCountry;
    }

    updateCharts(stats) {
        // Update tier distribution chart
        const tierChart = document.getElementById('tierDistributionChart');
        if (tierChart) {
            let html = '<div class="chart-bars">';
            Object.entries(stats.byTier).forEach(([tier, count]) => {
                const tierInfo = this.getTierDefinitions()[tier];
                const percentage = (count / stats.total) * 100;
                html += `
                    <div class="chart-bar">
                        <div class="bar-label">
                            <span class="tier-icon">${tierInfo?.icon || '💰'}</span>
                            <span>${tierInfo?.name || tier}</span>
                        </div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${percentage}%; background-color: ${tierInfo?.color || '#0A65FC'}"></div>
                        </div>
                        <div class="bar-value">${count}</div>
                    </div>
                `;
            });
            html += '</div>';
            tierChart.innerHTML = html;
        }
        
        // Update revenue chart
        const revenueChart = document.getElementById('revenueChart');
        if (revenueChart) {
            // Simplified revenue trend (would be more complex in real app)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            const revenue = months.map((_, i) => Math.floor(Math.random() * 100000) + 50000);
            const maxRevenue = Math.max(...revenue);
            
            let html = '<div class="chart-bars horizontal">';
            months.forEach((month, i) => {
                const percentage = (revenue[i] / maxRevenue) * 100;
                html += `
                    <div class="chart-bar">
                        <div class="bar-label">${month}</div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${percentage}%"></div>
                            <div class="bar-value">${this.formatCurrency(revenue[i])}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            revenueChart.innerHTML = html;
        }
    }

    checkExpirations() {
        const now = new Date();
        let expiredCount = 0;
        let expiringSoonCount = 0;
        
        this.subscriptions.forEach((sub, index) => {
            const expiryDate = new Date(sub.expiryDate);
            const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining <= 0 && sub.status === 'active') {
                this.subscriptions[index].status = 'expired';
                expiredCount++;
                
                // Block lender access (in real app, would update user permissions)
                this.blockLenderAccess(sub.lenderId);
                
                // Send expiration notification
                this.sendExpirationNotification(sub, 'expired');
            } else if (daysRemaining <= 7 && daysRemaining > 0 && sub.status === 'active') {
                expiringSoonCount++;
                
                // Send reminder notification
                if (daysRemaining <= 3) {
                    this.sendExpirationNotification(sub, 'reminder');
                }
            }
        });
        
        if (expiredCount > 0) {
            this.saveSubscriptions();
            this.filteredSubscriptions = this.filterSubscriptions();
            this.renderSubscriptionsTable();
            this.updateStats();
            
            console.log(`${expiredCount} subscriptions expired and blocked`);
        }
        
        // Show notification for expiring soon
        if (expiringSoonCount > 0 && this.shouldShowReminder()) {
            this.showNotification(`${expiringSoonCount} subscription${expiringSoonCount > 1 ? 's' : ''} expiring soon`, 'warning');
        }
    }

    blockLenderAccess(lenderId) {
        // Update lender status to blocked
        if (this.lenders[lenderId]) {
            this.lenders[lenderId].subscriptionActive = false;
            this.lenders[lenderId].accessBlocked = true;
            this.lenders[lenderId].blockedReason = 'Subscription expired';
            this.lenders[lenderId].blockedDate = new Date().toISOString();
            
            // Save to localStorage
            localStorage.setItem(this.lendersKey, JSON.stringify(this.lenders));
        }
    }

    unblockLenderAccess(lenderId) {
        // Restore lender access
        if (this.lenders[lenderId]) {
            this.lenders[lenderId].subscriptionActive = true;
            this.lenders[lenderId].accessBlocked = false;
            delete this.lenders[lenderId].blockedReason;
            delete this.lenders[lenderId].blockedDate;
            
            localStorage.setItem(this.lendersKey, JSON.stringify(this.lenders));
        }
    }

    sendExpirationNotification(subscription, type) {
        // In a real app, this would send email/SMS
        // For demo, just log to console
        const messages = {
            'expired': `Subscription expired for ${subscription.lenderName}. Access blocked.`,
            'reminder': `Subscription for ${subscription.lenderName} expires in 3 days.`
        };
        
        console.log(`Notification: ${messages[type]}`);
        
        // Also show in-app notification for current user
        const currentUser = window.mpesewa?.state?.currentUser;
        if (currentUser && currentUser.id === subscription.lenderId) {
            this.showNotification(messages[type], type === 'expired' ? 'error' : 'warning');
        }
    }

    shouldShowReminder() {
        // Only show reminder once per day
        const lastReminder = localStorage.getItem('lastSubscriptionReminder');
        const today = new Date().toDateString();
        
        if (lastReminder !== today) {
            localStorage.setItem('lastSubscriptionReminder', today);
            return true;
        }
        
        return false;
    }

    setupAutoCheck() {
        // Check for expirations every hour
        setInterval(() => {
            this.checkExpirations();
        }, 60 * 60 * 1000);
        
        // Also check when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkExpirations();
            }
        });
    }

    isAdmin() {
        const user = window.mpesewa?.state?.currentUser;
        return user?.role === 'admin' || user?.isAdmin === true;
    }

    createSubscription(lenderId, tier, period, paymentMethod = 'mpesa') {
        const now = new Date();
        const tierInfo = this.getTierDefinitions()[tier];
        
        if (!tierInfo) {
            throw new Error(`Invalid tier: ${tier}`);
        }
        
        // Calculate expiry date (28th of next month for monthly)
        let expiryDate = new Date(now);
        if (period === 'monthly') {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
            expiryDate.setDate(28);
        } else if (period === 'biAnnual') {
            expiryDate.setMonth(expiryDate.getMonth() + 6);
            expiryDate.setDate(28);
        } else if (period === 'annual') {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            expiryDate.setMonth(11); // December
            expiryDate.setDate(28);
        }
        
        const subscription = {
            id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            lenderId: lenderId,
            lenderName: this.lenders[lenderId]?.name || `Lender ${lenderId}`,
            tier: tier,
            period: period,
            amount: tierInfo.pricing[period],
            status: 'active',
            startDate: now.toISOString(),
            expiryDate: expiryDate.toISOString(),
            lastPaymentDate: now.toISOString(),
            nextPaymentDate: this.calculateNextPaymentDate(now.toISOString(), period),
            autoRenew: true,
            paymentMethod: paymentMethod,
            transactionId: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            country: this.lenders[lenderId]?.country || 'kenya',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };
        
        // Create transaction record
        const transaction = {
            id: subscription.transactionId,
            subscriptionId: subscription.id,
            lenderId: lenderId,
            lenderName: subscription.lenderName,
            tier: tier,
            period: period,
            amount: subscription.amount,
            paymentMethod: paymentMethod,
            status: 'completed',
            date: now.toISOString(),
            reference: `PAY${Date.now().toString().slice(-8)}`,
            currency: 'KES',
            country: subscription.country,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };
        
        this.subscriptions.unshift(subscription);
        this.transactions.unshift(transaction);
        
        this.saveSubscriptions();
        this.saveTransactions();
        
        // Update lender access
        this.unblockLenderAccess(lenderId);
        
        this.filteredSubscriptions = this.filterSubscriptions();
        this.renderSubscriptionsTable();
        this.updateStats();
        
        this.showNotification(`Subscription activated for ${tierInfo.name} (${period})`, 'success');
        
        return { subscription, transaction };
    }

    renewSubscription(subscriptionId, paymentMethod = 'mpesa') {
        const subscription = this.subscriptions.find(s => s.id === subscriptionId);
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        
        const now = new Date();
        const currentExpiry = new Date(subscription.expiryDate);
        let newExpiry = new Date(currentExpiry);
        
        // Extend based on period
        if (subscription.period === 'monthly') {
            newExpiry.setMonth(newExpiry.getMonth() + 1);
            newExpiry.setDate(28);
        } else if (subscription.period === 'biAnnual') {
            newExpiry.setMonth(newExpiry.getMonth() + 6);
            newExpiry.setDate(28);
        } else if (subscription.period === 'annual') {
            newExpiry.setFullYear(newExpiry.getFullYear() + 1);
            newExpiry.setMonth(11);
            newExpiry.setDate(28);
        }
        
        // Update subscription
        subscription.status = 'active';
        subscription.expiryDate = newExpiry.toISOString();
        subscription.lastPaymentDate = now.toISOString();
        subscription.nextPaymentDate = this.calculateNextPaymentDate(now.toISOString(), subscription.period);
        subscription.updatedAt = now.toISOString();
        
        // Create transaction
        const transaction = {
            id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            subscriptionId: subscription.id,
            lenderId: subscription.lenderId,
            lenderName: subscription.lenderName,
            tier: subscription.tier,
            period: subscription.period,
            amount: subscription.amount,
            paymentMethod: paymentMethod,
            status: 'completed',
            date: now.toISOString(),
            reference: `REN${Date.now().toString().slice(-8)}`,
            currency: 'KES',
            country: subscription.country,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };
        
        this.transactions.unshift(transaction);
        
        // Update lender access if previously blocked
        this.unblockLenderAccess(subscription.lenderId);
        
        this.saveSubscriptions();
        this.saveTransactions();
        
        this.filteredSubscriptions = this.filterSubscriptions();
        this.renderSubscriptionsTable();
        this.updateStats();
        
        const tierInfo = this.getTierDefinitions()[subscription.tier];
        this.showNotification(`Subscription renewed for ${tierInfo.name}`, 'success');
        
        return { subscription, transaction };
    }

    upgradeSubscription(subscriptionId, newTier, newPeriod = null) {
        const subscription = this.subscriptions.find(s => s.id === subscriptionId);
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        
        const newTierInfo = this.getTierDefinitions()[newTier];
        if (!newTierInfo) {
            throw new Error(`Invalid tier: ${newTier}`);
        }
        
        const period = newPeriod || subscription.period;
        const amount = newTierInfo.pricing[period];
        
        // Calculate prorated credit for remaining time
        const now = new Date();
        const expiry = new Date(subscription.expiryDate);
        const daysRemaining = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
        const totalDays = this.getDaysInPeriod(subscription.period);
        const credit = (daysRemaining / totalDays) * subscription.amount;
        
        // Update subscription
        subscription.tier = newTier;
        subscription.period = period;
        subscription.amount = amount;
        subscription.updatedAt = now.toISOString();
        
        // Create upgrade transaction
        const transaction = {
            id: `txn-upgrade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            subscriptionId: subscription.id,
            lenderId: subscription.lenderId,
            lenderName: subscription.lenderName,
            tier: newTier,
            period: period,
            amount: amount - credit, // Charge difference
            paymentMethod: 'mpesa',
            status: 'completed',
            date: now.toISOString(),
            reference: `UPG${Date.now().toString().slice(-8)}`,
            currency: 'KES',
            country: subscription.country,
            type: 'upgrade',
            previousTier: subscription.tier,
            creditApplied: credit,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };
        
        this.transactions.unshift(transaction);
        
        this.saveSubscriptions();
        this.saveTransactions();
        
        this.filteredSubscriptions = this.filterSubscriptions();
        this.renderSubscriptionsTable();
        this.updateStats();
        
        this.showNotification(`Upgraded to ${newTierInfo.name} tier`, 'success');
        
        return { subscription, transaction };
    }

    getDaysInPeriod(period) {
        const days = {
            'monthly': 30,
            'biAnnual': 180,
            'annual': 365
        };
        return days[period] || 30;
    }

    updateAutoRenew(subscriptionId, autoRenew) {
        const subscription = this.subscriptions.find(s => s.id === subscriptionId);
        if (!subscription) return;
        
        subscription.autoRenew = autoRenew;
        subscription.updatedAt = new Date().toISOString();
        
        this.saveSubscriptions();
        
        this.showNotification(`Auto-renew ${autoRenew ? 'enabled' : 'disabled'}`, 'info');
    }

    extendSubscription(subscriptionId, extraDays = 30) {
        if (!this.isAdmin()) {
            this.showNotification('Only admins can extend subscriptions', 'error');
            return;
        }
        
        const subscription = this.subscriptions.find(s => s.id === subscriptionId);
        if (!subscription) return;
        
        const expiry = new Date(subscription.expiryDate);
        expiry.setDate(expiry.getDate() + extraDays);
        
        subscription.expiryDate = expiry.toISOString();
        subscription.updatedAt = new Date().toISOString();
        
        this.saveSubscriptions();
        this.filteredSubscriptions = this.filterSubscriptions();
        this.renderSubscriptionsTable();
        
        this.showNotification(`Subscription extended by ${extraDays} days`, 'success');
    }

    cancelSubscription(subscriptionId) {
        if (!this.isAdmin()) {
            this.showNotification('Only admins can cancel subscriptions', 'error');
            return;
        }
        
        const subscription = this.subscriptions.find(s => s.id === subscriptionId);
        if (!subscription) return;
        
        if (confirm(`Cancel subscription for ${subscription.lenderName}?`)) {
            subscription.status = 'cancelled';
            subscription.updatedAt = new Date().toISOString();
            
            // Block lender access
            this.blockLenderAccess(subscription.lenderId);
            
            this.saveSubscriptions();
            this.filteredSubscriptions = this.filterSubscriptions();
            this.renderSubscriptionsTable();
            this.updateStats();
            
            this.showNotification('Subscription cancelled', 'info');
        }
    }

    processPayment(subscriptionId) {
        const subscription = this.subscriptions.find(s => s.id === subscriptionId);
        if (!subscription) return;
        
        // Show payment modal
        this.showPaymentModal(subscription);
    }

    showPaymentModal(subscription) {
        const tierInfo = this.getTierDefinitions()[subscription.tier];
        const modalHtml = `
            <div class="modal payment-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Complete Subscription Payment</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="payment-summary">
                            <div class="payment-item">
                                <div class="payment-label">Lender:</div>
                                <div class="payment-value">${subscription.lenderName}</div>
                            </div>
                            <div class="payment-item">
                                <div class="payment-label">Tier:</div>
                                <div class="payment-value">${tierInfo.name} (${subscription.period})</div>
                            </div>
                            <div class="payment-item">
                                <div class="payment-label">Amount:</div>
                                <div class="payment-value amount">${this.formatCurrency(subscription.amount)}</div>
                            </div>
                            <div class="payment-item">
                                <div class="payment-label">Due Date:</div>
                                <div class="payment-value">${this.formatDate(subscription.expiryDate)}</div>
                            </div>
                        </div>
                        
                        <div class="payment-methods">
                            <h4>Select Payment Method</h4>
                            <div class="method-options">
                                <label class="method-option">
                                    <input type="radio" name="paymentMethod" value="mpesa" checked>
                                    <div class="method-card">
                                        <div class="method-icon">📱</div>
                                        <div class="method-info">
                                            <div class="method-name">M-Pesa</div>
                                            <div class="method-desc">Pay via M-Pesa Till Number</div>
                                        </div>
                                    </div>
                                </label>
                                
                                <label class="method-option">
                                    <input type="radio" name="paymentMethod" value="bank-transfer">
                                    <div class="method-card">
                                        <div class="method-icon">🏦</div>
                                        <div class="method-info">
                                            <div class="method-name">Bank Transfer</div>
                                            <div class="method-desc">Direct bank transfer</div>
                                        </div>
                                    </div>
                                </label>
                                
                                <label class="method-option">
                                    <input type="radio" name="paymentMethod" value="card">
                                    <div class="method-card">
                                        <div class="method-icon">💳</div>
                                        <div class="method-info">
                                            <div class="method-name">Credit/Debit Card</div>
                                            <div class="method-desc">Visa, Mastercard, etc.</div>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <div class="payment-instructions" id="paymentInstructions">
                            <h4>M-Pesa Payment Instructions:</h4>
                            <ol>
                                <li>Go to M-Pesa on your phone</li>
                                <li>Select "Pay Bill"</li>
                                <li>Enter Business Number: <strong>888888</strong></li>
                                <li>Enter Account Number: <strong>${subscription.id.slice(-8)}</strong></li>
                                <li>Enter Amount: <strong>${subscription.amount}</strong></li>
                                <li>Enter your M-Pesa PIN</li>
                                <li>Click "Confirm Payment" below after payment</li>
                            </ol>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline modal-close">Cancel</button>
                        <button class="btn btn-primary" id="confirmPayment">Confirm Payment</button>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Update instructions based on payment method
        const updateInstructions = (method) => {
            const instructions = modalContainer.querySelector('#paymentInstructions');
            if (method === 'mpesa') {
                instructions.innerHTML = `
                    <h4>M-Pesa Payment Instructions:</h4>
                    <ol>
                        <li>Go to M-Pesa on your phone</li>
                        <li>Select "Pay Bill"</li>
                        <li>Enter Business Number: <strong>888888</strong></li>
                        <li>Enter Account Number: <strong>${subscription.id.slice(-8)}</strong></li>
                        <li>Enter Amount: <strong>${subscription.amount}</strong></li>
                        <li>Enter your M-Pesa PIN</li>
                        <li>Click "Confirm Payment" below after payment</li>
                    </ol>
                `;
            } else if (method === 'bank-transfer') {
                instructions.innerHTML = `
                    <h4>Bank Transfer Instructions:</h4>
                    <p>Transfer to:</p>
                    <ul>
                        <li>Bank: Equity Bank</li>
                        <li>Account Name: M-Pesewa Limited</li>
                        <li>Account Number: 1234567890</li>
                        <li>Branch: Nairobi CBD</li>
                        <li>Swift Code: EQBLKENA</li>
                        <li>Reference: ${subscription.id.slice(-8)}</li>
                    </ul>
                `;
            } else if (method === 'card') {
                instructions.innerHTML = `
                    <h4>Card Payment:</h4>
                    <p>You will be redirected to a secure payment page to complete your card payment.</p>
                `;
            }
        };
        
        // Payment method change
        modalContainer.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
            input.addEventListener('change', (e) => {
                updateInstructions(e.target.value);
            });
        });
        
        // Close modal
        modalContainer.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modalContainer);
            });
        });
        
        // Confirm payment
        modalContainer.querySelector('#confirmPayment').addEventListener('click', () => {
            const method = modalContainer.querySelector('input[name="paymentMethod"]:checked').value;
            
            // Simulate payment processing
            modalContainer.querySelector('#confirmPayment').disabled = true;
            modalContainer.querySelector('#confirmPayment').textContent = 'Processing...';
            
            setTimeout(() => {
                document.body.removeChild(modalContainer);
                this.renewSubscription(subscription.id, method);
            }, 1500);
        });
    }

    showSubscriptionDetails(subscriptionId) {
        const subscription = this.subscriptions.find(s => s.id === subscriptionId);
        if (!subscription) return;
        
        const tierInfo = this.getTierDefinitions()[subscription.tier];
        const expiryDate = new Date(subscription.expiryDate);
        const now = new Date();
        const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        const modalHtml = `
            <div class="modal subscription-details-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Subscription Details</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="subscription-header">
                            <div class="subscription-tier-badge" style="background-color: ${tierInfo.color}20; color: ${tierInfo.color};">
                                ${tierInfo.icon} ${tierInfo.name}
                            </div>
                            <div class="subscription-amount">${this.formatCurrency(subscription.amount)}</div>
                        </div>
                        
                        <div class="details-grid">
                            <div class="detail-section">
                                <h4>Lender Information</h4>
                                <p><strong>Name:</strong> ${subscription.lenderName}</p>
                                <p><strong>ID:</strong> ${subscription.lenderId}</p>
                                <p><strong>Country:</strong> ${subscription.country.toUpperCase()} ${this.getCountryFlag(subscription.country)}</p>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Subscription Plan</h4>
                                <p><strong>Tier:</strong> ${tierInfo.name}</p>
                                <p><strong>Period:</strong> ${this.getPeriodLabel(subscription.period)}</p>
                                <p><strong>Status:</strong> ${this.getStatusBadge(subscription.status, daysRemaining)}</p>
                                <p><strong>Auto-renew:</strong> ${subscription.autoRenew ? 'Yes' : 'No'}</p>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Dates</h4>
                                <p><strong>Start Date:</strong> ${this.formatDate(subscription.startDate)}</p>
                                <p><strong>Expiry Date:</strong> ${this.formatDate(expiryDate)}</p>
                                <p><strong>Last Payment:</strong> ${this.formatDate(subscription.lastPaymentDate)}</p>
                                <p><strong>Days Remaining:</strong> ${daysRemaining > 0 ? daysRemaining : 'Expired'} ${daysRemaining > 0 ? 'days' : ''}</p>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Payment Details</h4>
                                <p><strong>Amount:</strong> ${this.formatCurrency(subscription.amount)}</p>
                                <p><strong>Payment Method:</strong> ${subscription.paymentMethod}</p>
                                <p><strong>Transaction ID:</strong> ${subscription.transactionId}</p>
                                ${subscription.notes ? `<p><strong>Notes:</strong> ${subscription.notes}</p>` : ''}
                            </div>
                            
                            <div class="detail-section full-width">
                                <h4>Tier Features</h4>
                                <div class="features-list">
                                    ${tierInfo.features.map(feature => `
                                        <div class="feature-item">
                                            <span class="feature-icon">✓</span>
                                            <span>${feature}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline modal-close">Close</button>
                        ${daysRemaining <= 0 ? `
                            <button class="btn btn-primary subscription-pay-btn" data-id="${subscription.id}">
                                Renew Now
                            </button>
                        ` : daysRemaining <= 30 ? `
                            <button class="btn btn-primary subscription-renew-btn" data-id="${subscription.id}">
                                Renew Early
                            </button>
                        ` : ''}
                        ${this.isAdmin() ? `
                            <button class="btn btn-outline admin-extend-btn" data-id="${subscription.id}">
                                Extend
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        modalContainer.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modalContainer);
            });
        });
        
        const renewBtn = modalContainer.querySelector('.subscription-renew-btn');
        if (renewBtn) {
            renewBtn.addEventListener('click', () => {
                document.body.removeChild(modalContainer);
                this.showRenewalModal(subscriptionId);
            });
        }
        
        const payBtn = modalContainer.querySelector('.subscription-pay-btn');
        if (payBtn) {
            payBtn.addEventListener('click', () => {
                document.body.removeChild(modalContainer);
                this.processPayment(subscriptionId);
            });
        }
        
        const extendBtn = modalContainer.querySelector('.admin-extend-btn');
        if (extendBtn) {
            extendBtn.addEventListener('click', () => {
                document.body.removeChild(modalContainer);
                this.extendSubscription(subscriptionId);
            });
        }
    }

    showRenewalModal(subscriptionId) {
        const subscription = this.subscriptions.find(s => s.id === subscriptionId);
        if (!subscription) return;
        
        const tierInfo = this.getTierDefinitions()[subscription.tier];
        const expiryDate = new Date(subscription.expiryDate);
        const now = new Date();
        const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        let message = '';
        if (daysRemaining <= 0) {
            message = 'Your subscription has expired. Renew now to restore access.';
        } else if (daysRemaining <= 7) {
            message = `Your subscription expires in ${daysRemaining} days. Renew now to avoid interruption.`;
        } else {
            message = 'Renew your subscription early to ensure continuous access.';
        }
        
        if (confirm(`${message}\n\nRenew ${tierInfo.name} (${subscription.period}) for ${this.formatCurrency(subscription.amount)}?`)) {
            this.renewSubscription(subscriptionId);
        }
    }

    showUpgradeModal(subscriptionId) {
        const subscription = this.subscriptions.find(s => s.id === subscriptionId);
        if (!subscription) return;
        
        const currentTier = subscription.tier;
        const tiers = this.getTierDefinitions();
        const availableUpgrades = {};
        
        // Determine available upgrades
        if (currentTier === 'basic') {
            availableUpgrades.premium = tiers.premium;
            availableUpgrades.super = tiers.super;
            availableUpgrades['lender-of-lenders'] = tiers['lender-of-lenders'];
        } else if (currentTier === 'premium') {
            availableUpgrades.super = tiers.super;
            availableUpgrades['lender-of-lenders'] = tiers['lender-of-lenders'];
        } else if (currentTier === 'super') {
            availableUpgrades['lender-of-lenders'] = tiers['lender-of-lenders'];
        }
        
        // Show upgrade options
        let optionsHtml = '<h4>Available Upgrades:</h4><div class="upgrade-options">';
        
        Object.entries(availableUpgrades).forEach(([tierKey, tierInfo]) => {
            const price = tierInfo.pricing[subscription.period];
            const currentPrice = tiers[currentTier].pricing[subscription.period];
            const difference = price - currentPrice;
            
            optionsHtml += `
                <div class="upgrade-option">
                    <div class="upgrade-header">
                        <div class="upgrade-tier">
                            <span class="tier-icon">${tierInfo.icon}</span>
                            <h5>${tierInfo.name}</h5>
                        </div>
                        <div class="upgrade-price">
                            ${this.formatCurrency(price)} ${subscription.period}
                        </div>
                    </div>
                    <div class="upgrade-difference">
                        Additional ${this.formatCurrency(difference)}/${subscription.period}
                    </div>
                    <ul class="upgrade-features">
                        ${tierInfo.features.map(feature => `
                            <li>${feature}</li>
                        `).join('')}
                    </ul>
                    <button class="btn btn-outline btn-sm upgrade-select-btn" data-tier="${tierKey}">
                        Upgrade to ${tierInfo.name}
                    </button>
                </div>
            `;
        });
        
        optionsHtml += '</div>';
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = `
            <div class="modal upgrade-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Upgrade Subscription</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Current plan: <strong>${tiers[currentTier].name}</strong> (${this.formatCurrency(subscription.amount)}/${subscription.period})</p>
                        ${optionsHtml}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline modal-close">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalContainer);
        
        modalContainer.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modalContainer);
            });
        });
        
        modalContainer.querySelectorAll('.upgrade-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tier = btn.dataset.tier;
                document.body.removeChild(modalContainer);
                
                if (confirm(`Upgrade to ${tiers[tier].name} for ${this.formatCurrency(tiers[tier].pricing[subscription.period])}/${subscription.period}?`)) {
                    this.upgradeSubscription(subscriptionId, tier);
                }
            });
        });
    }

    selectTierForRegistration(tier) {
        const tierInfo = this.getTierDefinitions()[tier];
        if (!tierInfo) return;
        
        // Update UI to show selected tier
        document.querySelectorAll('.tier-select-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.tier === tier);
        });
        
        // Update hidden input if exists
        const tierInput = document.getElementById('selectedTier');
        if (tierInput) {
            tierInput.value = tier;
        }
        
        // Update pricing display
        this.updatePriceDisplay();
    }

    updateTierDisplay(tier) {
        const tierInfo = this.getTierDefinitions()[tier];
        if (!tierInfo) return;
        
        // Update pricing options
        const pricingContainer = document.getElementById('tierPricing');
        if (pricingContainer) {
            let html = '';
            Object.entries(tierInfo.pricing).forEach(([period, price]) => {
                html += `
                    <div class="price-option ${period === 'monthly' ? 'active' : ''}" data-period="${period}">
                        <div class="price-period">${this.getPeriodLabel(period)}</div>
                        <div class="price-amount">${this.formatCurrency(price)}</div>
                        ${period === 'annual' ? '<div class="price-save">Save 15%</div>' : ''}
                    </div>
                `;
            });
            pricingContainer.innerHTML = html;
            
            // Add click listeners
            pricingContainer.querySelectorAll('.price-option').forEach(option => {
                option.addEventListener('click', () => {
                    pricingContainer.querySelectorAll('.price-option').forEach(o => o.classList.remove('active'));
                    option.classList.add('active');
                    
                    const periodInput = document.getElementById('selectedPeriod');
                    if (periodInput) {
                        periodInput.value = option.dataset.period;
                    }
                });
            });
        }
        
        // Update features list
        const featuresContainer = document.getElementById('tierFeatures');
        if (featuresContainer) {
            let html = '<ul class="features-list">';
            tierInfo.features.forEach(feature => {
                html += `<li>${feature}</li>`;
            });
            html += '</ul>';
            featuresContainer.innerHTML = html;
        }
    }

    updatePriceDisplay() {
        const tierSelect = document.querySelector('input[name="subscriptionTier"]:checked');
        const periodSelect = document.querySelector('input[name="subscriptionPeriod"]:checked');
        
        if (!tierSelect || !periodSelect) return;
        
        const tier = tierSelect.value;
        const period = periodSelect.value;
        const tierInfo = this.getTierDefinitions()[tier];
        
        if (!tierInfo) return;
        
        const price = tierInfo.pricing[period];
        const priceDisplay = document.getElementById('subscriptionPrice');
        if (priceDisplay) {
            priceDisplay.textContent = `${this.formatCurrency(price)}/${period}`;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 5000);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            document.body.removeChild(notification);
        });
    }
}

// Initialize subscription system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.subscriptionSystem = new SubscriptionSystem();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubscriptionSystem;
}