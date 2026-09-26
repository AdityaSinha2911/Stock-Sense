# 📦 StockSense — Modular Inventory Management System (IMS)

[![Node.js Version](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.21+-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![EJS Engine](https://img.shields.io/badge/View_Engine-EJS-b4ca65?style=for-the-badge&logo=ejs&logoColor=white)](https://ejs.co/)
[![Bootstrap 5](https://img.shields.io/badge/UI_Framework-Bootstrap_5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](LICENSE)

> **StockSense** is an enterprise-grade, modular Inventory Management System (IMS) inspired by ERP workflows (such as Odoo). It digitizes, automates, and connects every stage of the inventory lifecycle—from vendor procurement and receiving, through internal warehouse relocations and physical cycle counts, to customer dispatch and real-time financial stock valuation.

---

## 📑 Table of Contents
- [Project Overview](#-project-overview)
- [System Architecture & Lifecycle](#-system-architecture--lifecycle)
- [Core Modules & Features](#-core-modules--features)
  - [1. Warehouse Analytics & Operations Dashboard](#1-warehouse-analytics--operations-dashboard)
  - [2. Inventory Master & Product Catalog](#2-inventory-master--product-catalog)
  - [3. Inbound Shipments & Receipts (WH/IN)](#3-inbound-shipments--receipts-whin)
  - [4. Outbound Delivery Orders (WH/OUT)](#4-outbound-delivery-orders-whout)
  - [5. Internal Stock Transfers (WH/INT)](#5-internal-stock-transfers-whint)
  - [6. Inventory Adjustments & Stock Takes (INV/ADJ)](#6-inventory-adjustments--stock-takes-invadj)
  - [7. Stock Ledger & Audit Trail](#7-stock-ledger--audit-trail)
  - [8. Security & Authentication](#8-security--authentication)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
- [API & Route Reference](#-api--route-reference)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Development Roadmap](#-development-roadmap)
- [Contributing](#-contributing)

---

## 🎯 Project Overview

Traditional inventory management often relies on fragmented spreadsheets, disconnected communication, and manual count reconciliations that lead to stockouts, inventory shrinkage, and inaccurate book valuations. 

**StockSense** solves this by establishing a single source of truth across all warehouse operations:
- **Traceability**: Every physical unit entering or leaving the warehouse is tagged to a verified document reference (`WH/IN`, `WH/OUT`, `WH/INT`, `INV/ADJ`).
- **Real-Time Valuation**: Continuous double-entry inventory tracking ensures unit costs and total book values reflect live physical balances.
- **Operational Efficiency**: Streamlined workflows for receiving clerks, warehouse pickers, forklift operators, and inventory auditors.

---

## 🔄 System Architecture & Lifecycle

The inventory lifecycle in StockSense follows standard industrial supply-chain operations:

```
 [ Suppliers / Vendors ]
            │
            ▼ (Purchase Orders)
 ┌─────────────────────────────────────────────────────────────┐
 │  1. Inbound Receipts (WH/IN)                                │
 │     - Goods inspection, staging bay allocation & validation │
 └──────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  2. Central Storage & Internal Transfers (WH/INT)           │
 │     - Relocation between zones, racks, shelves & bins       │
 └──────────────┬───────────────────────────────┬──────────────┘
                │                               │
                ▼                               ▼
 ┌──────────────────────────────┐ ┌────────────────────────────┐
 │ 3. Cycle Counts & Adjustments│ │ 4. Outbound Deliveries     │
 │    (INV/ADJ)                 │ │    (WH/OUT)                │
 │    - Damaged, loss & shrinkage│ │    - Sales order picking,  │
 │    - Variance reconciliation │ │      packing, and carrier  │
 └──────────────┬───────────────┘ │      shipping              │
                │                 └─────────────┬──────────────┘
                │                               │
                └───────────────┬───────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │  5. Stock Ledger & Financial Valuation                      │
 │     - Immutable audit trail, running balances & unit costs  │
 └─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Core Modules & Features

### 1. Warehouse Analytics & Operations Dashboard
- **Route**: `/dashboard`
- **Real-time KPI Metrics**: Total Inventory Valuation, Active SKU Count, Inbound Shipments Awaiting Receipt, and Outbound Deliveries Ready for Dispatch.
- **Odoo-Style Operations Pipeline**: Visual status counters for Receipts, Deliveries, Internal Transfers, and Pending Cycle Count Adjustments.
- **Interactive Charts (Chart.js)**:
  - *Monthly Movement Trends*: Compares inbound volume vs. outbound dispatch units over time.
  - *Valuation by Category*: Donut distribution of capital across Raw Materials, Finished Goods, and Packaging.
- **Safety Stock Warning Center**: High-priority alert table identifying items below minimum thresholds with direct reorder actions.

### 2. Inventory Master & Product Catalog
- **Route**: `/products`
- **Product Master Records**: Manages product names, internal SKUs, international barcodes (EAN/UPC), and Units of Measure (`pcs`, `kg`, `units`, `box`, `m`).
- **Dual Pricing**: Tracks both Cost Price (for valuation) and Sales Price (for billing).
- **Stock Status Pills**: Dynamic color-coded indicators for `In Stock`, `Low Stock`, and `Out of Stock`.
- **Search & Filtering**: Multi-criteria client-side search by keyword, category, and stock health status.
- **Modals**: Full modals for adding new products and performing instant on-the-fly stock corrections.

### 3. Inbound Shipments & Receipts (WH/IN)
- **Route**: `/receipts`
- **Procurement Fulfillment**: Logs purchase orders arriving from registered suppliers.
- **Operational States**: `Draft` &rarr; `Waiting for Vendor` &rarr; `Ready to Receive` &rarr; `Done`.
- **Receiving Validation**: Verifies incoming quantities against purchase order specifications.
- **Documentation**: One-click generation and printing of Goods Receipt Slips.

### 4. Outbound Delivery Orders (WH/OUT)
- **Route**: `/deliveries`
- **Sales Fulfillment**: Manages outgoing customer delivery orders and packing slips.
- **Logistics & Carrier Integration**: Stores carrier details (FedEx, UPS, DHL, Company Fleet) and tracking waybill IDs.
- **Reservation Checks**: Confirms available inventory before items are marked for packing.

### 5. Internal Stock Transfers (WH/INT)
- **Route**: `/transfers`
- **Inter-Location Movement**: Tracks stock relocation across warehouse buildings, zones, aisles, and storage bins.
- **Operator Assignment**: Assigns tasks to specific floor staff or forklift operators with scheduled timestamps.
- **Live Transfer Status**: Tracks items `Scheduled`, `In Transit`, or `Completed`.

### 6. Inventory Adjustments & Stock Takes (INV/ADJ)
- **Route**: `/adjustments`
- **Cycle Count Audits**: Reconciles physical count discrepancies against recorded book stock.
- **Automated Discrepancy Engine**: Live calculation of quantity variance (`+` / `-`) and associated financial impact.
- **Categorized Reasons**: Segregates variances by Cycle Count Discrepancy, Damaged Goods, Shrinkage/Theft, Expiry, or Unrecorded Returns.
- **Manager Approval Workflow**: Prevents unauthorized inventory manipulation through formal audit status stages (`Pending Review` &rarr; `Applied`).

### 7. Stock Ledger & Audit Trail
- **Route**: `/ledger`
- **Complete Audit Trail**: Chronological, immutable record of every single inventory movement in the system.
- **Double-Entry Visibility**: Logs exact Source & Destination coordinates for every move.
- **Running Balance Ledger**: Real-time recalculation of remaining physical units and financial value after every transaction.
- **Data Export**: Built-in support for CSV and spreadsheet statement exports.

### 8. Security & Authentication
- **Route**: `/login`
- **Enterprise Design**: Clean, branded authentication interface matching the `#157347` forest-green identity.
- **Feedback Alerts**: Support for dynamic error and success messages via EJS.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Server / Runtime** | [Node.js](https://nodejs.org/) (v18+) | Server-side execution environment |
| **Web Framework** | [Express.js](https://expressjs.com/) (v4.21+) | HTTP routing, middleware, and request handling |
| **Templating Engine** | [EJS](https://ejs.co/) (v3.1+) | Server-side rendered dynamic HTML templates |
| **CSS Framework** | [Bootstrap 5.3.3](https://getbootstrap.com/) | Responsive UI grid and utility components |
| **Custom Styling** | Vanilla CSS (`style.css`) | Design tokens, color system, and layout drawer |
| **Icons** | [Bootstrap Icons v1.11](https://icons.getbootstrap.com/) | Enterprise UI iconography |
| **Typography** | [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | Modern geometric typography |
| **Charts & Graphs** | [Chart.js](https://www.chartjs.org/) | Interactive canvas-based data visualizations |

---

## 📂 Repository Structure

```text
Stock-Sense/
│
├── front-end/
│   ├── public/
│   │   └── css/
│   │       └── style.css            # Global design tokens, layout, and component styles
│   │
│   ├── views/
│   │   ├── partials/
│   │   │   ├── navbar.ejs           # Header with global search (Ctrl+K), live sync, and alerts
│   │   │   ├── sidebar.ejs          # Collapsible navigation drawer with warehouse selector
│   │   │   └── footer.ejs           # System status footer, keyboard shortcuts modal, and JS bundles
│   │   │
│   │   ├── dashboard.ejs            # High-level analytics, operational pipelines, and charts
│   │   ├── products.ejs             # Product catalog, stock filters, and creation modal
│   │   ├── receipts.ejs             # Inbound purchase order receipts (WH/IN)
│   │   ├── deliveries.ejs           # Outbound sales delivery orders (WH/OUT)
│   │   ├── transfers.ejs            # Internal warehouse relocation (WH/INT)
│   │   ├── adjustments.ejs          # Physical cycle count reconciliation (INV/ADJ)
│   │   ├── ledger.ejs               # Chronological transaction ledger and valuation
│   │   └── login.ejs                # Authentication view
│   │
│   └── login.html                   # Static HTML login template
│
├── .gitignore                       # Standard rules for node_modules and system files
├── package.json                     # Project manifest and production dependencies
├── package-lock.json                 # Dependency lockfile
├── server.js                        # Main Express application entry point
└── README.md                        # Project documentation
```

---

## 🚀 Getting Started

Follow these instructions to set up and run StockSense locally on your machine.

### Prerequisites
- **Node.js**: `v18.0.0` or higher installed ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.0.0` or higher (comes bundled with Node.js)
- **Git**: Installed and configured ([Download Git](https://git-scm.com/))

### 1. Clone the Repository
```bash
git clone https://github.com/AdityaSinha2911/Stock-Sense.git
cd Stock-Sense
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch the Application
```bash
npm start
```
*For active development with automatic file watching:*
```bash
npm run dev
```

### 4. Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```
*(The root `/` path will automatically redirect you to the main `/dashboard`).*

---

## 🗺️ API & Route Reference

| HTTP Method | Route | Associated View | Description |
| :---: | :--- | :--- | :--- |
| `GET` | `/` | — | Automatically redirects to `/dashboard` |
| `GET` | `/login` | `login.ejs` | Displays authentication form |
| `POST` | `/login` | — | Authenticates credentials and starts session |
| `GET` | `/dashboard` | `dashboard.ejs` | Warehouse analytics, operational pipelines & charts |
| `GET` | `/products` | `products.ejs` | Product catalog with live search & filters |
| `POST` | `/products` | — | Creates and registers a new product SKU |
| `GET` | `/receipts` | `receipts.ejs` | Inbound receiving operations and vendor tracking |
| `POST` | `/receipts` | — | Registers a new inbound shipment order |
| `GET` | `/deliveries`| `deliveries.ejs`| Outbound dispatch management and carrier tracking |
| `POST` | `/deliveries`| — | Registers a new customer delivery order |
| `GET` | `/transfers` | `transfers.ejs` | Internal warehouse bin relocations |
| `POST` | `/transfers` | — | Dispatches a new internal stock transfer |
| `GET` | `/adjustments`| `adjustments.ejs`| Physical cycle count reconciliation |
| `POST` | `/adjustments`| — | Submits stock discrepancy for management review |
| `GET` | `/ledger` | `ledger.ejs` | Comprehensive chronological audit trail & valuation |

---

## ⌨️ Keyboard Shortcuts

StockSense includes built-in keyboard accelerators for rapid warehouse navigation:

| Key Binding | Function |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Instantly focus the global inventory search input |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> | Toggle the left navigation sidebar |

---

## 🔮 Development Roadmap

- [x] **Phase 1: UI/UX & Templating**
  - Implement cohesive design system based on `#157347` enterprise brand identity.
  - Build responsive EJS views for all 7 warehouse operations.
  - Implement Chart.js visual analytics and modals.
- [ ] **Phase 2: Database Persistence & ORM**
  - Connect database (PostgreSQL with Prisma / MongoDB with Mongoose).
  - Define relational schemas for Products, Locations, Partners, and StockMoves.
- [ ] **Phase 3: Production Authentication & Roles**
  - Implement `bcrypt` password encryption and session management.
  - Role-Based Access Control (Admin, Warehouse Manager, Receiving Clerk, Auditor).
- [ ] **Phase 4: Barcode & Label Generation**
  - Real-time barcode scanning integration (Code 128 / QR codes).
  - Automated PDF generation for Packing Slips and Delivery Waybills.

---

## 🤝 Contributing

We welcome contributions from team members! Please follow standard Git feature branching:

1. **Pull the latest changes from `main`**:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Create a descriptive feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your modifications using conventional commits**:
   ```bash
   git commit -m "feat(module): description of changes"
   ```
4. **Push the branch to GitHub**:
   ```bash
   git push -u origin feature/your-feature-name
   ```
5. **Open a Pull Request** against `main` for review and merging.
