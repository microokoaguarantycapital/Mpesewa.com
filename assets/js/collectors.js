// /assets/js/collectors.js

/**
 * M-Pesewa Debt Collectors Management System
 * Handles listing, filtering, and displaying of 200+ vetted debt collectors
 * Platform does NOT participate in recovery - only provides contact information
 */

class CollectorsSystem {
    constructor() {
        this.storageKey = 'mpesewa-collectors';
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentFilter = 'all';
        this.currentCountry = null;
        this.searchQuery = '';
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        this.initialize();
    }

    initialize() {
        this.loadCollectors();
        this.setupEventListeners();
        this.renderCollectorsTable();
        this.updateStats();
        this.renderCountryFilter();
        this.renderSpecializationFilter();
    }

    loadCollectors() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            this.collectors = JSON.parse(stored);
        } else {
            this.collectors = this.generateCollectors();
            this.saveCollectors();
        }
        
        this.filteredCollectors = this.filterCollectors();
    }

    generateCollectors() {
        const collectors = [];
        const countries = ['kenya', 'uganda', 'tanzania', 'rwanda', 'burundi', 'somalia', 'south-sudan', 'ethiopia', 'DRC', 'nigeria', 'south-africa', 'ghana'];
        const specializations = ['individual', 'small-business', 'corporate', 'legal', 'microfinance', 'cross-border'];
        const services = ['negotiation', 'legal-action', 'asset-tracing', 'skip-tracing', 'credit-reporting', 'mediation'];
        
        const firstNames = [
            'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
            'David', 'Susan', 'Richard', 'Jessica', 'Joseph', 'Sarah', 'Thomas', 'Karen', 'Charles', 'Nancy',
            'Christopher', 'Lisa', 'Daniel', 'Margaret', 'Matthew', 'Betty', 'Anthony', 'Sandra', 'Donald', 'Ashley'
        ];
        
        const lastNames = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
            'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
            'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
        ];
        
        const companyNames = [
            'Alpha Recovery', 'Beta Collectors', 'Gamma Solutions', 'Delta Agency', 'Epsilon Services',
            'Zeta Partners', 'Eta Associates', 'Theta Group', 'Iota Consultants', 'Kappa Recovery',
            'Lambda Legal', 'Mu Collectors', 'Nu Agency', 'Xi Solutions', 'Omicron Services',
            'Pi Partners', 'Rho Associates', 'Sigma Group', 'Tau Consultants', 'Upsilon Recovery'
        ];
        
        const cities = {
            'kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika'],
            'uganda': ['Kampala', 'Jinja', 'Gulu', 'Mbale', 'Mbarara', 'Entebbe'],
            'tanzania': ['Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Mbeya', 'Zanzibar'],
            'rwanda': ['Kigali', 'Musanze', 'Huye', 'Rubavu', 'Nyagatare', 'Karongi'],
            'burundi': ['Bujumbura', 'Gitega', 'Ngozi', 'Muyinga', 'Rutana', 'Cibitoke'],
            'somalia': ['Mogadishu', 'Hargeisa', 'Bosaso', 'Kismayo', 'Garowe', 'Baidoa'],
            'south-sudan': ['Juba', 'Wau', 'Malakal', 'Yei', 'Bor', 'Rumbek'],
            'ethiopia': ['Addis Ababa', 'Dire Dawa', 'Bahir Dar', 'Mekelle', 'Hawassa', 'Jimma'],
            'DRC': ['Kinshasa', 'Lubumbashi', 'Goma', 'Kisangani', 'Mbuji-Mayi', 'Bukavu'],
            'nigeria': ['Lagos', 'Abuja', 'Kano', 'Port Harcourt', 'Ibadan', 'Kaduna'],
            'south-africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'],
            'ghana': ['Accra', 'Kumasi', 'Takoradi', 'Tamale', 'Cape Coast', 'Sunyani']
        };

        for (let i = 0; i < 200; i++) {
            const country = countries[i % countries.length];
            const specialization = specializations[i % specializations.length];
            const serviceCount = 2 + (i % 4); // 2-5 services
            const servicesOffered = [];
            for (let j = 0; j < serviceCount; j++) {
                servicesOffered.push(services[(i + j) % services.length]);
            }
            
            const isCompany = i % 3 === 0;
            const name = isCompany 
                ? `${companyNames[i % companyNames.length]} ${['Ltd', 'Inc', 'PLC', 'LLC'][i % 4]}`
                : `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
            
            const experience = 2 + (i % 28); // 2-30 years
            const successRate = 60 + (i % 40); // 60-99%
            const feeType = ['percentage', 'fixed', 'hybrid'][i % 3];
            const fee = feeType === 'percentage' ? (15 + (i % 35)) + '%' : 
                        feeType === 'fixed' ? (5000 + (i * 100)) : 
                        '15% + $' + (1000 + (i * 50));
            
            const rating = 3 + (Math.random() * 2); // 3-5 stars
            const cases = 10 + (i * 5); // 10-1010 cases
            
            collectors.push({
                id: `collector-${Date.now()}-${i}`,
                name: name,
                type: isCompany ? 'company' : 'individual',
                email: `${name.toLowerCase().replace(/\s+/g, '.')}${i}@${isCompany ? 'company' : 'personal'}.com`,
                phone: this.generatePhoneNumber(country),
                phone2: i % 4 === 0 ? this.generatePhoneNumber(country) : null,
                website: isCompany ? `www.${name.toLowerCase().replace(/\s+/g, '')}.com` : null,
                country: country,
                city: cities[country][i % cities[country].length],
                address: `${100 + i} ${['Main', 'Market', 'Industrial', 'Business'][i % 4]} Street`,
                specialization: specialization,
                services: servicesOffered,
                experienceYears: experience,
                successRate: successRate,
                feeType: feeType,
                feeDetails: fee,
                rating: parseFloat(rating.toFixed(1)),
                totalCases: cases,
                activeCases: Math.floor(cases * 0.3),
                languages: this.getLanguagesForCountry(country),
                certification: i % 5 === 0 ? 'Certified Debt Collector' : null,
                verificationStatus: i % 10 === 0 ? 'pending' : 'verified',
                verificationDate: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
                notes: i % 7 === 0 ? 'Specializes in cross-border collections' : '',
                createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        
        return collectors;
    }

    generatePhoneNumber(country) {
        const prefixes = {
            'kenya': '+2547',
            'uganda': '+2567',
            'tanzania': '+2556',
            'rwanda': '+2507',
            'burundi': '+2577',
            'somalia': '+2526',
            'south-sudan': '+2119',
            'ethiopia': '+2519',
            'DRC': '+2438',
            'nigeria': '+2348',
            'south-africa': '+277',
            'ghana': '+2332'
        };
        
        const prefix = prefixes[country] || '+2547';
        const number = Math.floor(10000000 + Math.random() * 90000000);
        return prefix + number.toString().slice(0, 8 - prefix.length + 3);
    }

    getLanguagesForCountry(country) {
        const languages = {
            'kenya': ['English', 'Swahili'],
            'uganda': ['English', 'Swahili', 'Luganda'],
            'tanzania': ['Swahili', 'English'],
            'rwanda': ['Kinyarwanda', 'English', 'French'],
            'burundi': ['Kirundi', 'French'],
            'somalia': ['Somali', 'Arabic', 'English'],
            'south-sudan': ['English', 'Arabic'],
            'ethiopia': ['Amharic', 'English'],
            'DRC': ['French', 'Lingala', 'Swahili'],
            'nigeria': ['English', 'Hausa', 'Yoruba', 'Igbo'],
            'south-africa': ['English', 'Afrikaans', 'Zulu', 'Xhosa'],
            'ghana': ['English', 'Akan', 'Ewe']
        };
        
        return languages[country] || ['English'];
    }

    saveCollectors() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.collectors));
    }

    filterCollectors() {
        let filtered = this.collectors;
        
        // Filter by country
        if (this.currentCountry) {
            filtered = filtered.filter(collector => collector.country === this.currentCountry);
        }
        
        // Filter by specialization
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(collector => collector.specialization === this.currentFilter);
        }
        
        // Filter by search query
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(collector => 
                collector.name.toLowerCase().includes(query) ||
                collector.email.toLowerCase().includes(query) ||
                collector.city.toLowerCase().includes(query) ||
                collector.country.toLowerCase().includes(query) ||
                collector.specialization.toLowerCase().includes(query) ||
                collector.services.some(service => service.toLowerCase().includes(query))
            );
        }
        
        // Filter by verification status
        const showVerified = document.getElementById('showVerified')?.checked;
        if (showVerified) {
            filtered = filtered.filter(collector => collector.verificationStatus === 'verified');
        }
        
        // Sort
        filtered.sort((a, b) => {
            let aValue = a[this.sortBy];
            let bValue = b[this.sortBy];
            
            if (this.sortBy === 'name') {
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
            }
            
            if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        
        return filtered;
    }

    setupEventListeners() {
        // Search
        document.addEventListener('input', (e) => {
            if (e.target.id === 'collectorSearch') {
                this.searchQuery = e.target.value;
                this.currentPage = 1;
                this.filteredCollectors = this.filterCollectors();
                this.renderCollectorsTable();
                this.updateStats();
            }
        });
        
        // Filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.collector-filter-btn')) {
                const filter = e.target.closest('.collector-filter-btn').dataset.filter;
                this.setFilter(filter);
            }
            
            if (e.target.closest('.collector-view-btn')) {
                const collectorId = e.target.closest('.collector-view-btn').dataset.id;
                this.showCollectorDetails(collectorId);
            }
            
            if (e.target.closest('.collector-contact-btn')) {
                const collectorId = e.target.closest('.collector-contact-btn').dataset.id;
                this.showContactModal(collectorId);
            }
            
            if (e.target.closest('.collector-report-btn')) {
                const collectorId = e.target.closest('.collector-report-btn').dataset.id;
                this.reportCollector(collectorId);
            }
            
            if (e.target.closest('.collector-verify-btn')) {
                const collectorId = e.target.closest('.collector-verify-btn').dataset.id;
                this.verifyCollector(collectorId);
            }
        });
        
        // Sort
        document.addEventListener('click', (e) => {
            if (e.target.closest('.sort-header')) {
                const sortBy = e.target.closest('.sort-header').dataset.sort;
                this.setSort(sortBy);
            }
        });
        
        // Country filter
        document.addEventListener('change', (e) => {
            if (e.target.id === 'countryFilter') {
                this.currentCountry = e.target.value || null;
                this.currentPage = 1;
                this.filteredCollectors = this.filterCollectors();
                this.renderCollectorsTable();
                this.updateStats();
            }
            
            if (e.target.id === 'specializationFilter') {
                this.currentFilter = e.target.value || 'all';
                this.currentPage = 1;
                this.filteredCollectors = this.filterCollectors();
                this.renderCollectorsTable();
                this.updateStats();
            }
            
            if (e.target.id === 'showVerified') {
                this.filteredCollectors = this.filterCollectors();
                this.currentPage = 1;
                this.renderCollectorsTable();
                this.updateStats();
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
        
        // Export
        document.addEventListener('click', (e) => {
            if (e.target.closest('.export-collectors-btn')) {
                this.exportCollectors();
            }
            
            if (e.target.closest('.refresh-collectors-btn')) {
                this.refreshCollectors();
            }
            
            if (e.target.closest('.add-collector-btn')) {
                this.showAddCollectorModal();
            }
        });
        
        // Admin actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.admin-edit-btn')) {
                const collectorId = e.target.closest('.admin-edit-btn').dataset.id;
                this.editCollector(collectorId);
            }
            
            if (e.target.closest('.admin-delete-btn')) {
                const collectorId = e.target.closest('.admin-delete-btn').dataset.id;
                this.deleteCollector(collectorId);
            }
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filteredCollectors = this.filterCollectors();
        this.currentPage = 1;
        this.renderCollectorsTable();
        this.updateStats();
        
        // Update active filter button
        document.querySelectorAll('.collector-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    }

    setSort(sortBy) {
        if (this.sortBy === sortBy) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = sortBy;
            this.sortOrder = 'asc';
        }
        
        this.filteredCollectors = this.filterCollectors();
        this.renderCollectorsTable();
        
        // Update sort indicators
        document.querySelectorAll('.sort-header').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
            if (header.dataset.sort === this.sortBy) {
                header.classList.add(`sort-${this.sortOrder}`);
            }
        });
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredCollectors.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderCollectorsTable();
        this.updatePagination();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredCollectors.length / this.itemsPerPage);
        const paginationEl = document.getElementById('collectorsPagination');
        
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

    renderCollectorsTable() {
        const tableBody = document.getElementById('collectorsTableBody');
        if (!tableBody) return;
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const collectorsToShow = this.filteredCollectors.slice(startIndex, endIndex);
        
        if (collectorsToShow.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data">
                        <div class="empty-state">
                            <div class="empty-icon">🔍</div>
                            <h3>No collectors found</h3>
                            <p>${this.searchQuery ? 'No results for your search' : 'No collectors match the current filters'}</p>
                            <button class="btn btn-outline" onclick="document.getElementById('collectorSearch').value = ''; document.getElementById('countryFilter').value = ''; document.getElementById('specializationFilter').value = 'all';">
                                Clear Filters
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        const isAdmin = this.isAdmin();
        
        collectorsToShow.forEach(collector => {
            const countryFlag = this.getCountryFlag(collector.country);
            const typeBadge = this.getTypeBadge(collector.type);
            const specializationBadge = this.getSpecializationBadge(collector.specialization);
            const verificationBadge = this.getVerificationBadge(collector.verificationStatus);
            const ratingStars = this.getRatingStars(collector.rating);
            
            html += `
                <tr class="collector-row ${collector.verificationStatus === 'verified' ? 'verified' : ''}" data-id="${collector.id}">
                    <td>
                        <div class="collector-info">
                            <div class="collector-name">
                                <strong>${collector.name}</strong>
                                ${verificationBadge}
                            </div>
                            <div class="collector-details">
                                ${typeBadge} ${specializationBadge}
                            </div>
                            <div class="collector-location">
                                ${countryFlag} ${collector.city}, ${collector.country.toUpperCase()}
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="contact-info">
                            <div class="contact-phone">📱 ${collector.phone}</div>
                            ${collector.phone2 ? `<div class="contact-phone">📱 ${collector.phone2}</div>` : ''}
                            <div class="contact-email">✉️ ${collector.email}</div>
                        </div>
                    </td>
                    <td>
                        <div class="services-list">
                            ${collector.services.slice(0, 3).map(service => 
                                `<span class="service-tag">${this.formatService(service)}</span>`
                            ).join('')}
                            ${collector.services.length > 3 ? `<span class="more-tag">+${collector.services.length - 3}</span>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="stats-info">
                            <div class="stat-item">
                                <span class="stat-label">Experience:</span>
                                <span class="stat-value">${collector.experienceYears} years</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Success Rate:</span>
                                <span class="stat-value">${collector.successRate}%</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Fee:</span>
                                <span class="stat-value">${collector.feeDetails}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        ${ratingStars}
                        <div class="rating-value">${collector.rating.toFixed(1)}/5</div>
                        <div class="cases-count">${collector.totalCases.toLocaleString()} cases</div>
                    </td>
                    <td>
                        <div class="collector-actions">
                            <button class="btn-icon collector-view-btn" data-id="${collector.id}" title="View Details">
                                👁️
                            </button>
                            <button class="btn-icon collector-contact-btn" data-id="${collector.id}" title="Contact">
                                📞
                            </button>
                            ${isAdmin ? `
                                <button class="btn-icon btn-warning collector-report-btn" data-id="${collector.id}" title="Report Issue">
                                    ⚠️
                                </button>
                                <button class="btn-icon btn-success collector-verify-btn" data-id="${collector.id}" title="Verify Collector">
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

    renderCountryFilter() {
        const filterContainer = document.getElementById('countryFilterContainer');
        if (!filterContainer) return;
        
        const countries = [...new Set(this.collectors.map(c => c.country))];
        
        let html = '<select id="countryFilter" class="form-control">';
        html += '<option value="">All Countries</option>';
        
        countries.sort().forEach(country => {
            const flag = this.getCountryFlag(country);
            const name = country.charAt(0).toUpperCase() + country.slice(1);
            html += `<option value="${country}">${flag} ${name}</option>`;
        });
        
        html += '</select>';
        filterContainer.innerHTML = html;
        
        // Set event listener
        const select = filterContainer.querySelector('#countryFilter');
        select.addEventListener('change', (e) => {
            this.currentCountry = e.target.value || null;
            this.currentPage = 1;
            this.filteredCollectors = this.filterCollectors();
            this.renderCollectorsTable();
            this.updateStats();
        });
    }

    renderSpecializationFilter() {
        const filterContainer = document.getElementById('specializationFilterContainer');
        if (!filterContainer) return;
        
        const specializations = [
            { value: 'all', label: 'All Specializations' },
            { value: 'individual', label: 'Individual Collections' },
            { value: 'small-business', label: 'Small Business' },
            { value: 'corporate', label: 'Corporate' },
            { value: 'legal', label: 'Legal Action' },
            { value: 'microfinance', label: 'Microfinance' },
            { value: 'cross-border', label: 'Cross-border' }
        ];
        
        let html = '<select id="specializationFilter" class="form-control">';
        
        specializations.forEach(spec => {
            html += `<option value="${spec.value}">${spec.label}</option>`;
        });
        
        html += '</select>';
        filterContainer.innerHTML = html;
        
        // Set event listener
        const select = filterContainer.querySelector('#specializationFilter');
        select.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.currentPage = 1;
            this.filteredCollectors = this.filterCollectors();
            this.renderCollectorsTable();
            this.updateStats();
        });
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
        return flags[country] || '🏳️';
    }

    getTypeBadge(type) {
        const badges = {
            'company': '<span class="badge badge-primary">Company</span>',
            'individual': '<span class="badge badge-secondary">Individual</span>'
        };
        return badges[type] || `<span class="badge">${type}</span>`;
    }

    getSpecializationBadge(specialization) {
        const badges = {
            'individual': '<span class="badge badge-info">Individual</span>',
            'small-business': '<span class="badge badge-info">Small Business</span>',
            'corporate': '<span class="badge badge-success">Corporate</span>',
            'legal': '<span class="badge badge-danger">Legal</span>',
            'microfinance': '<span class="badge badge-warning">Microfinance</span>',
            'cross-border': '<span class="badge badge-primary">Cross-border</span>'
        };
        return badges[specialization] || `<span class="badge">${specialization}</span>`;
    }

    getVerificationBadge(status) {
        const badges = {
            'verified': '<span class="badge badge-success">✓ Verified</span>',
            'pending': '<span class="badge badge-warning">⏳ Pending</span>',
            'unverified': '<span class="badge badge-secondary">Unverified</span>'
        };
        return badges[status] || `<span class="badge">${status}</span>`;
    }

    getRatingStars(rating) {
        if (!rating) return '<span class="text-muted">Not rated</span>';
        
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < fullStars; i++) stars += '★';
        if (hasHalfStar) stars += '☆';
        for (let i = 0; i < emptyStars; i++) stars += '☆';
        
        return `<div class="star-rating" title="${rating}/5">${stars}</div>`;
    }

    formatService(service) {
        const services = {
            'negotiation': 'Negotiation',
            'legal-action': 'Legal Action',
            'asset-tracing': 'Asset Tracing',
            'skip-tracing': 'Skip Tracing',
            'credit-reporting': 'Credit Reporting',
            'mediation': 'Mediation'
        };
        return services[service] || service;
    }

    updateStats() {
        const stats = {
            total: this.filteredCollectors.length,
            verified: this.filteredCollectors.filter(c => c.verificationStatus === 'verified').length,
            companies: this.filteredCollectors.filter(c => c.type === 'company').length,
            individuals: this.filteredCollectors.filter(c => c.type === 'individual').length,
            avgRating: this.filteredCollectors.length > 0 ? 
                (this.filteredCollectors.reduce((sum, c) => sum + c.rating, 0) / this.filteredCollectors.length).toFixed(1) : 0,
            avgExperience: this.filteredCollectors.length > 0 ? 
                Math.round(this.filteredCollectors.reduce((sum, c) => sum + c.experienceYears, 0) / this.filteredCollectors.length) : 0,
            byCountry: this.getStatsByCountry(),
            bySpecialization: this.getStatsBySpecialization()
        };
        
        // Update stats display
        const updateStat = (id, value) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
            }
        };
        
        updateStat('statTotalCollectors', stats.total);
        updateStat('statVerifiedCollectors', stats.verified);
        updateStat('statCompanyCollectors', stats.companies);
        updateStat('statIndividualCollectors', stats.individuals);
        updateStat('statAvgRating', `${stats.avgRating}/5`);
        updateStat('statAvgExperience', `${stats.avgExperience} years`);
        
        // Update charts
        this.updateCharts(stats);
    }

    getStatsByCountry() {
        const byCountry = {};
        this.filteredCollectors.forEach(collector => {
            byCountry[collector.country] = (byCountry[collector.country] || 0) + 1;
        });
        return byCountry;
    }

    getStatsBySpecialization() {
        const bySpecialization = {};
        this.filteredCollectors.forEach(collector => {
            bySpecialization[collector.specialization] = (bySpecialization[collector.specialization] || 0) + 1;
        });
        return bySpecialization;
    }

    updateCharts(stats) {
        // Update country distribution chart
        const countryChart = document.getElementById('countryDistributionChart');
        if (countryChart) {
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
        
        // Update specialization chart
        const specChart = document.getElementById('specializationChart');
        if (specChart) {
            let html = '<div class="chart-bars">';
            Object.entries(stats.bySpecialization).forEach(([spec, count]) => {
                const percentage = (count / stats.total) * 100;
                html += `
                    <div class="chart-bar">
                        <div class="bar-label">
                            <span class="spec-badge">${this.getSpecializationBadge(spec)}</span>
                        </div>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="bar-value">${count}</div>
                    </div>
                `;
            });
            html += '</div>';
            specChart.innerHTML = html;
        }
    }

    showCollectorDetails(collectorId) {
        const collector = this.collectors.find(c => c.id === collectorId);
        if (!collector) return;
        
        const modalHtml = `
            <div class="modal collector-details-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Collector Details</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="collector-header">
                            <div class="collector-avatar">
                                ${collector.type === 'company' ? '🏢' : '👤'}
                            </div>
                            <div class="collector-title">
                                <h4>${collector.name}</h4>
                                <div class="collector-subtitle">
                                    ${this.getTypeBadge(collector.type)} ${this.getSpecializationBadge(collector.specialization)}
                                    ${this.getVerificationBadge(collector.verificationStatus)}
                                </div>
                            </div>
                        </div>
                        
                        <div class="details-grid">
                            <div class="detail-section">
                                <h5>Contact Information</h5>
                                <div class="contact-details">
                                    <div class="contact-item">
                                        <span class="contact-icon">📱</span>
                                        <div class="contact-content">
                                            <div class="contact-label">Phone</div>
                                            <div class="contact-value">${collector.phone}</div>
                                            ${collector.phone2 ? `<div class="contact-value">${collector.phone2}</div>` : ''}
                                        </div>
                                    </div>
                                    <div class="contact-item">
                                        <span class="contact-icon">✉️</span>
                                        <div class="contact-content">
                                            <div class="contact-label">Email</div>
                                            <div class="contact-value">${collector.email}</div>
                                        </div>
                                    </div>
                                    <div class="contact-item">
                                        <span class="contact-icon">📍</span>
                                        <div class="contact-content">
                                            <div class="contact-label">Address</div>
                                            <div class="contact-value">${collector.address}</div>
                                            <div class="contact-value">${collector.city}, ${collector.country.toUpperCase()} ${this.getCountryFlag(collector.country)}</div>
                                        </div>
                                    </div>
                                    ${collector.website ? `
                                        <div class="contact-item">
                                            <span class="contact-icon">🌐</span>
                                            <div class="contact-content">
                                                <div class="contact-label">Website</div>
                                                <div class="contact-value">${collector.website}</div>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h5>Professional Details</h5>
                                <div class="professional-details">
                                    <div class="stat-row">
                                        <div class="stat">
                                            <div class="stat-label">Experience</div>
                                            <div class="stat-value">${collector.experienceYears} years</div>
                                        </div>
                                        <div class="stat">
                                            <div class="stat-label">Success Rate</div>
                                            <div class="stat-value">${collector.successRate}%</div>
                                        </div>
                                    </div>
                                    <div class="stat-row">
                                        <div class="stat">
                                            <div class="stat-label">Fee Structure</div>
                                            <div class="stat-value">${collector.feeDetails}</div>
                                        </div>
                                        <div class="stat">
                                            <div class="stat-label">Cases Handled</div>
                                            <div class="stat-value">${collector.totalCases.toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div class="stat-row">
                                        <div class="stat">
                                            <div class="stat-label">Rating</div>
                                            <div class="stat-value">
                                                ${this.getRatingStars(collector.rating)}
                                                ${collector.rating.toFixed(1)}/5
                                            </div>
                                        </div>
                                        <div class="stat">
                                            <div class="stat-label">Active Cases</div>
                                            <div class="stat-value">${collector.activeCases}</div>
                                        </div>
                                    </div>
                                    ${collector.certification ? `
                                        <div class="certification">
                                            <span class="cert-icon">🏅</span>
                                            <span>${collector.certification}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="detail-section full-width">
                                <h5>Services Offered</h5>
                                <div class="services-grid">
                                    ${collector.services.map(service => `
                                        <div class="service-card">
                                            <div class="service-icon">${this.getServiceIcon(service)}</div>
                                            <div class="service-name">${this.formatService(service)}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h5>Languages</h5>
                                <div class="languages-list">
                                    ${collector.languages.map(lang => `
                                        <span class="language-tag">${lang}</span>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h5>Additional Information</h5>
                                <div class="additional-info">
                                    <div class="info-item">
                                        <span class="info-label">Verification Date:</span>
                                        <span class="info-value">${this.formatDate(collector.verificationDate)}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Member Since:</span>
                                        <span class="info-value">${this.formatDate(collector.createdAt)}</span>
                                    </div>
                                    ${collector.notes ? `
                                        <div class="info-item">
                                            <span class="info-label">Notes:</span>
                                            <span class="info-value">${collector.notes}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline modal-close">Close</button>
                        <button class="btn btn-primary collector-contact-btn" data-id="${collector.id}">
                            Contact Collector
                        </button>
                        ${this.isAdmin() ? `
                            <button class="btn btn-warning admin-edit-btn" data-id="${collector.id}">
                                Edit Details
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
        
        const contactBtn = modalContainer.querySelector('.collector-contact-btn');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => {
                document.body.removeChild(modalContainer);
                this.showContactModal(collectorId);
            });
        }
        
        const editBtn = modalContainer.querySelector('.admin-edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                document.body.removeChild(modalContainer);
                this.editCollector(collectorId);
            });
        }
    }

    getServiceIcon(service) {
        const icons = {
            'negotiation': '🤝',
            'legal-action': '⚖️',
            'asset-tracing': '🔍',
            'skip-tracing': '🕵️',
            'credit-reporting': '📊',
            'mediation': '⚖️'
        };
        return icons[service] || '💼';
    }

    formatDate(date) {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showContactModal(collectorId) {
        const collector = this.collectors.find(c => c.id === collectorId);
        if (!collector) return;
        
        const disclaimer = `Note: M-Pesewa does not participate in debt collection or recovery. 
        We only provide contact information for vetted collectors. 
        Any agreements or arrangements are strictly between you and the collector.`;
        
        const modalHtml = `
            <div class="modal contact-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Contact ${collector.name}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="contact-warning">
                            <div class="warning-icon">⚠️</div>
                            <div class="warning-text">${disclaimer}</div>
                        </div>
                        
                        <div class="contact-methods">
                            <h5>Contact Information:</h5>
                            <div class="method-cards">
                                <div class="method-card">
                                    <div class="method-icon">📱</div>
                                    <div class="method-details">
                                        <div class="method-name">Phone Call</div>
                                        <div class="method-value">${collector.phone}</div>
                                        ${collector.phone2 ? `<div class="method-value">${collector.phone2}</div>` : ''}
                                        <button class="btn btn-sm btn-outline copy-btn" data-text="${collector.phone}">
                                            Copy Number
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="method-card">
                                    <div class="method-icon">✉️</div>
                                    <div class="method-details">
                                        <div class="method-name">Email</div>
                                        <div class="method-value">${collector.email}</div>
                                        <button class="btn btn-sm btn-outline copy-btn" data-text="${collector.email}">
                                            Copy Email
                                        </button>
                                        <button class="btn btn-sm btn-primary" onclick="window.location.href='mailto:${collector.email}'">
                                            Send Email
                                        </button>
                                    </div>
                                </div>
                                
                                ${collector.website ? `
                                    <div class="method-card">
                                        <div class="method-icon">🌐</div>
                                        <div class="method-details">
                                            <div class="method-name">Website</div>
                                            <div class="method-value">${collector.website}</div>
                                            <button class="btn btn-sm btn-primary" onclick="window.open('https://${collector.website}', '_blank')">
                                                Visit Website
                                            </button>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div class="contact-tips">
                            <h5>Tips for Contacting:</h5>
                            <ul>
                                <li>Clearly explain your debt situation</li>
                                <li>Ask about their fee structure upfront</li>
                                <li>Request references or case studies</li>
                                <li>Discuss their success rate with similar cases</li>
                                <li>Get everything in writing before proceeding</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline modal-close">Close</button>
                        <button class="btn btn-primary" id="saveContact">
                            Save Contact
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Copy buttons
        modalContainer.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const text = e.target.dataset.text;
                navigator.clipboard.writeText(text).then(() => {
                    e.target.textContent = 'Copied!';
                    setTimeout(() => {
                        e.target.textContent = 'Copy';
                    }, 2000);
                });
            });
        });
        
        // Save contact
        modalContainer.querySelector('#saveContact').addEventListener('click', () => {
            this.saveContact(collector);
            modalContainer.querySelector('#saveContact').textContent = 'Saved!';
            modalContainer.querySelector('#saveContact').disabled = true;
            
            setTimeout(() => {
                document.body.removeChild(modalContainer);
            }, 1500);
        });
        
        // Close modal
        modalContainer.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modalContainer);
            });
        });
    }

    saveContact(collector) {
        const savedContacts = JSON.parse(localStorage.getItem('mpesewa-saved-contacts') || '[]');
        
        // Check if already saved
        if (!savedContacts.find(c => c.id === collector.id)) {
            savedContacts.push({
                id: collector.id,
                name: collector.name,
                phone: collector.phone,
                email: collector.email,
                type: 'collector',
                savedAt: new Date().toISOString()
            });
            
            localStorage.setItem('mpesewa-saved-contacts', JSON.stringify(savedContacts));
            this.showNotification(`${collector.name} saved to your contacts`, 'success');
        } else {
            this.showNotification(`${collector.name} is already in your contacts`, 'info');
        }
    }

    reportCollector(collectorId) {
        if (!this.isAdmin()) return;
        
        const collector = this.collectors.find(c => c.id === collectorId);
        if (!collector) return;
        
        const reportHtml = `
            <div class="modal report-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Report Collector: ${collector.name}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="reportReason">Reason for Report</label>
                            <select id="reportReason" class="form-control">
                                <option value="">Select a reason</option>
                                <option value="fraud">Suspected Fraud</option>
                                <option value="unprofessional">Unprofessional Conduct</option>
                                <option value="false-info">False Information</option>
                                <option value="non-performance">Non-performance</option>
                                <option value="harassment">Harassment</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="reportDetails">Details</label>
                            <textarea id="reportDetails" class="form-control" rows="4" 
                                      placeholder="Please provide details of the issue..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="reportEvidence">Evidence (Optional)</label>
                            <input type="text" id="reportEvidence" class="form-control" 
                                   placeholder="Links to evidence, case numbers, etc.">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline modal-close">Cancel</button>
                        <button class="btn btn-danger" id="submitReport">Submit Report</button>
                    </div>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = reportHtml;
        document.body.appendChild(modalContainer);
        
        modalContainer.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modalContainer);
            });
        });
        
        modalContainer.querySelector('#submitReport').addEventListener('click', () => {
            const reason = modalContainer.querySelector('#reportReason').value;
            const details = modalContainer.querySelector('#reportDetails').value;
            
            if (!reason || !details) {
                alert('Please provide both reason and details');
                return;
            }
            
            // Save report
            const reports = JSON.parse(localStorage.getItem('mpesewa-collector-reports') || '[]');
            reports.push({
                collectorId: collectorId,
                collectorName: collector.name,
                reason: reason,
                details: details,
                evidence: modalContainer.querySelector('#reportEvidence').value,
                reportedBy: window.mpesewa?.state?.currentUser?.name || 'Admin',
                reportedAt: new Date().toISOString(),
                status: 'pending'
            });
            
            localStorage.setItem('mpesewa-collector-reports', JSON.stringify(reports));
            
            // Update collector status
            const index = this.collectors.findIndex(c => c.id === collectorId);
            if (index !== -1) {
                this.collectors[index].verificationStatus = 'pending';
                this.collectors[index].notes = (this.collectors[index].notes || '') + `\nReported on ${new Date().toLocaleDateString()}: ${reason}`;
                this.saveCollectors();
                
                this.filteredCollectors = this.filterCollectors();
                this.renderCollectorsTable();
                this.updateStats();
            }
            
            document.body.removeChild(modalContainer);
            this.showNotification(`Report submitted for ${collector.name}. Collector status set to pending.`, 'warning');
        });
    }

    verifyCollector(collectorId) {
        if (!this.isAdmin()) return;
        
        const collector = this.collectors.find(c => c.id === collectorId);
        if (!collector) return;
        
        if (confirm(`Verify ${collector.name} as a trusted debt collector?`)) {
            const index = this.collectors.findIndex(c => c.id === collectorId);
            if (index !== -1) {
                this.collectors[index].verificationStatus = 'verified';
                this.collectors[index].verificationDate = new Date().toISOString();
                this.collectors[index].notes = (this.collectors[index].notes || '') + `\nVerified by admin on ${new Date().toLocaleDateString()}`;
                this.saveCollectors();
                
                this.filteredCollectors = this.filterCollectors();
                this.renderCollectorsTable();
                this.updateStats();
                
                this.showNotification(`${collector.name} verified successfully`, 'success');
            }
        }
    }

    editCollector(collectorId) {
        if (!this.isAdmin()) return;
        
        // Implementation for edit collector modal
        console.log('Edit collector:', collectorId);
        // This would open a form to edit collector details
    }

    deleteCollector(collectorId) {
        if (!this.isAdmin()) return;
        
        const collector = this.collectors.find(c => c.id === collectorId);
        if (!collector) return;
        
        if (confirm(`Permanently delete ${collector.name} from the collectors list?`)) {
            this.collectors = this.collectors.filter(c => c.id !== collectorId);
            this.saveCollectors();
            
            this.filteredCollectors = this.filterCollectors();
            this.renderCollectorsTable();
            this.updateStats();
            
            this.showNotification(`${collector.name} deleted from collectors list`, 'info');
        }
    }

    exportCollectors() {
        const data = JSON.stringify(this.filteredCollectors, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `mpesewa-collectors-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Collectors exported successfully', 'success');
    }

    refreshCollectors() {
        this.loadCollectors();
        this.filteredCollectors = this.filterCollectors();
        this.currentPage = 1;
        this.renderCollectorsTable();
        this.updateStats();
        
        this.showNotification('Collectors list refreshed', 'info');
    }

    showAddCollectorModal() {
        if (!this.isAdmin()) {
            this.showNotification('Only admins can add new collectors', 'error');
            return;
        }
        
        // Implementation for add collector modal
        console.log('Show add collector modal');
    }

    isAdmin() {
        const user = window.mpesewa?.state?.currentUser;
        return user?.role === 'admin' || user?.isAdmin === true;
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

// Initialize collectors system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.collectorsSystem = new CollectorsSystem();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollectorsSystem;
}