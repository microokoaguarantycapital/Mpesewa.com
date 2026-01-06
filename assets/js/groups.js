// ============================================
// GROUPS.JS - Group creation, invites, membership
// ============================================

'use strict';

// Groups Management Module
const GroupsModule = {
    // Current user's groups
    userGroups: [],
    
    // Available groups in current country
    availableGroups: [],
    
    // Group invitations
    invitations: [],
    
    // Initialize groups module
    init: function() {
        this.loadUserGroups();
        this.loadAvailableGroups();
        this.loadInvitations();
        this.setupEventListeners();
        this.updateGroupsUI();
        console.log('Groups module initialized');
    },
    
    // Load user's groups from localStorage
    loadUserGroups: function() {
        try {
            const groups = localStorage.getItem('mpesewa_user_groups');
            if (groups) {
                this.userGroups = JSON.parse(groups);
                console.log('Loaded user groups:', this.userGroups.length);
            }
        } catch (error) {
            console.error('Error loading user groups:', error);
            this.userGroups = [];
        }
    },
    
    // Load available groups for current country
    loadAvailableGroups: function() {
        try {
            // Get current user country from auth
            const userCountry = AuthModule?.getUserCountry() || 'kenya';
            
            // Load groups from demo data
            const allGroups = this.getDemoGroups();
            this.availableGroups = allGroups.filter(group => 
                group.country === userCountry && 
                group.members.length < group.maxMembers
            );
            
            console.log('Loaded available groups:', this.availableGroups.length, 'in', userCountry);
        } catch (error) {
            console.error('Error loading available groups:', error);
            this.availableGroups = [];
        }
    },
    
    // Load invitations for current user
    loadInvitations: function() {
        try {
            const invitations = localStorage.getItem('mpesewa_invitations');
            if (invitations) {
                this.invitations = JSON.parse(invitations);
                console.log('Loaded invitations:', this.invitations.length);
            }
        } catch (error) {
            console.error('Error loading invitations:', error);
            this.invitations = [];
        }
    },
    
    // Save user groups to localStorage
    saveUserGroups: function() {
        localStorage.setItem('mpesewa_user_groups', JSON.stringify(this.userGroups));
    },
    
    // Save invitations to localStorage
    saveInvitations: function() {
        localStorage.setItem('mpesewa_invitations', JSON.stringify(this.invitations));
    },
    
    // Create a new group
    createGroup: function(groupData) {
        // Validate group data
        const validation = this.validateGroupData(groupData);
        if (!validation.valid) {
            return {
                success: false,
                message: validation.errors[0]
            };
        }
        
        // Check if user can create group
        const canCreate = this.canCreateGroup();
        if (!canCreate.allowed) {
            return {
                success: false,
                message: canCreate.reason
            };
        }
        
        // Create group object
        const group = this.createGroupObject(groupData);
        
        // Add user as founder/admin
        this.addUserAsFounder(group);
        
        // Save group
        this.saveGroup(group);
        
        // Add to user's groups
        this.userGroups.push({
            groupId: group.id,
            role: 'founder',
            joinedAt: new Date().toISOString()
        });
        this.saveUserGroups();
        
        console.log('Group created:', group.name, 'by', group.founder.name);
        
        return {
            success: true,
            message: 'Group created successfully',
            group: group,
            redirect: `/pages/groups.html?groupId=${group.id}`
        };
    },
    
    // Validate group data
    validateGroupData: function(groupData) {
        const errors = [];
        
        // Required fields
        if (!groupData.name || groupData.name.length < 3) {
            errors.push('Group name must be at least 3 characters');
        }
        
        if (!groupData.description || groupData.description.length < 10) {
            errors.push('Please provide a meaningful group description');
        }
        
        if (!groupData.country) {
            errors.push('Please select a country');
        }
        
        if (!groupData.groupType) {
            errors.push('Please select group type');
        }
        
        // Validate max members
        if (groupData.maxMembers) {
            const max = parseInt(groupData.maxMembers);
            if (isNaN(max) || max < 5 || max > 1000) {
                errors.push('Group must have between 5 and 1000 members');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    // Check if user can create group
    canCreateGroup: function() {
        // Get current user
        const user = AuthModule?.currentSession;
        if (!user) {
            return {
                allowed: false,
                reason: 'Please login to create a group'
            };
        }
        
        // Check if user is blacklisted
        if (user.blacklisted) {
            return {
                allowed: false,
                reason: 'Blacklisted users cannot create groups'
            };
        }
        
        // Check if user is a lender (only lenders can create groups)
        if (user.role !== 'lender') {
            return {
                allowed: false,
                reason: 'Only lenders can create groups'
            };
        }
        
        // Check subscription for lenders
        if (user.role === 'lender') {
            const subscription = AuthModule?.checkSubscriptionStatus();
            if (!subscription.active) {
                return {
                    allowed: false,
                    reason: 'Active subscription required to create groups'
                };
            }
        }
        
        // Check existing groups count (optional limit)
        const userGroupCount = this.userGroups.length;
        if (userGroupCount >= 10) { // Example limit
            return {
                allowed: false,
                reason: 'Maximum groups limit reached (10)'
            };
        }
        
        return {
            allowed: true
        };
    },
    
    // Create group object
    createGroupObject: function(groupData) {
        const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            id: groupId,
            name: groupData.name,
            description: groupData.description,
            country: groupData.country,
            groupType: groupData.groupType,
            maxMembers: parseInt(groupData.maxMembers) || 1000,
            visibility: groupData.visibility || 'private',
            joinMethod: groupData.joinMethod || 'invitation',
            rules: groupData.rules || [],
            categories: groupData.categories || [],
            
            // Statistics
            totalLent: 0,
            totalRepaid: 0,
            defaultRate: 0,
            avgRating: 5.0,
            
            // Members
            members: [],
            lenders: [],
            borrowers: [],
            
            // Founder/Admin
            founder: null,
            admins: [],
            
            // Timestamps
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
        };
    },
    
    // Add current user as founder
    addUserAsFounder: function(group) {
        const user = AuthModule?.currentSession;
        if (!user) return;
        
        const member = {
            userId: user.id,
            name: user.name,
            phone: user.phone,
            role: 'founder',
            userRole: user.role,
            joinedAt: new Date().toISOString(),
            rating: 5.0,
            totalLent: 0,
            totalBorrowed: 0,
            isActive: true
        };
        
        group.founder = member;
        group.members.push(member);
        
        // Add to appropriate role list
        if (user.role === 'lender') {
            group.lenders.push(member);
        } else if (user.role === 'borrower') {
            group.borrowers.push(member);
        }
    },
    
    // Save group to localStorage
    saveGroup: function(group) {
        try {
            // Load existing groups
            const groups = this.getAllGroups();
            
            // Add new group
            groups.push(group);
            
            // Save back to localStorage
            localStorage.setItem('mpesewa_groups', JSON.stringify(groups));
            
            // Update available groups
            this.loadAvailableGroups();
        } catch (error) {
            console.error('Error saving group:', error);
        }
    },
    
    // Get all groups from localStorage
    getAllGroups: function() {
        try {
            const groups = localStorage.getItem('mpesewa_groups');
            return groups ? JSON.parse(groups) : [];
        } catch (error) {
            console.error('Error loading groups:', error);
            return [];
        }
    },
    
    // Get group by ID
    getGroupById: function(groupId) {
        const groups = this.getAllGroups();
        return groups.find(group => group.id === groupId);
    },
    
    // Join a group
    joinGroup: function(groupId, joinMethod = 'invitation', invitationCode = null) {
        // Check if user can join group
        const canJoin = this.canJoinGroup(groupId, joinMethod, invitationCode);
        if (!canJoin.allowed) {
            return {
                success: false,
                message: canJoin.reason
            };
        }
        
        // Get group
        const group = this.getGroupById(groupId);
        if (!group) {
            return {
                success: false,
                message: 'Group not found'
            };
        }
        
        // Check if group is full
        if (group.members.length >= group.maxMembers) {
            return {
                success: false,
                message: 'Group is full'
            };
        }
        
        // Get current user
        const user = AuthModule?.currentSession;
        if (!user) {
            return {
                success: false,
                message: 'Please login to join group'
            };
        }
        
        // Check if already a member
        const isMember = group.members.some(member => member.userId === user.id);
        if (isMember) {
            return {
                success: false,
                message: 'Already a member of this group'
            };
        }
        
        // Create member object
        const member = {
            userId: user.id,
            name: user.name,
            phone: user.phone,
            role: 'member',
            userRole: user.role,
            joinedAt: new Date().toISOString(),
            rating: user.rating || 5.0,
            totalLent: 0,
            totalBorrowed: 0,
            isActive: true
        };
        
        // Add to group
        group.members.push(member);
        
        // Add to appropriate role list
        if (user.role === 'lender') {
            group.lenders.push(member);
        } else if (user.role === 'borrower') {
            group.borrowers.push(member);
        }
        
        // Update group
        this.updateGroup(group);
        
        // Add to user's groups
        this.userGroups.push({
            groupId: groupId,
            role: 'member',
            joinedAt: new Date().toISOString()
        });
        this.saveUserGroups();
        
        // Remove invitation if exists
        if (invitationCode) {
            this.removeInvitation(invitationCode);
        }
        
        console.log('User joined group:', user.name, 'joined', group.name);
        
        return {
            success: true,
            message: 'Successfully joined group',
            group: group
        };
    },
    
    // Check if user can join group
    canJoinGroup: function(groupId, joinMethod, invitationCode) {
        // Get current user
        const user = AuthModule?.currentSession;
        if (!user) {
            return {
                allowed: false,
                reason: 'Please login to join group'
            };
        }
        
        // Check if user is blacklisted
        if (user.blacklisted) {
            return {
                allowed: false,
                reason: 'Blacklisted users cannot join groups'
            };
        }
        
        // Get group
        const group = this.getGroupById(groupId);
        if (!group) {
            return {
                allowed: false,
                reason: 'Group not found'
            };
        }
        
        // Check group join method
        if (group.joinMethod === 'invitation' && joinMethod !== 'invitation') {
            return {
                allowed: false,
                reason: 'This group is invitation only'
            };
        }
        
        // Check invitation if required
        if (joinMethod === 'invitation') {
            const invitation = this.getInvitation(invitationCode);
            if (!invitation) {
                return {
                    allowed: false,
                    reason: 'Invalid or expired invitation'
                };
            }
            
            if (invitation.groupId !== groupId) {
                return {
                    allowed: false,
                    reason: 'Invitation is for a different group'
                };
            }
            
            if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
                return {
                    allowed: false,
                    reason: 'Invitation has expired'
                };
            }
        }
        
        // Check user role compatibility
        if (group.groupType === 'lenders_only' && user.role !== 'lender') {
            return {
                allowed: false,
                reason: 'This group is for lenders only'
            };
        }
        
        // Check user country
        if (user.country !== group.country) {
            return {
                allowed: false,
                reason: 'Group is restricted to ' + group.country + ' residents only'
            };
        }
        
        // Check borrower group limits
        if (user.role === 'borrower') {
            const userGroupCount = this.userGroups.length;
            const maxGroups = RoleModule?.CONFIG?.borrower?.max_groups || 4;
            
            if (userGroupCount >= maxGroups) {
                return {
                    allowed: false,
                    reason: `Borrowers can only join ${maxGroups} groups maximum`
                };
            }
            
            // Check rating for additional groups
            if (userGroupCount >= 2 && (!user.rating || user.rating < 3.0)) {
                return {
                    allowed: false,
                    reason: 'Minimum 3.0 rating required to join more than 2 groups'
                };
            }
        }
        
        return {
            allowed: true
        };
    },
    
    // Leave a group
    leaveGroup: function(groupId) {
        // Get group
        const group = this.getGroupById(groupId);
        if (!group) {
            return {
                success: false,
                message: 'Group not found'
            };
        }
        
        // Get current user
        const user = AuthModule?.currentSession;
        if (!user) {
            return {
                success: false,
                message: 'Please login'
            };
        }
        
        // Check if user is founder
        if (group.founder?.userId === user.id) {
            return {
                success: false,
                message: 'Founder cannot leave group. Transfer ownership first or delete group.'
            };
        }
        
        // Check if user has active loans in group
        const hasActiveLoans = this.hasActiveLoansInGroup(groupId, user.id);
        if (hasActiveLoans) {
            return {
                success: false,
                message: 'Cannot leave group with active loans'
            };
        }
        
        // Remove user from group
        group.members = group.members.filter(member => member.userId !== user.id);
        group.lenders = group.lenders.filter(lender => lender.userId !== user.id);
        group.borrowers = group.borrowers.filter(borrower => borrower.userId !== user.id);
        
        // Remove from admins if present
        group.admins = group.admins.filter(admin => admin.userId !== user.id);
        
        // Update group
        this.updateGroup(group);
        
        // Remove from user's groups
        this.userGroups = this.userGroups.filter(ug => ug.groupId !== groupId);
        this.saveUserGroups();
        
        console.log('User left group:', user.name, 'left', group.name);
        
        return {
            success: true,
            message: 'Successfully left group'
        };
    },
    
    // Check if user has active loans in group
    hasActiveLoansInGroup: function(groupId, userId) {
        // This would check if user has active loans in the group
        // For now, return false (mock)
        return false;
    },
    
    // Update group
    updateGroup: function(group) {
        try {
            const groups = this.getAllGroups();
            const index = groups.findIndex(g => g.id === group.id);
            
            if (index !== -1) {
                group.updatedAt = new Date().toISOString();
                groups[index] = group;
                localStorage.setItem('mpesewa_groups', JSON.stringify(groups));
                
                // Update available groups
                this.loadAvailableGroups();
            }
        } catch (error) {
            console.error('Error updating group:', error);
        }
    },
    
    // Invite user to group
    inviteToGroup: function(groupId, inviteePhone, inviteeName = '') {
        // Check if user can invite
        const canInvite = this.canInviteToGroup(groupId);
        if (!canInvite.allowed) {
            return {
                success: false,
                message: canInvite.reason
            };
        }
        
        // Get group
        const group = this.getGroupById(groupId);
        if (!group) {
            return {
                success: false,
                message: 'Group not found'
            };
        }
        
        // Check if group is full
        if (group.members.length >= group.maxMembers) {
            return {
                success: false,
                message: 'Group is full'
            };
        }
        
        // Check if user is already a member
        const isMember = group.members.some(member => member.phone === inviteePhone);
        if (isMember) {
            return {
                success: false,
                message: 'User is already a group member'
            };
        }
        
        // Create invitation
        const invitation = {
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            groupId: groupId,
            groupName: group.name,
            inviterId: AuthModule?.currentSession?.id,
            inviterName: AuthModule?.currentSession?.name,
            inviteePhone: inviteePhone,
            inviteeName: inviteeName,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            code: Math.random().toString(36).substr(2, 9).toUpperCase()
        };
        
        // Save invitation
        this.invitations.push(invitation);
        this.saveInvitations();
        
        console.log('Invitation created:', invitation);
        
        // In a real app, send SMS or notification
        // For now, just return the invitation code
        
        return {
            success: true,
            message: 'Invitation sent successfully',
            invitation: invitation,
            invitationCode: invitation.code
        };
    },
    
    // Check if user can invite to group
    canInviteToGroup: function(groupId) {
        // Get current user
        const user = AuthModule?.currentSession;
        if (!user) {
            return {
                allowed: false,
                reason: 'Please login to invite members'
            };
        }
        
        // Get group
        const group = this.getGroupById(groupId);
        if (!group) {
            return {
                allowed: false,
                reason: 'Group not found'
            };
        }
        
        // Check if user is member
        const isMember = group.members.some(member => member.userId === user.id);
        if (!isMember) {
            return {
                allowed: false,
                reason: 'Only group members can invite others'
            };
        }
        
        // Check if user has invite permission
        const userRole = group.members.find(member => member.userId === user.id)?.role;
        if (!['founder', 'admin'].includes(userRole)) {
            return {
                allowed: false,
                reason: 'Only founders and admins can invite members'
            };
        }
        
        return {
            allowed: true
        };
    },
    
    // Get invitation by code
    getInvitation: function(invitationCode) {
        return this.invitations.find(inv => 
            inv.code === invitationCode && 
            inv.status === 'pending'
        );
    },
    
    // Remove invitation
    removeInvitation: function(invitationCode) {
        const index = this.invitations.findIndex(inv => inv.code === invitationCode);
        if (index !== -1) {
            this.invitations.splice(index, 1);
            this.saveInvitations();
        }
    },
    
    // Get demo groups (for testing)
    getDemoGroups: function() {
        return [
            {
                id: 'group_kenya_1',
                name: 'Nairobi Business Circle',
                description: 'Professional business owners in Nairobi supporting each other',
                country: 'kenya',
                groupType: 'professional',
                maxMembers: 200,
                members: Array(85).fill().map((_, i) => ({
                    userId: `user_${i}`,
                    name: `Member ${i}`,
                    role: i === 0 ? 'founder' : 'member',
                    userRole: i < 15 ? 'lender' : 'borrower'
                })),
                lenders: Array(15).fill().map((_, i) => ({
                    userId: `lender_${i}`,
                    name: `Lender ${i}`
                })),
                borrowers: Array(70).fill().map((_, i) => ({
                    userId: `borrower_${i}`,
                    name: `Borrower ${i}`
                })),
                totalLent: 1250000,
                totalRepaid: 1200000,
                defaultRate: 0.02,
                avgRating: 4.7,
                founder: {
                    userId: 'user_0',
                    name: 'James Kariuki',
                    role: 'founder'
                }
            },
            {
                id: 'group_ghana_1',
                name: 'Accra Family Support',
                description: 'Family members supporting each other in Accra',
                country: 'ghana',
                groupType: 'family',
                maxMembers: 50,
                members: Array(32).fill().map((_, i) => ({
                    userId: `user_g_${i}`,
                    name: `Member G${i}`,
                    role: i === 0 ? 'founder' : 'member'
                })),
                totalLent: 450000,
                totalRepaid: 420000,
                defaultRate: 0.01,
                avgRating: 4.9
            }
        ];
    },
    
    // Get group statistics
    getGroupStats: function(groupId) {
        const group = this.getGroupById(groupId);
        if (!group) return null;
        
        return {
            totalMembers: group.members.length,
            totalLenders: group.lenders.length,
            totalBorrowers: group.borrowers.length,
            totalLent: group.totalLent || 0,
            totalRepaid: group.totalRepaid || 0,
            defaultRate: group.defaultRate || 0,
            avgRating: group.avgRating || 0,
            availableSlots: group.maxMembers - group.members.length,
            repaymentRate: group.totalLent > 0 ? 
                ((group.totalRepaid / group.totalLent) * 100).toFixed(1) + '%' : 'N/A'
        };
    },
    
    // Search groups
    searchGroups: function(searchTerm, filters = {}) {
        const userCountry = AuthModule?.getUserCountry();
        
        return this.availableGroups.filter(group => {
            // Filter by country
            if (userCountry && group.country !== userCountry) {
                return false;
            }
            
            // Apply search term
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                    group.name.toLowerCase().includes(term) ||
                    group.description.toLowerCase().includes(term) ||
                    group.groupType.toLowerCase().includes(term)
                );
            }
            
            // Apply filters
            if (filters.groupType && group.groupType !== filters.groupType) {
                return false;
            }
            
            if (filters.minMembers) {
                if (group.members.length < filters.minMembers) return false;
            }
            
            if (filters.maxMembers) {
                if (group.members.length > filters.maxMembers) return false;
            }
            
            if (filters.minRating) {
                if ((group.avgRating || 0) < filters.minRating) return false;
            }
            
            if (filters.joinMethod && group.joinMethod !== filters.joinMethod) {
                return false;
            }
            
            return true;
        });
    },
    
    // Update groups UI
    updateGroupsUI: function() {
        // Update groups list if on groups page
        this.renderGroupsList();
        
        // Update user groups if on dashboard
        this.renderUserGroups();
        
        // Update invitations if on invitations page
        this.renderInvitations();
    },
    
    // Render groups list
    renderGroupsList: function() {
        const groupsList = document.getElementById('groupsList');
        const availableGroups = document.getElementById('availableGroups');
        
        if (groupsList) {
            // Render user's groups
            const userGroups = this.userGroups.map(ug => {
                const group = this.getGroupById(ug.groupId);
                return { ...ug, ...group };
            }).filter(g => g);
            
            if (userGroups.length === 0) {
                groupsList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">👥</div>
                        <h3>No Groups Yet</h3>
                        <p>You haven't joined any groups. Join or create a group to start lending or borrowing.</p>
                        <a href="#create-group" class="btn btn-primary">Create Group</a>
                    </div>
                `;
            } else {
                groupsList.innerHTML = userGroups.map(group => `
                    <div class="group-card" data-group-id="${group.id}">
                        <div class="group-header">
                            <div class="group-flag">${this.getCountryFlag(group.country)}</div>
                            <div class="group-info">
                                <h3 class="group-name">${group.name}</h3>
                                <div class="group-meta">
                                    <span class="group-type">${group.groupType}</span>
                                    <span class="group-members">${group.members.length} members</span>
                                </div>
                            </div>
                            <div class="group-actions">
                                <span class="badge ${group.founder?.userId === AuthModule?.currentSession?.id ? 'badge-founder' : 'badge-member'}">
                                    ${group.founder?.userId === AuthModule?.currentSession?.id ? 'Founder' : 'Member'}
                                </span>
                            </div>
                        </div>
                        <div class="group-stats">
                            <div class="stat">
                                <span class="stat-label">Total Lent</span>
                                <span class="stat-value">${formatCurrency(group.totalLent || 0, group.country)}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Repayment</span>
                                <span class="stat-value">${group.totalLent > 0 ? ((group.totalRepaid || 0) / group.totalLent * 100).toFixed(1) + '%' : 'N/A'}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Rating</span>
                                <span class="stat-value">⭐ ${group.avgRating?.toFixed(1) || '5.0'}</span>
                            </div>
                        </div>
                        <div class="group-actions">
                            <a href="/pages/groups.html?groupId=${group.id}" class="btn btn-outline btn-small">View</a>
                            <button class="btn btn-small leave-group-btn" data-group-id="${group.id}">Leave</button>
                        </div>
                    </div>
                `).join('');
                
                // Add leave group event listeners
                document.querySelectorAll('.leave-group-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const groupId = e.target.dataset.groupId;
                        this.handleLeaveGroup(groupId);
                    });
                });
            }
        }
        
        if (availableGroups) {
            // Render available groups
            if (this.availableGroups.length === 0) {
                availableGroups.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>No Groups Available</h3>
                        <p>There are no groups available in your country at the moment.</p>
                        <button class="btn btn-primary" id="createFirstGroup">Create First Group</button>
                    </div>
                `;
                
                document.getElementById('createFirstGroup')?.addEventListener('click', () => {
                    document.getElementById('createGroupModal')?.style.display = 'block';
                });
            } else {
                availableGroups.innerHTML = this.availableGroups.map(group => `
                    <div class="group-card" data-group-id="${group.id}">
                        <div class="group-header">
                            <div class="group-flag">${this.getCountryFlag(group.country)}</div>
                            <div class="group-info">
                                <h3 class="group-name">${group.name}</h3>
                                <div class="group-meta">
                                    <span class="group-type">${group.groupType}</span>
                                    <span class="group-members">${group.members.length}/${group.maxMembers} members</span>
                                </div>
                            </div>
                            <div class="group-rating">
                                ⭐ ${group.avgRating?.toFixed(1) || '5.0'}
                            </div>
                        </div>
                        <p class="group-description">${group.description}</p>
                        <div class="group-stats">
                            <div class="stat">
                                <span class="stat-label">Lenders</span>
                                <span class="stat-value">${group.lenders?.length || 0}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Borrowers</span>
                                <span class="stat-value">${group.borrowers?.length || 0}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Default Rate</span>
                                <span class="stat-value">${(group.defaultRate || 0) * 100}%</span>
                            </div>
                        </div>
                        <div class="group-actions">
                            <button class="btn btn-outline btn-small view-group-btn" data-group-id="${group.id}">View Details</button>
                            <button class="btn btn-primary btn-small join-group-btn" data-group-id="${group.id}">Join Group</button>
                        </div>
                    </div>
                `).join('');
                
                // Add event listeners
                document.querySelectorAll('.view-group-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const groupId = e.target.dataset.groupId;
                        this.handleViewGroup(groupId);
                    });
                });
                
                document.querySelectorAll('.join-group-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const groupId = e.target.dataset.groupId;
                        this.handleJoinGroup(groupId);
                    });
                });
            }
        }
    },
    
    // Render user groups
    renderUserGroups: function() {
        const userGroupsContainer = document.getElementById('userGroups');
        if (!userGroupsContainer) return;
        
        const userGroups = this.userGroups.slice(0, 3); // Show only 3
        
        if (userGroups.length === 0) {
            userGroupsContainer.innerHTML = `
                <div class="empty-state-small">
                    <span class="empty-icon">👥</span>
                    <span>No groups joined</span>
                </div>
            `;
        } else {
            userGroupsContainer.innerHTML = userGroups.map(ug => {
                const group = this.getGroupById(ug.groupId);
                if (!group) return '';
                
                return `
                    <div class="user-group-item">
                        <div class="group-avatar">${group.name.charAt(0)}</div>
                        <div class="group-info">
                            <div class="group-name">${group.name}</div>
                            <div class="group-meta">
                                <span class="group-role">${ug.role}</span>
                                <span class="group-members">${group.members.length} members</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    },
    
    // Render invitations
    renderInvitations: function() {
        const invitationsList = document.getElementById('invitationsList');
        if (!invitationsList) return;
        
        if (this.invitations.length === 0) {
            invitationsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📨</div>
                    <h3>No Invitations</h3>
                    <p>You don't have any pending group invitations.</p>
                </div>
            `;
        } else {
            invitationsList.innerHTML = this.invitations.map(inv => `
                <div class="invitation-card" data-invitation-id="${inv.id}">
                    <div class="invitation-header">
                        <div class="invitation-icon">📨</div>
                        <div class="invitation-info">
                            <h4 class="invitation-group">${inv.groupName}</h4>
                            <p class="invitation-from">Invited by ${inv.inviterName}</p>
                            <p class="invitation-expiry">Expires: ${new Date(inv.expiresAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div class="invitation-actions">
                        <button class="btn btn-outline btn-small decline-invitation" data-invitation-id="${inv.id}">Decline</button>
                        <button class="btn btn-primary btn-small accept-invitation" data-invitation-id="${inv.id}" data-group-id="${inv.groupId}" data-code="${inv.code}">Accept</button>
                    </div>
                </div>
            `).join('');
            
            // Add event listeners
            document.querySelectorAll('.accept-invitation').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const invitationId = e.target.dataset.invitationId;
                    const groupId = e.target.dataset.groupId;
                    const code = e.target.dataset.code;
                    this.handleAcceptInvitation(groupId, code, invitationId);
                });
            });
            
            document.querySelectorAll('.decline-invitation').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const invitationId = e.target.dataset.invitationId;
                    this.handleDeclineInvitation(invitationId);
                });
            });
        }
    },
    
    // Get country flag emoji
    getCountryFlag: function(country) {
        const flags = {
            'kenya': '🇰🇪',
            'uganda': '🇺🇬',
            'tanzania': '🇹🇿',
            'rwanda': '🇷🇼',
            'burundi': '🇧🇮',
            'somalia': '🇸🇴',
            'south-sudan': '🇸🇸',
            'ethiopia': '🇪🇹',
            'drc': '🇨🇩',
            'nigeria': '🇳🇬',
            'south-africa': '🇿🇦',
            'ghana': '🇬🇭'
        };
        
        return flags[country] || '🏳️';
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Create group form
        const createGroupForm = document.getElementById('createGroupForm');
        if (createGroupForm) {
            createGroupForm.addEventListener('submit', (e) => this.handleCreateGroup(e));
        }
        
        // Invite to group form
        const inviteForm = document.getElementById('inviteToGroupForm');
        if (inviteForm) {
            inviteForm.addEventListener('submit', (e) => this.handleInviteToGroup(e));
        }
        
        // Search groups
        const searchGroupsInput = document.getElementById('searchGroups');
        if (searchGroupsInput) {
            searchGroupsInput.addEventListener('input', (e) => {
                this.handleSearchGroups(e.target.value);
            });
        }
        
        // Filter groups
        const groupFilters = document.getElementById('groupFilters');
        if (groupFilters) {
            groupFilters.addEventListener('change', (e) => {
                this.handleFilterGroups();
            });
        }
    },
    
    // Handle create group
    handleCreateGroup: function(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const groupData = {
            name: formData.get('groupName'),
            description: formData.get('groupDescription'),
            country: formData.get('groupCountry') || AuthModule?.getUserCountry(),
            groupType: formData.get('groupType'),
            maxMembers: formData.get('maxMembers') || 1000,
            visibility: formData.get('visibility') || 'private',
            joinMethod: formData.get('joinMethod') || 'invitation',
            categories: Array.from(form.querySelectorAll('input[name="categories"]:checked')).map(cb => cb.value)
        };
        
        const result = this.createGroup(groupData);
        
        if (result.success) {
            showNotification(result.message, 'success');
            
            // Close modal if exists
            const modal = document.getElementById('createGroupModal');
            if (modal) modal.style.display = 'none';
            
            // Redirect to group page
            setTimeout(() => {
                window.location.href = result.redirect;
            }, 1500);
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle join group
    handleJoinGroup: function(groupId) {
        const result = this.joinGroup(groupId, 'request');
        
        if (result.success) {
            showNotification(result.message, 'success');
            this.updateGroupsUI();
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle leave group
    handleLeaveGroup: function(groupId) {
        if (!confirm('Are you sure you want to leave this group?')) {
            return;
        }
        
        const result = this.leaveGroup(groupId);
        
        if (result.success) {
            showNotification(result.message, 'success');
            this.updateGroupsUI();
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle view group
    handleViewGroup: function(groupId) {
        window.location.href = `/pages/groups.html?groupId=${groupId}`;
    },
    
    // Handle invite to group
    handleInviteToGroup: function(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const groupId = formData.get('groupId');
        
        const result = this.inviteToGroup(
            groupId,
            formData.get('inviteePhone'),
            formData.get('inviteeName')
        );
        
        if (result.success) {
            showNotification(result.message, 'success');
            
            // Show invitation code
            if (result.invitationCode) {
                showNotification(`Invitation code: ${result.invitationCode}. Share this with the invitee.`, 'info');
            }
            
            form.reset();
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle accept invitation
    handleAcceptInvitation: function(groupId, invitationCode, invitationId) {
        const result = this.joinGroup(groupId, 'invitation', invitationCode);
        
        if (result.success) {
            showNotification(result.message, 'success');
            
            // Remove invitation from UI
            const invitationCard = document.querySelector(`[data-invitation-id="${invitationId}"]`);
            if (invitationCard) {
                invitationCard.remove();
            }
            
            // Update invitations list
            this.invitations = this.invitations.filter(inv => inv.id !== invitationId);
            this.saveInvitations();
            
            // Update groups UI
            this.updateGroupsUI();
        } else {
            showNotification(result.message, 'error');
        }
    },
    
    // Handle decline invitation
    handleDeclineInvitation: function(invitationId) {
        if (!confirm('Are you sure you want to decline this invitation?')) {
            return;
        }
        
        // Remove invitation
        this.invitations = this.invitations.filter(inv => inv.id !== invitationId);
        this.saveInvitations();
        
        // Remove from UI
        const invitationCard = document.querySelector(`[data-invitation-id="${invitationId}"]`);
        if (invitationCard) {
            invitationCard.remove();
        }
        
        showNotification('Invitation declined', 'success');
    },
    
    // Handle search groups
    handleSearchGroups: function(searchTerm) {
        const filteredGroups = this.searchGroups(searchTerm);
        this.renderFilteredGroups(filteredGroups);
    },
    
    // Handle filter groups
    handleFilterGroups: function() {
        const filters = {
            groupType: document.getElementById('filterGroupType')?.value,
            minMembers: document.getElementById('filterMinMembers')?.value,
            maxMembers: document.getElementById('filterMaxMembers')?.value,
            minRating: document.getElementById('filterMinRating')?.value,
            joinMethod: document.getElementById('filterJoinMethod')?.value
        };
        
        const filteredGroups = this.searchGroups('', filters);
        this.renderFilteredGroups(filteredGroups);
    },
    
    // Render filtered groups
    renderFilteredGroups: function(groups) {
        const availableGroups = document.getElementById('availableGroups');
        if (!availableGroups) return;
        
        if (groups.length === 0) {
            availableGroups.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No Groups Found</h3>
                    <p>Try adjusting your search or filters.</p>
                </div>
            `;
        } else {
            // Similar to renderGroupsList but with filtered groups
            availableGroups.innerHTML = groups.map(group => `
                <div class="group-card" data-group-id="${group.id}">
                    <div class="group-header">
                        <div class="group-flag">${this.getCountryFlag(group.country)}</div>
                        <div class="group-info">
                            <h3 class="group-name">${group.name}</h3>
                            <div class="group-meta">
                                <span class="group-type">${group.groupType}</span>
                                <span class="group-members">${group.members.length}/${group.maxMembers} members</span>
                            </div>
                        </div>
                        <div class="group-rating">
                            ⭐ ${group.avgRating?.toFixed(1) || '5.0'}
                        </div>
                    </div>
                    <p class="group-description">${group.description}</p>
                    <div class="group-actions">
                        <button class="btn btn-outline btn-small view-group-btn" data-group-id="${group.id}">View Details</button>
                        <button class="btn btn-primary btn-small join-group-btn" data-group-id="${group.id}">Join Group</button>
                    </div>
                </div>
            `).join('');
            
            // Reattach event listeners
            document.querySelectorAll('.view-group-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const groupId = e.target.dataset.groupId;
                    this.handleViewGroup(groupId);
                });
            });
            
            document.querySelectorAll('.join-group-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const groupId = e.target.dataset.groupId;
                    this.handleJoinGroup(groupId);
                });
            });
        }
    }
};

// Initialize groups module when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GroupsModule.init());
} else {
    GroupsModule.init();
}

// Make GroupsModule available globally
window.GroupsModule = GroupsModule;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GroupsModule;
}