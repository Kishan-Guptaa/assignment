# MedChem B2B E-Commerce Platform

A comprehensive, full-stack B2B wholesale platform engineered for chemical distributors, sellers, and corporate buyers. Built with modern web technologies, this platform features a unique "hand-drawn / notebook" aesthetic, complete role-based dashboards, and a robust PostgreSQL database architecture.

---

## 🎨 The Vision & Aesthetic
MedChem breaks away from the sterile, corporate look of traditional B2B platforms. The UI is designed to feel tactile, dynamic, and engaging:
- **Notebook & Chalkboard Themes:** Light mode mimics warm, grid-lined notebook paper, while dark mode transitions into a rich charcoal chalkboard.
- **Scribble UI:** Custom CSS border-radius manipulation is used to create "hand-drawn" scribble borders around buttons, inputs, and cards.
- **Micro-Animations:** Fluid hover states, dynamic box-shadows, and smooth layout transitions encourage interaction and make the platform feel alive.

---

## 🏗️ System Architecture & Tech Stack

The application is built on a modern serverless architecture utilizing Next.js 15.1 and React 19.

- **Framework:** [Next.js 15.1](https://nextjs.org/) (App Router, Turbopack)
- **Data Fetching & Mutations:** Next.js Server Actions (Zero-API architecture)
- **Frontend & Styling:** React 19, Tailwind CSS, Lucide React (Icons), Recharts (Analytics)
- **Database:** PostgreSQL hosted on [Neon](https://neon.tech/) for serverless scalability.
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) for strict, type-safe database querying.
- **Authentication:** Custom JWT & HTTP-Only Cookie Session management using `bcryptjs`.
- **Language:** Strictly typed TypeScript across the entire stack.

---

## 🗄️ Database Schema Deep Dive

The platform relies on a highly relational PostgreSQL database designed to handle complex B2B interactions.

### 1. `users` Table
Handles all authentication and role-based access.
- **Roles:** `admin`, `seller`, `customer`
- **Verification:** Sellers have a `verificationStatus` (`pending`, `approved`, `rejected`) and must provide a `companyName`, `gstNumber`, and `licenseUrl`.

### 2. `products` Table
The central catalog of chemical compounds.
- **Details:** Name, description, CAS Number, formula, purity percentage, and price per kg.
- **Inventory:** Tracks exact stock quantities (`stockQuantity`).
- **Relations:** Tied to the `seller_id` who listed it.

### 3. `orders` & `order_items` Tables
Handles direct purchasing and checkout workflows.
- **Order States:** `pending`, `processing`, `shipped`, `delivered`, `cancelled`.
- **Items:** Links multiple products to a single order, locking in the price at the time of purchase.

### 4. `quotations` Table
B2B transactions often require negotiation. The quotation table allows buyers to request custom pricing for bulk orders.
- **States:** `pending`, `approved`, `rejected`.
- **Workflow:** A customer requests a bulk quantity -> Seller/Admin reviews and sets an offered price -> Customer accepts and converts it to a standard order.

---

## 🔄 Comprehensive User Flows

### 🛡️ 1. The Admin Portal (`/admin`)
The god-view of the platform.
- **Dashboard:** High-level metrics showing total revenue, active sellers, and pending quotations.
- **Seller Verification:** Admins review incoming seller registrations. They examine the uploaded Business Licenses and GST numbers, and explicitly click **Approve** to grant the seller platform access.
- **Global Management:** Full CRUD access to all users, products, and global platform settings.

### 🧪 2. The Seller Portal (`/seller`)
The distributor's command center.
- **Security Check:** Unverified sellers hit a strict "Clearance Required" lock screen until an Admin approves their account.
- **Analytics Console:** A Recharts-powered dashboard visualizes live sales trends, top-selling chemicals, and warehouse stock levels.
- **Inventory Management:** Sellers can add new chemical compounds to the global catalog, adjust stock levels, and update pricing based on market fluctuations.
- **Order Fulfillment:** Sellers view incoming orders for their specific products and update fulfillment statuses (`Processing` -> `Shipped`).

### 🏪 3. The Customer Portal (`/customer`)
The buyer's storefront.
- **Catalog Browsing:** Browse the global inventory of chemical compounds, filtering by CAS number, purity, or seller.
- **Direct Checkout:** Add items to the cart and execute a direct purchase using standard pricing.
- **Bulk Quotations:** For massive orders, customers use the "Request Quotation" flow to negotiate wholesale discounts directly with the distributors.

---

## 🔒 Security & Authentication Mechanics

- **No Third-Party Auth:** The platform uses a completely custom, self-hosted authentication system.
- **Password Security:** All passwords are mathematically salted and hashed using `bcryptjs` before entering the database. Plain text passwords are never stored.
- **Session Management:** Upon login, a cryptographically signed JWT is generated and stored in a strict, HTTP-Only, Secure cookie. This prevents XSS attacks from stealing user sessions.
- **Server Actions:** By utilizing Next.js Server Actions, database queries are executed entirely on the server. The client browser never sees the SQL queries, preventing SQL injection and protecting the database schema.

---

## 📂 Directory Structure

```text
├── src/
│   ├── app/                 # Next.js App Router Pages
│   │   ├── admin/           # Admin Dashboard & Sub-routes
│   │   ├── customer/        # Buyer Storefront & Cart
│   │   ├── seller/          # Distributor Analytics & Inventory
│   │   ├── login/           # Authentication UI
│   │   ├── profile/         # User Settings & License Uploads
│   │   └── globals.css      # Core Tailwind & Custom Scribble CSS
│   ├── components/          # Reusable React UI Components
│   │   ├── Header.tsx       # Global Navigation
│   │   ├── Sidebar.tsx      # Dashboard Routing
│   │   └── ChemicalCanvas.tsx # Animated Background Elements
│   └── lib/                 # Core Business Logic & Backend
│       ├── actions/         # Next.js Server Actions (Mutations)
│       ├── db/              # Database Config, Schema, & Seeding
│       ├── store/           # Zustand Global State Management
│       └── utils/           # Helper Functions (Currency, Export)
```

---

## 🛠️ Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/Kishan-Guptaa/assignment.git
cd assignment
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env.local` file in the root of the project and add your Neon PostgreSQL connection string:
```env
DATABASE_URL="postgresql://[user]:[password]@[neon_hostname]/[dbname]?sslmode=require"
```

### 4. Push Database Schema
Sync the Drizzle schema to your Neon database without losing data:
```bash
npx drizzle-kit push
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment

This project is optimized for deployment on **[Vercel](https://vercel.com/)**. 

1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add the `DATABASE_URL` to Vercel's Environment Variables settings.
4. Click Deploy.

---
*Designed and built with ❤️ using Next.js 15.1 and Neon PostgreSQL.*
