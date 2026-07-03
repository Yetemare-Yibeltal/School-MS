# 🏫 Kat Secondary School Management System

A full-stack, production-grade school management system built for **Kat Secondary School**, Addis Ababa, Ethiopia. Manages students, teachers, staff, academics, attendance, fees, library, HR, communication, and reports — all in one platform.

---

## 🚀 Tech Stack

| Layer            | Technology                     |
| ---------------- | ------------------------------ |
| Frontend         | React 18 + Vite + Tailwind CSS |
| Backend          | Node.js + Express.js           |
| Database         | MongoDB + Mongoose             |
| Auth             | JWT (Access + Refresh Tokens)  |
| File Upload      | Multer + Cloudinary            |
| Email            | Nodemailer                     |
| PDF Export       | Puppeteer                      |
| Excel Export     | ExcelJS                        |
| State Management | React Context API              |
| HTTP Client      | Axios                          |

---

## 📋 Modules

- 🔐 Authentication (Admin, Teacher, Student, Parent roles)
- 📊 Dashboard (role-based views)
- 👨‍🎓 Student Management (list, add, edit, profile, ID card, categories, suspension)
- 👩‍🏫 Teacher Management (list, add, edit, profile, timetable)
- 👨‍👩‍👧 Guardian Management
- 🏫 Academic (classes, sections, subjects, timetable builder, academic years)
- 📝 Exams (schedule, marks entry, results, report cards)
- ✅ Attendance (student, teacher, reports)
- 💰 Fees & Finance (types, groups, discounts, collection, receipts, income, expense)
- 👥 HRM (employees, departments, designations, leave, payroll, salary slips)
- 📚 Library (books, members, issue, return, overdue)
- 📢 Communication (notice board, events, internal messages)
- 📈 Reports (academic, attendance, finance, student, teacher)
- ⚙️ Settings (general, academic, fees, notifications, roles, backup)

---

## 📁 Project Structure

---
## ⚙️ Prerequisites

Make sure you have installed:
  - Node.js v18+
  - npm v9+
  - MongoDB v6+ (local) or MongoDB Atlas account
  - Git
---

## 🛠️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/kat-school.git
cd kat-school
```

### 2. Install all dependencies (root, server, client)

```bash
npm run install:all
```

### 3. Set up environment variables

```bash
# Backend
cp server/.env.example server/.env
# Edit server/.env with your values

# Frontend
cp client/.env.example client/.env
# Edit client/.env with your values
```

### 4. Seed the database with initial data

```bash
npm run seed
```

### 5. Run development servers (frontend + backend together)

```bash
npm run dev
```

This starts:

- Backend API on `http://localhost:5000`
- Frontend on `http://localhost:5173`

---

## 🔑 Default Login Credentials (after seeding)

| Role    | Email                    | Password     |
| ------- | ------------------------ | ------------ |
| Admin   | admin@katschool.edu.et   | Admin@1234   |
| Teacher | teacher@katschool.edu.et | Teacher@1234 |
| Student | student@katschool.edu.et | Student@1234 |
| Parent  | parent@katschool.edu.et  | Parent@1234  |

---

## 📜 Available Scripts

From the root directory:

| Script                | Description                     |
| --------------------- | ------------------------------- |
| `npm run dev`         | Run frontend + backend together |
| `npm run server`      | Run backend only                |
| `npm run client`      | Run frontend only               |
| `npm run install:all` | Install all dependencies        |
| `npm run seed`        | Seed database with sample data  |
| `npm run build`       | Build frontend for production   |

---

## 🌍 Environment Variables

### Backend (`server/.env`)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kat_school
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (`client/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Kat School
```

---

## 🇪🇹 Ethiopian Localization

- Ethiopian calendar (Meskerem – Nehase)
- Ethiopian Birr (ETB) currency
- Ethiopian MoE grading scale (A=85–100, B=75–84, C=65–74, D=50–64, F=0–49)
- Ethiopian regions, woredas, kebeles
- Local payment methods (Telebirr, CBE, Cash)
- Ethiopian student and staff names

---

## 🏫 School Info

|                   |                                 |
| ----------------- | ------------------------------- |
| **School**        | Kat Secondary School            |
| **Location**      | Addis Ababa, Ethiopia           |
| **Grades**        | Grade 9 – Grade 12              |
| **Curriculum**    | Ethiopian Ministry of Education |
| **Academic Year** | Meskerem – Sene (Sep – Jun)     |

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Developer

Built with ❤️ for Kat Secondary School, Addis Ababa, Ethiopia.
