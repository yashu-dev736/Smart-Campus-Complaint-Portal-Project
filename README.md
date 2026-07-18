# Smart Campus Complaint Desk (MERN Stack)

A full-stack complaint management system for campuses, built with MongoDB, Express, React (Vite), and Node.js.

## Features

- **3 roles**: Admin, Staff, Parent — each with a dedicated dashboard. Both Parents and Staff can file complaints; only Admins manage staff assignment and see contact emails.
- **JWT authentication** (register/login)
- **Complaint lifecycle**: Pending → In Progress → Resolved / Rejected, with a full audit history
- **Contact email on submission** — captured at complaint-filing time, but only ever returned to Admins by the API (Staff and Parents never see it, even for their own tickets' fellow complainants)
- **Email notifications** (Nodemailer) on: account creation, new complaint submitted, staff assignment, status change
- **Staff assignment** by admin
- **Comments/discussion thread** on each complaint
- **Filtering** by status/category (including a **Library** category), and an admin stats summary (totals by status/category)
- **Ticket-stub styled complaint cards** — a distinctive campus-notice-board / hall-pass visual identity (navy + gold palette)

## Project structure

```
smart-campus-complaint/
├── backend/          # Express + MongoDB API
│   ├── config/db.js
│   ├── models/        (User, Complaint)
│   ├── middleware/     (auth, role check)
│   ├── controllers/    (auth, complaints, users)
│   ├── routes/
│   ├── utils/sendEmail.js
│   └── server.js
└── frontend/         # React (Vite) app
    └── src/
        ├── api/axios.js
        ├── context/AuthContext.jsx
        ├── components/ (Navbar, ComplaintCard, ProtectedRoute)
        └── pages/ (Login, Register, dashboards, NewComplaint, ComplaintDetail)
```

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — your MongoDB connection string (local `mongodb://127.0.0.1:27017/smart_campus_complaint` or a MongoDB Atlas URI)
- `JWT_SECRET` — any long random string
- `EMAIL_HOST` / `EMAIL_USER` / `EMAIL_PASS` — SMTP credentials (e.g. Gmail SMTP with an [App Password](https://myaccount.google.com/apppasswords)). If you skip this, the app still works — emails are just silently skipped and logged to the console.

Run it:
```bash
npm run dev      # requires nodemon (devDependency, already listed)
# or
npm start
```
Server runs on `http://localhost:5000`.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
App runs on `http://localhost:5173`.

## 3. Try it out

1. Go to `/register`, create an **Admin** account first (pick "Admin" in the role dropdown).
2. Register a **Staff** account (e.g. department "IT/WiFi").
3. Register a **Parent** account and submit a complaint — note the "Contact email" field on the form; that address is only ever visible to Admins.
4. Log in as Admin → assign the complaint to your Staff account. As Admin, open the ticket detail page and you'll see the contact email; log in as Staff or Parent and it won't appear.
5. Log in as Staff → update the complaint status (this emails the parent if SMTP is configured).

> Note: In a real deployment you'd lock down public self-registration for `staff`/`admin` roles (e.g. only allow `parent` at `/register`, and have an admin create staff/admin accounts from a protected admin panel). It's left open here for easy local testing — see `authController.js` register function to restrict it later.

## API reference (quick)

| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| POST | `/api/complaints` | Parent, Staff, Admin |
| GET | `/api/complaints` | Authenticated (role-scoped) |
| GET | `/api/complaints/:id` | Authenticated (owner or staff/admin) |
| PUT | `/api/complaints/:id/status` | Staff, Admin |
| PUT | `/api/complaints/:id/assign` | Admin |
| POST | `/api/complaints/:id/comments` | Authenticated |
| DELETE | `/api/complaints/:id` | Admin |
| GET | `/api/complaints/stats/summary` | Staff, Admin |
| GET | `/api/users?role=staff` | Admin |

## Tech notes

- Passwords hashed with bcrypt; auth via JWT in `Authorization: Bearer <token>` header.
- Email sending is wrapped so a missing/broken SMTP config never breaks the app — it just logs a warning.
- Frontend uses Vite + React Router + Axios, no UI framework — hand-styled CSS in `src/index.css`.
