# Screenlytics — Backend API

> Node.js + Express + MySQL backend for the Screenlytics burnout-tracking app.

---

## ✅ Prerequisites — Install These First

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18 or higher | https://nodejs.org |
| **npm** | comes with Node | — |
| **MySQL** | v8.0 or higher | https://dev.mysql.com/downloads/ |
| **nodemon** (optional, for dev) | latest | `npm i -g nodemon` |

> **Tip:** Verify installs with `node -v`, `npm -v`, `mysql --version`

---

## 🗂 File Structure

```
screenlytics-backend/
│
├── server.js                   ← Entry point, mounts all routes
│
├── config/
│   ├── db.js                   ← MySQL connection pool (mysql2)
│   └── schema.sql              ← Run once to create DB & tables
│
├── controllers/
│   ├── auth.controller.js      ← register, login
│   ├── log.controller.js       ← upsert/get/delete screen-time logs
│   ├── task.controller.js      ← planner tasks CRUD
│   ├── user.controller.js      ← profile get/update/password
│   └── analytics.controller.js ← summary, chart data, streak
│
├── middleware/
│   ├── auth.js                 ← JWT verification (protects routes)
│   └── errorHandler.js         ← Global error response handler
│
├── routes/
│   ├── auth.routes.js
│   ├── log.routes.js
│   ├── task.routes.js
│   ├── user.routes.js
│   └── analytics.routes.js
│
├── utils/
│   └── burnout.js              ← Same algorithm as React frontend
│
├── .env.example                ← Copy to .env and fill in values
├── package.json
└── README.md
```

---

## 🚀 Setup & Run

### Step 1 — Create the database

Open MySQL and run the schema:

```bash
mysql -u root -p < config/schema.sql
```

This creates the `screenlytics_db` database and three tables:
- `users` — accounts
- `screen_logs` — daily screen-time entries + burnout score
- `tasks` — planner tasks

### Step 2 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your MySQL credentials:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=screenlytics_db
JWT_SECRET=pick_a_long_random_string
CLIENT_ORIGIN=http://localhost:5173
```

### Step 3 — Install dependencies

```bash
npm install
```

### Step 4 — Start the server

```bash
# Production
npm start

# Development (auto-restarts on file changes)
npm run dev
```

Server runs on **http://localhost:5000**

---

## 🔌 Connecting the React Frontend

In your React project, create a file like `src/api/client.js`:

```js
const BASE = 'http://localhost:5000/api';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('sl-token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  return res.json();
}
```

After login, save the JWT:
```js
localStorage.setItem('sl-token', data.token);
```

---

## 📡 API Reference

### Auth (no token needed)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/register` | `{ firstName, lastName, email, password }` | `{ success, userId }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ success, token, user }` |

---

### Screen-time Logs (token required)

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/logs` | All logs, `?limit=30` optional |
| POST | `/api/logs` | Upsert — creates or updates the day |
| GET | `/api/logs/:date` | Single day, date = `YYYY-MM-DD` |
| DELETE | `/api/logs/:date` | Delete a day's entry |

**POST body example:**
```json
{
  "logDate": "2025-06-15",
  "studyMins": 120,
  "socialMins": 90,
  "entMins": 60,
  "otherMins": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logDate": "2025-06-15",
    "totalMins": 300,
    "score": 6.2,
    "category": "Mid"
  }
}
```

---

### Planner Tasks (token required)

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/tasks` | All tasks for current user |
| POST | `/api/tasks` | `{ title, timeSlot? }` |
| PATCH | `/api/tasks/:id/toggle` | Flip isDone true/false |
| DELETE | `/api/tasks/:id` | Remove a task |

---

### User Profile (token required)

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/users/me` | Get current user's profile |
| PATCH | `/api/users/me` | `{ firstName, lastName }` |
| PATCH | `/api/users/me/password` | `{ currentPassword, newPassword }` |

---

### Analytics (token required)

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/analytics/summary` | Totals + averages, `?days=7` |
| GET | `/api/analytics/chart` | Per-day data array, `?days=7` |
| GET | `/api/analytics/streak` | Consecutive logging streak |

---

## 🧠 Burnout Score Logic

The server recalculates the burnout score from scratch (same formula as the frontend):

- **Base score** — scales with total hours per day (0–10 range)
- **Passive bonus** — +0.4 to +0.8 added if social+entertainment > 40–60% of total
- **Categories:** Normal (≤3.5) · Mid (≤6.5) · Excess (>6.5)

The server is the **source of truth** — it never trusts a score sent from the client.

---

## 🔐 Security Notes

- Passwords hashed with **bcrypt** (12 salt rounds)
- All protected routes require a **JWT Bearer token**
- JWT expires in **7 days** (configurable via `.env`)
- SQL injection prevented via **parameterised queries** (mysql2)
- CORS restricted to `CLIENT_ORIGIN` in `.env`
