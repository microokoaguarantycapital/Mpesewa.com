// ============================================
// ROLES.JS - Borrower/Lender/Admin role logic
// ============================================

'use strict';

// Role Management Module
const RoleModule = {
    // Available roles
    ROLES: {
        BORROWER: 'borrower',
        LENDER: 'lender',
        ADMIN: 'admin'
    },
    
    // Role permissions
    PERMISSIONS: {
        borrower: [
            'view_own_profile',
            'update_own_profile',
            'request_loans',
            'view_own_loans',
            'view_groups',
            'join_groups',
            'leave_groups',
            'rate_lenders',
            'view_blacklist',
            'view_debt_collectors'
        ],
        lender: [
            'view_own_profile',
            'update_own_profile',
            'view_borrower_profiles',
            'approve_loans',
            'manage_ledgers',
            'update_repayments',
            'rate_borrowers',
            'blacklist_borrowers',
            'view_groups',
            'create_groups',
            'invite_members',
            'view_subscription',
            'renew_subscription',
            'view_lender_stats'
        ],
        admin: [
            'view_all_profiles',
            'edit_all_profiles',
            'view_all_loans',
            'override_ledgers',
            'manage_blacklist',
            'remove_blacklist',
            'adjust_ratings',
            'view_all_groups',
            'suspend_groups',
            'view_all_subscriptions',
            'view_system_stats',
            'manage_debt_collectors',
            'send_notifications',
            'view_audit_logs'
        ]
    },
    
    // Role configurations
    CONFIG: {
        borrower: {
            max_groups: 4,
            requires_subscription: false,
            can_lend: false,
            can_borrow: true,
            default_rating: 5.0,
            dashboard: '/pages/dashboard/borrower-dashboard.html'
        },
        lender: {
            max_groups: null, // unlimited
            requires_subscription: true,
            can_lend: true,
            can_borrow: true,
            default_rating: 5.0,
            dashboard: '/pages/dashboard/lender-dashboard.html',
            subscription_expiry_day: 28,
            tiers: {
                basic: { max_per_week: 1500, requires_crb: false },
                premium: { max_per_week: 5000, requires_crb: false },
                super: { max_per_week: 20000, requires_crb: true },
                lender_of_lenders: { max_per_month: 50000, requires_crb: true }
            }
        },
        admin: {
            max_groups: null, // unlimited
            requires_subscription: false,
            can_lend: false,
            can_borrow: false,
            dashboard: '/pages/dashboard/admin-dashboard.html'
        }
    },
    
    // Current role state
    currentRole: null,
    userData: null,
    
    // Initialize role module
    init: function() {
        this.loadRoleData();
        this.setupEventListeners();
        console.log('Role module initialized');
    },
    
    // Load role data from localStorage
    loadRoleData: function() {
        try {
            const roleData = localStorage.getItem('mpesewa_role_data');
            if (roleData) {
                const data = JSON.parse(roleData);
                this.currentRole = data.currentRole;
                this.userData = data.userData;
                console.log('Role data loaded:', this.currentRole);
            }
        } catch (error) {
            console.error('Error loading role data:', error);
            this.clearRoleData();
        }
    },
    
    // Save role data to localStorage
    saveRoleData: function() {
        const data = {
            currentRole: this.currentRole,
            userData: this.userData,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('mpesewa_role_data', JSON.stringify(data));
    },
    
    // Clear role data
    clearRoleData: function() {
        this.currentRole = null;
        this.userData = null;
        localStorage.removeItem('mpesewa_role_data');
    },
    
    // Set user role
    setRole: function(role, userData) {
        if (!this.ROLES[role.toUpperCase()]) {
            console.error('Invalid role:', role);
            return false;
        }
        
        this.currentRole = role;
        this.userData = userData || this.userData;
        
        // Update permissions based on role
        this.updatePermissions();
        
        // Save to localStorage
        this.saveRoleData();
        
        // Update UI
        this.updateRoleUI();
        
        console.log('Role set to:', role, 'for user:', this.userData?.name);
        return true;
    },
    
    // Get current role
    getCurrentRole: function() {
        return this.currentRole;
    },
    
    // Get role configuration
    getRoleConfig: function(role = null) {
        const targetRole = role || this.currentRole;
        return this.CONFIG[targetRole] || {};
    },
    
    // Check if user has permission
    hasPermission: function(permission) {
        if (!this.currentRole) return false;
        
        const permissions = this.PERMISSIONS[this.currentRole];
        if (!permissions) return false;
        
        return permissions.includes(permission);
    },
    
    // Get all permissions for current role
    getPermissions: function() {
        if (!this.currentRole) return [];
        return this.PERMISSIONS[this.currentRole] || [];
    },
    
    // Update permissions based on user state
    updatePermissions: function() {
        if (!this.currentRole || !this.userData) return;
        
        // Add/remove permissions based on user state
        if (this.currentRole === this.ROLES.LENDER) {
            // Check subscription status
            const subscription = this.userData.subscription;
            if (!subscription || subscription.status !== 'active') {
                // Remove lending permissions if subscription is not active
                this.removeLenderPermissions();
            }
            
            // Check if blacklisted
            if (this.userData.blacklisted) {
                this.addRestrictedPermissions();
            }
        }
        
        if (this.currentRole === this.ROLES.BORROWER) {
            // Check if blacklisted
            if (this.userData.blacklisted) {
                this.addBorrowerRestrictions();
            }
            
            // Check rating for group limits
            if (this.userData.rating < 3.0) {
                this.addLowRatingRestrictions();
            }
        }
    },
    
    // Remove lender permissions (for expired subscription)
    removeLenderPermissions: function() {
        const lendingPermissions = [
            'approve_loans',
            'manage_ledgers',
            'update_repayments',
            'rate_borrowers',
            'blacklist_borrowers'
        ];
        
        this.PERMISSIONS.lender = this.PERMISSIONS.lender.filter(
            perm => !lendingPermissions.includes(perm)
        );
    },
    
    // Add restricted permissions for blacklisted lenders
    addRestrictedPermissions: function() {
        this.PERMISSIONS.lender = this.PERMISSIONS.lender.filter(
            perm => !perm.startsWith('manage_') && !perm.startsWith('approve_')
        );
    },
    
    // Add restrictions for blacklisted borrowers
    addBorrowerRestrictions: function() {
        this.PERMISSIONS.borrower = this.PERMISSIONS.borrower.filter(
            perm => !['request_loans', 'join_groups'].includes(perm)
        );
    },
    
    // Add restrictions for low-rated borrowers
    addLowRatingRestrictions: function() {
        // Limit to 2 groups instead of 4
        this.CONFIG.borrower.max_groups = 2;
    },
    
    // Check if user can perform action
    can: function(action, resource = null) {
        // First check permission
        if (!this.hasPermission(action)) {
            return {
                allowed: false,
                reason: 'Insufficient permissions'
            };
        }
        
        // Role-specific checks
        switch (this.currentRole) {
            case this.ROLES.BORROWER:
                return this.canBorrowerPerform(action, resource);
            case this.ROLES.LENDER:
                return this.canLenderPerform(action, resource);
            case this.ROLES.ADMIN:
                return this.canAdminPerform(action, resource);
            default:
                return {
                    allowed: false,
                    reason: 'Unknown role'
                };
        }
    },
    
    // Borrower-specific checks
    canBorrowerPerform: function(action, resource) {
        const user = this.userData;
        
        switch (action) {
            case 'request_loans':
                // Check if blacklisted
                if (user.blacklisted) {
                    return {
                        allowed: false,
                        reason: 'Account is blacklisted'
                    };
                }
                
                // Check active loans
                const activeLoans = user.activeLoans || [];
                if (activeLoans.length >= 1) { // Max 1 active loan
                    return {
                        allowed: false,
                        reason: 'Maximum active loans reached'
                    };
                }
                
                return { allowed: true };
                
            case 'join_groups':
                // Check if blacklisted
                if (user.blacklisted) {
                    return {
                        allowed: false,
                        reason: 'Account is blacklisted'
                    };
                }
                
                // Check group limit
                const currentGroups = user.groups || [];
                const maxGroups = this.CONFIG.borrower.max_groups;
                if (currentGroups.length >= maxGroups) {
                    return {
                        allowed: false,
                        reason: `Maximum groups reached (${maxGroups})`
                    };
                }
                
                return { allowed: true };
                
            default:
                return { allowed: true };
        }
    },
    
    // Lender-specific checks
    canLenderPerform: function(action, resource) {
        const user = this.userData;
        const subscription = user.subscription;
        
        switch (action) {
            case 'approve_loans':
                // Check subscription
                if (!subscription || subscription.status !== 'active') {
                    return {
                        allowed: false,
                        reason: 'Subscription required'
                    };
                }
                
                // Check tier limits
                if (resource && resource.amount) {
                    const tier = subscription.tier;
                    const tierConfig = this.CONFIG.lender.tiers[tier];
                    if (tierConfig) {
                        const maxAmount = tierConfig.max_per_week || tierConfig.max_per_month;
                        if (resource.amount > maxAmount) {
                            return {
                                allowed: false,
                                reason: `Amount exceeds tier limit (${maxAmount})`
                            };
                        }
                    }
                }
                
                return { allowed: true };
                
            case 'create_groups':
                // Check if blacklisted
                if (user.blacklisted) {
                    return {
                        allowed: false,
                        reason: 'Account is blacklisted'
                    };
                }
                
                return { allowed: true };
                
            default:
                return { allowed: true };
        }
    },
    
    // Admin-specific checks
    canAdminPerform: function(action, resource) {
        // Admins can do everything
        return { allowed: true };
    },
    
    // Switch role (for users with multiple roles)
    switchToRole: function(newRole) {
        if (!this.userData) {
            return {
                success: false,
                message: 'No user data available'
            };
        }
        
        // Check if user has this role
        if (!this.userHasRole(newRole)) {
            return {
                success: false,
                message: `User is not registered as ${newRole}`
            };
        }
        
        // Save current role data
        const oldRole = this.currentRole;
        
        // Set new role
        this.setRole(newRole, this.userData);
        
        console.log(`Switched from ${oldRole} to ${newRole}`);
        
        return {
            success: true,
            message: `Switched to ${newRole} role`,
            oldRole: oldRole,
            newRole: newRole,
            redirect: this.getRoleDashboard(newRole)
        };
    },
    
    // Check if user has a specific role
    userHasRole: function(role) {
        if (!this.userData) return false;
        
        // Check primary role
        if (this.userData.role === role) {
            return true;
        }
        
        // Check secondary roles (if implemented)
        if (this.userData.secondaryRoles && this.userData.secondaryRoles.includes(role)) {
            return true;
        }
        
        return false;
    },
    
    // Get dashboard URL for role
    getRoleDashboard: function(role = null) {
        const targetRole = role || this.currentRole;
        const config = this.CONFIG[targetRole];
        return config?.dashboard || '/index.html';
    },
    
    // Validate user for role
    validateForRole: function(userData, role) {
        const validation = {
            valid: true,
            errors: []
        };
        
        // Common validations
        if (!userData.name || !userData.phone || !userData.country) {
            validation.valid = false;
            validation.errors.push('Missing required user information');
        }
        
        // Role-specific validations
        switch (role) {
            case this.ROLES.BORROWER:
                validation.errors.push(...this.validateBorrower(userData));
                break;
            case this.ROLES.LENDER:
                validation.errors.push(...this.validateLender(userData));
                break;
            case this.ROLES.ADMIN:
                validation.errors.push(...this.validateAdmin(userData));
                break;
        }
        
        if (validation.errors.length > 0) {
            validation.valid = false;
        }
        
        return validation;
    },
    
    // Validate borrower data
    validateBorrower: function(userData) {
        const errors = [];
        
        // Required fields
        const required = ['nationalId', 'occupation', 'nextOfKinPhone'];
        for (const field of required) {
            if (!userData[field]) {
                errors.push(`Missing ${field} for borrower`);
            }
        }
        
        // Guarantors
        if (!userData.guarantor1 || !userData.guarantor1.name || !userData.guarantor1.phone) {
            errors.push('Missing first guarantor information');
        }
        
        if (!userData.guarantor2 || !userData.guarantor2.name || !userData.guarantor2.phone) {
            errors.push('Missing second guarantor information');
        }
        
        return errors;
    },
    
    // Validate lender data
    validateLender: function(userData) {
        const errors = [];
        
        // Subscription
        if (!userData.subscription || !userData.subscription.tier) {
            errors.push('Missing subscription information');
        }
        
        return errors;
    },
    
    // Validate admin data
    validateAdmin: function(userData) {
        const errors = [];
        
        // Admin-specific validations
        if (!userData.adminCode || userData.adminCode !== 'MPESEWA_ADMIN_2024') {
            errors.push('Invalid admin credentials');
        }
        
        return errors;
    },
    
    // Get role badge HTML
    getRoleBadge: function(role = null) {
        const targetRole = role || this.currentRole;
        
        const badges = {
            borrower: {
                text: 'Borrower',
                class: 'badge-borrower',
                icon: '🤲',
                color: '#20BF6F'
            },
            lender: {
                text: 'Lender',
                class: 'badge-lender',
                icon: '💰',
                color: '#0A65FC'
            },
            admin: {
                text: 'Admin',
                class: 'badge-admin',
                icon: '👑',
                color: '#FF9F1C'
            }
        };
        
        const badge = badges[targetRole] || { text: 'Unknown', class: 'badge-unknown', icon: '❓', color: '#6B6B6B' };
        
        return `
            <span class="role-badge ${badge.class}" style="background-color: ${badge.color}20; color: ${badge.color}; border-color: ${badge.color}">
                <span class="badge-icon">${badge.icon}</span>
                <span class="badge-text">${badge.text}</span>
            </span>
        `;
    },
    
    // Get role stats
    getRoleStats: function() {
        if (!this.currentRole || !this.userData) return null;
        
        const stats = {
            borrower: {
                total_borrowed: this.userData.totalBorrowed || 0,
                total_repaid: this.userData.totalRepaid || 0,
                outstanding: (this.userData.totalBorrowed || 0) - (this.userData.totalRepaid || 0),
                active_loans: this.userData.activeLoans?.length || 0,
                groups: this.userData.groups?.length || 0,
                rating: this.userData.rating || 0,
                defaults: this.userData.defaults || 0
            },
            lender: {
                total_lent: this.userData.totalLent || 0,
                total_outstanding: this.userData.totalOutstanding || 0,
                total_interest: this.userData.totalInterestEarned || 0,
                active_ledgers: this.userData.ledgers?.filter(l => l.status === 'active').length || 0,
                total_borrowers: this.userData.borrowers?.length || 0,
                lender_rating: this.userData.lenderRating || 0,
                subscription: this.userData.subscription
            },
            admin: {
                total_users: 0,
                total_groups: 0,
                total_loans: 0,
                total_volume: 0,
                blacklisted_users: 0,
                pending_actions: 0
            }
        };
        
        return stats[this.currentRole];
    },
    
    // Update role UI
    updateRoleUI: function() {
        if (!this.currentRole) return;
        
        // Update role badge in header
        const roleBadgeContainer = document.getElementById('roleBadgeContainer');
        if (roleBadgeContainer) {
            roleBadgeContainer.innerHTML = this.getRoleBadge();
        }
        
        // Update dashboard link
        const dashboardLink = document.getElementById('dashboardLink');
        if (dashboardLink) {
            dashboardLink.href = this.getRoleDashboard();
        }
        
        // Update page title based on role
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            const roleTitles = {
                borrower: 'Borrower Dashboard',
                lender: 'Lender Dashboard',
                admin: 'Admin Dashboard'
            };
            
            if (roleTitles[this.currentRole]) {
                pageTitle.textContent = roleTitles[this.currentRole];
            }
        }
        
        // Show/hide role-specific sections
        this.toggleRoleSections();
    },
    
    // Toggle role-specific UI sections
    toggleRoleSections: function() {
        const sections = {
            borrower: document.querySelectorAll('.borrower-section'),
            lender: document.querySelectorAll('.lender-section'),
            admin: document.querySelectorAll('.admin-section')
        };
        
        // Hide all role sections
        Object.values(sections).forEach(sectionList => {
            sectionList.forEach(section => {
                section.style.display = 'none';
            });
        });
        
        // Show current role sections
        if (this.currentRole && sections[this.currentRole]) {
            sections[this.currentRole].forEach(section => {
                section.style.display = 'block';
            });
        }
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Role switching buttons
        const switchRoleBtns = document.querySelectorAll('.switch-role-btn');
        switchRoleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleRoleSwitch(e));
        });
        
        // Role-specific form submissions
        const roleForms = document.querySelectorAll('.role-form');
        roleForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleRoleForm(e));
        });
    },
    
    // Handle role switch
    handleRoleSwitch: function(e) {
        e.preventDefault();
        
        const newRole = e.target.dataset.role;
        if (!newRole) return;
        
        const result = this.switchToRole(newRole);
        
        if (result.success) {
            showNotification(result.message, 'success');
            
            // Redirect to new dashboard
            setTimeout(() => {
                window.location.href = result.redirect;
            }, 1000);
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle role-specific form submissions
    handleRoleForm: function(e) {
        e.preventDefault();
        
        const form = e.target;
        const role = form.dataset.role;
        
        if (!role) {
            showNotification('Form role not specified', 'error');
            return;
        }
        
        // Validate form data
        const formData = new FormData(form);
        const validation = this.validateFormData(formData, role);
        
        if (!validation.valid) {
            showNotification(validation.errors[0], 'error');
            return;
        }
        
        // Process form based on role
        switch (role) {
            case 'borrower':
                this.processBorrowerForm(formData);
                break;
            case 'lender':
                this.processLenderForm(formData);
                break;
            case 'admin':
                this.processAdminForm(formData);
                break;
        }
    },
    
    // Validate form data for role
    validateFormData: function(formData, role) {
        // Basic validation
        const errors = [];
        
        // Check required fields based on role
        const requiredFields = {
            borrower: ['fullName', 'nationalId', 'phone', 'country'],
            lender: ['fullName', 'phone', 'country', 'subscriptionTier'],
            admin: ['adminCode', 'password']
        };
        
        const fields = requiredFields[role] || [];
        for (const field of fields) {
            if (!formData.get(field)) {
                errors.push(`Please provide ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    // Process borrower form
    processBorrowerForm: function(formData) {
        // Create borrower data object
        const borrowerData = {
            name: formData.get('fullName'),
            nationalId: formData.get('nationalId'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            country: formData.get('country'),
            location: formData.get('location'),
            occupation: formData.get('occupation'),
            nextOfKinPhone: formData.get('nextOfKinPhone'),
            guarantor1: {
                name: formData.get('guarantor1Name'),
                phone: formData.get('guarantor1Phone')
            },
            guarantor2: {
                name: formData.get('guarantor2Name'),
                phone: formData.get('guarantor2Phone')
            }
        };
        
        // Validate borrower
        const validation = this.validateForRole(borrowerData, this.ROLES.BORROWER);
        if (!validation.valid) {
            showNotification(validation.errors[0], 'error');
            return;
        }
        
        // Set role
        this.setRole(this.ROLES.BORROWER, borrowerData);
        
        showNotification('Borrower profile updated successfully', 'success');
    },
    
    // Process lender form
    processLenderForm: function(formData) {
        // Create lender data object
        const lenderData = {
            name: formData.get('fullName'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            country: formData.get('country'),
            location: formData.get('location'),
            subscription: {
                tier: formData.get('subscriptionTier'),
                status: 'pending_payment',
                expiryDate: null
            }
        };
        
        // Validate lender
        const validation = this.validateForRole(lenderData, this.ROLES.LENDER);
        if (!validation.valid) {
            showNotification(validation.errors[0], 'error');
            return;
        }
        
        // Set role
        this.setRole(this.ROLES.LENDER, lenderData);
        
        showNotification('Lender profile updated successfully', 'success');
    },
    
    // Process admin form
    processAdminForm: function(formData) {
        // Create admin data object
        const adminData = {
            name: formData.get('adminName'),
            adminCode: formData.get('adminCode'),
            permissions: ['all']
        };
        
        // Validate admin
        const validation = this.validateForRole(adminData, this.ROLES.ADMIN);
        if (!validation.valid) {
            showNotification(validation.errors[0], 'error');
            return;
        }
        
        // Set role
        this.setRole(this.ROLES.ADMIN, adminData);
        
        showNotification('Admin access granted', 'success');
    }
};

// Initialize role module when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RoleModule.init());
} else {
    RoleModule.init();
}

// Make RoleModule available globally
window.RoleModule = RoleModule;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoleModule;
}