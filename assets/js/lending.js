// ============================================
// LENDING.JS - Lender actions, approvals, ledgers
// ============================================

'use strict';

// Lending Management Module
const LendingModule = {
    // Current lender's data
    lenderData: null,
    
    // Active loan requests
    loanRequests: [],
    
    // Current ledgers
    ledgers: [],
    
    // Initialize lending module
    init: function() {
        this.loadLenderData();
        this.loadLoanRequests();
        this.loadLedgers();
        this.setupEventListeners();
        this.updateLendingUI();
        console.log('Lending module initialized');
    },
    
    // Load lender data from localStorage
    loadLenderData: function() {
        try {
            const lenderData = localStorage.getItem('mpesewa_lender_data');
            if (lenderData) {
                this.lenderData = JSON.parse(lenderData);
                console.log('Loaded lender data:', this.lenderData.name);
            } else {
                // Check if current user is a lender
                const user = AuthModule?.currentSession;
                if (user && user.role === 'lender') {
                    this.lenderData = user;
                }
            }
        } catch (error) {
            console.error('Error loading lender data:', error);
            this.lenderData = null;
        }
    },
    
    // Load loan requests for current lender's groups
    loadLoanRequests: function() {
        try {
            const requests = localStorage.getItem('mpesewa_loan_requests');
            if (requests) {
                const allRequests = JSON.parse(requests);
                
                // Get lender's groups
                const lenderGroups = GroupsModule?.userGroups || [];
                const groupIds = lenderGroups.map(g => g.groupId);
                
                // Filter requests from lender's groups
                this.loanRequests = allRequests.filter(request => 
                    groupIds.includes(request.groupId) && 
                    request.status === 'pending'
                );
                
                console.log('Loaded loan requests:', this.loanRequests.length);
            }
        } catch (error) {
            console.error('Error loading loan requests:', error);
            this.loanRequests = [];
        }
    },
    
    // Load ledgers for current lender
    loadLedgers: function() {
        try {
            const ledgers = localStorage.getItem('mpesewa_ledgers');
            if (ledgers) {
                const allLedgers = JSON.parse(ledgers);
                const lenderId = this.lenderData?.id;
                
                if (lenderId) {
                    this.ledgers = allLedgers.filter(ledger => ledger.lenderId === lenderId);
                    console.log('Loaded ledgers:', this.ledgers.length);
                }
            }
        } catch (error) {
            console.error('Error loading ledgers:', error);
            this.ledgers = [];
        }
    },
    
    // Save lender data
    saveLenderData: function() {
        if (this.lenderData) {
            localStorage.setItem('mpesewa_lender_data', JSON.stringify(this.lenderData));
        }
    },
    
    // Save loan requests
    saveLoanRequests: function() {
        try {
            const allRequests = JSON.parse(localStorage.getItem('mpesewa_loan_requests') || '[]');
            
            // Update existing requests
            this.loanRequests.forEach(request => {
                const index = allRequests.findIndex(r => r.id === request.id);
                if (index !== -1) {
                    allRequests[index] = request;
                } else {
                    allRequests.push(request);
                }
            });
            
            localStorage.setItem('mpesewa_loan_requests', JSON.stringify(allRequests));
        } catch (error) {
            console.error('Error saving loan requests:', error);
        }
    },
    
    // Save ledgers
    saveLedgers: function() {
        try {
            const allLedgers = JSON.parse(localStorage.getItem('mpesewa_ledgers') || '[]');
            
            // Update existing ledgers
            this.ledgers.forEach(ledger => {
                const index = allLedgers.findIndex(l => l.id === ledger.id);
                if (index !== -1) {
                    allLedgers[index] = ledger;
                } else {
                    allLedgers.push(ledger);
                }
            });
            
            localStorage.setItem('mpesewa_ledgers', JSON.stringify(allLedgers));
        } catch (error) {
            console.error('Error saving ledgers:', error);
        }
    },
    
    // Check if lender can approve loans
    canApproveLoans: function() {
        if (!this.lenderData) {
            return {
                allowed: false,
                reason: 'Lender data not found'
            };
        }
        
        // Check subscription
        const subscription = this.lenderData.subscription;
        if (!subscription || subscription.status !== 'active') {
            return {
                allowed: false,
                reason: 'Active subscription required'
            };
        }
        
        // Check if blacklisted
        if (this.lenderData.blacklisted) {
            return {
                allowed: false,
                reason: 'Lender is blacklisted'
            };
        }
        
        // Check available balance (if implemented)
        const availableBalance = this.getAvailableBalance();
        if (availableBalance <= 0) {
            return {
                allowed: false,
                reason: 'Insufficient available balance'
            };
        }
        
        return {
            allowed: true,
            availableBalance: availableBalance
        };
    },
    
    // Get available lending balance
    getAvailableBalance: function() {
        if (!this.lenderData) return 0;
        
        const subscription = this.lenderData.subscription;
        if (!subscription) return 0;
        
        // Get tier limits
        const tier = subscription.tier;
        const tierConfig = RoleModule?.CONFIG?.lender?.tiers?.[tier];
        if (!tierConfig) return 0;
        
        // Calculate weekly limit
        const weeklyLimit = tierConfig.max_per_week || tierConfig.max_per_month / 4;
        
        // Calculate amount lent this week
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const lentThisWeek = this.ledgers
            .filter(ledger => {
                const ledgerDate = new Date(ledger.createdAt);
                return ledgerDate >= oneWeekAgo && ledger.status === 'active';
            })
            .reduce((sum, ledger) => sum + ledger.amount, 0);
        
        return Math.max(0, weeklyLimit - lentThisWeek);
    },
    
    // Get loan requests for lender
    getLoanRequests: function(filters = {}) {
        let requests = this.loanRequests;
        
        // Apply filters
        if (filters.groupId) {
            requests = requests.filter(request => request.groupId === filters.groupId);
        }
        
        if (filters.category) {
            requests = requests.filter(request => request.category === filters.category);
        }
        
        if (filters.minAmount) {
            requests = requests.filter(request => request.amount >= filters.minAmount);
        }
        
        if (filters.maxAmount) {
            requests = requests.filter(request => request.amount <= filters.maxAmount);
        }
        
        if (filters.borrowerRating) {
            requests = requests.filter(request => request.borrowerRating >= filters.borrowerRating);
        }
        
        return requests;
    },
    
    // Get ledger by ID
    getLedgerById: function(ledgerId) {
        return this.ledgers.find(ledger => ledger.id === ledgerId);
    },
    
    // Get ledgers with filters
    getLedgers: function(filters = {}) {
        let ledgers = this.ledgers;
        
        // Apply filters
        if (filters.status) {
            ledgers = ledgers.filter(ledger => ledger.status === filters.status);
        }
        
        if (filters.borrowerName) {
            const searchTerm = filters.borrowerName.toLowerCase();
            ledgers = ledgers.filter(ledger => 
                ledger.borrowerName.toLowerCase().includes(searchTerm)
            );
        }
        
        if (filters.category) {
            ledgers = ledgers.filter(ledger => ledger.category === filters.category);
        }
        
        if (filters.minAmount) {
            ledgers = ledgers.filter(ledger => ledger.amount >= filters.minAmount);
        }
        
        if (filters.maxAmount) {
            ledgers = ledgers.filter(ledger => ledger.amount <= filters.maxAmount);
        }
        
        // Sort ledgers
        if (filters.sortBy) {
            ledgers.sort((a, b) => {
                switch (filters.sortBy) {
                    case 'amount':
                        return filters.sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
                    case 'dueDate':
                        return filters.sortOrder === 'desc' ? 
                            new Date(b.dueDate) - new Date(a.dueDate) : 
                            new Date(a.dueDate) - new Date(b.dueDate);
                    case 'createdAt':
                        return filters.sortOrder === 'desc' ?
                            new Date(b.createdAt) - new Date(a.createdAt) :
                            new Date(a.createdAt) - new Date(b.createdAt);
                    default:
                        return 0;
                }
            });
        }
        
        return ledgers;
    },
    
    // Approve a loan request
    approveLoan: function(requestId, terms = {}) {
        // Check if lender can approve
        const canApprove = this.canApproveLoans();
        if (!canApprove.allowed) {
            return {
                success: false,
                message: canApprove.reason
            };
        }
        
        // Find loan request
        const request = this.loanRequests.find(req => req.id === requestId);
        if (!request) {
            return {
                success: false,
                message: 'Loan request not found'
            };
        }
        
        // Check if request is still pending
        if (request.status !== 'pending') {
            return {
                success: false,
                message: 'Loan request already processed'
            };
        }
        
        // Check amount against available balance
        if (request.amount > canApprove.availableBalance) {
            return {
                success: false,
                message: `Amount exceeds available balance (${formatCurrency(canApprove.availableBalance)})`
            };
        }
        
        // Check amount against tier limit
        const tier = this.lenderData.subscription.tier;
        const tierConfig = RoleModule?.CONFIG?.lender?.tiers?.[tier];
        if (tierConfig) {
            const maxAmount = tierConfig.max_per_week || tierConfig.max_per_month;
            if (request.amount > maxAmount) {
                return {
                    success: false,
                    message: `Amount exceeds tier limit (${formatCurrency(maxAmount)})`
                };
            }
        }
        
        // Create ledger
        const ledger = this.createLedger(request, terms);
        
        // Update request status
        request.status = 'approved';
        request.approvedAt = new Date().toISOString();
        request.approvedBy = this.lenderData.id;
        request.ledgerId = ledger.id;
        
        // Update lender stats
        this.updateLenderStats(request.amount);
        
        // Save changes
        this.saveLoanRequests();
        this.saveLedgers();
        this.saveLenderData();
        
        console.log('Loan approved:', request.id, 'by', this.lenderData.name);
        
        return {
            success: true,
            message: 'Loan approved successfully',
            ledger: ledger,
            request: request
        };
    },
    
    // Create ledger from loan request
    createLedger: function(request, terms) {
        const ledgerId = `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Calculate dates
        const now = new Date();
        const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        
        // Calculate interest (10% weekly)
        const interest = request.amount * 0.10;
        
        const ledger = {
            id: ledgerId,
            requestId: request.id,
            lenderId: this.lenderData.id,
            lenderName: this.lenderData.name,
            borrowerId: request.borrowerId,
            borrowerName: request.borrowerName,
            borrowerPhone: request.borrowerPhone,
            borrowerLocation: request.borrowerLocation,
            
            // Guarantors
            guarantor1: request.guarantor1,
            guarantor2: request.guarantor2,
            
            // Loan details
            amount: request.amount,
            category: request.category,
            purpose: request.purpose,
            
            // Terms
            interestRate: 0.10, // 10% weekly
            interest: interest,
            totalAmount: request.amount + interest,
            dueDate: dueDate.toISOString(),
            repaymentPeriod: 7, // days
            
            // Status
            status: 'active',
            amountRepaid: 0,
            amountDue: request.amount + interest,
            daysOverdue: 0,
            
            // Penalties
            penaltyRate: 0.05, // 5% daily after due date
            penalties: 0,
            totalPenalties: 0,
            
            // Timestamps
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            disbursedAt: now.toISOString()
        };
        
        // Add custom terms if provided
        Object.assign(ledger, terms);
        
        // Add to ledgers
        this.ledgers.push(ledger);
        
        return ledger;
    },
    
    // Update lender statistics
    updateLenderStats: function(amount) {
        if (!this.lenderData) return;
        
        // Initialize stats if not present
        if (!this.lenderData.stats) {
            this.lenderData.stats = {
                totalLent: 0,
                totalOutstanding: 0,
                totalInterestEarned: 0,
                totalLoans: 0,
                activeLoans: 0,
                repaidLoans: 0,
                defaultedLoans: 0
            };
        }
        
        // Update stats
        this.lenderData.stats.totalLent += amount;
        this.lenderData.stats.totalOutstanding += amount;
        this.lenderData.stats.totalLoans += 1;
        this.lenderData.stats.activeLoans += 1;
    },
    
    // Reject a loan request
    rejectLoan: function(requestId, reason = '') {
        // Find loan request
        const request = this.loanRequests.find(req => req.id === requestId);
        if (!request) {
            return {
                success: false,
                message: 'Loan request not found'
            };
        }
        
        // Check if request is still pending
        if (request.status !== 'pending') {
            return {
                success: false,
                message: 'Loan request already processed'
            };
        }
        
        // Update request status
        request.status = 'rejected';
        request.rejectedAt = new Date().toISOString();
        request.rejectedBy = this.lenderData?.id;
        request.rejectionReason = reason;
        
        // Save changes
        this.saveLoanRequests();
        
        console.log('Loan rejected:', request.id, 'by', this.lenderData?.name);
        
        return {
            success: true,
            message: 'Loan request rejected',
            request: request
        };
    },
    
    // Record repayment
    recordRepayment: function(ledgerId, amount, partial = true) {
        // Find ledger
        const ledger = this.getLedgerById(ledgerId);
        if (!ledger) {
            return {
                success: false,
                message: 'Ledger not found'
            };
        }
        
        // Check if ledger is active
        if (ledger.status !== 'active') {
            return {
                success: false,
                message: 'Ledger is not active'
            };
        }
        
        // Calculate penalties if overdue
        const now = new Date();
        const dueDate = new Date(ledger.dueDate);
        let penalties = 0;
        
        if (now > dueDate) {
            const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
            ledger.daysOverdue = daysOverdue;
            
            // Calculate penalty (5% daily on outstanding balance)
            const outstandingBeforePenalty = ledger.amountDue - ledger.amountRepaid;
            penalties = outstandingBeforePenalty * 0.05 * daysOverdue;
            ledger.penalties = penalties;
            ledger.totalPenalties += penalties;
            ledger.amountDue += penalties;
        }
        
        // Update repayment
        ledger.amountRepaid += amount;
        ledger.updatedAt = now.toISOString();
        
        // Check if fully repaid
        if (ledger.amountRepaid >= ledger.amountDue) {
            ledger.status = 'repaid';
            ledger.repaidAt = now.toISOString();
            
            // Update lender stats
            if (this.lenderData?.stats) {
                this.lenderData.stats.totalOutstanding -= ledger.amount;
                this.lenderData.stats.activeLoans -= 1;
                this.lenderData.stats.repaidLoans += 1;
                this.lenderData.stats.totalInterestEarned += ledger.interest;
            }
        } else if (partial) {
            ledger.status = 'active_partial';
        }
        
        // Save changes
        this.saveLedgers();
        this.saveLenderData();
        
        console.log('Repayment recorded:', amount, 'for ledger', ledgerId);
        
        return {
            success: true,
            message: 'Repayment recorded successfully',
            ledger: ledger,
            penalties: penalties,
            remaining: ledger.amountDue - ledger.amountRepaid
        };
    },
    
    // Mark loan as defaulted
    markAsDefaulted: function(ledgerId) {
        // Find ledger
        const ledger = this.getLedgerById(ledgerId);
        if (!ledger) {
            return {
                success: false,
                message: 'Ledger not found'
            };
        }
        
        // Check if overdue for 2 months (60 days)
        const now = new Date();
        const dueDate = new Date(ledger.dueDate);
        const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
        
        if (daysOverdue < 60) {
            return {
                success: false,
                message: 'Loan must be overdue for at least 60 days to mark as defaulted'
            };
        }
        
        // Update ledger status
        ledger.status = 'defaulted';
        ledger.defaultedAt = now.toISOString();
        ledger.daysOverdue = daysOverdue;
        ledger.updatedAt = now.toISOString();
        
        // Update lender stats
        if (this.lenderData?.stats) {
            this.lenderData.stats.activeLoans -= 1;
            this.lenderData.stats.defaultedLoans += 1;
        }
        
        // Save changes
        this.saveLedgers();
        this.saveLenderData();
        
        console.log('Loan marked as defaulted:', ledgerId);
        
        return {
            success: true,
            message: 'Loan marked as defaulted',
            ledger: ledger
        };
    },
    
    // Blacklist borrower
    blacklistBorrower: function(ledgerId, reason = '') {
        // Find ledger
        const ledger = this.getLedgerById(ledgerId);
        if (!ledger) {
            return {
                success: false,
                message: 'Ledger not found'
            };
        }
        
        // Check if loan is defaulted
        if (ledger.status !== 'defaulted') {
            return {
                success: false,
                message: 'Only defaulted loans can trigger blacklisting'
            };
        }
        
        // Get borrower data
        const borrowerId = ledger.borrowerId;
        
        // In a real app, this would update the borrower's status in the database
        // For now, we'll just mark the ledger
        ledger.blacklisted = true;
        ledger.blacklistReason = reason;
        ledger.blacklistedAt = new Date().toISOString();
        ledger.blacklistedBy = this.lenderData?.id;
        
        // Save changes
        this.saveLedgers();
        
        console.log('Borrower blacklisted:', borrowerId, 'for ledger', ledgerId);
        
        return {
            success: true,
            message: 'Borrower blacklisted',
            ledger: ledger
        };
    },
    
    // Rate borrower
    rateBorrower: function(ledgerId, rating, review = '') {
        // Validate rating
        if (rating < 1 || rating > 5) {
            return {
                success: false,
                message: 'Rating must be between 1 and 5'
            };
        }
        
        // Find ledger
        const ledger = this.getLedgerById(ledgerId);
        if (!ledger) {
            return {
                success: false,
                message: 'Ledger not found'
            };
        }
        
        // Check if loan is repaid
        if (ledger.status !== 'repaid') {
            return {
                success: false,
                message: 'Can only rate borrowers after loan repayment'
            };
        }
        
        // Update ledger with rating
        ledger.borrowerRating = rating;
        ledger.borrowerReview = review;
        ledger.ratedAt = new Date().toISOString();
        ledger.updatedAt = new Date().toISOString();
        
        // Save changes
        this.saveLedgers();
        
        console.log('Borrower rated:', rating, 'stars for ledger', ledgerId);
        
        return {
            success: true,
            message: 'Borrower rated successfully',
            ledger: ledger
        };
    },
    
    // Get lending statistics
    getLendingStats: function() {
        if (!this.lenderData) return null;
        
        const stats = this.lenderData.stats || {
            totalLent: 0,
            totalOutstanding: 0,
            totalInterestEarned: 0,
            totalLoans: 0,
            activeLoans: 0,
            repaidLoans: 0,
            defaultedLoans: 0
        };
        
        // Calculate additional stats
        const availableBalance = this.getAvailableBalance();
        const repaymentRate = stats.totalLent > 0 ? 
            ((stats.totalLent - stats.totalOutstanding) / stats.totalLent * 100).toFixed(1) : 0;
        
        return {
            ...stats,
            availableBalance: availableBalance,
            repaymentRate: repaymentRate + '%',
            avgLoanSize: stats.totalLoans > 0 ? stats.totalLent / stats.totalLoans : 0,
            defaultRate: stats.totalLoans > 0 ? (stats.defaultedLoans / stats.totalLoans * 100).toFixed(1) + '%' : '0%'
        };
    },
    
    // Update lending UI
    updateLendingUI: function() {
        // Update stats dashboard
        this.renderLendingStats();
        
        // Update loan requests list
        this.renderLoanRequests();
        
        // Update ledgers list
        this.renderLedgers();
    },
    
    // Render lending statistics
    renderLendingStats: function() {
        const statsContainer = document.getElementById('lendingStats');
        if (!statsContainer) return;
        
        const stats = this.getLendingStats();
        const canApprove = this.canApproveLoans();
        
        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-info">
                        <div class="stat-value">${formatCurrency(stats?.totalLent || 0)}</div>
                        <div class="stat-label">Total Lent</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📈</div>
                    <div class="stat-info">
                        <div class="stat-value">${formatCurrency(stats?.availableBalance || 0)}</div>
                        <div class="stat-label">Available Balance</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">🔄</div>
                    <div class="stat-info">
                        <div class="stat-value">${stats?.activeLoans || 0}</div>
                        <div class="stat-label">Active Loans</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-info">
                        <div class="stat-value">${stats?.repaymentRate || '0%'}</div>
                        <div class="stat-label">Repayment Rate</div>
                    </div>
                </div>
            </div>
            
            <div class="lending-status">
                <div class="status-indicator ${canApprove.allowed ? 'status-active' : 'status-inactive'}">
                    <span class="status-dot"></span>
                    <span class="status-text">
                        ${canApprove.allowed ? 'Ready to Lend' : 'Lending Disabled'}
                    </span>
                </div>
                ${!canApprove.allowed ? `
                <p class="status-note">${canApprove.reason}</p>
                ` : ''}
            </div>
        `;
    },
    
    // Render loan requests
    renderLoanRequests: function() {
        const requestsContainer = document.getElementById('loanRequests');
        if (!requestsContainer) return;
        
        const requests = this.getLoanRequests();
        
        if (requests.length === 0) {
            requestsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>No Loan Requests</h3>
                    <p>There are no pending loan requests in your groups.</p>
                </div>
            `;
        } else {
            requestsContainer.innerHTML = requests.map(request => `
                <div class="loan-request-card" data-request-id="${request.id}">
                    <div class="request-header">
                        <div class="request-category">${this.getCategoryIcon(request.category)} ${request.category}</div>
                        <div class="request-amount">${formatCurrency(request.amount)}</div>
                    </div>
                    
                    <div class="request-details">
                        <div class="detail-row">
                            <span class="detail-label">Borrower:</span>
                            <span class="detail-value">${request.borrowerName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Location:</span>
                            <span class="detail-value">${request.borrowerLocation}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Rating:</span>
                            <span class="detail-value">${this.renderRatingStars(request.borrowerRating)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Purpose:</span>
                            <span class="detail-value">${request.purpose}</span>
                        </div>
                    </div>
                    
                    <div class="request-footer">
                        <div class="request-meta">
                            <span class="meta-item">${this.getTimeAgo(request.createdAt)}</span>
                            <span class="meta-item">${request.groupName}</span>
                        </div>
                        
                        <div class="request-actions">
                            <button class="btn btn-outline btn-small reject-request" data-request-id="${request.id}">Reject</button>
                            <button class="btn btn-primary btn-small approve-request" data-request-id="${request.id}">Approve</button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Add event listeners
            document.querySelectorAll('.approve-request').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const requestId = e.target.dataset.requestId;
                    this.handleApproveRequest(requestId);
                });
            });
            
            document.querySelectorAll('.reject-request').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const requestId = e.target.dataset.requestId;
                    this.handleRejectRequest(requestId);
                });
            });
        }
    },
    
    // Render ledgers
    renderLedgers: function() {
        const ledgersContainer = document.getElementById('ledgersList');
        if (!ledgersContainer) return;
        
        const ledgers = this.getLedgers({ sortBy: 'createdAt', sortOrder: 'desc' });
        
        if (ledgers.length === 0) {
            ledgersContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📒</div>
                    <h3>No Ledgers</h3>
                    <p>You haven't approved any loans yet.</p>
                </div>
            `;
        } else {
            ledgersContainer.innerHTML = ledgers.map(ledger => `
                <div class="ledger-card ${ledger.status}" data-ledger-id="${ledger.id}">
                    <div class="ledger-header">
                        <div class="ledger-status ${ledger.status}">
                            <span class="status-dot"></span>
                            <span class="status-text">${this.getStatusText(ledger.status)}</span>
                        </div>
                        <div class="ledger-amount">${formatCurrency(ledger.amount)}</div>
                    </div>
                    
                    <div class="ledger-details">
                        <div class="detail-row">
                            <span class="detail-label">Borrower:</span>
                            <span class="detail-value">${ledger.borrowerName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Category:</span>
                            <span class="detail-value">${ledger.category}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Due Date:</span>
                            <span class="detail-value ${ledger.daysOverdue > 0 ? 'text-danger' : ''}">
                                ${new Date(ledger.dueDate).toLocaleDateString()}
                                ${ledger.daysOverdue > 0 ? `(${ledger.daysOverdue} days overdue)` : ''}
                            </span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Amount Due:</span>
                            <span class="detail-value">${formatCurrency(ledger.amountDue)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Amount Repaid:</span>
                            <span class="detail-value">${formatCurrency(ledger.amountRepaid)}</span>
                        </div>
                    </div>
                    
                    <div class="ledger-actions">
                        ${ledger.status === 'active' || ledger.status === 'active_partial' ? `
                        <button class="btn btn-outline btn-small record-repayment" data-ledger-id="${ledger.id}">Record Repayment</button>
                        ` : ''}
                        ${ledger.status === 'defaulted' ? `
                        <button class="btn btn-danger btn-small blacklist-borrower" data-ledger-id="${ledger.id}">Blacklist</button>
                        ` : ''}
                        ${ledger.status === 'repaid' && !ledger.borrowerRating ? `
                        <button class="btn btn-primary btn-small rate-borrower" data-ledger-id="${ledger.id}">Rate</button>
                        ` : ''}
                        <button class="btn btn-text btn-small view-ledger" data-ledger-id="${ledger.id}">View</button>
                    </div>
                </div>
            `).join('');
            
            // Add event listeners
            document.querySelectorAll('.record-repayment').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const ledgerId = e.target.dataset.ledgerId;
                    this.handleRecordRepayment(ledgerId);
                });
            });
            
            document.querySelectorAll('.blacklist-borrower').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const ledgerId = e.target.dataset.ledgerId;
                    this.handleBlacklistBorrower(ledgerId);
                });
            });
            
            document.querySelectorAll('.rate-borrower').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const ledgerId = e.target.dataset.ledgerId;
                    this.handleRateBorrower(ledgerId);
                });
            });
            
            document.querySelectorAll('.view-ledger').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const ledgerId = e.target.dataset.ledgerId;
                    this.handleViewLedger(ledgerId);
                });
            });
        }
    },
    
    // Get category icon
    getCategoryIcon: function(category) {
        const icons = {
            'fare': '🚌',
            'data': '📱',
            'cooking_gas': '🔥',
            'food': '🍲',
            'credo': '🛠️',
            'water_bill': '💧',
            'fuel': '⛽',
            'repair': '🔧',
            'medicine': '💊',
            'electricity': '💡',
            'school_fees': '🎓',
            'tv_subscription': '📺',
            'advance': '💰',
            'sales_advance': '📊',
            'capital_advance': '🏢'
        };
        
        return icons[category] || '💰';
    },
    
    // Render rating stars
    renderRatingStars: function(rating) {
        if (!rating) return 'Not rated';
        
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < fullStars; i++) stars += '⭐';
        if (halfStar) stars += '½';
        for (let i = 0; i < emptyStars; i++) stars += '☆';
        
        return stars + ` (${rating.toFixed(1)})`;
    },
    
    // Get status text
    getStatusText: function(status) {
        const statusMap = {
            'active': 'Active',
            'active_partial': 'Partially Repaid',
            'repaid': 'Repaid',
            'defaulted': 'Defaulted',
            'cancelled': 'Cancelled'
        };
        
        return statusMap[status] || status;
    },
    
    // Get time ago
    getTimeAgo: function(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        return new Date(dateString).toLocaleDateString();
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Filter loan requests
        const requestFilters = document.getElementById('requestFilters');
        if (requestFilters) {
            requestFilters.addEventListener('change', (e) => {
                this.handleFilterRequests();
            });
        }
        
        // Filter ledgers
        const ledgerFilters = document.getElementById('ledgerFilters');
        if (ledgerFilters) {
            ledgerFilters.addEventListener('change', (e) => {
                this.handleFilterLedgers();
            });
        }
        
        // Search ledgers
        const searchLedgers = document.getElementById('searchLedgers');
        if (searchLedgers) {
            searchLedgers.addEventListener('input', (e) => {
                this.handleSearchLedgers(e.target.value);
            });
        }
        
        // New loan form
        const newLoanForm = document.getElementById('newLoanForm');
        if (newLoanForm) {
            newLoanForm.addEventListener('submit', (e) => this.handleNewLoan(e));
        }
    },
    
    // Handle approve request
    handleApproveRequest: function(requestId) {
        const result = this.approveLoan(requestId);
        
        if (result.success) {
            showNotification(result.message, 'success');
            
            // Update UI
            this.updateLendingUI();
            
            // Show ledger details
            if (result.ledger) {
                this.showLedgerDetails(result.ledger);
            }
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle reject request
    handleRejectRequest: function(requestId) {
        const reason = prompt('Please enter rejection reason:');
        if (reason === null) return; // User cancelled
        
        const result = this.rejectLoan(requestId, reason);
        
        if (result.success) {
            showNotification(result.message, 'success');
            this.updateLendingUI();
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle record repayment
    handleRecordRepayment: function(ledgerId) {
        const amount = parseFloat(prompt('Enter repayment amount:'));
        if (isNaN(amount) || amount <= 0) {
            showNotification('Please enter a valid amount', 'error');
            return;
        }
        
        const result = this.recordRepayment(ledgerId, amount);
        
        if (result.success) {
            showNotification(result.message, 'success');
            
            if (result.penalties > 0) {
                showNotification(`Penalties applied: ${formatCurrency(result.penalties)}`, 'info');
            }
            
            if (result.remaining > 0) {
                showNotification(`Remaining amount: ${formatCurrency(result.remaining)}`, 'info');
            }
            
            this.updateLendingUI();
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle blacklist borrower
    handleBlacklistBorrower: function(ledgerId) {
        if (!confirm('Are you sure you want to blacklist this borrower? This will prevent them from borrowing in any group.')) {
            return;
        }
        
        const reason = prompt('Please enter reason for blacklisting:');
        if (reason === null) return;
        
        const result = this.blacklistBorrower(ledgerId, reason);
        
        if (result.success) {
            showNotification(result.message, 'success');
            this.updateLendingUI();
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle rate borrower
    handleRateBorrower: function(ledgerId) {
        const rating = parseFloat(prompt('Rate the borrower (1-5 stars):'));
        if (isNaN(rating) || rating < 1 || rating > 5) {
            showNotification('Please enter a valid rating between 1 and 5', 'error');
            return;
        }
        
        const review = prompt('Optional review (leave empty for no review):');
        
        const result = this.rateBorrower(ledgerId, rating, review);
        
        if (result.success) {
            showNotification(result.message, 'success');
            this.updateLendingUI();
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle view ledger
    handleViewLedger: function(ledgerId) {
        const ledger = this.getLedgerById(ledgerId);
        if (ledger) {
            this.showLedgerDetails(ledger);
        }
    },
    
    // Show ledger details
    showLedgerDetails: function(ledger) {
        const modal = document.getElementById('ledgerDetailsModal');
        if (!modal) return;
        
        // Populate modal with ledger details
        const content = `
            <div class="ledger-details-modal">
                <h3>Ledger Details</h3>
                <div class="ledger-summary">
                    <div class="summary-row">
                        <span class="summary-label">Borrower:</span>
                        <span class="summary-value">${ledger.borrowerName}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Phone:</span>
                        <span class="summary-value">${ledger.borrowerPhone}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Location:</span>
                        <span class="summary-value">${ledger.borrowerLocation}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Category:</span>
                        <span class="summary-value">${ledger.category}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Amount:</span>
                        <span class="summary-value">${formatCurrency(ledger.amount)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Interest (10%):</span>
                        <span class="summary-value">${formatCurrency(ledger.interest)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Total Due:</span>
                        <span class="summary-value">${formatCurrency(ledger.amountDue)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Amount Repaid:</span>
                        <span class="summary-value">${formatCurrency(ledger.amountRepaid)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Due Date:</span>
                        <span class="summary-value">${new Date(ledger.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Status:</span>
                        <span class="summary-value ${ledger.status}">${this.getStatusText(ledger.status)}</span>
                    </div>
                </div>
                
                ${ledger.guarantor1 ? `
                <div class="guarantors-section">
                    <h4>Guarantors</h4>
                    <div class="guarantor-list">
                        <div class="guarantor">
                            <strong>${ledger.guarantor1.name}</strong>
                            <div>${ledger.guarantor1.phone}</div>
                        </div>
                        ${ledger.guarantor2 ? `
                        <div class="guarantor">
                            <strong>${ledger.guarantor2.name}</strong>
                            <div>${ledger.guarantor2.phone}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
                
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="LendingModule.closeLedgerModal()">Close</button>
                </div>
            </div>
        `;
        
        modal.innerHTML = content;
        modal.style.display = 'block';
    },
    
    // Close ledger modal
    closeLedgerModal: function() {
        const modal = document.getElementById('ledgerDetailsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    // Handle filter requests
    handleFilterRequests: function() {
        const filters = {
            groupId: document.getElementById('filterRequestGroup')?.value,
            category: document.getElementById('filterRequestCategory')?.value,
            minAmount: document.getElementById('filterRequestMinAmount')?.value,
            maxAmount: document.getElementById('filterRequestMaxAmount')?.value,
            borrowerRating: document.getElementById('filterRequestRating')?.value
        };
        
        // Filter and render requests
        const requests = this.getLoanRequests(filters);
        this.renderFilteredRequests(requests);
    },
    
    // Handle filter ledgers
    handleFilterLedgers: function() {
        const filters = {
            status: document.getElementById('filterLedgerStatus')?.value,
            category: document.getElementById('filterLedgerCategory')?.value,
            minAmount: document.getElementById('filterLedgerMinAmount')?.value,
            maxAmount: document.getElementById('filterLedgerMaxAmount')?.value
        };
        
        const ledgers = this.getLedgers(filters);
        this.renderFilteredLedgers(ledgers);
    },
    
    // Handle search ledgers
    handleSearchLedgers: function(searchTerm) {
        const filters = {
            borrowerName: searchTerm
        };
        
        const ledgers = this.getLedgers(filters);
        this.renderFilteredLedgers(ledgers);
    },
    
    // Render filtered requests
    renderFilteredRequests: function(requests) {
        const requestsContainer = document.getElementById('loanRequests');
        if (!requestsContainer) return;
        
        if (requests.length === 0) {
            requestsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No Matching Requests</h3>
                    <p>Try adjusting your filters.</p>
                </div>
            `;
        } else {
            // Similar to renderLoanRequests but with filtered requests
            requestsContainer.innerHTML = requests.map(request => `
                <div class="loan-request-card" data-request-id="${request.id}">
                    <div class="request-header">
                        <div class="request-category">${this.getCategoryIcon(request.category)} ${request.category}</div>
                        <div class="request-amount">${formatCurrency(request.amount)}</div>
                    </div>
                    
                    <div class="request-details">
                        <div class="detail-row">
                            <span class="detail-label">Borrower:</span>
                            <span class="detail-value">${request.borrowerName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Purpose:</span>
                            <span class="detail-value">${request.purpose}</span>
                        </div>
                    </div>
                    
                    <div class="request-actions">
                        <button class="btn btn-outline btn-small reject-request" data-request-id="${request.id}">Reject</button>
                        <button class="btn btn-primary btn-small approve-request" data-request-id="${request.id}">Approve</button>
                    </div>
                </div>
            `).join('');
            
            // Reattach event listeners
            document.querySelectorAll('.approve-request').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const requestId = e.target.dataset.requestId;
                    this.handleApproveRequest(requestId);
                });
            });
            
            document.querySelectorAll('.reject-request').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const requestId = e.target.dataset.requestId;
                    this.handleRejectRequest(requestId);
                });
            });
        }
    },
    
    // Render filtered ledgers
    renderFilteredLedgers: function(ledgers) {
        const ledgersContainer = document.getElementById('ledgersList');
        if (!ledgersContainer) return;
        
        if (ledgers.length === 0) {
            ledgersContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No Matching Ledgers</h3>
                    <p>Try adjusting your filters or search.</p>
                </div>
            `;
        } else {
            // Similar to renderLedgers but with filtered ledgers
            ledgersContainer.innerHTML = ledgers.map(ledger => `
                <div class="ledger-card ${ledger.status}" data-ledger-id="${ledger.id}">
                    <div class="ledger-header">
                        <div class="ledger-status ${ledger.status}">
                            <span class="status-dot"></span>
                            <span class="status-text">${this.getStatusText(ledger.status)}</span>
                        </div>
                        <div class="ledger-amount">${formatCurrency(ledger.amount)}</div>
                    </div>
                    
                    <div class="ledger-details">
                        <div class="detail-row">
                            <span class="detail-label">Borrower:</span>
                            <span class="detail-value">${ledger.borrowerName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Due Date:</span>
                            <span class="detail-value">${new Date(ledger.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Amount Due:</span>
                            <span class="detail-value">${formatCurrency(ledger.amountDue)}</span>
                        </div>
                    </div>
                    
                    <div class="ledger-actions">
                        <button class="btn btn-text btn-small view-ledger" data-ledger-id="${ledger.id}">View</button>
                    </div>
                </div>
            `).join('');
            
            // Reattach event listeners
            document.querySelectorAll('.view-ledger').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const ledgerId = e.target.dataset.ledgerId;
                    this.handleViewLedger(ledgerId);
                });
            });
        }
    },
    
    // Handle new loan (direct lending without request)
    handleNewLoan: function(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Create mock loan request
        const request = {
            id: `request_${Date.now()}`,
            borrowerId: formData.get('borrowerId'),
            borrowerName: formData.get('borrowerName'),
            borrowerPhone: formData.get('borrowerPhone'),
            borrowerLocation: formData.get('borrowerLocation'),
            borrowerRating: parseFloat(formData.get('borrowerRating')) || 5.0,
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            purpose: formData.get('purpose'),
            groupId: formData.get('groupId'),
            groupName: formData.get('groupName'),
            status: 'pending',
            createdAt: new Date().toISOString(),
            guarantor1: {
                name: formData.get('guarantor1Name'),
                phone: formData.get('guarantor1Phone')
            },
            guarantor2: {
                name: formData.get('guarantor2Name'),
                phone: formData.get('guarantor2Phone')
            }
        };
        
        // Add to loan requests
        this.loanRequests.push(request);
        this.saveLoanRequests();
        
        // Auto-approve if checkbox checked
        if (formData.get('autoApprove') === 'on') {
            const result = this.approveLoan(request.id);
            
            if (result.success) {
                showNotification('Loan created and approved successfully', 'success');
                this.updateLendingUI();
                form.reset();
            } else {
                showNotification('Loan created but approval failed: ' + result.message, 'error');
            }
        } else {
            showNotification('Loan request created successfully', 'success');
            this.updateLendingUI();
            form.reset();
        }
    }
};

// Initialize lending module when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LendingModule.init());
} else {
    LendingModule.init();
}

// Make LendingModule available globally
window.LendingModule = LendingModule;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LendingModule;
}