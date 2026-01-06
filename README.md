# M-Pesewa - Emergency Micro-Lending Platform

![M-Pesewa Logo](assets/images/logo.svg)

**Emergency Micro-Lending in Trusted Circles** - A Progressive Web App (PWA) that enables peer-to-peer emergency micro-lending within trusted social groups across Africa.

## 🌍 Live Demo
[View Live Demo](https://yourusername.github.io/m-pesewa)  
*Note: Replace with your GitHub Pages URL*

## 📱 Features

### Core Platform
- **Country → Group → Lender → Borrower Hierarchy** - Strict hierarchical isolation
- **13 African Countries** - Kenya, Uganda, Tanzania, Rwanda, Burundi, Somalia, South Sudan, Ethiopia, DRC, Nigeria, South Africa, Ghana
- **16 Emergency Loan Categories** - Specific consumption needs (Transport, Data, Food, Medicine, etc.)
- **Trust-Based System** - Referral-only group membership with guarantor requirements

### User Roles
- **Borrowers** - No subscription fees, up to 4 groups, 2 guarantors required
- **Lenders** - Tiered subscriptions (Basic, Premium, Super, Lender of Lenders)
- **Dual Roles** - Users can be both borrowers and lenders (separate registrations)
- **Admins** - Platform and group moderation capabilities

### Technical Features
- **Progressive Web App (PWA)** - Installable, offline-capable, push notifications
- **Mobile-First Design** - Fully responsive across all devices
- **GitHub Pages Ready** - Static hosting with no backend required
- **Mock Data System** - Complete demo data for testing

## 🏗️ Project Structure
/
├── index.html # Main landing page
├── manifest.json # PWA manifest
├── service-worker.js # PWA service worker
├── README.md # This file
├── .nojekyll # Disable Jekyll processing
│
├── assets/
│ ├── css/
│ │ ├── main.css # Global styles & typography
│ │ ├── components.css # Cards, buttons, modals
│ │ ├── dashboard.css # Dashboard-specific styles
│ │ ├── forms.css # Form styling
│ │ ├── tables.css # Table styling
│ │ └── animations.css # Animations & transitions
│ │
│ ├── js/
│ │ ├── app.js # App bootstrap & routing
│ │ ├── auth.js # Authentication logic (UI only)
│ │ ├── roles.js # Role management
│ │ ├── groups.js # Group creation & management
│ │ ├── lending.js # Lending functionality
│ │ ├── borrowing.js # Borrowing functionality
│ │ ├── ledger.js # Ledger management
│ │ ├── blacklist.js # Blacklist system
│ │ ├── subscriptions.js # Subscription management
│ │ ├── countries.js # Country isolation logic
│ │ ├── collectors.js # Debt collectors listing
│ │ ├── calculator.js # Loan calculator
│ │ ├── pwa.js # PWA installation & offline
│ │ └── utils.js # Utilities & helpers
│ │
│ └── images/ # All image assets
│ ├── logo.svg
│ ├── icons/ # PWA icons
│ ├── flags/ # Country flags
│ └── categories/ # Category icons
│
├── pages/
│ ├── dashboard/
│ │ ├── borrower-dashboard.html
│ │ ├── lender-dashboard.html
│ │ └── admin-dashboard.html
│ │
│ ├── lending.html # Lending page
│ ├── borrowing.html # Borrowing page
│ ├── ledger.html # Ledger management
│ ├── groups.html # Groups directory
│ ├── subscriptions.html # Subscription plans
│ ├── blacklist.html # Blacklisted users
│ ├── debt-collectors.html # Debt collectors directory
│ ├── about.html # About page
│ ├── qa.html # Q&A page
│ ├── contact.html # Contact page
│ │
│ └── countries/ # Country-specific pages
│ ├── index.html # Countries overview
│ ├── kenya.html # Kenya dashboard
│ ├── uganda.html # Uganda dashboard
│ └── ... (11 more countries)
│
└── data/ # Mock data files
├── countries.json # Country configurations
├── subscriptions.json # Subscription tiers
├── categories.json # Loan categories
├── collectors.json # 200 debt collectors
├── demo-groups.json # Sample groups
├── demo-users.json # Sample users
└── demo-ledgers.json # Sample ledgers


## 🚀 Quick Start

### Option 1: GitHub Pages (Recommended)
1. **Fork this repository** to your GitHub account
2. **Enable GitHub Pages** in repository settings
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: main (or master) → / (root)
   - Click Save
3. **Your site will be live at:** `https://yourusername.github.io/m-pesewa`

### Option 2: Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/m-pesewa.git
cd m-pesewa

# Serve locally (Python 3)
python3 -m http.server 8000

# Or with Node.js
npx serve .

# Open in browser
open http://localhost:8000

Option 3: Deploy to Netlify/Vercel
Drag & drop the entire folder to Netlify/Vercel

Or connect repository for continuous deployment

No build process needed - it's static HTML/CSS/JS

🎨 Design System
Colors
Primary Blue: #0A65FC - Trust & stability

Deep Navy: #061257 - Professionalism

Growth Green: #20BF6F - Success & growth

Warm Orange: #FF9F1C - Human warmth

Alert Red: #FF4401 - Warnings & errors

Typography
Primary Font: Inter (system font stack)

Secondary Font: SF Pro Display (Apple system)

Responsive scaling: 14px mobile → 16px desktop

📋 Business Rules
Strict Hierarchy Enforcement
Country Isolation: No cross-country lending/borrowing

Group Isolation: Lenders only lend within their group

Borrower Limits: Max 4 groups (good rating required)

Subscription Enforcement: Expires 28th of each month

Subscription Tiers
Tier	Max/Week	Monthly	Bi-Annual	Annual	CRB
Basic	₵1,500	₵50	₵250	₵500	No
Premium	₵5,000	₵250	₵1,500	₵2,500	No
Super	₵20,000	₵1,000	₵5,000	₵8,500	Yes
Lender of Lenders	₵50,000	₵500	₵3,500	₵6,500	Yes
Loan Terms
Repayment Period: 7 days maximum

Interest: 10% per week (fixed)

Partial Payments: Daily repayments allowed

Penalty: 5% daily after 7 days

Default: After 2 months of non-payment

Group Rules
Minimum Members: 5

Maximum Members: 1,000

Entry: Invitation or referral only

Country-locked: Cannot invite non-citizens

Admin/Founder: One per group, moderates members

🔧 PWA Features
Installation
Add to Home Screen on mobile devices

Desktop installation on Chrome/Edge

Standalone mode (no browser UI)

Offline Capabilities
Service Worker caches all assets

Offline forms with background sync

Cached data for browsing offline

Performance
Lazy loading of images and content

Minified assets (in production)

Fast First Paint (< 1 second)

📱 Pages Overview
1. Home Page (index.html)
Hero section with platform overview

16 emergency category cards

Borrower & lender registration forms

Loan calculator

Success stories

Country selector

2. Country Pages (pages/countries/)
Country-specific dashboard

Local groups listing

Currency converter

Language toggle (EN/FR)

Country contact form

3. Dashboard Pages (pages/dashboard/)
Borrower Dashboard: Active loans, repayment schedule, rating

Lender Dashboard: Ledgers, borrowers, subscription status, analytics

Admin Dashboard: Platform moderation, blacklist management, reports

4. Functional Pages
Lending: Create loan offers, manage borrowers

Borrowing: Request loans, view offers, repay

Ledger: Track all loans, update repayments

Groups: Create/join groups, manage members

Blacklist: View defaulters, manage blacklist status

Debt Collectors: 200+ verified collectors directory

📊 Mock Data
The platform includes complete mock data:

data/countries.json
13 African countries with currencies, languages, contact info

Country-specific configurations

data/subscriptions.json
All 4 subscription tiers with pricing and limits

CRB requirements for each tier

data/categories.json
16 emergency loan categories with icons and descriptions

data/collectors.json
200+ debt collectors with contact details

Organized by country and specialization

data/demo-*.json
Sample groups, users, and ledgers

Realistic data for testing all features

🛠️ Development
Adding New Features
Create HTML file in pages/ directory

Add CSS to appropriate CSS file

Add JavaScript to appropriate JS file

Update navigation in header/footer

Test offline functionality

Customizing for Your Country
Update data/countries.json with your country details

Modify currency in calculator and forms

Update contact information in footer

Add country flag to assets/images/flags/
🔒 Security Notes
Frontend-Only Implementation
No real authentication - UI simulation only

No real payments - Mock payment flow

No sensitive data - All data is mock/demo

No backend API calls - All data from JSON files

For Production Use
Implement backend authentication (Firebase, Auth0, etc.)

Add real payment processing (Stripe, Flutterwave, etc.)

Implement database (Firestore, PostgreSQL, etc.)

Add SSL/TLS encryption

Implement rate limiting

Add audit logging

Professional Support
For enterprise implementations or custom development, contact:

Email: support@mpesewa.com

Website: https://mpesewa.com

Business Hours: 9AM-5PM EAT (UTC+3)

🙏 Acknowledgments
Built With
HTML5 - Semantic markup

CSS3 - Modern styling with CSS Grid & Flexbox

Vanilla JavaScript - No frameworks for maximum performance

PWA Standards - Service Workers, Web App Manifest

Inspiration
African Microfinance - Community-based lending circles

Trust Economics - Social capital as financial infrastructure

Financial Inclusion - Banking the unbanked through technology

Contributors
M-Pesewa Team - Platform concept and business logic

Open Source Community - Tools and libraries

Early Testers - Feedback and validation

🚨 Disclaimer
Legal Notice
This is a frontend demonstration only. For production use:

Consult lawyers for financial regulations in your country

Implement proper KYC/AML procedures

Get necessary licenses for lending operations

Comply with data protection laws (GDPR, etc.)

Financial Disclaimer
Not financial advice - Consult professionals

No guarantee of returns or loan recovery

Risk of default exists in all lending

Platform fee only from lender subscriptions

<div align="center"> <strong>M-Pesewa</strong> - Emergency Micro-Lending in Trusted Circles<br> <sub>Building trust-based financial ecosystems across Africa</sub> </div> ```