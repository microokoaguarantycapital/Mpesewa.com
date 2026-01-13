# M-Pesewa - Emergency Micro-Lending Platform

![M-Pesewa Logo](assets/images/logo.svg)

**M-Pesewa** is a revolutionary Progressive Web App (PWA) that enables emergency micro-lending within trusted social circles across Africa. Built on strict hierarchical isolation and social trust principles.

## 🌍 Live Demo

[View Live Demo on GitHub Pages](https://yourusername.github.io/m-pesewa)

*Note: Replace with your GitHub Pages URL*

## 📱 Features

### Core Platform Architecture
- **Strict Hierarchy**: Global → Country → Group → Lender → Borrower/Ledger
- **13 African Countries**: Kenya, Uganda, Tanzania, Rwanda, Burundi, Somalia, South Sudan, Ethiopia, DRC, Nigeria, South Africa, Ghana
- **16 Emergency Loan Categories**: Specific consumption needs (Transport, Data, Food, Medicine, etc.)
- **Trust-Based System**: Referral-only group membership with guarantor requirements

### User Roles & Permissions
- **Borrowers**: No subscription fees, up to 4 groups, 2 guarantors required
- **Lenders**: Tiered subscriptions (Basic, Premium, Super, Lender of Lenders)
- **Dual Roles**: Users can be both borrowers and lenders (separate registrations)
- **Platform Admin**: System-level controls and moderation

### Technical Features
- **Progressive Web App (PWA)**: Installable, offline-capable, push notifications
- **Mobile-First Design**: Fully responsive across all devices
- **GitHub Pages Ready**: Static hosting with no backend required
- **Complete Mock Data System**: Demo data for testing all features

## 🏗️ Project Structure
/
├── index.html # Main landing page
├── manifest.json # PWA manifest
├── service-worker.js # PWA service worker
├── README.md # This documentation
├── .nojekyll # Disable Jekyll processing
├── assets/
│ ├── css/ # All stylesheets
│ │ ├── main.css
│ │ ├── components.css
│ │ ├── animations.css
│ │ ├── dashboard.css
│ │ ├── forms.css
│ │ └── tables.css
│ ├── js/ # All JavaScript files
│ │ ├── app.js
│ │ ├── auth.js
│ │ ├── calculator.js
│ │ ├── pwa.js
│ │ ├── utils.js
│ │ └── [14 more .js files]
│ └── images/ # Image assets
│ ├── logo.svg
│ ├── icons/
│ ├── flags/
│ └── categories/
├── pages/ # All HTML pages
│ ├── dashboard/
│ │ ├── borrower-dashboard.html
│ │ ├── lender-dashboard.html
│ │ └── admin-dashboard.html
│ ├── countries/
│ │ ├── index.html
│ │ ├── kenya.html
│ │ ├── uganda.html
│ │ └── [10 more countries]
│ ├── lending.html
│ ├── borrowing.html
│ ├── ledger.html
│ ├── groups.html
│ ├── subscriptions.html
│ ├── blacklist.html
│ ├── debt-collectors.html
│ ├── about.html
│ ├── qa.html
│ └── contact.html
└── data/ # Mock data files
├── countries.json
├── subscriptions.json
├── categories.json
├── collectors.json
├── demo-groups.json
├── demo-users.json
└── demo-ledgers.json

text

## 🚀 Quick Start

### Option 1: GitHub Pages (Recommended)

1. **Fork this repository** to your GitHub account
2. **Enable GitHub Pages** in repository settings:
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: main (or master) → / (root)
   - Click Save
3. **Your site will be live at**: `https://yourusername.github.io/m-pesewa`

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
Colors (Strictly Enforced)
Category	Color	Hex	Usage
Core	Deep Purple	#512DA8	Primary CTAs, links, headers
Core	Primary Purple	#7B1FA2	Secondary actions, highlights
Core	Soft Purple	#F3E5F5	Section backgrounds, cards
Growth	Green	#388E3C	Success states, approved loans
Growth	Light Green	#4CAF50	Positive indicators
Growth	Soft Green	#E8F5E9	Success backgrounds
Human	Orange Accent	#F57C00	Warnings, important notices
Human	Light Orange	#FFF3E0	Warning backgrounds
Alerts	Red	#D32F2F	Errors, critical alerts
Alerts	Soft Red	#FFEBEE	Error backgrounds
Neutral	Black	#000000	Text only
Neutral	Dark Gray	#424242	Secondary text
Neutral	Medium Gray	#757575	Disabled states
Neutral	Light Gray	#E0E4E8	Borders, dividers
Neutral	Off White	#F7FAFC	Backgrounds
Neutral	White	#FFFFFF	Cards, modals
Typography
Primary Font: Inter (system font stack)

Secondary Font: Montserrat for headings

Responsive scaling: 14px mobile → 16px desktop

Line height: 1.5 for body, 1.3 for headings

📋 Business Rules (Enforced in Frontend)
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

Success stories

Country selector

Registration forms

2. Country Pages (pages/countries/)
Country-specific dashboard

Local unlimited groups listing

Currency converter

Loan calculator

Language toggle (EN/FR)

Country contact form

Platform statistics

3. Dashboard Pages (pages/dashboard/)
Borrower Dashboard: Active loans, repayment schedule, rating

Lender Dashboard: Create loan offers, manage borrowers, ledgers

Admin Dashboard: System controls (hidden from normal users)

4. Functional Pages
Groups: Create/join groups, manage members

Lending: Lender interface, loan approvals

Borrowing: Borrower interface, loan requests

Ledger: Track all loans, update repayments

Blacklist: View defaulters, manage blacklist status

Debt Collectors: 200+ verified collectors directory

📊 Mock Data System
The platform includes complete mock data for testing:

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