// /assets/js/blacklist.js

/**
 * M-Pesewa Blacklist Management System
 * Handles blacklist logic, default tracking, badge display, and admin moderation
 * Strict rule: Default = 2 months arrears, removal ONLY by admin after full payment
 */

class BlacklistSystem {
    constructor() {
        this.storageKey = 'mpesewa-blacklist';
        this.blacklistKey = 'mpesewa-blacklisted-users';
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentFilter = 'all';
        this.currentCountry = null;
        this.initialize();
    }

    initialize() {
        this.loadBlacklist();
        this.loadBlacklistedUsers();
        this.setupEventListeners();
        this.renderBlacklistTable();
        this.updateStats();
        this.checkForDefaults();
    }

    loadBlacklist() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            this.blacklistEntries = JSON.parse(stored);
        } else {
            this.blacklistEntries = this.getDemoBlacklist();
            this.saveBlacklist();
        }
        
        this.filteredEntries = this.filterEntriesByContext();
    }

    loadBlacklistedUsers() {
        const stored = localStorage.getItem(this.blacklistKey);
        if (stored) {
            this.blacklistedUsers = JSON.parse(stored);
        } else {
            this.blacklistedUsers = {};
            this.saveBlacklistedUsers();
        }
    }

    getDemoBlacklist() {
        // Generate sample blacklist data
        return Array.from({ length: 30 }, (_, i) => this.createDemoBlacklistEntry(i));
    }

    createDemoBlacklistEntry(index) {
        const reasons = ['default', 'fraud', 'multiple-defaults', 'false-information', 'non-cooperation'];
        const statuses = ['active', 'pending-removal', 'removed'];
        const reason = reasons[index % reasons.length];
        const status = statuses[index % statuses.length];
        
        const defaultDate = new Date(Date.now() - ((60 + (index * 5)) * 24 * 60 * 60 * 1000));
        const borrowedDate = new Date(defaultDate.getTime() - (30 * 24 * 60 * 60 * 1000));
        const dueDate = new Date(borrowedDate.getTime() + (7 * 24 * 60 * 60 * 1000));
        const daysOverdue = Math.max(0, Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24)));
        
        return {
            id: `blacklist-${Date.now()}-${index}`,
            borrowerId: `borrower-${index}`,
            borrowerName: `Blacklisted Borrower ${index + 1}`,
            borrowerPhone: `+2547${10000000 + index}`,
            borrowerEmail: `borrower${index}@example.com`,
            borrowerLocation: ['Nairobi', 'Kampala', 'Dar es Salaam', 'Kigali', 'Accra'][index % 5],
            nationalId: `${10000000 + index}`,
            lenderId: `lender-${index % 10}`,
            lenderName: `Lender ${(index % 10) + 1}`,
            groupId: `group-${index % 5}`,
            groupName: `Group ${(index % 5) + 1}`,
            country: ['kenya', 'uganda', 'tanzania', 'rwanda', 'ghana'][index % 5],
            loanId: `loan-${index}`,
            ledgerId: `ledger-${index}`,
            amountBorrowed: [1000, 1500, 2000, 5000, 10000][index % 5],
            amountDue: function() {
                const interest = this.amountBorrowed * 0.1;
                const penaltyDays = Math.max(0, daysOverdue - 7);
                const penalty = penaltyDays > 0 ? this.amountBorrowed * 0.05 * penaltyDays : 0;
                return this.amountBorrowed + interest + penalty;
            }(),
            amountRepaid: [0, 500, 1000, 1500][index % 4],
            amountOverdue: function() {
                return this.amountDue - this.amountRepaid;
            }(),
            dateBorrowed: borrowedDate.toISOString(),
            dateDue: dueDate.toISOString(),
            dateDefaulted: defaultDate.toISOString(),
            daysOverdue: daysOverdue,
            reason: reason,
            reasonDetails: this.getReasonDetails(reason, index),
            status: status,
            reportedBy: `lender-${index % 10}`,
            reportedByName: `Lender ${(index % 10) + 1}`,
            reportedDate: new Date(defaultDate.getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString(),
            reviewedBy: status === 'removed' ? 'admin-001' : null,
            reviewedByName: status === 'removed' ? 'Platform Admin' : null,
            reviewedDate: status === 'removed' ? 
                new Date(defaultDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString() : null,
            removalReason: status === 'removed' ? 'Full payment received with penalties' : null,
            blocks: ['new-loans', 'new-groups', 'role-switch'],
            createdAt: defaultDate.toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    getReasonDetails(reason, index) {
        const details = {
            'default': `Failed to repay loan for ${60 + (index * 5)} days despite multiple reminders`,
            'fraud': 'Provided false guarantor information and fake national ID',
            'multiple-defaults': `Has ${3 + (index % 3)} defaulted loans across different groups`,
            'false-information': 'Falsified employment and income details',
            'non-cooperation': 'Refused to communicate with lender or provide repayment plan'
        };
        return details[reason] || 'Default on loan repayment';
    }

    saveBlacklist() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.blacklistEntries));
    }

    saveBlacklistedUsers() {
        localStorage.setItem(this.blacklistKey, JSON.stringify(this.blacklistedUsers));
    }

    filterEntriesByContext() {
        let filtered = this.blacklistEntries;
        
        // Filter by status
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(entry => entry.status === this.currentFilter);
        }
        
        // Filter by country
        if (this.currentCountry) {
            filtered = filtered.filter(entry => entry.country === this.currentCountry);
        }
        
        // Filter by search if active
        if (this.currentSearch) {
            const searchTerm = this.currentSearch.toLowerCase();
            filtered = filtered.filter(entry => 
                entry.borrowerName.toLowerCase().includes(searchTerm) ||
                entry.borrowerPhone.includes(searchTerm) ||
                entry.nationalId.includes(searchTerm) ||
                entry.groupName.toLowerCase().includes(searchTerm) ||
                entry.lenderName.toLowerCase().includes(searchTerm) ||
                entry.reason.toLowerCase().includes(searchTerm)
            );
        }
        
        return filtered;
    }

    setupEventListeners() {
        // Filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.blacklist-filter-btn')) {
                const filter = e.target.closest('.blacklist-filter-btn').dataset.filter;
                this.setFilter(filter);
            }
            
            if (e.target.closest('.blacklist-export-btn')) {
                this.exportBlacklist();
            }
            
            if (e.target.closest('.blacklist-refresh-btn')) {
                this.refreshBlacklist();
            }
            
            if (e.target.closest('.blacklist-add-btn')) {
                this.showAddBlacklistModal();
            }
            
            if (e.target.closest('.blacklist-remove-btn')) {
                const entryId = e.target.closest('.blacklist-remove-btn').dataset.id;
                this.showRemoveBlacklistModal(entryId);
            }
            
            if (e.target.closest('.blacklist-view-btn')) {
                const entryId = e.target.closest('.blacklist-view-btn').dataset.id;
                this.showBlacklistDetails(entryId);
            }
            
            if (e.target.closest('.blacklist-block-btn')) {
                const borrowerId = e.target.closest('.blacklist-block-btn').dataset.borrowerId;
                this.toggleBlockStatus(borrowerId);
            }
        });
        
        // Search
        const searchInput = document.getElementById('blacklistSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchBlacklist(e.target.value);
            });
        }
        
        // Country filter
        const countryFilter = document.getElementById('countryFilter');
        if (countryFilter) {
            countryFilter.addEventListener('change', (e) => {
                this.currentCountry = e.target.value || null;
                this.filteredEntries = this.filterEntriesByContext();
                this.currentPage = 1;
                this.renderBlacklistTable();
                this.updateStats();
            });
        }
        
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
            if (e.target.closest('.admin-remove-btn')) {
                const entryId = e.target.closest('.admin-remove-btn').dataset.id;
                this.adminRemoveFromBlacklist(entryId);
            }
            
            if (e.target.closest('.admin-verify-btn')) {
                const entryId = e.target.closest('.admin-verify-btn').dataset.id;
                this.verifyBlacklistEntry(entryId);
            }
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filteredEntries = this.filterEntriesByContext();
        this.currentPage = 1;
        this.renderBlacklistTable();
        this.updateStats();
        
        // Update active filter button
        document.querySelectorAll('.blacklist-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    }

    searchBlacklist(query) {
        this.currentSearch = query;
        this.filteredEntries = this.filterEntriesByContext();
        this.currentPage = 1;
        this.renderBlacklistTable();
        this.updateStats();
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredEntries.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderBlacklistTable();
        this.updatePagination();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredEntries.length / this.itemsPerPage);
        const paginationEl = document.getElementById('blacklistPagination');
        
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

    renderBlacklistTable() {
        const tableBody = document.getElementById('blacklistTableBody');
        if (!tableBody) return;
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const entriesToShow = this.filteredEntries.slice(startIndex, endIndex);
        
        if (entriesToShow.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="12" class="no-data">
                        <div class="empty-state">
                            <div class="empty-icon">🚫</div>
                            <h3>No blacklist entries found</h3>
                            <p>${this.currentFilter !== 'all' ? `No ${this.currentFilter} entries` : 'No blacklisted users found for the current filters'}</p>
                            ${this.isAdmin() ? `
                                <button class="btn btn-primary blacklist-add-btn">Add to Blacklist</button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        entriesToShow.forEach(entry => {
            const defaultDate = new Date(entry.dateDefaulted);
            const daysOverdue = entry.daysOverdue;
            const isAdmin = this.isAdmin();
            
            const statusBadge = this.getStatusBadge(entry.status);
            const reasonBadge = this.getReasonBadge(entry.reason);
            const countryFlag = this.getCountryFlag(entry.country);
            
            html += `
                <tr class="blacklist-row ${entry.status === 'removed' ? 'removed' : ''}" data-id="${entry.id}">
                    <td>
                        <div class="borrower-info">
                            <div class="borrower-name">
                                <strong>${entry.borrowerName}</strong>
                                ${countryFlag}
                            </div>
                            <div class="text-small">${entry.borrowerPhone}</div>
                            <div class="text-small">ID: ${entry.nationalId}</div>
                            <div class="text-small">${entry.borrowerLocation}</div>
                        </div>
                    </td>
                    <td>
                        <div class="loan-info">
                            <div class="amount-overdue">
                                <strong>${this.formatCurrency(entry.amountOverdue)}</strong>
                                <div class="text-small">of ${this.formatCurrency(entry.amountDue)} total</div>
                            </div>
                            <div class="text-small">
                                Borrowed: ${this.formatDate(entry.dateBorrowed)}
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="group-info">
                            <strong>${entry.groupName}</strong>
                            <div class="text-small">Lender: ${entry.lenderName}</div>
                        </div>
                    </td>
                    <td>${reasonBadge}</td>
                    <td>
                        <div class="date-info">
                            <div>${this.formatDate(defaultDate)}</div>
                            <div class="text-danger">${daysOverdue} days overdue</div>
                        </div>
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="blocked-actions">
                            ${entry.blocks.map(block => 
                                `<span class="block-badge">${this.formatBlock(block)}</span>`
                            ).join('')}
                        </div>
                    </td>
                    <td>
                        <div class="blacklist-actions">
                            <button class="btn-icon blacklist-view-btn" data-id="${entry.id}" title="View Details">
                                👁️
                            </button>
                            ${isAdmin && entry.status === 'active' ? `
                                <button class="btn-icon btn-danger admin-remove-btn" data-id="${entry.id}" title="Remove from Blacklist">
                                    ✅
                                </button>
                            ` : ''}
                            ${isAdmin && entry.status === 'pending-removal' ? `
                                <button class="btn-icon btn-success admin-verify-btn" data-id="${entry.id}" title="Verify Removal">
                                    ✓
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

    getStatusBadge(status) {
        const badges = {
            'active': '<span class="badge badge-danger">Active</span>',
            'pending-removal': '<span class="badge badge-warning">Pending Removal</span>',
            'removed': '<span class="badge badge-success">Removed</span>'
        };
        return badges[status] || `<span class="badge">${status}</span>`;
    }

    getReasonBadge(reason) {
        const badges = {
            'default': '<span class="badge badge-danger">Default</span>',
            'fraud': '<span class="badge badge-danger">Fraud</span>',
            'multiple-defaults': '<span class="badge badge-danger">Multiple Defaults</span>',
            'false-information': '<span class="badge badge-warning">False Info</span>',
            'non-cooperation': '<span class="badge badge-warning">Non-cooperation</span>'
        };
        return badges[reason] || `<span class="badge">${reason}</span>`;
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

    formatBlock(block) {
        const blocks = {
            'new-loans': 'No Loans',
            'new-groups': 'No Groups',
            'role-switch': 'No Switching'
        };
        return blocks[block] || block;
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
            total: this.filteredEntries.length,
            active: this.filteredEntries.filter(e => e.status === 'active').length,
            pending: this.filteredEntries.filter(e => e.status === 'pending-removal').length,
            removed: this.filteredEntries.filter(e => e.status === 'removed').length,
            totalAmount: this.filteredEntries.reduce((sum, e) => sum + e.amountOverdue, 0),
            avgOverdue: this.filteredEntries.length > 0 ? 
                Math.round(this.filteredEntries.reduce((sum, e) => sum + e.daysOverdue, 0) / this.filteredEntries.length) : 0,
            byCountry: this.getStatsByCountry(),
            byReason: this.getStatsByReason()
        };
        
        // Update stats display
        const updateStat = (id, value, isCurrency = false) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = isCurrency ? this.formatCurrency(value) : value;
            }
        };
        
        updateStat('statTotalBlacklisted', stats.total);
        updateStat('statActiveBlacklist', stats.active);
        updateStat('statPendingRemoval', stats.pending);
        updateStat('statRemoved', stats.removed);
        updateStat('statTotalOverdue', stats.totalAmount, true);
        updateStat('statAvgOverdue', `${stats.avgOverdue} days`);
        
        // Update charts if they exist
        this.updateCharts(stats);
    }

    getStatsByCountry() {
        const byCountry = {};
        this.filteredEntries.forEach(entry => {
            byCountry[entry.country] = (byCountry[entry.country] || 0) + 1;
        });
        return byCountry;
    }

    getStatsByReason() {
        const byReason = {};
        this.filteredEntries.forEach(entry => {
            byReason[entry.reason] = (byReason[entry.reason] || 0) + 1;
        });
        return byReason;
    }

    updateCharts(stats) {
        // Update country distribution chart
        const countryChart = document.getElementById('countryDistributionChart');
        if (countryChart) {
            // This would be implemented with a charting library
            // For now, update a simple HTML representation
            let html = '<div class="chart-bars">';
            Object.entries(stats.byCountry).forEach(([country, count]) => {
                const percentage = (count / stats.total) * 100;
                html += `
                    <div class="chart-bar">
                        <div class="bar-label">
                            <span class="country-flag">${this.getCountryFlag(country)}</span>
                            <span>${country.toUpperCase()}</span>
                        </div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="bar-value">${count}</div>
                    </div>
                `;
            });
            html += '</div>';
            countryChart.innerHTML = html;
        }
        
        // Update reason distribution chart
        const reasonChart = document.getElementById('reasonDistributionChart');
        if (reasonChart) {
            let html = '<div class="chart-bars">';
            Object.entries(stats.byReason).forEach(([reason, count]) => {
                const percentage = (count / stats.total) * 100;
                html += `
                    <div class="chart-bar">
                        <div class="bar-label">
                            <span class="reason-badge">${this.getReasonBadge(reason)}</span>
                        </div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="bar-value">${count}</div>
                    </div>
                `;
            });
            html += '</div>';
            reasonChart.innerHTML = html;
        }
    }

    checkForDefaults() {
        // Check ledger system for loans that are 60+ days overdue
        // and add them to blacklist if not already there
        const ledgerSystem = window.ledgerSystem;
        if (!ledgerSystem) return;
        
        const now = new Date();
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
        
        // Get overdue ledgers (simplified - in real app, query ledger system)
        const overdueLedgers = ledgerSystem.ledgers?.filter(ledger => {
            if (ledger.status !== 'active') return false;
            
            const dueDate = new Date(ledger.dateDue);
            const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
            return daysOverdue >= 60;
        }) || [];
        
        // Add to blacklist if not already blacklisted
        overdueLedgers.forEach(ledger => {
            if (!this.isBlacklisted(ledger.borrowerId)) {
                this.addToBlacklistFromLedger(ledger);
            }
        });
    }

    addToBlacklistFromLedger(ledger) {
        const now = new Date();
        const dueDate = new Date(ledger.dateDue);
        const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 1000));
        
        const entry = {
            id: `blacklist-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            borrowerId: ledger.borrowerId,
            borrowerName: ledger.borrowerName,
            borrowerPhone: ledger.borrowerPhone,
            borrowerEmail: '',
            borrowerLocation: ledger.borrowerLocation,
            nationalId: '',
            lenderId: ledger.lenderId,
            lenderName: ledger.lenderName,
            groupId: ledger.groupId,
            groupName: ledger.groupName,
            country: ledger.country,
            loanId: ledger.id,
            ledgerId: ledger.id,
            amountBorrowed: ledger.amountBorrowed,
            amountDue: ledger.amountBorrowed + ledger.interestAmount + ledger.penaltyAmount,
            amountRepaid: ledger.amountRepaid || 0,
            amountOverdue: (ledger.amountBorrowed + ledger.interestAmount + ledger.penaltyAmount) - (ledger.amountRepaid || 0),
            dateBorrowed: ledger.dateBorrowed,
            dateDue: ledger.dateDue,
            dateDefaulted: new Date(dueDate.getTime() + (60 * 24 * 60 * 60 * 1000)).toISOString(),
            daysOverdue: daysOverdue,
            reason: 'default',
            reasonDetails: `Automatic blacklisting after ${daysOverdue} days overdue`,
            status: 'active',
            reportedBy: 'system',
            reportedByName: 'System Auto-detection',
            reportedDate: now.toISOString(),
            reviewedBy: null,
            reviewedByName: null,
            reviewedDate: null,
            removalReason: null,
            blocks: ['new-loans', 'new-groups'],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };
        
        this.blacklistEntries.unshift(entry);
        this.saveBlacklist();
        
        // Add to blacklisted users map
        this.blacklistedUsers[ledger.borrowerId] = {
            blacklisted: true,
            entryId: entry.id,
            dateBlacklisted: now.toISOString(),
            blocks: entry.blocks
        };
        this.saveBlacklistedUsers();
        
        // Update display
        this.filteredEntries = this.filterEntriesByContext();
        this.renderBlacklistTable();
        this.updateStats();
        
        // Show notification
        this.showNotification(`${ledger.borrowerName} added to blacklist for ${daysOverdue} days overdue`, 'warning');
        
        return entry;
    }

    isBlacklisted(borrowerId) {
        return this.blacklistedUsers[borrowerId]?.blacklisted === true;
    }

    isAdmin() {
        const user = window.mpesewa?.state?.currentUser;
        return user?.role === 'admin' || user?.isAdmin === true;
    }

    addToBlacklist(entryData) {
        const now = new Date();
        const entry = {
            id: `blacklist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...entryData,
            status: 'active',
            reportedDate: now.toISOString(),
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };
        
        this.blacklistEntries.unshift(entry);
        this.saveBlacklist();
        
        // Update blacklisted users
        this.blacklistedUsers[entry.borrowerId] = {
            blacklisted: true,
            entryId: entry.id,
            dateBlacklisted: now.toISOString(),
            blocks: entry.blocks || ['new-loans', 'new-groups']
        };
        this.saveBlacklistedUsers();
        
        this.filteredEntries = this.filterEntriesByContext();
        this.currentPage = 1;
        this.renderBlacklistTable();
        this.updateStats();
        
        this.showNotification(`${entry.borrowerName} added to blacklist`, 'success');
        return entry;
    }

    adminRemoveFromBlacklist(entryId) {
        const entry = this.blacklistEntries.find(e => e.id === entryId);
        if (!entry) return;
        
        if (!this.isAdmin()) {
            this.showNotification('Only platform admins can remove from blacklist', 'error');
            return;
        }
        
        // Show confirmation modal
        if (confirm(`Remove ${entry.borrowerName} from blacklist? This requires full payment verification.`)) {
            this.showRemoveBlacklistModal(entryId);
        }
    }

    verifyBlacklistEntry(entryId) {
        const entry = this.blacklistEntries.find(e => e.id === entryId);
        if (!entry) return;
        
        if (!this.isAdmin()) {
            this.showNotification('Admin verification required', 'error');
            return;
        }
        
        // Update entry to removed
        const index = this.blacklistEntries.findIndex(e => e.id === entryId);
        if (index === -1) return;
        
        const now = new Date();
        const user = window.mpesewa?.state?.currentUser;
        
        this.blacklistEntries[index] = {
            ...this.blacklistEntries[index],
            status: 'removed',
            reviewedBy: user?.id || 'admin',
            reviewedByName: user?.name || 'Platform Admin',
            reviewedDate: now.toISOString(),
            removalReason: 'Verified full payment and cleared by admin',
            updatedAt: now.toISOString()
        };
        
        // Remove from blacklisted users
        delete this.blacklistedUsers[entry.borrowerId];
        
        this.saveBlacklist();
        this.saveBlacklistedUsers();
        
        this.filteredEntries = this.filterEntriesByContext();
        this.renderBlacklistTable();
        this.updateStats();
        
        this.showNotification(`${entry.borrowerName} removed from blacklist`, 'success');
    }

    toggleBlockStatus(borrowerId) {
        const userEntry = this.blacklistedUsers[borrowerId];
        if (!userEntry) return;
        
        const entry = this.blacklistEntries.find(e => e.borrowerId === borrowerId);
        if (!entry) return;
        
        // Toggle specific blocks based on admin decision
        // This would be implemented with a proper UI
        console.log('Toggle block status for:', borrowerId);
    }

    exportBlacklist() {
        const data = JSON.stringify(this.filteredEntries, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `mpesewa-blacklist-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    refreshBlacklist() {
        this.loadBlacklist();
        this.loadBlacklistedUsers();
        this.filteredEntries = this.filterEntriesByContext();
        this.renderBlacklistTable();
        this.updateStats();
        
        this.showNotification('Blacklist refreshed', 'info');
    }

    showAddBlacklistModal() {
        if (!this.isAdmin()) {
            this.showNotification('Only admins can manually add to blacklist', 'error');
            return;
        }
        
        // Implementation would show modal with form
        console.log('Show add blacklist modal');
    }

    showRemoveBlacklistModal(entryId) {
        const entry = this.blacklistEntries.find(e => e.id === entryId);
        if (!entry) return;
        
        if (!this.isAdmin()) {
            this.showNotification('Only admins can remove from blacklist', 'error');
            return;
        }
        
        // Implementation would show removal modal with payment verification
        console.log('Show remove blacklist modal for:', entryId);
    }

    showBlacklistDetails(entryId) {
        const entry = this.blacklistEntries.find(e => e.id === entryId);
        if (!entry) return;
        
        const modalHtml = `
            <div class="modal blacklist-details-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Blacklist Entry Details</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="details-grid">
                            <div class="detail-section">
                                <h4>Borrower Information</h4>
                                <p><strong>Name:</strong> ${entry.borrowerName}</p>
                                <p><strong>Phone:</strong> ${entry.borrowerPhone}</p>
                                <p><strong>Location:</strong> ${entry.borrowerLocation}</p>
                                <p><strong>National ID:</strong> ${entry.nationalId || 'Not provided'}</p>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Loan & Default Details</h4>
                                <p><strong>Amount Borrowed:</strong> ${this.formatCurrency(entry.amountBorrowed)}</p>
                                <p><strong>Amount Overdue:</strong> ${this.formatCurrency(entry.amountOverdue)}</p>
                                <p><strong>Days Overdue:</strong> ${entry.daysOverdue} days</p>
                                <p><strong>Date Borrowed:</strong> ${this.formatDate(entry.dateBorrowed)}</p>
                                <p><strong>Date Due:</strong> ${this.formatDate(entry.dateDue)}</p>
                                <p><strong>Date Defaulted:</strong> ${this.formatDate(entry.dateDefaulted)}</p>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Blacklist Information</h4>
                                <p><strong>Reason:</strong> ${entry.reason}</p>
                                <p><strong>Details:</strong> ${entry.reasonDetails}</p>
                                <p><strong>Status:</strong> ${this.getStatusBadge(entry.status)}</p>
                                <p><strong>Reported By:</strong> ${entry.reportedByName} on ${this.formatDate(entry.reportedDate)}</p>
                                ${entry.reviewedByName ? `
                                    <p><strong>Reviewed By:</strong> ${entry.reviewedByName} on ${this.formatDate(entry.reviewedDate)}</p>
                                    <p><strong>Removal Reason:</strong> ${entry.removalReason}</p>
                                ` : ''}
                            </div>
                            
                            <div class="detail-section">
                                <h4>Group & Lender</h4>
                                <p><strong>Group:</strong> ${entry.groupName}</p>
                                <p><strong>Lender:</strong> ${entry.lenderName}</p>
                                <p><strong>Country:</strong> ${entry.country.toUpperCase()} ${this.getCountryFlag(entry.country)}</p>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Restrictions Applied</h4>
                                <div class="restrictions-list">
                                    ${entry.blocks.map(block => `
                                        <div class="restriction-item">
                                            <span class="restriction-icon">🚫</span>
                                            <span>${this.formatBlock(block)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline modal-close">Close</button>
                        ${this.isAdmin() && entry.status === 'active' ? `
                            <button class="btn btn-primary admin-remove-btn" data-id="${entry.id}">
                                Remove from Blacklist
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
        
        const removeBtn = modalContainer.querySelector('.admin-remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                document.body.removeChild(modalContainer);
                this.adminRemoveFromBlacklist(entryId);
            });
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

// Initialize blacklist system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.blacklistSystem = new BlacklistSystem();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlacklistSystem;
}