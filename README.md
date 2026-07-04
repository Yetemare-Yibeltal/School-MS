# 🏫 Kat Secondary School Management System

An AI-powered, full-stack, production-grade school management system built for **Kat Secondary School**, Addis Ababa, Ethiopia.

Manages students, teachers, staff, academics, attendance, fees, library, HR, communication, and reports — with built-in AI assistance powered by **Claude (Anthropic)** and **GPT-4 (OpenAI)**.

---

## 🤖 AI Features

| Feature                 | AI Provider | Description                                                                                                         |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| Academic Assistant      | Claude      | Students ask any subject question — Math, Physics, Biology, English, History, etc. AI explains, solves, and teaches |
| School Chatbot          | Claude      | Parents, students, teachers ask anything about the school 24/7                                                      |
| Notice Writer           | Claude      | Admin types keywords → AI writes full professional notice in Amharic or English                                     |
| Report Card Comments    | Claude      | Auto-generates meaningful teacher comments based on student performance                                             |
| Exam Question Generator | Claude      | Teachers input topic + grade → AI generates exam questions (MCQ, short, essay)                                      |
| Performance Predictor   | GPT-4       | Predicts student pass/fail risk from marks + attendance history                                                     |
| Attendance Analyzer     | GPT-4       | Detects absence patterns, predicts future absences, sends early alerts                                              |
| Fee Default Predictor   | GPT-4       | Predicts which students are likely to default on fee payment                                                        |
| Timetable Generator     | GPT-4       | Auto-generates conflict-free weekly timetable for all classes                                                       |
| Book Recommender        | GPT-4       | Recommends library books based on student grade and subjects                                                        |

---

## 🚀 Tech Stack

| Layer            | Technology                     |
| ---------------- | ------------------------------ |
| Frontend         | React 18 + Vite + Tailwind CSS |
| Backend          | Node.js + Express.js           |
| Database         | MongoDB Atlas + Mongoose       |
| Auth             | JWT (Access + Refresh Tokens)  |
| AI Assistant     | Anthropic Claude API           |
| AI Predictions   | OpenAI GPT-4 API               |
| File Upload      | Multer + Cloudinary            |
| Email            | Nodemailer                     |
| PDF Export       | Puppeteer                      |
| Excel Export     | ExcelJS                        |
| State Management | React Context API              |
| HTTP Client      | Axios                          |

---

## 📋 Modules

| Module           | Features                                                                  |
| ---------------- | ------------------------------------------------------------------------- |
| 🔐 Auth          | Login, Register, Forgot Password, Reset Password, Role-based access       |
| 📊 Dashboard     | Admin, Teacher, Student, Parent role-based dashboards with live stats     |
| 👨‍🎓 Students      | List, Add, Edit, Profile, ID Card, Categories, Suspension                 |
| 👩‍🏫 Teachers      | List, Add, Edit, Profile, Timetable                                       |
| 👨‍👩‍👧 Guardians     | List, Add, Edit, Profile, linked to students                              |
| 🏫 Academic      | Classes, Sections, Subjects, Timetable Builder, Academic Years            |
| 📝 Exams         | Schedule, Marks Entry, Results, Report Card Generator                     |
| ✅ Attendance    | Student daily, Teacher daily, Reports, Low-attendance alerts              |
| 💰 Fees          | Types, Groups, Discounts, Collection, Receipts, Income, Expense           |
| 👥 HRM           | Employees, Departments, Designations, Leave, Payroll, Salary Slips        |
| 📚 Library       | Books, Categories, Members, Issue, Return, Overdue                        |
| 📢 Communication | Notice Board, Events, Internal Messages                                   |
| 📈 Reports       | Academic, Attendance, Finance, Student, Teacher                           |
| ⚙️ Settings      | General, Academic, Fees, Notifications, Roles & Permissions, Backup       |
| 🤖 AI            | Academic Assistant, Chatbot, Exam Generator, Insights, Performance Alerts |

---

## 📁 Project Structure
---
## ⚙️ Prerequisites

- Node.js v18+
- npm v9+
- MongoDB Atlas account
- Anthropic Claude API key
- OpenAI API key
- Git
---

## 🛠️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/Yetemare-Yibeltal/School-MS.git
cd School-MS
```

### 2. Install all dependencies

```bash
npm run install:all
```

### 3. Set up environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Open `server/.env` and fill in your values (see Environment Variables section below).

### 4. Seed the database

```bash
npm run seed
```

### 5. Run development servers

```bash
npm run dev
```

- Backend API → `http://localhost:5000`
- Frontend → `http://localhost:5173`

---

## 🔑 Default Login Credentials

| Role    | Email                    | Password     |
| ------- | ------------------------ | ------------ |
| Admin   | admin@katschool.edu.et   | Admin@1234   |
| Teacher | teacher@katschool.edu.et | Teacher@1234 |
| Student | student@katschool.edu.et | Student@1234 |
| Parent  | parent@katschool.edu.et  | Parent@1234  |

---

## 📜 Available Scripts

Run from the root `kat-school/` directory:

| Script                | What it does                                    |
| --------------------- | ----------------------------------------------- |
| `npm run dev`         | Starts frontend + backend together              |
| `npm run server`      | Starts backend only                             |
| `npm run client`      | Starts frontend only                            |
| `npm run install:all` | Installs root + server + client dependencies    |
| `npm run seed`        | Seeds MongoDB with sample Ethiopian school data |
| `npm run build`       | Builds frontend for production                  |

---

## 🌍 Environment Variables

### Backend — `server/.env`

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/kat_school?retryWrites=true&w=majority

# JWT
JWT_ACCESS_SECRET=your_strong_access_secret_here
JWT_REFRESH_SECRET=your_strong_refresh_secret_here
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# AI — Anthropic Claude
ANTHROPIC_API_KEY=your_claude_api_key_here

# AI — OpenAI GPT-4
OPENAI_API_KEY=your_openai_api_key_here

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Client URL (for CORS and email links)
CLIENT_URL=http://localhost:5173

# Cloudinary (profile photo uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend — `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Kat School MS
```

---

## 🇪🇹 Ethiopian Localization

- Ethiopian calendar months (Meskerem, Tikimt, Hidar, Tahsas, Tir, Yekatit, Megabit, Miazia, Ginbot, Sene, Hamle, Nehase)
- Ethiopian Birr (ETB) currency formatting
- Ethiopian MoE grading scale (A=85–100, B=75–84, C=65–74, D=50–64, F=0–49)
- Assessment weights: Continuous Assessment 50% + Final Exam 50%
- Ethiopian regions, woredas, and kebeles in address fields
- Local payment methods: Cash, Telebirr, CBE Birr, M-Pesa, Bank Transfer
- Ethiopian student, teacher, and staff names throughout seed data

---

## 🏫 School Info

|                   |                                       |
| ----------------- | ------------------------------------- |
| **School Name**   | Kat Secondary School                  |
| **Location**      | Addis Ababa, Ethiopia                 |
| **Grades**        | Grade 9 – Grade 12                    |
| **Sections**      | A, B, C, D per grade                  |
| **Curriculum**    | Ethiopian Ministry of Education (MoE) |
| **Academic Year** | Meskerem – Sene (September – June)    |
| **Grading**       | Ethiopian MoE 4-point GPA scale       |

---

## 🤝 Contributing

This system is built exclusively for Kat Secondary School, Addis Ababa, Ethiopia.

---

## 📄 License

MIT License — © 2024 Kat Secondary School
