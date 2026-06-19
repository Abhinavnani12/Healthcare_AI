# Northstar Hospital Command Center

Northstar Hospital Command Center is a professional, interactive, AI-powered operational monitoring full-stack web application designed for a fictional 1,000-bed hospital. It helps hospital executives and operations heads monitor daily occupancies, coordinate clinical workloads, respond to real-time bottlenecks (alerts), and track patient journeys.

---

## 🚀 Quick Start & Launch Instructions

To launch both the backend API server and the React frontend client, follow these steps:

### 1. Prerequisite Checks
Ensure that **Node.js** (v18+) and **MySQL** are running.
- Database: `northstar_hospital`
- Port: `3306`
- Username: `root`
- Password: `Nanu@2005` (configured in `backend/.env`)

### 2. Run Backend Express Server
```bash
cd backend
npm run dev
```
The server will start on port `5000`. You should see:
`Northstar Command Center Server is running on port 5000 in development mode.`

### 3. Run Frontend React Client
In a new terminal window:
```bash
cd frontend
npm run dev
```
The Vite development server will start on port `5173`. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Demonstration Credentials

Log in using one of the pre-seeded accounts configured with the default password: **`Password123`**

| Email | Assigned Role | Primary Dashboard Focus | Access Permissions |
| :--- | :--- | :--- | :--- |
| **`admin@northstar.test`** | **ADMIN** | User Management / Logistics | Full Panel + All Modules |
| **`ceo@northstar.test`** | **CEO** | Revenues, Operating Costs, Risks | Executive & Financial Dashboards |
| **`cmo@northstar.test`** | **CMO** | Patient Acuity, ER Queues, Doctors | ICU, ER, Doctor, journeys, alerts |
| **`operations@northstar.test`** | **OPERATIONS_HEAD** | Beds, Alert tickets, Staffing | Executive, ICU, ER, journeys, alerts |

---

## 🛠️ Project Architecture

```
Project/
├── backend/                  # Node.js/Express API
│   ├── prisma/
│   │   ├── schema.prisma     # Introspected MySQL schema models
│   │   └── seed.js           # Database seed script for ER/ICU/Financial tables
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT & Role-Based Access Control guards
│   │   ├── routes/
│   │   │   ├── authRoutes.js # Register, login, verification, logout
│   │   │   ├── dashboard.js  # Analytics aggregates & rules-based AI
│   │   │   ├── journeys.js   # Patient journey CRUD with search & filters
│   │   │   ├── alerts.js     # Persistent alert tickets updates
│   │   │   └── reports.js    # PDF/CSV simulation reports generators
│   │   ├── utils/
│   │   │   └── auditLogger.js# Audit trail db logs helper
│   │   └── db.js             # Singleton Prisma Client module
│   ├── server.js             # Server entry point
│   └── package.json
│
└── frontend/                 # Vite React Client
    ├── src/
    │   ├── components/
    │   │   └── DashboardLayout.jsx # Shell layout, sidebar, header, alerts panel
    │   ├── context/
    │   │   └── AuthContext.jsx     # Session provider & Persona switcher state
    │   ├── pages/
    │   │   ├── Login.jsx           # Secure log-in
    │   │   ├── Register.jsx        # Default operations-head sign-up
    │   │   ├── HospitalExecutive.jsx# Executive charts (Area, Donut, Bar) & KPIs
    │   │   ├── IcuOperations.jsx   # ICU ventilator, critical list
    │   │   ├── EmergencyRoom.jsx   # ER arrivals, wait-time SLA
    │   │   ├── PatientJourney.jsx  # CRUD table, details, add, edit, delete modals
    │   │   ├── DoctorProductivity.jsx# Doctor caseloads, feedback ratings
    │   │   ├── FinancialDashboard.jsx# Revenues vs expenses, claims tracker
    │   │   ├── AlertsCenter.jsx    # Assignable alert incidents console
    │   │   ├── Reports.jsx         # Query builder & download CSV simulator
    │   │   ├── Settings.jsx        # Polling frequency settings
    │   │   └── AdminPanel.jsx      # Active status toggler & role modifier
    │   ├── App.jsx                 # Routes definition
    │   ├── index.css               # Styling and Google font imports
    │   └── main.jsx
    └── package.json
```

---

## 🔒 Security & HIPAA Assumption Guards

Since this is an operational monitoring command center prototype:
1. **Masked Patient Identifiers**: High-visibility views display randomized masked IDs (e.g. `NS-41020` instead of government ID or record file names) to simulate HIPAA constraints.
2. **Session Cookies**: JWT token is stored inside an HTTP-only secure cookie, guarding against XSS token extraction.
3. **Audit Trails**: All registration, login, role changes, patient journey edits, and alert ticket updates write descriptive entries into the `auditlog` table containing who did what and when.
4. **Helmet & Rate Limiting**: Helmet security headers are mounted, and API calls are rate-limited to prevent brute-forcing.
