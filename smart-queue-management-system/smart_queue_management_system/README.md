# Smart Queue Management System

A modern, centralized digital queue management platform built for hospitals, banks, colleges, municipal offices, and service centers.

**Theme Palette**:
- Navy Blue: `#142B4A`
- Teal: `#14B8A6`
- White: `#FFFFFF`
- Background: `#F4F7FB`

---

## 🌟 Key Features

1. **Self-Service Customer Triage & Token Desk**:
   - Organization and department selection (Cardiology, OPD, Billing, Pharmacy, Records).
   - Dynamic auto-selection of services to ensure flawless, immediate ticket issuance without validation roadblocks.
   - Priority categorization (Standard FIFO, Senior Citizens / Differently Abled, and Emergency Priority).
   - Instant digital token issuance with unique sequential numbering (e.g., `OPD-108`, `CARD-104`).
   - Dynamic estimated waiting time prediction using multi-factor wait estimation.
   - Interactive scannable QR Code generation for real-time mobile tracking.

2. **Digital Public Display Screen (Lobby TV Board)**:
   - High-visibility fullscreen presentation mode with audio chime and voice callout synthesis.
   - Now Serving multi-counter grid (Counters 1 through 5) in Navy + Teal high contrast.
   - Upcoming waiting queue feed and recently completed tokens.

3. **Service Counter Staff Console**:
   - Dedicated station controls (Counter 1 to 5).
   - One-click **Call Next Customer** with atomic transaction locks.
   - Instant Recall / Audio Re-announce.
   - Mark as Completed (records consultation duration).
   - Mark as No-show / Skipped.

4. **Administrator Command Center**:
   - Department and service configuration (custom avg service duration).
   - Service counter assignment and station status (open, busy, closed).
   - Search, filter, and audit all tokens.
   - Safe operational shift queue reset.
   - One-click CSV audit trail export.

---

## 🏗️ Project Structure

```text
smart-queue-system/
├── backend/                  # Python Flask Backend
│   ├── app.py                # Flask REST API endpoints
│   ├── database.py           # SQLite connection & schema initialization
│   ├── queue_service.py      # Queue FIFO/priority logic & wait estimation
│   └── test_queue.py         # Pytest / unittest test cases
├── server/                   # Express Full-Stack Node SQLite Engine
│   ├── db.ts                 # SQLite WebAssembly integration (sql.js)
│   └── routes.ts             # REST API router
├── src/                      # React Frontend (TypeScript + Tailwind CSS)
│   ├── components/           # UI Components
│   │   ├── Navbar.tsx
│   │   ├── CustomerKiosk.tsx
│   │   ├── MyTicketView.tsx
│   │   ├── PublicDisplayBoard.tsx
│   │   ├── StaffCounterConsole.tsx
│   │   └── AdminDashboard.tsx
│   ├── types/
│   │   └── queue.ts
│   ├── utils/
│   │   └── audio.ts          # Web Audio & Speech synthesis chime
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── queue_system.sqlite       # Local SQLite Database file
├── requirements.txt          # Python dependencies
├── package.json              # Node.js dependencies
└── README.md                 # Complete documentation
```

---

## 🚀 Setup & Execution on Windows using VS Code

### Step 1: Open Project in VS Code
Open VS Code, press `Ctrl + ~` to open the integrated terminal.

### Step 2: Set Up Python Virtual Environment
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment in PowerShell
.\venv\Scripts\activate
# If using Command Prompt: .\venv\Scripts\activate.bat
```

### Step 3: Install Python Dependencies
```powershell
pip install -r requirements.txt
```

### Step 4: Initialize the SQLite Database
```powershell
python -m backend.database
```
*Creates all tables (`users`, `departments`, `services`, `service_counters`, `queue_tokens`, `service_history`, `notifications`) and seeds demo accounts.*

### Step 5: Run Automated Unit Tests
```powershell
python -m unittest backend/test_queue.py -v
```

### Step 6: Start the Flask Backend Server
```powershell
python -m backend.app
```
*The backend REST API will start at `http://127.0.0.1:5000`.*

### Step 7: Start the React Frontend
Open a second terminal tab in VS Code:
```powershell
npm install
npm run dev
```
*Open `http://localhost:3000` in your browser.*

---

## 🔑 Pre-Configured Demo Credentials

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@queuesmart.io` | `admin123` | System config, reports, queue reset, CSV export |
| **Counter Staff** | `staff1@queuesmart.io` | `staff123` | Call next token, complete, skip, recall |
| **Customer** | `customer@queuesmart.io` | `customer123` | Self-service kiosk, ticket tracking, cancel |

---

## 📊 Database Schema (SQLite)

- `users`: ID, name, email, phone, role, password_hash, created_at
- `departments`: ID, name, code, description, icon, is_active
- `services`: ID, department_id, name, avg_duration_mins, base_priority
- `service_counters`: ID, counter_number, name, department_id, current_staff_id, status
- `queue_tokens`: ID, token_number, user_id, customer_name, customer_phone, department_id, service_id, counter_id, status, priority_level, estimated_wait_mins, actual_wait_mins, service_duration_mins, issue_time, call_time, completion_time
- `service_history`: ID, token_id, action, performed_by, timestamp, details
- `notifications`: ID, user_id, token_id, title, message, is_read, type
