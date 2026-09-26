# 📦 StockSense — Modular Inventory Management System (IMS)

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-v4.21+-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![EJS](https://img.shields.io/badge/View_Engine-EJS-b4ca65?style=flat)](https://ejs.co/)
[![Bootstrap](https://img.shields.io/badge/Styling-Bootstrap_5.3-7952B3?style=flat&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

> A modern, modular, enterprise-grade Inventory Management System (IMS) designed to digitize and streamline end-to-end warehouse and stock operations within a business.

---

## 🌟 Key Modules & Features

### 📊 1. Operations & Analytics Dashboard (`/dashboard`)
- **Real-Time KPIs**: Total inventory valuation, active SKU count, pending receipts, and outgoing delivery orders.
- **Odoo-Style Operations Pipeline**: Visual cards for Inbound Receipts (`WH/IN`), Outbound Deliveries (`WH/OUT`), Internal Transfers (`WH/INT`), and Stock Adjustments (`INV/ADJ`).
- **Interactive Visualizations**: Chart.js charts for monthly inbound vs. outbound trends and valuation distribution by category.
- **Safety Stock Warning Center**: Instant alerts for products falling below safety thresholds with quick reorder triggers.

### 📦 2. Product Catalog (`/products`)
- **Inventory Master**: Full catalog management with SKUs, barcodes, unit of measures (pcs, kg, box), and cost/sales pricing.
- **Stock Status Indicators**: Visual badges for `In Stock`, `Low Stock`, and `Out of Stock`.
- **Search & Multi-Filters**: Instant search by SKU/name, category filtering, and location tagging.
- **Modals**: Built-in modal forms for adding new products and performing quick stock adjustments.

### 📥 3. Inbound Receipts (`/receipts`)
- **Purchase Order Tracking**: Manage incoming supplier shipments (`WH/IN/XXXXX`).
- **Inspection & Validation**: Status workflows (`Draft` &rarr; `Waiting` &rarr; `Ready` &rarr; `Done`).
- **Goods Receipt Slips**: Generate and print inbound delivery verification slips.

### 📤 4. Delivery Orders (`/deliveries`)
- **Outbound Shipments**: Process sales order fulfillment and dispatches (`WH/OUT/XXXXX`).
- **Carrier Logistics**: Integration fields for FedEx, UPS, DHL, tracking numbers, and delivery dates.
- **Order States**: Track items from stock reservation to dispatch and delivery completion.

### 🔄 5. Internal Stock Transfers (`/transfers`)
- **Location Relocation**: Move stock seamlessly between warehouses, zones, racks, or staging bins (`WH/INT/XXXXX`).
- **Forklift / Operator Assignment**: Assign team members and track transfer status (`In Transit`, `Scheduled`, `Completed`).

### ⚖️ 6. Inventory Adjustments & Reconciliation (`/adjustments`)
- **Physical Cycle Counts**: Reconcile recorded system stock with physical warehouse counts (`INV/ADJ/XXXXX`).
- **Live Discrepancy Calculator**: Automatic variance and cost impact calculation.
- **Audit Reasons**: Categorize discrepancies by Cycle Count, Damaged Goods, Shrinkage/Theft, or Expiry.

### 📜 7. Stock Ledger & Audit Trail (`/ledger`)
- **Immutable Log**: Comprehensive chronological record of all stock moves across the entire organization.
- **Running Inventory Balance**: Real-time running quantities and book valuations after every movement.
- **Financial Impact**: Track unit costs and valuation adjustments for accounting audits.

### 🔐 8. Authentication & Navigation (`/login`)
- **Modern Login Interface**: Responsive authentication card with session support and alerts.
- **Global Navigation**: Header with quick search (`Ctrl + K`), system live sync status, and quick operation shortcuts.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/) |
| **Templating Engine** | [EJS (Embedded JavaScript)](https://ejs.co/) |
| **Frontend Styling** | [Bootstrap 5.3.3](https://getbootstrap.com/), Custom Modern SaaS CSS |
| **Iconography & Fonts** | [Bootstrap Icons v1.11.3](https://icons.getbootstrap.com/), Google Fonts (*Plus Jakarta Sans*) |
| **Data Visualization** | [Chart.js](https://www.chartjs.org/) |

---

## 📂 Project Structure

```text
Stock-Sense/
├── front-end/
│   ├── public/
│   │   └── css/
│   │       └── style.css            # Custom layout & design tokens
│   ├── views/
│   │   ├── partials/
│   │   │   ├── navbar.ejs           # Top navigation bar with search & shortcuts
│   │   │   ├── sidebar.ejs          # Collapsible sidebar with active page states
│   │   │   └── footer.ejs           # System footer & JS bundles
│   │   ├── dashboard.ejs            # Main analytics & pipeline overview
│   │   ├── products.ejs             # Product master catalog & modals
│   │   ├── receipts.ejs             # Inbound shipments (WH/IN)
│   │   ├── deliveries.ejs           # Outbound delivery orders (WH/OUT)
│   │   ├── transfers.ejs            # Internal stock transfers (WH/INT)
│   │   ├── adjustments.ejs          # Physical inventory reconciliation
│   │   ├── ledger.ejs               # Chronological audit ledger
│   │   └── login.ejs                # Authentication view
│   └── login.html                   # Teammate static login template
├── .gitignore                       # Node modules and temporary file rules
├── package.json                     # Express & EJS dependencies
├── server.js                        # Dev server & application routes
└── README.md                        # Documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18.x or later recommended).

### 1. Clone the Repository
```bash
git clone https://github.com/AdityaSinha2911/Stock-Sense.git
cd Stock-Sense
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npm start
```
*Or with automatic file reload:*
```bash
npm run dev
```

### 4. Open in Browser
Visit **[http://localhost:3000](http://localhost:3000)** to explore the system.

---

## 🗺️ Application Routes

| Endpoint | Method | View Rendered | Purpose |
| :--- | :---: | :--- | :--- |
| `/` | `GET` | — | Redirects to `/dashboard` |
| `/login` | `GET` / `POST` | `login.ejs` | User login and authentication |
| `/dashboard` | `GET` | `dashboard.ejs` | Warehouse analytics, metrics & charts |
| `/products` | `GET` / `POST` | `products.ejs` | Product catalog & new item creation |
| `/receipts` | `GET` / `POST` | `receipts.ejs` | Inbound receiving operations |
| `/deliveries` | `GET` / `POST` | `deliveries.ejs` | Outbound packing & dispatch |
| `/transfers` | `GET` / `POST` | `transfers.ejs` | Inter-location stock transfers |
| `/adjustments`| `GET` / `POST` | `adjustments.ejs`| Physical stock takes & variance reconciliation |
| `/ledger` | `GET` | `ledger.ejs` | Chronological transaction audit trail |

---

## ⌨️ Built-in Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Focus global inventory search bar |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> | Toggle navigation sidebar |

---

## 🤝 Contributing & Git Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes:
   ```bash
   git commit -m "feat: description of changes"
   ```
3. Push to your remote branch:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Open a **Pull Request** for team review.
