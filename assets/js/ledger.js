// /assets/js/ledger.js

/**
 * M-Pesewa Ledger Management System
 * Handles transaction ledger rendering, loan records, repayment tracking,
 * interest/penalty calculations, and ledger persistence.
 */

class LedgerSystem {
    constructor() {
        this.storageKey = 'mpesewa-ledgers';
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentFilter = 'all';
        this.currentGroupId = null;
        this.currentLenderId = null;
        this.initialize();
    }

    initialize() {
        this.loadLedgers();
        this.setupEventListeners();
        this.renderLedgerTable();
        this.updateStats();
    }

    loadLedgers() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            this.ledgers = JSON.parse(stored);
        } else {
            // Load demo data if no ledgers exist
            this.ledgers = this.getDemoLedgers();
            this.saveLedgers();
        }
        
        // Filter ledgers by current user context
        this.filteredLedgers = this.filterLedgersByContext();
    }

    saveLedgers() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.ledgers));
    }

    getDemoLedgers() {
        // This would be replaced with actual demo data from data/demo-ledgers.json
        // For now, generate some sample ledgers
        return Array.from({ length: 50 }, (_, i) => this.createDemoLedger(i));
    }

    createDemoLedger(index) {
        const categories = [
            'fare', 'data', 'cooking-gas', 'food', 'credo', 'water-bill',
            'fuel', 'repair', 'medicine', 'electricity', 'school-fees',
            'tv-subscription', 'advance', 'daily-sales', 'working-capital'
        ];
        
        const statuses = ['active', 'cleared', 'overdue', 'defaulted'];
        const category = categories[index % categories.length];
        const status = statuses[index % statuses.length];
        const amount = [500, 1000, 1500, 2000, 5000, 10000][index % 6];
        const borrowedDate = new Date(Date.now() - (index * 24 * 60 * 60 * 1000));
        const dueDate = new Date(borrowedDate.getTime() + (7 * 24 * 60 * 60 * 1000));
        const repaidDate = status === 'cleared' ? 
            new Date(dueDate.getTime() + ((index % 3) * 24 * 60 * 60 * 1000)) : null;
        
        return {
            id: `ledger-${Date.now()}-${index}`,
            borrowerId: `borrower-${index % 20}`,
            borrowerName: `Borrower ${index + 1}`,
            borrowerPhone: `+2547${10000000 + index}`,
            borrowerLocation: ['Nairobi', 'Kampala', 'Dar es Salaam', 'Kigali', 'Accra'][index % 5],
            lenderId: `lender-${index % 10}`,
            lenderName: `Lender ${(index % 10) + 1}`,
            groupId: `group-${index % 5}`,
            groupName: `Group ${(index % 5) + 1}`,
            country: ['kenya', 'uganda', 'tanzania', 'rwanda', 'ghana'][index % 5],
            category: category,
            categoryName: this.getCategoryName(category),
            amount: amount,
            amountBorrowed: amount,
            amountRepaid: status === 'cleared' ? amount * 1.1 : Math.floor(amount * (0.3 + Math.random() * 0.7)),
            interestRate: 10, // 10% weekly
            interestAmount: Math.round(amount * 0.1),
            penaltyRate: 5, // 5% daily after 7 days
            penaltyAmount: status === 'overdue' || status === 'defaulted' ? 
                Math.round(amount * 0.05 * (index % 7)) : 0,
            dateBorrowed: borrowedDate.toISOString(),
            dateDue: dueDate.toISOString(),
            dateRepaid: repaidDate ? repaidDate.toISOString() : null,
            status: status,
            guarantor1Name: `Guarantor ${index * 2 + 1}`,
            guarantor1Phone: `+2547${20000000 + index}`,
            guarantor2Name: `Guarantor ${index * 2 + 2}`,
            guarantor2Phone: `+2547${30000000 + index}`,
            rating: 3 + (index % 3), // 3-5 stars
            notes: index % 4 === 0 ? 'Early repayment bonus applied' : '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    getCategoryName(category) {
        const categories = {
            'fare': 'M-pesewa Fare',
            'data': 'M-pesewa Data',
            'cooking-gas': 'M-pesewa Cooking Gas',
            'food': 'M-pesewa Food',
            'credo': 'M-pesewa Credo',
            'water-bill': 'M-pesewa Water Bill',
            'fuel': 'M-pesewa Fuel',
            'repair': 'M-pesewa Repair',
            'medicine': 'M-pesewa Medicine',
            'electricity': 'M-pesewa Electricity',
            'school-fees': 'M-pesewa School Fees',
            'tv-subscription': 'M-pesewa TV Subscription',
            'advance': 'M-pesewa Advance',
            'daily-sales': 'M-Pesa Daily Sales Advance',
            'working-capital': 'M-Pesa Working Capital Advance'
        };
        return categories[category] || category;
    }

    filterLedgersByContext() {
        // Get current user from global state
        const currentUser = window.mpesewa?.state?.currentUser;
        if (!currentUser) return this.ledgers;

        let filtered = this.ledgers;
        
        // Filter by country
        if (currentUser.country) {
            filtered = filtered.filter(ledger => ledger.country === currentUser.country);
        }
        
        // Filter by group if selected
        if (this.currentGroupId) {
            filtered = filtered.filter(ledger => ledger.groupId === this.currentGroupId);
        }
        
        // Filter by lender if user is a lender
        if (currentUser.role === 'lender') {
            filtered = filtered.filter(ledger => ledger.lenderId === currentUser.id);
        }
        
        // Filter by borrower if user is a borrower
        if (currentUser.role === 'borrower') {
            filtered = filtered.filter(ledger => ledger.borrowerId === currentUser.id);
        }
        
        // Apply status filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(ledger => ledger.status === this.currentFilter);
        }
        
        return filtered;
    }

    setupEventListeners() {
        // Filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.ledger-filter-btn')) {
                const filter = e.target.closest('.ledger-filter-btn').dataset.filter;
                this.setFilter(filter);
            }
            
            if (e.target.closest('.ledger-export-btn')) {
                this.exportLedgers();
            }
            
            if (e.target.closest('.ledger-refresh-btn')) {
                this.refreshLedgers();
            }
            
            if (e.target.closest('.ledger-add-btn')) {
                this.showAddLedgerModal();
            }
            
            if (e.target.closest('.ledger-edit-btn')) {
                const ledgerId = e.target.closest('.ledger-edit-btn').dataset.id;
                this.showEditLedgerModal(ledgerId);
            }
            
            if (e.target.closest('.ledger-view-btn')) {
                const ledgerId = e.target.closest('.ledger-view-btn').dataset.id;
                this.showLedgerDetails(ledgerId);
            }
            
            if (e.target.closest('.ledger-repay-btn')) {
                const ledgerId = e.target.closest('.ledger-repay-btn').dataset.id;
                this.showRepaymentModal(ledgerId);
            }
            
            if (e.target.closest('.ledger-rate-btn')) {
                const ledgerId = e.target.closest('.ledger-rate-btn').dataset.id;
                this.showRatingModal(ledgerId);
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
        
        // Search
        const searchInput = document.getElementById('ledgerSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchLedgers(e.target.value);
            });
        }
        
        // Group filter
        const groupFilter = document.getElementById('groupFilter');
        if (groupFilter) {
            groupFilter.addEventListener('change', (e) => {
                this.currentGroupId = e.target.value || null;
                this.filteredLedgers = this.filterLedgersByContext();
                this.currentPage = 1;
                this.renderLedgerTable();
                this.updateStats();
            });
        }
        
        // Lender filter (for admin)
        const lenderFilter = document.getElementById('lenderFilter');
        if (lenderFilter) {
            lenderFilter.addEventListener('change', (e) => {
                this.currentLenderId = e.target.value || null;
                this.filteredLedgers = this.filterLedgersByContext();
                this.currentPage = 1;
                this.renderLedgerTable();
                this.updateStats();
            });
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filteredLedgers = this.filterLedgersByContext();
        this.currentPage = 1;
        this.renderLedgerTable();
        this.updateStats();
        
        // Update active filter button
        document.querySelectorAll('.ledger-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    }

    searchLedgers(query) {
        if (!query.trim()) {
            this.filteredLedgers = this.filterLedgersByContext();
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredLedgers = this.filterLedgersByContext().filter(ledger => 
                ledger.borrowerName.toLowerCase().includes(searchTerm) ||
                ledger.lenderName.toLowerCase().includes(searchTerm) ||
                ledger.groupName.toLowerCase().includes(searchTerm) ||
                ledger.categoryName.toLowerCase().includes(searchTerm) ||
                ledger.borrowerPhone.includes(searchTerm) ||
                ledger.id.toLowerCase().includes(searchTerm)
            );
        }
        
        this.currentPage = 1;
        this.renderLedgerTable();
        this.updateStats();
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredLedgers.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderLedgerTable();
        this.updatePagination();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredLedgers.length / this.itemsPerPage);
        const paginationEl = document.getElementById('ledgerPagination');
        
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
        
        // Show first page, current page, and last page
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

    renderLedgerTable() {
        const tableBody = document.getElementById('ledgerTableBody');
        if (!tableBody) return;
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const ledgersToShow = this.filteredLedgers.slice(startIndex, endIndex);
        
        if (ledgersToShow.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="12" class="no-data">
                        <div class="empty-state">
                            <div class="empty-icon">📊</div>
                            <h3>No ledgers found</h3>
                            <p>${this.currentFilter !== 'all' ? `No ${this.currentFilter} ledgers` : 'No ledgers available for the current filters'}</p>
                            <button class="btn btn-primary ledger-add-btn">Add New Ledger</button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        ledgersToShow.forEach(ledger => {
            const borrowedDate = new Date(ledger.dateBorrowed);
            const dueDate = new Date(ledger.dateDue);
            const today = new Date();
            const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
            
            const statusBadge = this.getStatusBadge(ledger.status, daysOverdue);
            const amountRepaid = ledger.amountRepaid || 0;
            const amountDue = ledger.amountBorrowed + ledger.interestAmount + ledger.penaltyAmount;
            const balance = amountDue - amountRepaid;
            
            html += `
                <tr class="ledger-row" data-id="${ledger.id}">
                    <td>
                        <div class="ledger-id">${ledger.id.slice(-8)}</div>
                        <small class="text-muted">${this.formatDate(borrowedDate)}</small>
                    </td>
                    <td>
                        <div class="borrower-info">
                            <strong>${ledger.borrowerName}</strong>
                            <div class="text-small">${ledger.borrowerPhone}</div>
                            <div class="text-small">${ledger.borrowerLocation}</div>
                        </div>
                    </td>
                    <td>
                        <div class="lender-info">
                            <strong>${ledger.lenderName}</strong>
                            <div class="text-small">${ledger.groupName}</div>
                        </div>
                    </td>
                    <td>
                        <div class="category-badge">${ledger.categoryName}</div>
                    </td>
                    <td class="text-right">
                        <div class="amount-display">
                            <strong>${this.formatCurrency(ledger.amountBorrowed)}</strong>
                            <div class="text-small">
                                +${this.formatCurrency(ledger.interestAmount)} interest
                                ${ledger.penaltyAmount > 0 ? `+${this.formatCurrency(ledger.penaltyAmount)} penalty` : ''}
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="date-display">
                            <div>${this.formatDate(dueDate)}</div>
                            ${daysOverdue > 0 ? `<div class="text-danger">${daysOverdue} days overdue</div>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="progress-display">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(100, (amountRepaid / amountDue) * 100)}%"></div>
                            </div>
                            <div class="text-small">
                                ${this.formatCurrency(amountRepaid)} / ${this.formatCurrency(amountDue)}
                            </div>
                        </div>
                    </td>
                    <td>
                        ${this.getRatingStars(ledger.rating)}
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="ledger-actions">
                            <button class="btn-icon ledger-view-btn" data-id="${ledger.id}" title="View Details">
                                👁️
                            </button>
                            ${balance > 0 ? `
                                <button class="btn-icon ledger-repay-btn" data-id="${ledger.id}" title="Record Repayment">
                                    💰
                                </button>
                            ` : ''}
                            <button class="btn-icon ledger-rate-btn" data-id="${ledger.id}" title="Rate Borrower">
                                ⭐
                            </button>
                            <button class="btn-icon ledger-edit-btn" data-id="${ledger.id}" title="Edit Ledger">
                                ✏️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        this.updatePagination();
    }

    getStatusBadge(status, daysOverdue) {
        const badges = {
            'active': '<span class="badge badge-success">Active</span>',
            'cleared': '<span class="badge badge-primary">Cleared</span>',
            'overdue': `<span class="badge badge-warning">Overdue (${daysOverdue}d)</span>`,
            'defaulted': '<span class="badge badge-danger">Defaulted</span>'
        };
        return badges[status] || `<span class="badge">${status}</span>`;
    }

    getRatingStars(rating) {
        if (!rating) return '<span class="text-muted">Not rated</span>';
        
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) {
                stars += '★';
            } else if (i === Math.ceil(rating) && rating % 1 >= 0.5) {
                stars += '☆';
            } else {
                stars += '☆';
            }
        }
        return `<div class="star-rating" title="${rating}/5">${stars}</div>`;
    }

    formatDate(date) {
        if (!(date instanceof Date)) date = new Date(date);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatCurrency(amount) {
        // Get current country currency from global state or use default
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

    updateStats() {
        const stats = {
            total: this.filteredLedgers.length,
            active: this.filteredLedgers.filter(l => l.status === 'active').length,
            overdue: this.filteredLedgers.filter(l => l.status === 'overdue').length,
            cleared: this.filteredLedgers.filter(l => l.status === 'cleared').length,
            defaulted: this.filteredLedgers.filter(l => l.status === 'defaulted').length,
            totalAmount: this.filteredLedgers.reduce((sum, l) => sum + l.amountBorrowed, 0),
            totalInterest: this.filteredLedgers.reduce((sum, l) => sum + l.interestAmount, 0),
            totalPenalty: this.filteredLedgers.reduce((sum, l) => sum + l.penaltyAmount, 0),
            totalRepaid: this.filteredLedgers.reduce((sum, l) => sum + (l.amountRepaid || 0), 0)
        };
        
        // Update stats display if elements exist
        const updateStat = (id, value, isCurrency = false) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = isCurrency ? this.formatCurrency(value) : value;
            }
        };
        
        updateStat('statTotalLedgers', stats.total);
        updateStat('statActiveLedgers', stats.active);
        updateStat('statOverdueLedgers', stats.overdue);
        updateStat('statClearedLedgers', stats.cleared);
        updateStat('statDefaultedLedgers', stats.defaulted);
        updateStat('statTotalAmount', stats.totalAmount, true);
        updateStat('statTotalInterest', stats.totalInterest, true);
        updateStat('statTotalPenalty', stats.totalPenalty, true);
        updateStat('statTotalRepaid', stats.totalRepaid, true);
        updateStat('statTotalDue', stats.totalAmount + stats.totalInterest + stats.totalPenalty - stats.totalRepaid, true);
    }

    calculateInterest(amount, days) {
        // 10% weekly interest, prorated for partial weeks
        const weeklyRate = 0.10;
        const daysInWeek = 7;
        const interest = amount * weeklyRate * (Math.min(days, daysInWeek) / daysInWeek);
        return Math.round(interest);
    }

    calculatePenalty(amount, daysOverdue) {
        // 5% daily penalty after 7 days
        if (daysOverdue <= 0) return 0;
        const dailyRate = 0.05;
        const penalty = amount * dailyRate * daysOverdue;
        return Math.round(penalty);
    }

    addLedger(ledgerData) {
        const ledger = {
            id: `ledger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...ledgerData,
            interestAmount: this.calculateInterest(ledgerData.amountBorrowed, 7),
            penaltyAmount: 0,
            status: 'active',
            amountRepaid: 0,
            rating: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.ledgers.unshift(ledger);
        this.saveLedgers();
        this.filteredLedgers = this.filterLedgersByContext();
        this.currentPage = 1;
        this.renderLedgerTable();
        this.updateStats();
        
        return ledger;
    }

    updateLedger(ledgerId, updates) {
        const index = this.ledgers.findIndex(l => l.id === ledgerId);
        if (index === -1) return null;
        
        this.ledgers[index] = {
            ...this.ledgers[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        // Recalculate interest and penalty if amount or dates changed
        if (updates.amountBorrowed || updates.dateBorrowed || updates.dateDue) {
            const ledger = this.ledgers[index];
            const dueDate = new Date(ledger.dateDue);
            const today = new Date();
            const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
            
            ledger.interestAmount = this.calculateInterest(ledger.amountBorrowed, 7);
            ledger.penaltyAmount = this.calculatePenalty(ledger.amountBorrowed, daysOverdue);
            
            // Update status based on overdue days
            if (daysOverdue > 60) {
                ledger.status = 'defaulted';
            } else if (daysOverdue > 0) {
                ledger.status = 'overdue';
            } else if (ledger.amountRepaid >= ledger.amountBorrowed + ledger.interestAmount + ledger.penaltyAmount) {
                ledger.status = 'cleared';
            }
        }
        
        this.saveLedgers();
        this.filteredLedgers = this.filterLedgersByContext();
        this.renderLedgerTable();
        this.updateStats();
        
        return this.ledgers[index];
    }

    recordRepayment(ledgerId, amount, date = new Date().toISOString()) {
        const ledger = this.ledgers.find(l => l.id === ledgerId);
        if (!ledger) return null;
        
        const totalDue = ledger.amountBorrowed + ledger.interestAmount + ledger.penaltyAmount;
        const newRepaid = (ledger.amountRepaid || 0) + amount;
        
        const updates = {
            amountRepaid: newRepaid,
            dateRepaid: newRepaid >= totalDue ? date : ledger.dateRepaid
        };
        
        // Update status if fully repaid
        if (newRepaid >= totalDue) {
            updates.status = 'cleared';
        }
        
        return this.updateLedger(ledgerId, updates);
    }

    updateRating(ledgerId, rating, feedback = '') {
        return this.updateLedger(ledgerId, {
            rating: rating,
            notes: feedback ? `${ledger.notes || ''}\nRating: ${rating}/5 - ${feedback}`.trim() : ledger.notes
        });
    }

    exportLedgers() {
        const data = JSON.stringify(this.filteredLedgers, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `mpesewa-ledgers-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    refreshLedgers() {
        // In a real app, this would fetch from server
        // For now, just reload from storage
        this.loadLedgers();
        this.renderLedgerTable();
        this.updateStats();
        
        // Show notification
        this.showNotification('Ledgers refreshed successfully', 'success');
    }

    showAddLedgerModal() {
        // Implementation would show modal with form
        // For now, log to console
        console.log('Show add ledger modal');
    }

    showEditLedgerModal(ledgerId) {
        const ledger = this.ledgers.find(l => l.id === ledgerId);
        if (!ledger) return;
        
        console.log('Show edit ledger modal for:', ledger);
        // Implementation would show modal with form pre-filled with ledger data
    }

    showLedgerDetails(ledgerId) {
        const ledger = this.ledgers.find(l => l.id === ledgerId);
        if (!ledger) return;
        
        // Create and show details modal
        const modalHtml = `
            <div class="modal ledger-details-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Ledger Details</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="ledger-details-grid">
                            <div class="detail-section">
                                <h4>Borrower Information</h4>
                                <p><strong>Name:</strong> ${ledger.borrowerName}</p>
                                <p><strong>Phone:</strong> ${ledger.borrowerPhone}</p>
                                <p><strong>Location:</strong> ${ledger.borrowerLocation}</p>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Loan Details</h4>
                                <p><strong>Amount:</strong> ${this.formatCurrency(ledger.amountBorrowed)}</p>
                                <p><strong>Category:</strong> ${ledger.categoryName}</p>
                                <p><strong>Borrowed:</strong> ${this.formatDate(ledger.dateBorrowed)}</p>
                                <p><strong>Due:</strong> ${this.formatDate(ledger.dateDue)}</p>
                                <p><strong>Status:</strong> ${ledger.status}</p>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Financial Details</h4>
                                <p><strong>Interest (10%):</strong> ${this.formatCurrency(ledger.interestAmount)}</p>
                                <p><strong>Penalty (5% daily):</strong> ${this.formatCurrency(ledger.penaltyAmount)}</p>
                                <p><strong>Total Due:</strong> ${this.formatCurrency(ledger.amountBorrowed + ledger.interestAmount + ledger.penaltyAmount)}</p>
                                <p><strong>Amount Repaid:</strong> ${this.formatCurrency(ledger.amountRepaid || 0)}</p>
                                <p><strong>Balance:</strong> ${this.formatCurrency((ledger.amountBorrowed + ledger.interestAmount + ledger.penaltyAmount) - (ledger.amountRepaid || 0))}</p>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Guarantors</h4>
                                <p><strong>Guarantor 1:</strong> ${ledger.guarantor1Name} (${ledger.guarantor1Phone})</p>
                                <p><strong>Guarantor 2:</strong> ${ledger.guarantor2Name} (${ledger.guarantor2Phone})</p>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Lender & Group</h4>
                                <p><strong>Lender:</strong> ${ledger.lenderName}</p>
                                <p><strong>Group:</strong> ${ledger.groupName}</p>
                                <p><strong>Country:</strong> ${ledger.country.toUpperCase()}</p>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Rating & Notes</h4>
                                <p><strong>Rating:</strong> ${this.getRatingStars(ledger.rating)}</p>
                                ${ledger.notes ? `<p><strong>Notes:</strong> ${ledger.notes}</p>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline modal-close">Close</button>
                        ${ledger.status !== 'cleared' ? `
                            <button class="btn btn-primary ledger-repay-btn" data-id="${ledger.id}">
                                Record Repayment
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM and show it
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Add event listeners for modal
        modalContainer.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modalContainer);
            });
        });
        
        // Add repayment button listener
        const repayBtn = modalContainer.querySelector('.ledger-repay-btn');
        if (repayBtn) {
            repayBtn.addEventListener('click', () => {
                document.body.removeChild(modalContainer);
                this.showRepaymentModal(ledgerId);
            });
        }
    }

    showRepaymentModal(ledgerId) {
        const ledger = this.ledgers.find(l => l.id === ledgerId);
        if (!ledger) return;
        
        const totalDue = ledger.amountBorrowed + ledger.interestAmount + ledger.penaltyAmount;
        const balance = totalDue - (ledger.amountRepaid || 0);
        
        console.log('Show repayment modal for ledger:', ledgerId, 'Balance:', balance);
        // Implementation would show modal with repayment form
    }

    showRatingModal(ledgerId) {
        const ledger = this.ledgers.find(l => l.id === ledgerId);
        if (!ledger) return;
        
        console.log('Show rating modal for ledger:', ledgerId);
        // Implementation would show modal with rating form
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            document.body.removeChild(notification);
        });
    }
}

// Initialize ledger system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ledgerSystem = new LedgerSystem();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LedgerSystem;
}