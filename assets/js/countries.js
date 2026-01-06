// /assets/js/countries.js

/**
 * M-Pesewa Country Management System
 * Handles country dashboards, isolation logic, currency conversion, and language toggling
 * Strict rule: No cross-country lending or borrowing allowed
 */

class CountrySystem {
    constructor() {
        this.storageKey = 'mpesewa-countries';
        this.userCountryKey = 'mpesewa-user-country';
        this.countryDataKey = 'mpesewa-country-data';
        this.currentCountry = null;
        this.initialize();
    }

    initialize() {
        this.loadCountryData();
        this.loadUserCountry();
        this.setupEventListeners();
        this.setupCountryDetection();
        this.renderCountrySelector();
        this.renderCountryDashboard();
        this.setupCurrencyConverter();
        this.setupLanguageToggle();
    }

    // Country definitions with all required data
    getCountryDefinitions() {
        return {
            'kenya': {
                name: 'Kenya',
                code: 'KE',
                flag: '🇰🇪',
                currency: 'KES',
                currencySymbol: 'KSh',
                currencyName: 'Kenyan Shilling',
                language: 'en',
                languages: ['en', 'sw'],
                timezone: 'Africa/Nairobi',
                phoneCode: '+254',
                phoneFormat: '+254 XXX XXX XXX',
                contactEmail: 'kenya@mpesewa.com',
                supportHours: 'Mon-Fri 8AM-6PM, Sat 9AM-1PM',
                groupsCount: 2500,
                lendersCount: 15000,
                borrowersCount: 75000,
                totalLent: 450000000,
                repaymentRate: 99.2,
                defaultRate: 0.8,
                popularGroups: ['Nairobi Professionals', 'Mombasa Traders', 'Kisumu Farmers', 'Nakuru Business'],
                activeLoans: 12500,
                conversionRate: 1, // Base currency
                color: '#000000',
                mapCenter: [1.2921, 36.8219],
                mapZoom: 6,
                regions: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika'],
                emergencyContacts: ['+254 709 219 000'],
                bankingHours: '8:30 AM - 4:30 PM',
                holidays: ['Jamhuri Day', 'Madaraka Day', 'Mashujaa Day']
            },
            'uganda': {
                name: 'Uganda',
                code: 'UG',
                flag: '🇺🇬',
                currency: 'UGX',
                currencySymbol: 'UGX',
                currencyName: 'Ugandan Shilling',
                language: 'en',
                languages: ['en', 'sw'],
                timezone: 'Africa/Kampala',
                phoneCode: '+256',
                phoneFormat: '+256 XXX XXX XXX',
                contactEmail: 'uganda@mpesewa.com',
                supportHours: 'Mon-Fri 8AM-6PM, Sat 9AM-1PM',
                groupsCount: 1800,
                lendersCount: 12000,
                borrowersCount: 60000,
                totalLent: 320000000,
                repaymentRate: 98.8,
                defaultRate: 1.2,
                popularGroups: ['Kampala Business', 'Jinja Traders', 'Gulu Farmers', 'Mbale Professionals'],
                activeLoans: 9500,
                conversionRate: 0.028, // 1 KES = 0.028 USD, 1 UGX = 0.00027 USD
                color: '#FFD700',
                mapCenter: [0.3476, 32.5825],
                mapZoom: 7,
                regions: ['Kampala', 'Jinja', 'Gulu', 'Mbale', 'Mbarara', 'Entebbe'],
                emergencyContacts: ['+256 392 175 546'],
                bankingHours: '8:00 AM - 5:00 PM',
                holidays: ['Independence Day', 'Liberation Day']
            },
            'tanzania': {
                name: 'Tanzania',
                code: 'TZ',
                flag: '🇹🇿',
                currency: 'TZS',
                currencySymbol: 'TSh',
                currencyName: 'Tanzanian Shilling',
                language: 'sw',
                languages: ['sw', 'en'],
                timezone: 'Africa/Dar_es_Salaam',
                phoneCode: '+255',
                phoneFormat: '+255 XXX XXX XXX',
                contactEmail: 'tanzania@mpesewa.com',
                supportHours: 'Mon-Fri 8AM-6PM, Sat 9AM-1PM',
                groupsCount: 1200,
                lendersCount: 9000,
                borrowersCount: 45000,
                totalLent: 280000000,
                repaymentRate: 98.5,
                defaultRate: 1.5,
                popularGroups: ['Dar es Salaam Business', 'Arusha Traders', 'Mwanza Fishers', 'Dodoma Government'],
                activeLoans: 7500,
                conversionRate: 0.00043,
                color: '#1EB53A',
                mapCenter: [-6.3690, 34.8888],
                mapZoom: 6,
                regions: ['Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Mbeya', 'Zanzibar'],
                emergencyContacts: ['+255 659 073 010'],
                bankingHours: '8:30 AM - 4:00 PM',
                holidays: ['Union Day', 'Independence Day']
            },
            'rwanda': {
                name: 'Rwanda',
                code: 'RW',
                flag: '🇷🇼',
                currency: 'RWF',
                currencySymbol: 'FRw',
                currencyName: 'Rwandan Franc',
                language: ['rw', 'en', 'fr'],
                languages: ['rw', 'en', 'fr'],
                timezone: 'Africa/Kigali',
                phoneCode: '+250',
                phoneFormat: '+250 XXX XXX XXX',
                contactEmail: 'rwanda@mpesewa.com',
                supportHours: 'Mon-Fri 8AM-6PM, Sat 9AM-1PM',
                groupsCount: 900,
                lendersCount: 6000,
                borrowersCount: 30000,
                totalLent: 180000000,
                repaymentRate: 99.5,
                defaultRate: 0.5,
                popularGroups: ['Kigali Tech', 'Musanze Tourism', 'Huye Academia', 'Rubavu Cross-border'],
                activeLoans: 4500,
                conversionRate: 0.001,
                color: '#20603D',
                mapCenter: [-1.9403, 29.8739],
                mapZoom: 8,
                regions: ['Kigali', 'Musanze', 'Huye', 'Rubavu', 'Nyagatare', 'Karongi'],
                emergencyContacts: ['+250 791 590 801'],
                bankingHours: '8:00 AM - 5:00 PM',
                holidays: ['Liberation Day', 'Heroes Day']
            },
            'burundi': {
                name: 'Burundi',
                code: 'BI',
                flag: '🇧🇮',
                currency: 'BIF',
                currencySymbol: 'FBu',
                currencyName: 'Burundian Franc',
                language: ['fr', 'rn'],
                languages: ['fr', 'rn'],
                timezone: 'Africa/Bujumbura',
                phoneCode: '+257',
                phoneFormat: '+257 XX XX XX XX',
                contactEmail: 'burundi@mpesewa.com',
                supportHours: 'Mon-Fri 8AM-5PM',
                groupsCount: 600,
                lendersCount: 4000,
                borrowersCount: 20000,
                totalLent: 95000000,
                repaymentRate: 97.8,
                defaultRate: 2.2,
                popularGroups: ['Bujumbura Business', 'Gitega Government', 'Ngozi Farmers', 'Muyinga Traders'],
                activeLoans: 3000,
                conversionRate: 0.0005,
                color: '#CE1126',
                mapCenter: [-3.3731, 29.9189],
                mapZoom: 8,
                regions: ['Bujumbura', 'Gitega', 'Ngozi', 'Muyinga', 'Rutana', 'Cibitoke'],
                emergencyContacts: ['+257 79 000 000'],
                bankingHours: '7:30 AM - 3:30 PM',
                holidays: ['Independence Day', 'Unity Day']
            },
            'somalia': {
                name: 'Somalia',
                code: 'SO',
                flag: '🇸🇴',
                currency: 'SOS',
                currencySymbol: 'S',
                currencyName: 'Somali Shilling',
                language: 'so',
                languages: ['so', 'ar'],
                timezone: 'Africa/Mogadishu',
                phoneCode: '+252',
                phoneFormat: '+252 XX XXX XXX',
                contactEmail: 'somalia@mpesewa.com',
                supportHours: 'Sat-Thu 8AM-5PM',
                groupsCount: 450,
                lendersCount: 3000,
                borrowersCount: 15000,
                totalLent: 75000000,
                repaymentRate: 96.5,
                defaultRate: 3.5,
                popularGroups: ['Mogadishu Business', 'Hargeisa Traders', 'Bosaso Port', 'Kismayo Fishermen'],
                activeLoans: 2200,
                conversionRate: 0.0018,
                color: '#4189DD',
                mapCenter: [5.1521, 46.1996],
                mapZoom: 6,
                regions: ['Mogadishu', 'Hargeisa', 'Bosaso', 'Kismayo', 'Garowe', 'Baidoa'],
                emergencyContacts: ['+252 63 0000000'],
                bankingHours: '8:00 AM - 4:00 PM',
                holidays: ['Independence Day', 'Republic Day']
            },
            'south-sudan': {
                name: 'South Sudan',
                code: 'SS',
                flag: '🇸🇸',
                currency: 'SSP',
                currencySymbol: '£',
                currencyName: 'South Sudanese Pound',
                language: 'en',
                languages: ['en', 'ar'],
                timezone: 'Africa/Juba',
                phoneCode: '+211',
                phoneFormat: '+211 XXX XXX XXX',
                contactEmail: 'southsudan@mpesewa.com',
                supportHours: 'Mon-Fri 8AM-4PM',
                groupsCount: 350,
                lendersCount: 2000,
                borrowersCount: 10000,
                totalLent: 50000000,
                repaymentRate: 95.8,
                defaultRate: 4.2,
                popularGroups: ['Juba Business', 'Wau Traders', 'Malakal River', 'Yei Farmers'],
                activeLoans: 1800,
                conversionRate: 0.007,
                color: '#078930',
                mapCenter: [6.8770, 31.3070],
                mapZoom: 6,
                regions: ['Juba', 'Wau', 'Malakal', 'Yei', 'Bor', 'Rumbek'],
                emergencyContacts: ['+211 955 000000'],
                bankingHours: '8:00 AM - 3:00 PM',
                holidays: ['Independence Day', 'Peace Agreement Day']
            },
            'ethiopia': {
                name: 'Ethiopia',
                code: 'ET',
                flag: '🇪🇹',
                currency: 'ETB',
                currencySymbol: 'Br',
                currencyName: 'Ethiopian Birr',
                language: 'am',
                languages: ['am', 'en'],
                timezone: 'Africa/Addis_Ababa',
                phoneCode: '+251',
                phoneFormat: '+251 XX XXX XXXX',
                contactEmail: 'ethiopia@mpesewa.com',
                supportHours: 'Mon-Fri 8:30AM-5:30PM',
                groupsCount: 1500,
                lendersCount: 10000,
                borrowersCount: 50000,
                totalLent: 350000000,
                repaymentRate: 98.2,
                defaultRate: 1.8,
                popularGroups: ['Addis Ababa Business', 'Dire Dawa Traders', 'Bahir Dar Tourism', 'Mekelle Professionals'],
                activeLoans: 8500,
                conversionRate: 0.018,
                color: '#DA121A',
                mapCenter: [9.1450, 40.4897],
                mapZoom: 6,
                regions: ['Addis Ababa', 'Dire Dawa', 'Bahir Dar', 'Mekelle', 'Hawassa', 'Jimma'],
                emergencyContacts: ['+251 91 000 000'],
                bankingHours: '8:00 AM - 4:00 PM',
                holidays: ['Adwa Victory Day', 'Finding of True Cross']
            },
            'DRC': {
                name: 'DR Congo',
                code: 'CD',
                flag: '🇨🇩',
                currency: 'CDF',
                currencySymbol: 'FC',
                currencyName: 'Congolese Franc',
                language: 'fr',
                languages: ['fr', 'ln', 'sw'],
                timezone: 'Africa/Kinshasa',
                phoneCode: '+243',
                phoneFormat: '+243 XXX XXX XXX',
                contactEmail: 'drc@mpesewa.com',
                supportHours: 'Mon-Fri 8AM-5PM',
                groupsCount: 1100,
                lendersCount: 7000,
                borrowersCount: 35000,
                totalLent: 220000000,
                repaymentRate: 97.5,
                defaultRate: 2.5,
                popularGroups: ['Kinshasa Business', 'Lubumbashi Mining', 'Goma Cross-border', 'Kisangani River'],
                activeLoans: 6000,
                conversionRate: 0.0005,
                color: '#007FFF',
                mapCenter: [-4.0383, 21.7587],
                mapZoom: 5,
                regions: ['Kinshasa', 'Lubumbashi', 'Goma', 'Kisangani', 'Mbuji-Mayi', 'Bukavu'],
                emergencyContacts: ['+243 81 000 0000'],
                bankingHours: '7:30 AM - 3:30 PM',
                holidays: ['Independence Day', 'Heroes Day']
            },
            'nigeria': {
                name: 'Nigeria',
                code: 'NG',
                flag: '🇳🇬',
                currency: 'NGN',
                currencySymbol: '₦',
                currencyName: 'Nigerian Naira',
                language: 'en',
                languages: ['en', 'ha', 'yo', 'ig'],
                timezone: 'Africa/Lagos',
                phoneCode: '+234',
                phoneFormat: '+234 XXX XXX XXXX',
                contactEmail: 'nigeria@mpesewa.com',
                supportHours: 'Mon-Fri 8AM-6PM, Sat 9AM-2PM',
                groupsCount: 3000,
                lendersCount: 25000,
                borrowersCount: 120000,
                totalLent: 850000000,
                repaymentRate: 98.9,
                defaultRate: 1.1,
                popularGroups: ['Lagos Business', 'Abuja Government', 'Kano Traders', 'Port Harcourt Oil'],
                activeLoans: 18000,
                conversionRate: 0.0024,
                color: '#008751',
                mapCenter: [9.0820, 8.6753],
                mapZoom: 6,
                regions: ['Lagos', 'Abuja', 'Kano', 'Port Harcourt', 'Ibadan', 'Kaduna'],
                emergencyContacts: ['+234 800 000 0000'],
                bankingHours: '8:00 AM - 4:00 PM',
                holidays: ['Independence Day', 'Democracy Day']
            },
            'south-africa': {
                name: 'South Africa',
                code: 'ZA',
                flag: '🇿🇦',
                currency: 'ZAR',
                currencySymbol: 'R',
                currencyName: 'South African Rand',
                language: 'en',
                languages: ['en', 'af', 'zu', 'xh'],
                timezone: 'Africa/Johannesburg',
                phoneCode: '+27',
                phoneFormat: '+27 XX XXX XXXX',
                contactEmail: 'southafrica@mpesewa.com',
                supportHours: 'Mon-Fri 8AM-5PM',
                groupsCount: 2000,
                lendersCount: 18000,
                borrowersCount: 90000,
                totalLent: 650000000,
                repaymentRate: 99.1,
                defaultRate: 0.9,
                popularGroups: ['Johannesburg Business', 'Cape Town Tourism', 'Durban Traders', 'Pretoria Government'],
                activeLoans: 12000,
                conversionRate: 0.055,
                color: '#FFB81C',
                mapCenter: [-30.5595, 22.9375],
                mapZoom: 5,
                regions: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'],
                emergencyContacts: ['+27 11 000 0000'],
                bankingHours: '9:00 AM - 3:30 PM',
                holidays: ['Freedom Day', 'Heritage Day']
            },
            'ghana': {
                name: 'Ghana',
                code: 'GH',
                flag: '🇬🇭',
                currency: 'GHS',
                currencySymbol: '₵',
                currencyName: 'Ghanaian Cedi',
                language: 'en',
                languages: ['en', 'ak', 'ewe'],
                timezone: 'Africa/Accra',
                phoneCode: '+233',
                phoneFormat: '+233 XX XXX XXXX',
                contactEmail: 'ghana@mpesewa.com',
                supportHours: 'Mon-Fri 8AM-6PM, Sat 9AM-1PM',
                groupsCount: 1500,
                lendersCount: 12000,
                borrowersCount: 60000,
                totalLent: 380000000,
                repaymentRate: 99.3,
                defaultRate: 0.7,
                popularGroups: ['Accra Business', 'Kumasi Traders', 'Takoradi Port', 'Tamale Agriculture'],
                activeLoans: 8000,
                conversionRate: 0.084,
                color: '#CE1126',
                mapCenter: [7.9465, -1.0232],
                mapZoom: 7,
                regions: ['Accra', 'Kumasi', 'Takoradi', 'Tamale', 'Cape Coast', 'Sunyani'],
                emergencyContacts: ['+233 24 000 0000'],
                bankingHours: '8:30 AM - 4:00 PM',
                holidays: ['Independence Day', 'Republic Day']
            }
        };
    }

    loadCountryData() {
        const stored = localStorage.getItem(this.countryDataKey);
        if (stored) {
            this.countryData = JSON.parse(stored);
        } else {
            this.countryData = this.getCountryDefinitions();
            this.saveCountryData();
        }
    }

    loadUserCountry() {
        const stored = localStorage.getItem(this.userCountryKey);
        const urlParams = new URLSearchParams(window.location.search);
        const urlCountry = urlParams.get('country');
        
        if (urlCountry && this.countryData[urlCountry]) {
            this.currentCountry = urlCountry;
            this.saveUserCountry();
        } else if (stored && this.countryData[stored]) {
            this.currentCountry = stored;
        } else {
            // Try to detect from browser or IP
            this.currentCountry = this.detectCountry() || 'kenya';
            this.saveUserCountry();
        }
        
        // Update global state
        if (window.mpesewa) {
            window.mpesewa.state.currentCountry = this.currentCountry;
        }
    }

    saveUserCountry() {
        localStorage.setItem(this.userCountryKey, this.currentCountry);
    }

    saveCountryData() {
        localStorage.setItem(this.countryDataKey, JSON.stringify(this.countryData));
    }

    detectCountry() {
        // Try to detect from browser language or timezone
        const language = navigator.language.toLowerCase();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Check language hints
        if (language.includes('sw') || language.includes('tz') || language.includes('ke')) return 'kenya';
        if (language.includes('gh') || language.includes('ak') || language.includes('ewe')) return 'ghana';
        if (language.includes('ng') || language.includes('ha') || language.includes('yo')) return 'nigeria';
        if (language.includes('za') || language.includes('af') || language.includes('zu')) return 'south-africa';
        
        // Check timezone hints
        if (timezone.includes('Nairobi')) return 'kenya';
        if (timezone.includes('Accra')) return 'ghana';
        if (timezone.includes('Lagos')) return 'nigeria';
        if (timezone.includes('Johannesburg')) return 'south-africa';
        
        return null;
    }

    setupEventListeners() {
        // Country selector changes
        document.addEventListener('change', (e) => {
            if (e.target.id === 'countrySelect' || e.target.classList.contains('country-select')) {
                const country = e.target.value;
                if (country && this.countryData[country]) {
                    this.setCountry(country);
                }
            }
        });
        
        // Country card clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.country-card')) {
                const card = e.target.closest('.country-card');
                const country = card.dataset.country;
                if (country && this.countryData[country]) {
                    this.setCountry(country);
                    // Navigate to country page
                    window.location.href = `pages/countries/${country}.html`;
                }
            }
            
            if (e.target.closest('.country-flag-btn')) {
                const country = e.target.closest('.country-flag-btn').dataset.country;
                if (country && this.countryData[country]) {
                    this.setCountry(country);
                }
            }
        });
        
        // Language toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('.language-toggle')) {
                this.toggleLanguage();
            }
            
            if (e.target.closest('.language-select')) {
                const lang = e.target.closest('.language-select').dataset.lang;
                this.setLanguage(lang);
            }
        });
        
        // Currency converter
        document.addEventListener('input', (e) => {
            if (e.target.id === 'currencyAmount' || e.target.id === 'currencyFrom' || e.target.id === 'currencyTo') {
                this.updateCurrencyConversion();
            }
        });
        
        // Update on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateCountryDisplay();
            }
        });
    }

    setupCountryDetection() {
        // Check if user is trying to access wrong country
        const currentUser = window.mpesewa?.state?.currentUser;
        if (currentUser && currentUser.country && currentUser.country !== this.currentCountry) {
            console.warn(`User from ${currentUser.country} trying to access ${this.currentCountry}`);
            
            // In strict mode, redirect to correct country
            if (window.mpesewa?.state?.strictCountryMode) {
                this.showCountryWarning(currentUser.country);
            }
        }
    }

    setCountry(country) {
        if (!this.countryData[country]) {
            console.error(`Invalid country: ${country}`);
            return;
        }
        
        const oldCountry = this.currentCountry;
        this.currentCountry = country;
        this.saveUserCountry();
        
        // Update global state
        if (window.mpesewa) {
            window.mpesewa.state.currentCountry = country;
        }
        
        // Update UI
        this.updateCountryDisplay();
        
        // Fire event for other components
        const event = new CustomEvent('countryChanged', {
            detail: { 
                oldCountry, 
                newCountry: country,
                countryData: this.countryData[country]
            }
        });
        document.dispatchEvent(event);
        
        // Update URL if on country page
        this.updateCountryURL();
        
        // Log country change
        console.log(`Country changed to: ${this.countryData[country].name}`);
    }

    updateCountryDisplay() {
        // Update all country selectors
        document.querySelectorAll('#countrySelect, .country-select').forEach(select => {
            select.value = this.currentCountry;
        });
        
        // Update country flag displays
        document.querySelectorAll('.current-country-flag').forEach(flag => {
            flag.textContent = this.countryData[this.currentCountry].flag;
        });
        
        // Update country name displays
        document.querySelectorAll('.current-country-name').forEach(name => {
            name.textContent = this.countryData[this.currentCountry].name;
        });
        
        // Update currency displays
        document.querySelectorAll('.current-currency').forEach(currency => {
            currency.textContent = this.countryData[this.currentCountry].currencySymbol;
        });
        
        // Update page title if on country page
        if (window.location.pathname.includes('/countries/')) {
            document.title = `${this.countryData[this.currentCountry].name} - M-Pesewa`;
        }
        
        // Update dashboard stats
        this.updateCountryStats();
        
        // Update groups display
        this.updateGroupsByCountry();
    }

    updateCountryURL() {
        // Only update if we're on a country-specific page
        if (window.location.pathname.includes('/countries/')) {
            const newURL = `pages/countries/${this.currentCountry}.html`;
            if (window.location.pathname !== newURL) {
                window.history.replaceState(null, '', newURL);
            }
        }
    }

    updateCountryStats() {
        const country = this.countryData[this.currentCountry];
        
        // Update stats in dashboard
        const stats = {
            'countryGroups': country.groupsCount,
            'countryLenders': country.lendersCount,
            'countryBorrowers': country.borrowersCount,
            'countryTotalLent': this.formatCurrency(country.totalLent, this.currentCountry),
            'countryRepaymentRate': `${country.repaymentRate}%`,
            'countryActiveLoans': country.activeLoans,
            'countryDefaultRate': `${country.defaultRate}%`
        };
        
        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update popular groups
        const groupsContainer = document.getElementById('popularGroups');
        if (groupsContainer) {
            let html = '<div class="groups-list">';
            country.popularGroups.forEach(group => {
                html += `
                    <div class="group-item">
                        <div class="group-icon">👥</div>
                        <div class="group-info">
                            <div class="group-name">${group}</div>
                            <div class="group-stats">
                                <span>${Math.floor(Math.random() * 500) + 100} members</span>
                                <span>•</span>
                                <span>${this.formatCurrency(Math.floor(Math.random() * 5000000) + 1000000, this.currentCountry)} lent</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            groupsContainer.innerHTML = html;
        }
        
        // Update regional distribution
        this.updateRegionalDistribution();
    }

    updateRegionalDistribution() {
        const country = this.countryData[this.currentCountry];
        const container = document.getElementById('regionalDistribution');
        
        if (!container) return;
        
        let html = '<div class="regions-grid">';
        country.regions.forEach((region, index) => {
            const percentage = Math.floor((country.regions.length - index) / country.regions.length * 100);
            const amount = Math.floor(country.totalLent / country.regions.length * (percentage / 100));
            
            html += `
                <div class="region-card">
                    <div class="region-header">
                        <h4>${region}</h4>
                        <span class="region-percentage">${percentage}%</span>
                    </div>
                    <div class="region-bar">
                        <div class="region-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="region-stats">
                        <div class="stat">
                            <div class="stat-label">Total Lent</div>
                            <div class="stat-value">${this.formatCurrency(amount, this.currentCountry)}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Active Groups</div>
                            <div class="stat-value">${Math.floor(country.groupsCount / country.regions.length) + index * 10}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    updateGroupsByCountry() {
        // This would fetch groups for current country from backend
        // For now, simulate with demo data
        const groupsContainer = document.getElementById('countryGroupsList');
        if (!groupsContainer) return;
        
        const country = this.countryData[this.currentCountry];
        const groupCount = Math.min(10, country.groupsCount);
        
        let html = '<div class="table-responsive"><table class="groups-table"><thead><tr>';
        html += '<th>Group Name</th><th>Type</th><th>Members</th><th>Lenders</th><th>Total Lent</th><th>Repayment Rate</th><th>Action</th>';
        html += '</tr></thead><tbody>';
        
        for (let i = 0; i < groupCount; i++) {
            const groupTypes = ['Professional', 'Community', 'Family', 'Business', 'Religious'];
            const type = groupTypes[i % groupTypes.length];
            const members = Math.floor(Math.random() * 900) + 100;
            const lenders = Math.floor(members * 0.3);
            const totalLent = Math.floor(Math.random() * 50000000) + 1000000;
            const repaymentRate = 95 + Math.random() * 4;
            
            html += `
                <tr>
                    <td>
                        <div class="group-name">
                            <strong>${country.popularGroups[i % country.popularGroups.length]}</strong>
                            <div class="text-small">${country.regions[i % country.regions.length]}</div>
                        </div>
                    </td>
                    <td><span class="group-type-badge">${type}</span></td>
                    <td>${members.toLocaleString()}</td>
                    <td>${lenders.toLocaleString()}</td>
                    <td>${this.formatCurrency(totalLent, this.currentCountry)}</td>
                    <td>
                        <div class="repayment-rate">
                            <div class="rate-bar">
                                <div class="rate-fill" style="width: ${repaymentRate}%"></div>
                            </div>
                            <span>${repaymentRate.toFixed(1)}%</span>
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="window.location.href='pages/groups.html?country=${this.currentCountry}&group=${i}'">
                            View
                        </button>
                    </td>
                </tr>
            `;
        }
        
        html += '</tbody></table></div>';
        groupsContainer.innerHTML = html;
    }

    setupCurrencyConverter() {
        const converter = document.getElementById('currencyConverter');
        if (!converter) return;
        
        // Populate currency options
        const fromSelect = document.getElementById('currencyFrom');
        const toSelect = document.getElementById('currencyTo');
        
        if (fromSelect && toSelect) {
            // Clear existing options
            fromSelect.innerHTML = '';
            toSelect.innerHTML = '';
            
            // Add all country currencies
            Object.values(this.countryData).forEach(country => {
                const option1 = document.createElement('option');
                option1.value = country.currency;
                option1.textContent = `${country.currency} - ${country.name}`;
                option1.selected = country.code === this.countryData[this.currentCountry].code;
                
                const option2 = document.createElement('option');
                option2.value = country.currency;
                option2.textContent = `${country.currency} - ${country.name}`;
                option2.selected = country.currency === 'USD';
                
                fromSelect.appendChild(option1.cloneNode(true));
                toSelect.appendChild(option2.cloneNode(true));
            });
            
            // Add USD option
            const usdOption1 = document.createElement('option');
            usdOption1.value = 'USD';
            usdOption1.textContent = 'USD - US Dollar';
            
            const usdOption2 = document.createElement('option');
            usdOption2.value = 'USD';
            usdOption2.textContent = 'USD - US Dollar';
            usdOption2.selected = true;
            
            fromSelect.appendChild(usdOption1);
            toSelect.insertBefore(usdOption2, toSelect.firstChild);
            
            // Set initial conversion
            this.updateCurrencyConversion();
        }
    }

    updateCurrencyConversion() {
        const amountInput = document.getElementById('currencyAmount');
        const fromSelect = document.getElementById('currencyFrom');
        const toSelect = document.getElementById('currencyTo');
        const resultElement = document.getElementById('currencyResult');
        
        if (!amountInput || !fromSelect || !toSelect || !resultElement) return;
        
        const amount = parseFloat(amountInput.value) || 0;
        const fromCurrency = fromSelect.value;
        const toCurrency = toSelect.value;
        
        if (amount <= 0) {
            resultElement.textContent = 'Enter amount to convert';
            return;
        }
        
        // Simple conversion rates (in real app, fetch from API)
        const rates = this.getConversionRates();
        const fromRate = rates[fromCurrency] || 1;
        const toRate = rates[toCurrency] || 1;
        
        // Convert to USD first, then to target currency
        const usdAmount = amount / fromRate;
        const convertedAmount = usdAmount * toRate;
        
        const fromSymbol = this.getCurrencySymbol(fromCurrency);
        const toSymbol = this.getCurrencySymbol(toCurrency);
        
        resultElement.innerHTML = `
            <div class="conversion-result">
                <div class="conversion-from">
                    ${fromSymbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div class="conversion-arrow">→</div>
                <div class="conversion-to">
                    ${toSymbol} ${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div class="conversion-rate">
                    1 ${fromCurrency} = ${(toRate / fromRate).toFixed(4)} ${toCurrency}
                </div>
            </div>
        `;
    }

    getConversionRates() {
        // Simplified conversion rates (relative to USD)
        return {
            'USD': 1,
            'KES': 0.007,    // 1 KES = 0.007 USD
            'UGX': 0.00027,  // 1 UGX = 0.00027 USD
            'TZS': 0.00043,  // 1 TZS = 0.00043 USD
            'RWF': 0.001,    // 1 RWF = 0.001 USD
            'BIF': 0.0005,   // 1 BIF = 0.0005 USD
            'SOS': 0.0018,   // 1 SOS = 0.0018 USD
            'SSP': 0.007,    // 1 SSP = 0.007 USD
            'ETB': 0.018,    // 1 ETB = 0.018 USD
            'CDF': 0.0005,   // 1 CDF = 0.0005 USD
            'NGN': 0.0024,   // 1 NGN = 0.0024 USD
            'ZAR': 0.055,    // 1 ZAR = 0.055 USD
            'GHS': 0.084     // 1 GHS = 0.084 USD
        };
    }

    getCurrencySymbol(currency) {
        const symbols = {
            'USD': '$',
            'KES': 'KSh',
            'UGX': 'UGX',
            'TZS': 'TSh',
            'RWF': 'FRw',
            'BIF': 'FBu',
            'SOS': 'S',
            'SSP': '£',
            'ETB': 'Br',
            'CDF': 'FC',
            'NGN': '₦',
            'ZAR': 'R',
            'GHS': '₵'
        };
        return symbols[currency] || currency;
    }

    setupLanguageToggle() {
        const toggle = document.getElementById('languageToggle');
        if (!toggle) return;
        
        const country = this.countryData[this.currentCountry];
        const currentLang = localStorage.getItem('mpesewa-language') || country.language[0] || 'en';
        
        toggle.innerHTML = `
            <button class="language-toggle-btn">
                <span class="language-icon">🌐</span>
                <span class="language-code">${currentLang.toUpperCase()}</span>
            </button>
            <div class="language-dropdown">
                ${country.languages.map(lang => `
                    <button class="language-option ${lang === currentLang ? 'active' : ''}" data-lang="${lang}">
                        ${this.getLanguageName(lang)} (${lang.toUpperCase()})
                    </button>
                `).join('')}
            </div>
        `;
        
        // Add click event to toggle
        toggle.querySelector('.language-toggle-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggle.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            toggle.classList.remove('active');
        });
        
        // Language option clicks
        toggle.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = option.dataset.lang;
                this.setLanguage(lang);
                toggle.classList.remove('active');
            });
        });
    }

    setLanguage(lang) {
        localStorage.setItem('mpesewa-language', lang);
        
        // Update UI
        const toggle = document.getElementById('languageToggle');
        if (toggle) {
            toggle.querySelector('.language-code').textContent = lang.toUpperCase();
            toggle.querySelectorAll('.language-option').forEach(option => {
                option.classList.toggle('active', option.dataset.lang === lang);
            });
        }
        
        // In a real app, this would trigger i18n updates
        console.log(`Language changed to: ${lang}`);
        
        // Show notification
        this.showNotification(`Language set to ${this.getLanguageName(lang)}`, 'info');
    }

    toggleLanguage() {
        const currentLang = localStorage.getItem('mpesewa-language') || 'en';
        const country = this.countryData[this.currentCountry];
        const languages = country.languages || ['en'];
        const currentIndex = languages.indexOf(currentLang);
        const nextIndex = (currentIndex + 1) % languages.length;
        const nextLang = languages[nextIndex];
        
        this.setLanguage(nextLang);
    }

    getLanguageName(code) {
        const languages = {
            'en': 'English',
            'sw': 'Swahili',
            'fr': 'French',
            'rw': 'Kinyarwanda',
            'rn': 'Kirundi',
            'so': 'Somali',
            'ar': 'Arabic',
            'am': 'Amharic',
            'ha': 'Hausa',
            'yo': 'Yoruba',
            'ig': 'Igbo',
            'af': 'Afrikaans',
            'zu': 'Zulu',
            'xh': 'Xhosa',
            'ak': 'Akan',
            'ewe': 'Ewe'
        };
        return languages[code] || code.toUpperCase();
    }

    renderCountrySelector() {
        const container = document.getElementById('countrySelectorContainer');
        if (!container) return;
        
        let html = '<div class="country-selector-dropdown">';
        html += '<button class="country-selector-btn">';
        html += `<span class="country-flag">${this.countryData[this.currentCountry].flag}</span>`;
        html += `<span class="country-name">${this.countryData[this.currentCountry].name}</span>`;
        html += '<span class="dropdown-arrow">▼</span>';
        html += '</button>';
        html += '<div class="country-dropdown-menu">';
        
        Object.entries(this.countryData).forEach(([code, country]) => {
            html += `
                <button class="country-option ${code === this.currentCountry ? 'active' : ''}" data-country="${code}">
                    <span class="country-flag">${country.flag}</span>
                    <span class="country-info">
                        <span class="country-name">${country.name}</span>
                        <span class="country-details">${country.currency} • ${country.languages[0].toUpperCase()}</span>
                    </span>
                </button>
            `;
        });
        
        html += '</div></div>';
        container.innerHTML = html;
        
        // Add event listeners
        const btn = container.querySelector('.country-selector-btn');
        const menu = container.querySelector('.country-dropdown-menu');
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
        });
        
        container.querySelectorAll('.country-option').forEach(option => {
            option.addEventListener('click', () => {
                const country = option.dataset.country;
                this.setCountry(country);
                menu.classList.remove('show');
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            menu.classList.remove('show');
        });
    }

    renderCountryDashboard() {
        const container = document.getElementById('countryDashboard');
        if (!container) return;
        
        const country = this.countryData[this.currentCountry];
        
        let html = `
            <div class="country-header">
                <div class="country-title">
                    <h1><span class="country-flag-large">${country.flag}</span> ${country.name} Dashboard</h1>
                    <p class="country-subtitle">Emergency micro-lending in ${country.name} - ${country.currencyName} (${country.currency})</p>
                </div>
                <div class="country-actions">
                    <button class="btn btn-outline" onclick="window.location.href='pages/contact.html?country=${this.currentCountry}'">
                        Contact ${country.name} Support
                    </button>
                    <button class="btn btn-primary" onclick="window.location.href='pages/groups.html?country=${this.currentCountry}'">
                        View Groups in ${country.name}
                    </button>
                </div>
            </div>
            
            <div class="country-stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <div class="stat-value">${country.groupsCount.toLocaleString()}</div>
                        <div class="stat-label">Active Groups</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <div class="stat-value">${this.formatCurrency(country.totalLent, this.currentCountry)}</div>
                        <div class="stat-label">Total Amount Lent</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📈</div>
                    <div class="stat-content">
                        <div class="stat-value">${country.repaymentRate}%</div>
                        <div class="stat-label">Repayment Rate</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">👨‍💼</div>
                    <div class="stat-content">
                        <div class="stat-value">${country.lendersCount.toLocaleString()}</div>
                        <div class="stat-label">Active Lenders</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">👤</div>
                    <div class="stat-content">
                        <div class="stat-value">${country.borrowersCount.toLocaleString()}</div>
                        <div class="stat-label">Registered Borrowers</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">⏱️</div>
                    <div class="stat-content">
                        <div class="stat-value">${country.activeLoans.toLocaleString()}</div>
                        <div class="stat-label">Active Loans</div>
                    </div>
                </div>
            </div>
            
            <div class="country-details-grid">
                <div class="detail-card">
                    <h3>Country Information</h3>
                    <div class="detail-list">
                        <div class="detail-item">
                            <span class="detail-label">Currency:</span>
                            <span class="detail-value">${country.currency} (${country.currencySymbol})</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Language(s):</span>
                            <span class="detail-value">${country.languages.map(l => this.getLanguageName(l)).join(', ')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Timezone:</span>
                            <span class="detail-value">${country.timezone}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Phone Code:</span>
                            <span class="detail-value">${country.phoneCode}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Support Hours:</span>
                            <span class="detail-value">${country.supportHours}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Contact Email:</span>
                            <span class="detail-value">${country.contactEmail}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-card">
                    <h3>Popular Regions</h3>
                    <div class="regions-list">
                        ${country.regions.map(region => `
                            <div class="region-item">
                                <span class="region-name">${region}</span>
                                <span class="region-stats">
                                    <span>${Math.floor(country.groupsCount / country.regions.length)} groups</span>
                                    <span>•</span>
                                    <span>${this.formatCurrency(Math.floor(country.totalLent / country.regions.length), this.currentCountry)} lent</span>
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="detail-card">
                    <h3>Currency Converter</h3>
                    <div class="currency-converter">
                        <div class="converter-inputs">
                            <input type="number" id="currencyAmount" class="form-control" placeholder="Amount" value="1000" min="0" step="0.01">
                            <select id="currencyFrom" class="form-control"></select>
                            <span class="converter-arrow">→</span>
                            <select id="currencyTo" class="form-control"></select>
                        </div>
                        <div id="currencyResult" class="converter-result"></div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Setup currency converter
        this.setupCurrencyConverter();
    }

    formatCurrency(amount, countryCode) {
        const country = this.countryData[countryCode];
        if (!country) return `₵ ${amount.toLocaleString()}`;
        
        return `${country.currencySymbol} ${amount.toLocaleString()}`;
    }

    showCountryWarning(correctCountry) {
        const correctCountryData = this.countryData[correctCountry];
        const currentCountryData = this.countryData[this.currentCountry];
        
        const warning = document.createElement('div');
        warning.className = 'country-warning-modal';
        warning.innerHTML = `
            <div class="warning-content">
                <div class="warning-icon">🚫</div>
                <h3>Country Restriction</h3>
                <p>Your account is registered in <strong>${correctCountryData.name}</strong> ${correctCountryData.flag}</p>
                <p>You cannot access groups or lend/borrow in <strong>${currentCountryData.name}</strong> ${currentCountryData.flag}</p>
                <p>M-Pesewa enforces strict country isolation to maintain trust within communities.</p>
                <div class="warning-actions">
                    <button class="btn btn-outline" id="stayInCountry">
                        Stay in ${currentCountryData.name} (View Only)
                    </button>
                    <button class="btn btn-primary" id="switchToCountry">
                        Switch to ${correctCountryData.name}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        document.getElementById('stayInCountry').addEventListener('click', () => {
            document.body.removeChild(warning);
            // Set view-only mode
            if (window.mpesewa) {
                window.mpesewa.state.viewOnlyMode = true;
            }
        });
        
        document.getElementById('switchToCountry').addEventListener('click', () => {
            document.body.removeChild(warning);
            this.setCountry(correctCountry);
            window.location.href = `pages/countries/${correctCountry}.html`;
        });
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

    // Public API for other modules
    getCurrentCountry() {
        return this.currentCountry;
    }

    getCountryData(countryCode = null) {
        return countryCode ? this.countryData[countryCode] : this.countryData[this.currentCountry];
    }

    getAllCountries() {
        return Object.values(this.countryData);
    }

    validateCountryAccess(userCountry, targetCountry) {
        if (!userCountry || !targetCountry) return false;
        return userCountry === targetCountry;
    }

    getCountryFromGroup(groupId) {
        // In real app, fetch from backend
        // For demo, extract from group ID or return current country
        return this.currentCountry;
    }
}

// Initialize country system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.countrySystem = new CountrySystem();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CountrySystem;
}