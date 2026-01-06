/**
 * Loan Calculator for M-Pesewa
 * Calculates 10% weekly interest, daily repayment breakdown, and penalties
 */

class LoanCalculator {
    constructor() {
        this.interestRate = 0.10; // 10% weekly
        this.penaltyRate = 0.05; // 5% daily after 7 days
        this.defaultDays = 60; // 2 months default
        this.currentTier = null;
        this.currentCountry = null;
        
        this.tierLimits = {
            basic: 1500,
            premium: 5000,
            super: 20000,
            lenderOfLenders: 50000
        };
        
        this.initialize();
    }
    
    /**
     * Initialize calculator with DOM elements
     */
    initialize() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindElements());
        } else {
            this.bindElements();
        }
    }
    
    /**
     * Bind calculator to DOM elements
     */
    bindElements() {
        // Calculator elements on index.html
        const calcContainer = document.querySelector('.calculator-container');
        if (!calcContainer) return;
        
        this.amountInput = document.getElementById('calcAmount');
        this.amountDisplay = document.getElementById('amountDisplay');
        this.daysInput = document.getElementById('calcDays');
        this.daysDisplay = document.getElementById('daysDisplay');
        this.principalDisplay = document.getElementById('principalAmount');
        this.interestDisplay = document.getElementById('interestAmount');
        this.totalDisplay = document.getElementById('totalRepayment');
        this.dailyDisplay = document.getElementById('dailyRepayment');
        this.tierButtons = document.querySelectorAll('.tier-btn');
        
        // Quick amount buttons
        this.quickAmountButtons = document.querySelectorAll('.btn-amount');
        
        // Quick days buttons
        this.quickDaysButtons = document.querySelectorAll('.btn-days');
        
        // Set current tier from active button
        const activeTierBtn = document.querySelector('.tier-btn.active');
        if (activeTierBtn) {
            this.currentTier = activeTierBtn.dataset.tier;
        }
        
        // Set default country
        this.currentCountry = 'kenya';
        
        // Add event listeners
        this.addEventListeners();
        
        // Perform initial calculation
        this.calculateAndUpdate();
    }
    
    /**
     * Add event listeners to calculator elements
     */
    addEventListeners() {
        if (this.amountInput) {
            this.amountInput.addEventListener('input', () => this.handleAmountChange());
        }
        
        if (this.daysInput) {
            this.daysInput.addEventListener('input', () => this.handleDaysChange());
        }
        
        // Quick amount buttons
        this.quickAmountButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const amount = parseInt(e.target.dataset.amount);
                this.setAmount(amount);
            });
        });
        
        // Quick days buttons
        this.quickDaysButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const days = parseInt(e.target.dataset.days);
                this.setDays(days);
            });
        });
        
        // Tier buttons
        this.tierButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.setTier(e.target.dataset.tier, parseInt(e.target.dataset.max));
            });
        });
    }
    
    /**
     * Handle amount input change
     */
    handleAmountChange() {
        const amount = parseInt(this.amountInput.value);
        this.updateAmountDisplay(amount);
        this.calculateAndUpdate();
    }
    
    /**
     * Handle days input change
     */
    handleDaysChange() {
        const days = parseInt(this.daysInput.value);
        this.updateDaysDisplay(days);
        this.calculateAndUpdate();
    }
    
    /**
     * Set loan amount
     * @param {number} amount - Loan amount
     */
    setAmount(amount) {
        if (this.currentTier && amount > this.tierLimits[this.currentTier]) {
            amount = this.tierLimits[this.currentTier];
        }
        
        this.amountInput.value = amount;
        this.updateAmountDisplay(amount);
        this.calculateAndUpdate();
    }
    
    /**
     * Set repayment days
     * @param {number} days - Number of days (1-7)
     */
    setDays(days) {
        days = Math.min(7, Math.max(1, days));
        this.daysInput.value = days;
        this.updateDaysDisplay(days);
        this.calculateAndUpdate();
    }
    
    /**
     * Set subscription tier
     * @param {string} tier - Tier name
     * @param {number} maxAmount - Maximum amount for tier
     */
    setTier(tier, maxAmount) {
        // Update active button
        this.tierButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tier === tier) {
                btn.classList.add('active');
            }
        });
        
        this.currentTier = tier;
        this.amountInput.max = maxAmount;
        
        // Adjust current amount if exceeds new limit
        const currentAmount = parseInt(this.amountInput.value);
        if (currentAmount > maxAmount) {
            this.setAmount(maxAmount);
        }
        
        this.calculateAndUpdate();
    }
    
    /**
     * Update amount display
     * @param {number} amount - Loan amount
     */
    updateAmountDisplay(amount) {
        if (this.amountDisplay) {
            this.amountDisplay.textContent = this.formatCurrency(amount);
        }
    }
    
    /**
     * Update days display
     * @param {number} days - Number of days
     */
    updateDaysDisplay(days) {
        if (this.daysDisplay) {
            this.daysDisplay.textContent = `${days} day${days !== 1 ? 's' : ''}`;
        }
    }
    
    /**
     * Calculate loan details
     * @param {number} amount - Loan amount
     * @param {number} days - Repayment days (1-7)
     * @returns {Object} Calculation results
     */
    calculate(amount, days) {
        // Ensure days is between 1 and 7
        days = Math.min(7, Math.max(1, days));
        
        // Calculate weekly interest (10%)
        const weeklyInterest = amount * this.interestRate;
        
        // Calculate pro-rated interest for partial weeks
        const interest = weeklyInterest * (days / 7);
        
        // Calculate totals
        const total = amount + interest;
        const dailyRepayment = total / days;
        
        // Calculate penalty if applicable (for display only)
        let penalty = 0;
        if (days < 7) {
            // Calculate what the penalty would be if loan goes over 7 days
            const remainingDays = 7 - days;
            penalty = amount * this.penaltyRate * remainingDays;
        }
        
        return {
            principal: amount,
            interest: interest,
            total: total,
            daily: dailyRepayment,
            penalty: penalty,
            interestRate: this.interestRate * 100, // Percentage
            penaltyRate: this.penaltyRate * 100 // Percentage
        };
    }
    
    /**
     * Calculate and update all displays
     */
    calculateAndUpdate() {
        const amount = parseInt(this.amountInput.value);
        const days = parseInt(this.daysInput.value);
        
        const results = this.calculate(amount, days);
        
        // Update displays
        if (this.principalDisplay) {
            this.principalDisplay.textContent = this.formatCurrency(results.principal);
        }
        
        if (this.interestDisplay) {
            this.interestDisplay.textContent = this.formatCurrency(results.interest);
        }
        
        if (this.totalDisplay) {
            this.totalDisplay.textContent = this.formatCurrency(results.total);
        }
        
        if (this.dailyDisplay) {
            this.dailyDisplay.textContent = this.formatCurrency(results.daily);
        }
    }
    
    /**
     * Calculate penalty for overdue loans
     * @param {number} amount - Outstanding amount
     * @param {number} overdueDays - Days overdue (beyond 7 days)
     * @returns {Object} Penalty details
     */
    calculatePenalty(amount, overdueDays) {
        if (overdueDays <= 0) return { penalty: 0, total: amount };
        
        const penalty = amount * this.penaltyRate * overdueDays;
        const total = amount + penalty;
        
        return {
            penalty: penalty,
            total: total,
            dailyPenalty: amount * this.penaltyRate,
            isDefault: overdueDays >= this.defaultDays
        };
    }
    
    /**
     * Generate repayment schedule
     * @param {number} amount - Loan amount
     * @param {number} days - Repayment days
     * @param {Date} startDate - Loan start date
     * @returns {Array} Daily repayment schedule
     */
    generateRepaymentSchedule(amount, days, startDate = new Date()) {
        const results = this.calculate(amount, days);
        const schedule = [];
        
        for (let i = 1; i <= days; i++) {
            const dueDate = new Date(startDate);
            dueDate.setDate(dueDate.getDate() + i);
            
            schedule.push({
                day: i,
                date: dueDate,
                amountDue: results.daily,
                cumulative: results.daily * i,
                remaining: results.total - (results.daily * i),
                isPenaltyDay: i > 7
            });
        }
        
        return schedule;
    }
    
    /**
     * Check if amount exceeds tier limit
     * @param {string} tier - Tier name
     * @param {number} amount - Loan amount
     * @returns {boolean} True if amount exceeds limit
     */
    exceedsTierLimit(tier, amount) {
        return amount > this.tierLimits[tier];
    }
    
    /**
     * Get tier limits
     * @param {string} tier - Tier name
     * @returns {number} Maximum amount for tier
     */
    getTierLimit(tier) {
        return this.tierLimits[tier] || 0;
    }
    
    /**
     * Format currency based on country
     * @param {number} amount - Amount to format
     * @param {string} country - Country code
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount, country = this.currentCountry) {
        const currencies = {
            kenya: 'KSh',
            uganda: 'UGX',
            tanzania: 'TZS',
            rwanda: 'RWF',
            burundi: 'BIF',
            somalia: 'SOS',
            'south-sudan': 'SSP',
            ethiopia: 'ETB',
            drc: 'CDF',
            nigeria: 'NGN',
            'south-africa': 'ZAR',
            ghana: 'GHS'
        };
        
        const symbol = currencies[country] || '₵';
        
        // Format with commas for thousands
        return `${symbol}${amount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })}`;
    }
    
    /**
     * Get calculator for specific country page
     * @param {string} countryCode - Country code
     */
    initializeCountryCalculator(countryCode) {
        this.currentCountry = countryCode;
        
        // Update currency displays if on country page
        const currencyElements = document.querySelectorAll('.currency-display');
        currencyElements.forEach(el => {
            if (el.dataset.amount) {
                const amount = parseFloat(el.dataset.amount);
                el.textContent = this.formatCurrency(amount, countryCode);
            }
        });
        
        // Recalculate with new currency
        this.calculateAndUpdate();
    }
    
    /**
     * Create calculator UI for dynamic insertion
     * @param {Object} options - Calculator options
     * @returns {HTMLElement} Calculator container
     */
    createCalculatorUI(options = {}) {
        const defaults = {
            amount: 5000,
            days: 7,
            tier: 'premium',
            showTierSelection: true,
            showQuickButtons: true,
            compact: false
        };
        
        const config = { ...defaults, ...options };
        
        // Create calculator container
        const container = document.createElement('div');
        container.className = `calculator-container ${config.compact ? 'compact' : ''}`;
        
        // Build calculator HTML
        container.innerHTML = `
            <div class="calculator-inputs">
                <div class="form-group">
                    <label for="dynamic-calcAmount">Loan Amount</label>
                    <input type="range" id="dynamic-calcAmount" 
                           min="100" max="${this.tierLimits[config.tier]}" 
                           value="${config.amount}" step="100">
                    <div class="input-display">
                        <span id="dynamic-amountDisplay">${this.formatCurrency(config.amount)}</span>
                        ${config.showQuickButtons ? `
                            <div class="input-actions">
                                <button class="btn-amount" data-amount="1000">${this.formatCurrency(1000)}</button>
                                <button class="btn-amount" data-amount="5000">${this.formatCurrency(5000)}</button>
                                <button class="btn-amount" data-amount="10000">${this.formatCurrency(10000)}</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="dynamic-calcDays">Repayment Days (Max 7)</label>
                    <input type="range" id="dynamic-calcDays" min="1" max="7" value="${config.days}">
                    <div class="input-display">
                        <span id="dynamic-daysDisplay">${config.days} days</span>
                        ${config.showQuickButtons ? `
                            <div class="input-actions">
                                <button class="btn-days" data-days="1">1 day</button>
                                <button class="btn-days" data-days="3">3 days</button>
                                <button class="btn-days" data-days="7">7 days</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${config.showTierSelection ? `
                    <div class="tier-selection">
                        <label>Select Tier:</label>
                        <div class="tier-buttons">
                            <button class="tier-btn ${config.tier === 'basic' ? 'active' : ''}" 
                                    data-tier="basic" data-max="${this.tierLimits.basic}">
                                Basic (${this.formatCurrency(this.tierLimits.basic)})
                            </button>
                            <button class="tier-btn ${config.tier === 'premium' ? 'active' : ''}" 
                                    data-tier="premium" data-max="${this.tierLimits.premium}">
                                Premium (${this.formatCurrency(this.tierLimits.premium)})
                            </button>
                            <button class="tier-btn ${config.tier === 'super' ? 'active' : ''}" 
                                    data-tier="super" data-max="${this.tierLimits.super}">
                                Super (${this.formatCurrency(this.tierLimits.super)})
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="calculator-results">
                <div class="result-card">
                    <div class="result-label">Principal Amount</div>
                    <div class="result-value" id="dynamic-principalAmount">${this.formatCurrency(config.amount)}</div>
                </div>
                
                <div class="result-card">
                    <div class="result-label">Weekly Interest (${this.interestRate * 100}%)</div>
                    <div class="result-value" id="dynamic-interestAmount">${this.formatCurrency(config.amount * this.interestRate)}</div>
                </div>
                
                <div class="result-card highlight">
                    <div class="result-label">Total Repayment</div>
                    <div class="result-value" id="dynamic-totalRepayment">${this.formatCurrency(config.amount + (config.amount * this.interestRate))}</div>
                </div>
                
                <div class="result-card">
                    <div class="result-label">Daily Repayment</div>
                    <div class="result-value" id="dynamic-dailyRepayment">${this.formatCurrency((config.amount + (config.amount * this.interestRate)) / config.days)}</div>
                </div>
            </div>
        `;
        
        // Bind events to dynamic calculator
        setTimeout(() => {
            this.bindDynamicCalculator(container);
        }, 0);
        
        return container;
    }
    
    /**
     * Bind events to dynamically created calculator
     * @param {HTMLElement} container - Calculator container
     */
    bindDynamicCalculator(container) {
        const amountInput = container.querySelector('#dynamic-calcAmount');
        const amountDisplay = container.querySelector('#dynamic-amountDisplay');
        const daysInput = container.querySelector('#dynamic-calcDays');
        const daysDisplay = container.querySelector('#dynamic-daysDisplay');
        const principalDisplay = container.querySelector('#dynamic-principalAmount');
        const interestDisplay = container.querySelector('#dynamic-interestAmount');
        const totalDisplay = container.querySelector('#dynamic-totalRepayment');
        const dailyDisplay = container.querySelector('#dynamic-dailyRepayment');
        
        const updateCalculator = () => {
            const amount = parseInt(amountInput.value);
            const days = parseInt(daysInput.value);
            const results = this.calculate(amount, days);
            
            amountDisplay.textContent = this.formatCurrency(amount);
            daysDisplay.textContent = `${days} day${days !== 1 ? 's' : ''}`;
            principalDisplay.textContent = this.formatCurrency(results.principal);
            interestDisplay.textContent = this.formatCurrency(results.interest);
            totalDisplay.textContent = this.formatCurrency(results.total);
            dailyDisplay.textContent = this.formatCurrency(results.daily);
        };
        
        amountInput.addEventListener('input', updateCalculator);
        daysInput.addEventListener('input', updateCalculator);
        
        // Quick amount buttons
        container.querySelectorAll('.btn-amount').forEach(button => {
            button.addEventListener('click', (e) => {
                const amount = parseInt(e.target.dataset.amount);
                amountInput.value = amount;
                updateCalculator();
            });
        });
        
        // Quick days buttons
        container.querySelectorAll('.btn-days').forEach(button => {
            button.addEventListener('click', (e) => {
                const days = parseInt(e.target.dataset.days);
                daysInput.value = days;
                updateCalculator();
            });
        });
        
        // Tier buttons
        container.querySelectorAll('.tier-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const tier = e.target.dataset.tier;
                const maxAmount = parseInt(e.target.dataset.max);
                
                // Update active button
                container.querySelectorAll('.tier-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Update amount input max
                amountInput.max = maxAmount;
                
                // Adjust current amount if exceeds new limit
                if (parseInt(amountInput.value) > maxAmount) {
                    amountInput.value = maxAmount;
                }
                
                updateCalculator();
            });
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoanCalculator;
} else {
    // Initialize calculator when script loads
    const calculator = new LoanCalculator();
    
    // Make calculator available globally
    window.MPesewaCalculator = calculator;
}