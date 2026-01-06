// ============================================
// BORROWING.JS - Borrower flows, requests, repayments
// ============================================

'use strict';

// Borrowing Management Module
const BorrowingModule = {
    // Current borrower's data
    borrowerData: null,
    
    // Active loans
    activeLoans: [],
    
    // Loan history
    loanHistory: [],
    
    // Available lenders in groups
    availableLenders: [],
    
    // Initialize borrowing module
    init: function() {
        this.loadBorrowerData();
        this.loadActiveLoans();
        this.loadLoanHistory();
        this.loadAvailableLenders();
        this.setupEventListeners();
        this.updateBorrowingUI();
        console.log('Borrowing module initialized');
    },
    
    // Load borrower data from localStorage
    loadBorrowerData: function() {
        try {
            const borrowerData = localStorage.getItem('mpesewa_borrower_data');
            if (borrowerData) {
                this.borrowerData = JSON.parse(borrowerData);
                console.log('Loaded borrower data:', this.borrowerData.name);
            } else {
                // Check if current user is a borrower
                const user = AuthModule?.currentSession;
                if (user && user.role === 'borrower') {
                    this.borrowerData = user;
                }
            }
        } catch (error) {
            console.error('Error loading borrower data:', error);
            this.borrowerData = null;
        }
    },
    
    // Load active loans for current borrower
    loadActiveLoans: function() {
        try {
            const loans = localStorage.getItem('mpesewa_loans');
            if (loans) {
                const allLoans = JSON.parse(loans);
                const borrowerId = this.borrowerData?.id;
                
                if (borrowerId) {
                    this.activeLoans = allLoans.filter(loan => 
                        loan.borrowerId === borrowerId && 
                        loan.status === 'active'
                    );
                    console.log('Loaded active loans:', this.activeLoans.length);
                }
            }
        } catch (error) {
            console.error('Error loading active loans:', error);
            this.activeLoans = [];
        }
    },
    
    // Load loan history for current borrower
    loadLoanHistory: function() {
        try {
            const loans = localStorage.getItem('mpesewa_loans');
            if (loans) {
                const allLoans = JSON.parse(loans);
                const borrowerId = this.borrowerData?.id;
                
                if (borrowerId) {
                    this.loanHistory = allLoans.filter(loan => 
                        loan.borrowerId === borrowerId && 
                        loan.status !== 'active'
                    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    
                    console.log('Loaded loan history:', this.loanHistory.length);
                }
            }
        } catch (error) {
            console.error('Error loading loan history:', error);
            this.loanHistory = [];
        }
    },
    
    // Load available lenders in borrower's groups
    loadAvailableLenders: function() {
        try {
            // Get borrower's groups
            const borrowerGroups = GroupsModule?.userGroups || [];
            const groupIds = borrowerGroups.map(g => g.groupId);
            
            // Get all lenders
            const allLenders = JSON.parse(localStorage.getItem('mpesewa_lenders') || '[]');
            
            // Filter lenders in borrower's groups with active subscriptions
            this.availableLenders = allLenders.filter(lender => {
                // Check if lender is in any of borrower's groups
                const inSameGroup = lender.groups?.some(groupId => groupIds.includes(groupId));
                
                // Check if lender has active subscription
                const subscriptionActive = lender.subscription?.status === 'active';
                
                // Check if lender offers needed categories
                const offersCategories = this.borrowerData?.loanCategories?.every(category => 
                    lender.categories?.includes(category)
                ) || true;
                
                return inSameGroup && subscriptionActive && offersCategories;
            });
            
            console.log('Loaded available lenders:', this.availableLenders.length);
        } catch (error) {
            console.error('Error loading available lenders:', error);
            this.availableLenders = [];
        }
    },
    
    // Save borrower data
    saveBorrowerData: function() {
        if (this.borrowerData) {
            localStorage.setItem('mpesewa_borrower_data', JSON.stringify(this.borrowerData));
        }
    },
    
    // Save loans
    saveLoans: function() {
        try {
            const allLoans = JSON.parse(localStorage.getItem('mpesewa_loans') || '[]');
            
            // Update active loans
            this.activeLoans.forEach(loan => {
                const index = allLoans.findIndex(l => l.id === loan.id);
                if (index !== -1) {
                    allLoans[index] = loan;
                } else {
                    allLoans.push(loan);
                }
            });
            
            // Update loan history
            this.loanHistory.forEach(loan => {
                const index = allLoans.findIndex(l => l.id === loan.id);
                if (index !== -1) {
                    allLoans[index] = loan;
                }
            });
            
            localStorage.setItem('mpesewa_loans', JSON.stringify(allLoans));
        } catch (error) {
            console.error('Error saving loans:', error);
        }
    },
    
    // Check if borrower can request loan
    canRequestLoan: function() {
        if (!this.borrowerData) {
            return {
                allowed: false,
                reason: 'Borrower data not found'
            };
        }
        
        // Check if blacklisted
        if (this.borrowerData.blacklisted) {
            return {
                allowed: false,
                reason: 'Account is blacklisted'
            };
        }
        
        // Check active loans limit (max 1 per group)
        const activeLoanCount = this.activeLoans.length;
        const maxLoans = 1; // Can have only 1 active loan at a time
        
        if (activeLoanCount >= maxLoans) {
            return {
                allowed: false,
                reason: 'Maximum active loans reached'
            };
        }
        
        // Check rating
        if (this.borrowerData.rating < 2.0) {
            return {
                allowed: false,
                reason: 'Minimum 2.0 rating required to request loans'
            };
        }
        
        // Check if borrower has groups
        const borrowerGroups = GroupsModule?.userGroups || [];
        if (borrowerGroups.length === 0) {
            return {
                allowed: false,
                reason: 'Join a group to request loans'
            };
        }
        
        // Check if there are available lenders
        if (this.availableLenders.length === 0) {
            return {
                allowed: false,
                reason: 'No available lenders in your groups'
            };
        }
        
        return {
            allowed: true,
            maxAmount: this.getMaxLoanAmount(),
            availableLenders: this.availableLenders.length
        };
    },
    
    // Get maximum loan amount based on borrower's rating and lender tiers
    getMaxLoanAmount: function() {
        if (!this.borrowerData) return 0;
        
        // Base amount based on rating
        const rating = this.borrowerData.rating || 5.0;
        let baseAmount = 0;
        
        if (rating >= 4.5) baseAmount = 20000;
        else if (rating >= 4.0) baseAmount = 10000;
        else if (rating >= 3.0) baseAmount = 5000;
        else if (rating >= 2.0) baseAmount = 1500;
        else return 0;
        
        // Check available lender tiers
        const lenderTiers = this.availableLenders.map(lender => {
            const tier = lender.subscription?.tier;
            const tierConfig = RoleModule?.CONFIG?.lender?.tiers?.[tier];
            return tierConfig?.max_per_week || 0;
        });
        
        const maxLenderAmount = Math.max(...lenderTiers, 0);
        
        return Math.min(baseAmount, maxLenderAmount);
    },
    
    // Request a loan
    requestLoan: function(loanData) {
        // Check if borrower can request loan
        const canRequest = this.canRequestLoan();
        if (!canRequest.allowed) {
            return {
                success: false,
                message: canRequest.reason
            };
        }
        
        // Validate loan data
        const validation = this.validateLoanData(loanData);
        if (!validation.valid) {
            return {
                success: false,
                message: validation.errors[0]
            };
        }
        
        // Check amount against max allowed
        if (loanData.amount > canRequest.maxAmount) {
            return {
                success: false,
                message: `Amount exceeds maximum allowed (${formatCurrency(canRequest.maxAmount)})`
            };
        }
        
        // Check if selected lender is available
        const lender = this.availableLenders.find(l => l.id === loanData.lenderId);
        if (!lender) {
            return {
                success: false,
                message: 'Selected lender is not available'
            };
        }
        
        // Check lender's available balance
        const lenderBalance = LendingModule?.getAvailableBalance() || 0;
        if (loanData.amount > lenderBalance) {
            return {
                success: false,
                message: 'Lender has insufficient available balance'
            };
        }
        
        // Create loan request
        const loanRequest = this.createLoanRequest(loanData, lender);
        
        // Create loan object
        const loan = this.createLoanObject(loanRequest);
        
        // Add to active loans
        this.activeLoans.push(loan);
        
        // Update borrower stats
        this.updateBorrowerStats(loanData.amount);
        
        // Save changes
        this.saveLoans();
        this.saveBorrowerData();
        
        console.log('Loan requested:', loan.id, 'by', this.borrowerData.name);
        
        return {
            success: true,
            message: 'Loan request submitted successfully',
            loan: loan,
            loanRequest: loanRequest,
            redirect: `/pages/borrowing.html?loanId=${loan.id}`
        };
    },
    
    // Validate loan data
    validateLoanData: function(loanData) {
        const errors = [];
        
        // Required fields
        if (!loanData.amount || loanData.amount <= 0) {
            errors.push('Please enter a valid loan amount');
        }
        
        if (!loanData.category) {
            errors.push('Please select a loan category');
        }
        
        if (!loanData.purpose || loanData.purpose.length < 10) {
            errors.push('Please provide a clear purpose (minimum 10 characters)');
        }
        
        if (!loanData.groupId) {
            errors.push('Please select a group');
        }
        
        if (!loanData.lenderId) {
            errors.push('Please select a lender');
        }
        
        // Check amount minimum
        if (loanData.amount < 100) {
            errors.push('Minimum loan amount is 100');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    // Create loan request object
    createLoanRequest: function(loanData, lender) {
        const requestId = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            id: requestId,
            borrowerId: this.borrowerData.id,
            borrowerName: this.borrowerData.name,
            borrowerPhone: this.borrowerData.phone,
            borrowerLocation: this.borrowerData.location,
            borrowerRating: this.borrowerData.rating || 5.0,
            amount: loanData.amount,
            category: loanData.category,
            purpose: loanData.purpose,
            groupId: loanData.groupId,
            groupName: loanData.groupName,
            lenderId: lender.id,
            lenderName: lender.name,
            status: 'pending',
            createdAt: new Date().toISOString(),
            guarantor1: this.borrowerData.guarantor1,
            guarantor2: this.borrowerData.guarantor2
        };
    },
    
    // Create loan object
    createLoanObject: function(loanRequest) {
        const loanId = `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        
        // Calculate interest (10% weekly)
        const interest = loanRequest.amount * 0.10;
        
        return {
            id: loanId,
            requestId: loanRequest.id,
            borrowerId: loanRequest.borrowerId,
            borrowerName: loanRequest.borrowerName,
            lenderId: loanRequest.lenderId,
            lenderName: loanRequest.lenderName,
            
            // Loan details
            amount: loanRequest.amount,
            category: loanRequest.category,
            purpose: loanRequest.purpose,
            groupId: loanRequest.groupId,
            groupName: loanRequest.groupName,
            
            // Terms
            interestRate: 0.10, // 10% weekly
            interest: interest,
            totalAmount: loanRequest.amount + interest,
            dueDate: dueDate.toISOString(),
            repaymentPeriod: 7, // days
            
            // Repayment tracking
            amountRepaid: 0,
            amountDue: loanRequest.amount + interest,
            lastRepaymentDate: null,
            repaymentHistory: [],
            
            // Penalties
            penaltyRate: 0.05, // 5% daily after due date
            penalties: 0,
            daysOverdue: 0,
            
            // Status
            status: 'pending_approval',
            disbursed: false,
            disbursedAt: null,
            
            // Timestamps
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };
    },
    
    // Update borrower statistics
    updateBorrowerStats: function(amount) {
        if (!this.borrowerData) return;
        
        // Initialize stats if not present
        if (!this.borrowerData.stats) {
            this.borrowerData.stats = {
                totalBorrowed: 0,
                totalRepaid: 0,
                totalOutstanding: 0,
                totalLoans: 0,
                activeLoans: 0,
                repaidLoans: 0,
                defaultedLoans: 0,
                avgLoanSize: 0
            };
        }
        
        // Update stats
        this.borrowerData.stats.totalBorrowed += amount;
        this.borrowerData.stats.totalOutstanding += amount;
        this.borrowerData.stats.totalLoans += 1;
        this.borrowerData.stats.activeLoans += 1;
    },
    
    // Get loan by ID
    getLoanById: function(loanId) {
        return [...this.activeLoans, ...this.loanHistory].find(loan => loan.id === loanId);
    },
    
    // Get active loans with filters
    getActiveLoans: function(filters = {}) {
        let loans = this.activeLoans;
        
        // Apply filters
        if (filters.groupId) {
            loans = loans.filter(loan => loan.groupId === filters.groupId);
        }
        
        if (filters.category) {
            loans = loans.filter(loan => loan.category === filters.category);
        }
        
        if (filters.minAmount) {
            loans = loans.filter(loan => loan.amount >= filters.minAmount);
        }
        
        if (filters.maxAmount) {
            loans = loans.filter(loan => loan.amount <= filters.maxAmount);
        }
        
        // Sort loans
        if (filters.sortBy) {
            loans.sort((a, b) => {
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
        
        return loans;
    },
    
    // Get loan history with filters
    getLoanHistory: function(filters = {}) {
        let loans = this.loanHistory;
        
        // Apply filters
        if (filters.status) {
            loans = loans.filter(loan => loan.status === filters.status);
        }
        
        if (filters.category) {
            loans = loans.filter(loan => loan.category === filters.category);
        }
        
        if (filters.minAmount) {
            loans = loans.filter(loan => loan.amount >= filters.minAmount);
        }
        
        if (filters.maxAmount) {
            loans = loans.filter(loan => loan.amount <= filters.maxAmount);
        }
        
        // Sort loans
        loans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return loans;
    },
    
    // Make a repayment
    makeRepayment: function(loanId, amount, paymentMethod = 'manual') {
        // Find loan
        const loan = this.getLoanById(loanId);
        if (!loan) {
            return {
                success: false,
                message: 'Loan not found'
            };
        }
        
        // Check if loan is active
        if (!['active', 'active_partial', 'overdue'].includes(loan.status)) {
            return {
                success: false,
                message: 'Loan is not active'
            };
        }
        
        // Validate amount
        if (amount <= 0) {
            return {
                success: false,
                message: 'Please enter a valid repayment amount'
            };
        }
        
        if (amount > loan.amountDue - loan.amountRepaid) {
            return {
                success: false,
                message: 'Repayment amount exceeds outstanding balance'
            };
        }
        
        // Calculate penalties if overdue
        const now = new Date();
        const dueDate = new Date(loan.dueDate);
        let penalties = 0;
        
        if (now > dueDate) {
            const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
            loan.daysOverdue = daysOverdue;
            
            // Calculate penalty (5% daily on outstanding balance before this payment)
            const outstandingBeforePayment = loan.amountDue - loan.amountRepaid;
            penalties = outstandingBeforePayment * 0.05 * daysOverdue;
            loan.penalties += penalties;
            loan.amountDue += penalties;
        }
        
        // Update repayment
        loan.amountRepaid += amount;
        loan.updatedAt = now.toISOString();
        loan.lastRepaymentDate = now.toISOString();
        
        // Add to repayment history
        loan.repaymentHistory.push({
            date: now.toISOString(),
            amount: amount,
            method: paymentMethod,
            penalties: penalties,
            remaining: loan.amountDue - loan.amountRepaid
        });
        
        // Update loan status
        if (loan.amountRepaid >= loan.amountDue) {
            loan.status = 'repaid';
            loan.repaidAt = now.toISOString();
            
            // Move from active to history
            this.activeLoans = this.activeLoans.filter(l => l.id !== loanId);
            this.loanHistory.unshift(loan);
            
            // Update borrower stats
            if (this.borrowerData?.stats) {
                this.borrowerData.stats.totalRepaid += loan.amount;
                this.borrowerData.stats.totalOutstanding -= loan.amount;
                this.borrowerData.stats.activeLoans -= 1;
                this.borrowerData.stats.repaidLoans += 1;
            }
        } else if (amount < loan.amountDue - loan.amountRepaid) {
            loan.status = 'active_partial';
        }
        
        // Save changes
        this.saveLoans();
        this.saveBorrowerData();
        
        console.log('Repayment made:', amount, 'for loan', loanId);
        
        return {
            success: true,
            message: 'Repayment successful',
            loan: loan,
            penalties: penalties,
            remaining: loan.amountDue - loan.amountRepaid,
            isFullyRepaid: loan.status === 'repaid'
        };
    },
    
    // Calculate repayment schedule
    calculateRepaymentSchedule: function(loanId) {
        const loan = this.getLoanById(loanId);
        if (!loan) return null;
        
        const schedule = [];
        const totalAmount = loan.totalAmount;
        const dailyAmount = totalAmount / 7;
        const startDate = new Date(loan.disbursedAt || loan.createdAt);
        
        // Generate 7-day schedule
        for (let i = 1; i <= 7; i++) {
            const dueDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const isOverdue = new Date() > dueDate;
            
            schedule.push({
                day: i,
                dueDate: dueDate.toISOString(),
                amountDue: dailyAmount,
                cumulativeAmount: dailyAmount * i,
                status: isOverdue ? 'overdue' : 'pending'
            });
        }
        
        // Calculate penalties for overdue days
        if (loan.daysOverdue > 0) {
            const penaltyPerDay = (loan.amountDue - loan.amountRepaid) * 0.05;
            
            for (let i = 8; i <= 7 + loan.daysOverdue; i++) {
                const penaltyDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
                
                schedule.push({
                    day: i,
                    dueDate: penaltyDate.toISOString(),
                    amountDue: penaltyPerDay,
                    cumulativeAmount: totalAmount + (penaltyPerDay * (i - 7)),
                    status: 'penalty',
                    isPenalty: true
                });
            }
        }
        
        return schedule;
    },
    
    // Get loan summary
    getLoanSummary: function(loanId) {
        const loan = this.getLoanById(loanId);
        if (!loan) return null;
        
        const now = new Date();
        const dueDate = new Date(loan.dueDate);
        const daysRemaining = Math.max(0, Math.floor((dueDate - now) / (1000 * 60 * 60 * 24)));
        const isOverdue = now > dueDate;
        const daysOverdue = isOverdue ? Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)) : 0;
        
        // Calculate penalties if overdue
        let penalties = 0;
        if (isOverdue) {
            const outstandingBalance = loan.amountDue - loan.amountRepaid;
            penalties = outstandingBalance * 0.05 * daysOverdue;
        }
        
        return {
            loan: loan,
            daysRemaining: daysRemaining,
            isOverdue: isOverdue,
            daysOverdue: daysOverdue,
            penalties: penalties,
            totalDue: loan.amountDue + penalties,
            amountRepaid: loan.amountRepaid,
            amountOutstanding: loan.amountDue - loan.amountRepaid + penalties,
            repaymentProgress: (loan.amountRepaid / loan.totalAmount) * 100,
            nextPaymentDue: daysRemaining > 0 ? dueDate.toISOString() : null
        };
    },
    
    // Get borrowing statistics
    getBorrowingStats: function() {
        if (!this.borrowerData) return null;
        
        const stats = this.borrowerData.stats || {
            totalBorrowed: 0,
            totalRepaid: 0,
            totalOutstanding: 0,
            totalLoans: 0,
            activeLoans: 0,
            repaidLoans: 0,
            defaultedLoans: 0,
            avgLoanSize: 0
        };
        
        // Calculate additional stats
        const canBorrow = this.canRequestLoan();
        const repaymentRate = stats.totalBorrowed > 0 ? 
            ((stats.totalRepaid) / stats.totalBorrowed * 100).toFixed(1) : 0;
        
        // Calculate total interest paid
        const totalInterest = this.loanHistory
            .filter(loan => loan.status === 'repaid')
            .reduce((sum, loan) => sum + (loan.interest || 0), 0);
        
        return {
            ...stats,
            canBorrow: canBorrow.allowed,
            maxLoanAmount: canBorrow.maxAmount || 0,
            repaymentRate: repaymentRate + '%',
            totalInterest: totalInterest,
            avgLoanSize: stats.totalLoans > 0 ? stats.totalBorrowed / stats.totalLoans : 0,
            defaultRate: stats.totalLoans > 0 ? (stats.defaultedLoans / stats.totalLoans * 100).toFixed(1) + '%' : '0%',
            availableLenders: canBorrow.availableLenders || 0
        };
    },
    
    // Update borrowing UI
    updateBorrowingUI: function() {
        // Update stats dashboard
        this.renderBorrowingStats();
        
        // Update active loans list
        this.renderActiveLoans();
        
        // Update loan history
        this.renderLoanHistory();
        
        // Update available lenders
        this.renderAvailableLenders();
    },
    
    // Render borrowing statistics
    renderBorrowingStats: function() {
        const statsContainer = document.getElementById('borrowingStats');
        if (!statsContainer) return;
        
        const stats = this.getBorrowingStats();
        const canBorrow = this.canRequestLoan();
        
        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-info">
                        <div class="stat-value">${formatCurrency(stats?.totalBorrowed || 0)}</div>
                        <div class="stat-label">Total Borrowed</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-info">
                        <div class="stat-value">${formatCurrency(stats?.totalOutstanding || 0)}</div>
                        <div class="stat-label">Total Outstanding</div>
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
            
            <div class="borrowing-status">
                <div class="status-indicator ${canBorrow.allowed ? 'status-active' : 'status-inactive'}">
                    <span class="status-dot"></span>
                    <span class="status-text">
                        ${canBorrow.allowed ? 'Eligible to Borrow' : 'Cannot Borrow'}
                    </span>
                </div>
                ${canBorrow.allowed ? `
                <p class="status-note">
                    Maximum loan amount: ${formatCurrency(canBorrow.maxAmount)} • 
                    Available lenders: ${canBorrow.availableLenders}
                </p>
                ` : `
                <p class="status-note">${canBorrow.reason}</p>
                `}
            </div>
        `;
    },
    
    // Render active loans
    renderActiveLoans: function() {
        const loansContainer = document.getElementById('activeLoans');
        if (!loansContainer) return;
        
        const loans = this.getActiveLoans();
        
        if (loans.length === 0) {
            loansContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>No Active Loans</h3>
                    <p>You don't have any active loans at the moment.</p>
                    ${this.canRequestLoan().allowed ? `
                    <button class="btn btn-primary" id="requestFirstLoan">Request Loan</button>
                    ` : ''}
                </div>
            `;
            
            document.getElementById('requestFirstLoan')?.addEventListener('click', () => {
                document.getElementById('requestLoanModal')?.style.display = 'block';
            });
        } else {
            loansContainer.innerHTML = loans.map(loan => {
                const summary = this.getLoanSummary(loan.id);
                
                return `
                    <div class="loan-card ${loan.status}" data-loan-id="${loan.id}">
                        <div class="loan-header">
                            <div class="loan-category">${this.getCategoryIcon(loan.category)} ${loan.category}</div>
                            <div class="loan-amount">${formatCurrency(loan.amount)}</div>
                        </div>
                        
                        <div class="loan-details">
                            <div class="detail-row">
                                <span class="detail-label">Lender:</span>
                                <span class="detail-value">${loan.lenderName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Group:</span>
                                <span class="detail-value">${loan.groupName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Due Date:</span>
                                <span class="detail-value ${summary?.isOverdue ? 'text-danger' : ''}">
                                    ${new Date(loan.dueDate).toLocaleDateString()}
                                    ${summary?.isOverdue ? `(${summary.daysOverdue} days overdue)` : `(${summary?.daysRemaining} days left)`}
                                </span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Total Due:</span>
                                <span class="detail-value">${formatCurrency(summary?.totalDue || loan.totalAmount)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Amount Repaid:</span>
                                <span class="detail-value">${formatCurrency(loan.amountRepaid)}</span>
                            </div>
                        </div>
                        
                        <div class="loan-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${summary?.repaymentProgress || 0}%"></div>
                            </div>
                            <div class="progress-label">
                                <span>${(summary?.repaymentProgress || 0).toFixed(1)}% Repaid</span>
                                <span>${formatCurrency(summary?.amountOutstanding || loan.amountDue - loan.amountRepaid)} Remaining</span>
                            </div>
                        </div>
                        
                        <div class="loan-actions">
                            <button class="btn btn-primary btn-small make-repayment" data-loan-id="${loan.id}">Make Repayment</button>
                            <button class="btn btn-outline btn-small view-loan" data-loan-id="${loan.id}">View Details</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Add event listeners
            document.querySelectorAll('.make-repayment').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const loanId = e.target.dataset.loanId;
                    this.handleMakeRepayment(loanId);
                });
            });
            
            document.querySelectorAll('.view-loan').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const loanId = e.target.dataset.loanId;
                    this.handleViewLoan(loanId);
                });
            });
        }
    },
    
    // Render loan history
    renderLoanHistory: function() {
        const historyContainer = document.getElementById('loanHistory');
        if (!historyContainer) return;
        
        const history = this.getLoanHistory();
        
        if (history.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <h3>No Loan History</h3>
                    <p>You haven't taken any loans yet.</p>
                </div>
            `;
        } else {
            historyContainer.innerHTML = history.map(loan => `
                <div class="history-card ${loan.status}" data-loan-id="${loan.id}">
                    <div class="history-header">
                        <div class="history-category">${this.getCategoryIcon(loan.category)}</div>
                        <div class="history-info">
                            <h4 class="history-title">${loan.category} Loan</h4>
                            <div class="history-meta">
                                <span class="meta-item">${formatCurrency(loan.amount)}</span>
                                <span class="meta-item">${new Date(loan.createdAt).toLocaleDateString()}</span>
                                <span class="meta-item status-${loan.status}">${this.getStatusText(loan.status)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="history-details">
                        <div class="detail-row">
                            <span class="detail-label">Lender:</span>
                            <span class="detail-value">${loan.lenderName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Repaid:</span>
                            <span class="detail-value">${formatCurrency(loan.amountRepaid)} of ${formatCurrency(loan.totalAmount)}</span>
                        </div>
                        ${loan.repaidAt ? `
                        <div class="detail-row">
                            <span class="detail-label">Repaid On:</span>
                            <span class="detail-value">${new Date(loan.repaidAt).toLocaleDateString()}</span>
                        </div>
                        ` : ''}
                        ${loan.borrowerRating ? `
                        <div class="detail-row">
                            <span class="detail-label">Your Rating:</span>
                            <span class="detail-value">${this.renderRatingStars(loan.borrowerRating)}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="history-actions">
                        <button class="btn btn-text btn-small view-history" data-loan-id="${loan.id}">View Details</button>
                    </div>
                </div>
            `).join('');
            
            // Add event listeners
            document.querySelectorAll('.view-history').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const loanId = e.target.dataset.loanId;
                    this.handleViewLoan(loanId);
                });
            });
        }
    },
    
    // Render available lenders
    renderAvailableLenders: function() {
        const lendersContainer = document.getElementById('availableLenders');
        if (!lendersContainer) return;
        
        if (this.availableLenders.length === 0) {
            lendersContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>No Lenders Available</h3>
                    <p>There are no active lenders in your groups at the moment.</p>
                </div>
            `;
        } else {
            lendersContainer.innerHTML = this.availableLenders.map(lender => `
                <div class="lender-card" data-lender-id="${lender.id}">
                    <div class="lender-header">
                        <div class="lender-avatar">${lender.name.charAt(0)}</div>
                        <div class="lender-info">
                            <h4 class="lender-name">${lender.name}</h4>
                            <div class="lender-meta">
                                <span class="meta-item">${lender.subscription?.tier || 'Basic'} Tier</span>
                                <span class="meta-item">⭐ ${lender.lenderRating?.toFixed(1) || '5.0'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="lender-details">
                        <div class="detail-row">
                            <span class="detail-label">Available:</span>
                            <span class="detail-value">${formatCurrency(LendingModule?.getAvailableBalance() || 0)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Categories:</span>
                            <span class="detail-value">${lender.categories?.slice(0, 3).map(c => this.getCategoryName(c)).join(', ')}${lender.categories?.length > 3 ? '...' : ''}</span>
                        </div>
                    </div>
                    
                    <div class="lender-actions">
                        <button class="btn btn-outline btn-small select-lender" data-lender-id="${lender.id}">Select</button>
                    </div>
                </div>
            `).join('');
            
            // Add event listeners
            document.querySelectorAll('.select-lender').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const lenderId = e.target.dataset.lenderId;
                    this.handleSelectLender(lenderId);
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
            'capital_advance': '🏢',
            'wifi': '🌐',
            'advance_loan': '💸'
        };
        
        return icons[category] || '💰';
    },
    
    // Get category name
    getCategoryName: function(category) {
        const names = {
            'fare': 'Transport',
            'data': 'Data/Airtime',
            'cooking_gas': 'Cooking Gas',
            'food': 'Food',
            'credo': 'Repairs',
            'water_bill': 'Water Bill',
            'fuel': 'Fuel',
            'repair': 'Vehicle Repair',
            'medicine': 'Medicine',
            'electricity': 'Electricity',
            'school_fees': 'School Fees',
            'tv_subscription': 'TV Subscription',
            'advance': 'Advance',
            'sales_advance': 'Sales Advance',
            'capital_advance': 'Capital Advance',
            'wifi': 'WiFi',
            'advance_loan': 'Advance Loan'
        };
        
        return names[category] || category;
    },
    
    // Get status text
    getStatusText: function(status) {
        const statusMap = {
            'pending_approval': 'Pending Approval',
            'active': 'Active',
            'active_partial': 'Partially Repaid',
            'overdue': 'Overdue',
            'repaid': 'Repaid',
            'defaulted': 'Defaulted',
            'cancelled': 'Cancelled',
            'rejected': 'Rejected'
        };
        
        return statusMap[status] || status;
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
    
    // Setup event listeners
    setupEventListeners: function() {
        // Request loan form
        const requestLoanForm = document.getElementById('requestLoanForm');
        if (requestLoanForm) {
            requestLoanForm.addEventListener('submit', (e) => this.handleRequestLoan(e));
        }
        
        // Make repayment form
        const repaymentForm = document.getElementById('repaymentForm');
        if (repaymentForm) {
            repaymentForm.addEventListener('submit', (e) => this.handleRepaymentForm(e));
        }
        
        // Filter active loans
        const loanFilters = document.getElementById('loanFilters');
        if (loanFilters) {
            loanFilters.addEventListener('change', (e) => {
                this.handleFilterLoans();
            });
        }
        
        // Filter loan history
        const historyFilters = document.getElementById('historyFilters');
        if (historyFilters) {
            historyFilters.addEventListener('change', (e) => {
                this.handleFilterHistory();
            });
        }
        
        // Search lenders
        const searchLenders = document.getElementById('searchLenders');
        if (searchLenders) {
            searchLenders.addEventListener('input', (e) => {
                this.handleSearchLenders(e.target.value);
            });
        }
    },
    
    // Handle request loan
    handleRequestLoan: function(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const loanData = {
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            purpose: formData.get('purpose'),
            groupId: formData.get('groupId'),
            groupName: formData.get('groupName'),
            lenderId: formData.get('lenderId'),
            repaymentPlan: formData.get('repaymentPlan') || '7_days'
        };
        
        const result = this.requestLoan(loanData);
        
        if (result.success) {
            showNotification(result.message, 'success');
            
            // Close modal if exists
            const modal = document.getElementById('requestLoanModal');
            if (modal) modal.style.display = 'none';
            
            // Redirect to loan page
            if (result.redirect) {
                setTimeout(() => {
                    window.location.href = result.redirect;
                }, 1500);
            }
            
            // Update UI
            this.updateBorrowingUI();
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle make repayment
    handleMakeRepayment: function(loanId) {
        const modal = document.getElementById('repaymentModal');
        if (!modal) return;
        
        const loan = this.getLoanById(loanId);
        if (!loan) return;
        
        const summary = this.getLoanSummary(loanId);
        
        // Populate modal
        modal.querySelector('#repaymentLoanId').value = loanId;
        modal.querySelector('#repaymentAmount').max = summary?.amountOutstanding || loan.amountDue - loan.amountRepaid;
        modal.querySelector('#repaymentAmount').placeholder = `Max: ${formatCurrency(summary?.amountOutstanding || loan.amountDue - loan.amountRepaid)}`;
        
        // Show summary
        const summaryEl = modal.querySelector('.repayment-summary');
        if (summaryEl) {
            summaryEl.innerHTML = `
                <div class="summary-item">
                    <span>Loan Amount:</span>
                    <strong>${formatCurrency(loan.amount)}</strong>
                </div>
                <div class="summary-item">
                    <span>Interest (10%):</span>
                    <strong>${formatCurrency(loan.interest)}</strong>
                </div>
                ${summary?.penalties > 0 ? `
                <div class="summary-item text-danger">
                    <span>Penalties (${summary.daysOverdue} days):</span>
                    <strong>${formatCurrency(summary.penalties)}</strong>
                </div>
                ` : ''}
                <div class="summary-item">
                    <span>Amount Repaid:</span>
                    <strong>${formatCurrency(loan.amountRepaid)}</strong>
                </div>
                <div class="summary-item total">
                    <span>Total Outstanding:</span>
                    <strong>${formatCurrency(summary?.amountOutstanding || loan.amountDue - loan.amountRepaid)}</strong>
                </div>
            `;
        }
        
        modal.style.display = 'block';
    },
    
    // Handle repayment form
    handleRepaymentForm: function(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const loanId = formData.get('loanId');
        const amount = parseFloat(formData.get('amount'));
        const paymentMethod = formData.get('paymentMethod') || 'manual';
        
        const result = this.makeRepayment(loanId, amount, paymentMethod);
        
        if (result.success) {
            showNotification(result.message, 'success');
            
            // Close modal
            const modal = document.getElementById('repaymentModal');
            if (modal) modal.style.display = 'none';
            
            // Show additional info
            if (result.penalties > 0) {
                showNotification(`Penalties applied: ${formatCurrency(result.penalties)}`, 'info');
            }
            
            if (result.isFullyRepaid) {
                showNotification('🎉 Loan fully repaid! Your rating will improve.', 'success');
            } else if (result.remaining > 0) {
                showNotification(`Remaining amount: ${formatCurrency(result.remaining)}`, 'info');
            }
            
            // Update UI
            this.updateBorrowingUI();
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle view loan
    handleViewLoan: function(loanId) {
        const loan = this.getLoanById(loanId);
        if (loan) {
            this.showLoanDetails(loan);
        }
    },
    
    // Handle select lender
    handleSelectLender: function(lenderId) {
        const lender = this.availableLenders.find(l => l.id === lenderId);
        if (!lender) return;
        
        // Update request loan form
        const lenderInput = document.getElementById('selectedLender');
        const lenderDisplay = document.getElementById('selectedLenderDisplay');
        
        if (lenderInput) lenderInput.value = lenderId;
        if (lenderDisplay) {
            lenderDisplay.textContent = lender.name;
            lenderDisplay.style.display = 'inline';
        }
        
        showNotification(`Selected lender: ${lender.name}`, 'success');
    },
    
    // Handle filter loans
    handleFilterLoans: function() {
        const filters = {
            groupId: document.getElementById('filterLoanGroup')?.value,
            category: document.getElementById('filterLoanCategory')?.value,
            minAmount: document.getElementById('filterLoanMinAmount')?.value,
            maxAmount: document.getElementById('filterLoanMaxAmount')?.value
        };
        
        const loans = this.getActiveLoans(filters);
        this.renderFilteredLoans(loans);
    },
    
    // Handle filter history
    handleFilterHistory: function() {
        const filters = {
            status: document.getElementById('filterHistoryStatus')?.value,
            category: document.getElementById('filterHistoryCategory')?.value,
            minAmount: document.getElementById('filterHistoryMinAmount')?.value,
            maxAmount: document.getElementById('filterHistoryMaxAmount')?.value
        };
        
        const history = this.getLoanHistory(filters);
        this.renderFilteredHistory(history);
    },
    
    // Handle search lenders
    handleSearchLenders: function(searchTerm) {
        const filteredLenders = this.availableLenders.filter(lender => 
            lender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lender.subscription?.tier?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.renderFilteredLenders(filteredLenders);
    },
    
    // Show loan details
    showLoanDetails: function(loan) {
        const modal = document.getElementById('loanDetailsModal');
        if (!modal) return;
        
        const summary = this.getLoanSummary(loan.id);
        const schedule = this.calculateRepaymentSchedule(loan.id);
        
        // Populate modal
        const content = `
            <div class="loan-details-modal">
                <h3>Loan Details</h3>
                
                <div class="loan-summary">
                    <div class="summary-header">
                        <div class="summary-category">${this.getCategoryIcon(loan.category)} ${loan.category}</div>
                        <div class="summary-amount">${formatCurrency(loan.amount)}</div>
                    </div>
                    
                    <div class="summary-details">
                        <div class="detail-row">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value status-${loan.status}">${this.getStatusText(loan.status)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Lender:</span>
                            <span class="detail-value">${loan.lenderName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Group:</span>
                            <span class="detail-value">${loan.groupName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Purpose:</span>
                            <span class="detail-value">${loan.purpose}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Requested:</span>
                            <span class="detail-value">${new Date(loan.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Due Date:</span>
                            <span class="detail-value ${summary?.isOverdue ? 'text-danger' : ''}">
                                ${new Date(loan.dueDate).toLocaleDateString()}
                                ${summary?.isOverdue ? `(${summary.daysOverdue} days overdue)` : `(${summary?.daysRemaining} days left)`}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="loan-breakdown">
                    <h4>Loan Breakdown</h4>
                    <div class="breakdown-grid">
                        <div class="breakdown-item">
                            <span>Principal:</span>
                            <strong>${formatCurrency(loan.amount)}</strong>
                        </div>
                        <div class="breakdown-item">
                            <span>Interest (10%):</span>
                            <strong>${formatCurrency(loan.interest)}</strong>
                        </div>
                        ${summary?.penalties > 0 ? `
                        <div class="breakdown-item text-danger">
                            <span>Penalties:</span>
                            <strong>${formatCurrency(summary.penalties)}</strong>
                        </div>
                        ` : ''}
                        <div class="breakdown-item total">
                            <span>Total Due:</span>
                            <strong>${formatCurrency(summary?.totalDue || loan.totalAmount)}</strong>
                        </div>
                        <div class="breakdown-item">
                            <span>Amount Repaid:</span>
                            <strong>${formatCurrency(loan.amountRepaid)}</strong>
                        </div>
                        <div class="breakdown-item remaining">
                            <span>Remaining:</span>
                            <strong>${formatCurrency(summary?.amountOutstanding || loan.amountDue - loan.amountRepaid)}</strong>
                        </div>
                    </div>
                </div>
                
                ${schedule && schedule.length > 0 ? `
                <div class="repayment-schedule">
                    <h4>Repayment Schedule</h4>
                    <div class="schedule-table">
                        ${schedule.map(item => `
                            <div class="schedule-row ${item.status}">
                                <div class="schedule-day">Day ${item.day}</div>
                                <div class="schedule-date">${new Date(item.dueDate).toLocaleDateString()}</div>
                                <div class="schedule-amount">${formatCurrency(item.amountDue)}</div>
                                <div class="schedule-status">${item.isPenalty ? 'Penalty' : item.status}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${loan.repaymentHistory && loan.repaymentHistory.length > 0 ? `
                <div class="repayment-history">
                    <h4>Repayment History</h4>
                    <div class="history-table">
                        ${loan.repaymentHistory.map(payment => `
                            <div class="history-row">
                                <div class="history-date">${new Date(payment.date).toLocaleDateString()}</div>
                                <div class="history-amount">${formatCurrency(payment.amount)}</div>
                                <div class="history-method">${payment.method}</div>
                                ${payment.penalties > 0 ? `
                                <div class="history-penalties text-danger">+${formatCurrency(payment.penalties)}</div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="modal-actions">
                    ${loan.status === 'active' || loan.status === 'active_partial' || loan.status === 'overdue' ? `
                    <button class="btn btn-primary" onclick="BorrowingModule.handleMakeRepayment('${loan.id}')">Make Repayment</button>
                    ` : ''}
                    <button class="btn btn-outline" onclick="BorrowingModule.closeLoanModal()">Close</button>
                </div>
            </div>
        `;
        
        modal.innerHTML = content;
        modal.style.display = 'block';
    },
    
    // Close loan modal
    closeLoanModal: function() {
        const modal = document.getElementById('loanDetailsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    // Render filtered loans
    renderFilteredLoans: function(loans) {
        const loansContainer = document.getElementById('activeLoans');
        if (!loansContainer) return;
        
        if (loans.length === 0) {
            loansContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No Matching Loans</h3>
                    <p>Try adjusting your filters.</p>
                </div>
            `;
        } else {
            // Similar to renderActiveLoans but with filtered loans
            loansContainer.innerHTML = loans.map(loan => {
                const summary = this.getLoanSummary(loan.id);
                
                return `
                    <div class="loan-card ${loan.status}" data-loan-id="${loan.id}">
                        <div class="loan-header">
                            <div class="loan-category">${this.getCategoryIcon(loan.category)} ${loan.category}</div>
                            <div class="loan-amount">${formatCurrency(loan.amount)}</div>
                        </div>
                        
                        <div class="loan-details">
                            <div class="detail-row">
                                <span class="detail-label">Due Date:</span>
                                <span class="detail-value ${summary?.isOverdue ? 'text-danger' : ''}">
                                    ${new Date(loan.dueDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Amount Due:</span>
                                <span class="detail-value">${formatCurrency(summary?.totalDue || loan.totalAmount)}</span>
                            </div>
                        </div>
                        
                        <div class="loan-actions">
                            <button class="btn btn-primary btn-small make-repayment" data-loan-id="${loan.id}">Make Repayment</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Reattach event listeners
            document.querySelectorAll('.make-repayment').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const loanId = e.target.dataset.loanId;
                    this.handleMakeRepayment(loanId);
                });
            });
        }
    },
    
    // Render filtered history
    renderFilteredHistory: function(history) {
        const historyContainer = document.getElementById('loanHistory');
        if (!historyContainer) return;
        
        if (history.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No Matching History</h3>
                    <p>Try adjusting your filters.</p>
                </div>
            `;
        } else {
            // Similar to renderLoanHistory but with filtered history
            historyContainer.innerHTML = history.map(loan => `
                <div class="history-card ${loan.status}" data-loan-id="${loan.id}">
                    <div class="history-header">
                        <div class="history-category">${this.getCategoryIcon(loan.category)}</div>
                        <div class="history-info">
                            <h4 class="history-title">${loan.category} Loan</h4>
                            <div class="history-meta">
                                <span class="meta-item">${formatCurrency(loan.amount)}</span>
                                <span class="meta-item">${new Date(loan.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="history-actions">
                        <button class="btn btn-text btn-small view-history" data-loan-id="${loan.id}">View Details</button>
                    </div>
                </div>
            `).join('');
            
            // Reattach event listeners
            document.querySelectorAll('.view-history').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const loanId = e.target.dataset.loanId;
                    this.handleViewLoan(loanId);
                });
            });
        }
    },
    
    // Render filtered lenders
    renderFilteredLenders: function(lenders) {
        const lendersContainer = document.getElementById('availableLenders');
        if (!lendersContainer) return;
        
        if (lenders.length === 0) {
            lendersContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No Matching Lenders</h3>
                    <p>Try adjusting your search.</p>
                </div>
            `;
        } else {
            // Similar to renderAvailableLenders but with filtered lenders
            lendersContainer.innerHTML = lenders.map(lender => `
                <div class="lender-card" data-lender-id="${lender.id}">
                    <div class="lender-header">
                        <div class="lender-avatar">${lender.name.charAt(0)}</div>
                        <div class="lender-info">
                            <h4 class="lender-name">${lender.name}</h4>
                            <div class="lender-meta">
                                <span class="meta-item">${lender.subscription?.tier || 'Basic'} Tier</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="lender-actions">
                        <button class="btn btn-outline btn-small select-lender" data-lender-id="${lender.id}">Select</button>
                    </div>
                </div>
            `).join('');
            
            // Reattach event listeners
            document.querySelectorAll('.select-lender').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const lenderId = e.target.dataset.lenderId;
                    this.handleSelectLender(lenderId);
                });
            });
        }
    }
};

// Initialize borrowing module when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BorrowingModule.init());
} else {
    BorrowingModule.init();
}

// Make BorrowingModule available globally
window.BorrowingModule = BorrowingModule;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BorrowingModule;
}