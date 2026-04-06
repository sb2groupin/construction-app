# Construction App — Backend

## Setup (Pehli baar)

### 1. Dependencies install karo
```bash
cd backend
npm install
```

### 2. .env file banao
```bash
cp .env.example .env
```
Ab `.env` file kholo aur apni values daalo:
```
PORT=5001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/constructionAppDB?retryWrites=true&w=majority
JWT_SECRET=koi_bhi_strong_secret_min_32_chars_likho
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Cloud deploy note:
- Render par `.env` file automatically use nahi hoti.
- `MONGO_URI` ya `MONGODB_URI` ko Render dashboard ke Environment section me add karna zaroori hai.

### 3. Admin account banao (sirf ek baar)
```bash
npm run seed
```
Ye command admin user create karega:
- Username: `admin`
- Password: `Admin@1234`
- ⚠️ Pehle login ke baad password zaroor change karo!

### 4. Server start karo
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server `http://localhost:5001` pe chalega.

---

## API Endpoints

### Auth
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/auth/login | Login | ❌ |
| POST | /api/auth/create-employee-login | Employee login banao | Admin |
| PUT | /api/auth/change-password | Apna password change | ✅ |
| PUT | /api/auth/reset-password | Employee ka reset | Admin |

### Employees
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | /api/employees | Sab employees | ✅ |
| GET | /api/employees/:id | Single employee | ✅ |
| POST | /api/employees | Add employee | Admin |
| PUT | /api/employees/:id | Update employee | Admin |
| DELETE | /api/employees/:id | Delete (soft) | Admin |

### Attendance
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | /api/attendance | Attendance list | ✅ |
| GET | /api/attendance/today-summary | Aaj ka count | ✅ |
| POST | /api/attendance | Mark attendance | ✅ |
| PUT | /api/attendance/:id | Update record | Admin |

### Salary
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | /api/salary/monthly-report | Sab ka report | Admin |
| GET | /api/salary/month/:id | Single monthly | ✅ |
| GET | /api/salary/range/:id | Date range | ✅ |

---

## Folder Structure
```
backend/
├── config/
│   ├── db.js              — MongoDB connection
│   └── constants.js       — App constants
├── controllers/           — Business logic
├── middleware/
│   ├── auth.middleware.js  — JWT verify
│   └── error.middleware.js — Global errors
├── models/                — Mongoose schemas
├── routes/                — API routes
├── seeders/
│   └── admin.seeder.js    — Admin account create
└── utils/
    ├── response.utils.js  — Standard API response
    ├── salary.utils.js    — Salary calculation
    └── geo.utils.js       — Distance calculation
```

---

## API Response Format (hamesha same)
```json
{
  "success": true,
  "message": "Employee added successfully",
  "data": { ... }
}
```

Error response:
```json
{
  "success": false,
  "message": "Employee not found"
}
```
