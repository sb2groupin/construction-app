# Construction App — Frontend (React + Modern Orange Design)

## Setup

```bash
cd frontend
npm install
npm run dev
```

App `http://localhost:3000` pe chalegi.

> Backend port 5000 pe chalna chahiye — Vite proxy handle karega.

## Folder Structure
```
src/
├── api/                  — Sab backend calls ek jagah (axios)
├── components/
│   ├── redesign/         — New Design: Sidebar, BottomTabBar
│   └── common/           — PrivateRoute, Loader, other utilities
├── context/
│   └── AuthContext.jsx   — Global login state + role
├── pages/
│   ├── Auth/             — Login page
│   ├── Dashboard/        — Admin dashboard
│   ├── Employees/        — Employee list + add/edit
│   ├── Attendance/       — Mark + view attendance  
│   ├── Salary/           — Salary check
│   ├── Projects/         — Projects management
│   ├── Tasks/            — Tasks management
│   ├── DPR/              — Daily Project Reports
│   ├── Inventory/        — Inventory management
│   ├── Expenses/         — Expense tracking
│   ├── Safety/           — Safety notices
│   ├── Equipment/        — Equipment tracking
│   ├── Reports/          — Monthly reports + PDF
│   ├── EmployeePortal/   — Employee ka apna view
│   ├── Profile/          — User profiles
│   ├── Leaves/           — Leave management
│   ├── Advance/          — Salary advances
│   ├── Quotation/        — Quotations
│   ├── Subcontractor/    — Subcontractor management
│   ├── CompanySettings/  — Company settings
│   └── Analytics/        — Analytics dashboard
├── redesign.css          — Complete orange/white theme
├── App.jsx               — All routes + new design layout
└── main.jsx              — Entry point
```

## Design
- **Primary Color**: Orange (#F97316)
- **Background**: Off-white (#FEF9F5)  
- **Layout**: Desktop sidebar → Mobile bottom tab bar
- **Responsive**: Fully responsive across all devices

## Routes
| Path | Role | Page |
|------|------|------|
| /login | Public | Login |
| / | Admin | Dashboard |
| /projects | Admin | Projects |
| /employees | Admin | Employees |
| /attendance | Admin | Attendance |
| /salary | Admin | Salary |
| /tasks | Admin | Tasks |
| /dpr | Admin | Daily Reports |
| /inventory | Admin | Inventory |
| /expenses | Admin | Expenses |
| /safety | Admin | Safety |
| /equipment | Admin | Equipment |
| /reports | Admin | Reports |
| /settings | Admin | Settings |
| /my-dashboard | Employee | My Dashboard |
| /my-attendance | Employee | My Attendance |
| /my-salary | Employee | My Salary |
| /my-leaves | Employee | My Leaves |
