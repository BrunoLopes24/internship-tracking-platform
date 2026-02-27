# StageSync — Internship Management Dashboard

A production-ready full-stack application for tracking internship hours, monitoring progress, and generating professional reports. Built with Express, React, TypeScript, PostgreSQL, and Prisma.

## 🎯 Features

| Feature | Description |
|---------|-------------|
| **Hour Tracking** | Log daily activities and hours with validation |
| **Smart End Date** | Automatic estimated end date calculation excluding weekends and Portuguese holidays |
| **Portuguese Holidays** | Algorithmic calculation (Meeus/Jones/Butcher) — no hardcoded dates |
| **Dashboard** | KPI cards, progress bar, weekly/monthly charts, interactive calendar |
| **Alerts** | Warnings for skipped days, low averages, and milestone notifications |
| **Reports** | Mid-term (320h) and final (640h) reports with PDF export |
| **Dark Mode** | Toggle between dark and light themes |
| **CSV Export** | Export daily logs to CSV for spreadsheets |
| **Backup/Restore** | Full data backup and restore functionality |
| **File Attachments** | Upload files to daily log entries |
| **Responsive** | Works on desktop, tablet, and mobile |

## 🏗️ Project Structure

```
Controlo_Estagio/
├── backend/                    # Express API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (6 models)
│   │   └── seed.ts             # Example data
│   ├── src/
│   │   ├── index.ts            # Server entry point
│   │   ├── config/database.ts  # Prisma client singleton
│   │   ├── models/types.ts     # TypeScript interfaces
│   │   ├── services/
│   │   │   ├── internshipService.ts  # Core business logic
│   │   │   └── pdfService.ts         # PDF generation
│   │   ├── routes/
│   │   │   ├── config.ts       # GET/POST /api/config
│   │   │   ├── logs.ts         # CRUD /api/logs + CSV export
│   │   │   ├── dashboard.ts    # /api/dashboard + alerts + holidays
│   │   │   ├── reports.ts      # /api/reports + PDF download
│   │   │   └── backup.ts       # /api/backup + /api/restore
│   │   ├── middleware/upload.ts # Multer file uploads
│   │   └── utils/holidays.ts   # Portuguese holiday calculator
│   ├── Dockerfile
│   └── package.json
├── frontend/                   # Vite + React
│   ├── src/
│   │   ├── main.tsx            # Entry point
│   │   ├── App.tsx             # Router + Navbar
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx   # KPIs, charts, calendar, alerts
│   │   │   ├── Configuration.tsx
│   │   │   ├── DailyLog.tsx    # CRUD table + modal
│   │   │   └── Reports.tsx     # Mid-term/final reports
│   │   ├── context/ThemeContext.tsx
│   │   ├── config/api.ts
│   │   ├── types/index.ts
│   │   └── styles/index.css    # Full design system
│   ├── nginx.conf
│   ├── vercel.json
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml          # 3 services: db, backend, frontend
├── render.yaml                 # Render deployment blueprint
├── .env.example
└── package.json                # Root monorepo scripts
```

## 🚀 Quick Start

### Option 1: Podman / Docker (Recommended)

```bash
# Clone and enter the project
cd Controlo_Estagio

# Start all services
podman compose up --build
# or: docker compose up --build

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:5001/api
# Database: localhost:5432
```

### Option 2: Local Development

```bash
# 1. Install dependencies
npm run install-all

# 2. Set up PostgreSQL (you need a running PostgreSQL instance)
cp .env.example .env
# Edit .env with your DATABASE_URL

# 3. Run database migrations
cd backend
npx prisma migrate dev --name init
npx prisma db seed
cd ..

# 4. Start development servers
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:5001
```

## 🗄️ Database

### Schema (6 Models)

| Model | Purpose |
|-------|---------|
| `InternshipConfig` | Global settings (start date, hours, working days) |
| `DailyLog` | Daily work entries with unique date constraint |
| `FileAttachment` | Files attached to daily logs |
| `Alert` | System notifications (skipped days, milestones) |
| `Report` | Mid-term and final report data (JSON content) |
| `Backup` | Full data backup snapshots |

### Migrations

```bash
cd backend
npx prisma migrate dev --name your_migration_name   # Development
npx prisma migrate deploy                             # Production
npx prisma studio                                     # Visual DB editor
```

## 🇵🇹 Portuguese Holidays

All holidays calculated algorithmically using the **Meeus/Jones/Butcher** algorithm for Easter:

**Fixed:** New Year, Freedom Day (Apr 25), Labour Day (May 1), Portugal Day (Jun 10), Assumption (Aug 15), Republic Day (Oct 5), All Saints (Nov 1), Independence (Dec 1), Christmas

**Movable:** Good Friday (Easter-2), Easter Sunday, Corpus Christi (Easter+60)

## 🌐 Deployment

### Frontend → Vercel
1. Import `frontend/` directory in Vercel
2. Set `VITE_API_URL` to your backend URL
3. Update `vercel.json` rewrite destination

### Backend → Render
1. Use `render.yaml` blueprint or manual setup
2. Connect your PostgreSQL database
3. Set `DATABASE_URL` environment variable

### Database → Neon
1. Create a Neon project at neon.tech
2. Copy the connection string to `DATABASE_URL`
3. Set `DIRECT_URL` to the direct (non-pooled) connection

## 📊 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/config` | GET/POST | Internship configuration |
| `/api/logs` | GET/POST | Daily log entries |
| `/api/logs/:id` | PUT/DELETE | Update/delete a log |
| `/api/logs/export/csv` | GET | Export logs as CSV |
| `/api/dashboard` | GET | Dashboard metrics |
| `/api/dashboard/alerts` | GET | Active alerts |
| `/api/dashboard/alerts/:id/dismiss` | POST | Dismiss alert |
| `/api/dashboard/holidays/:year` | GET | Holidays for a year |
| `/api/reports` | GET/POST | Report list/creation |
| `/api/reports/:id` | GET/PUT | Get/update report |
| `/api/reports/:id/pdf` | GET | Download report PDF |
| `/api/backup` | POST | Create backup |
| `/api/restore` | POST | Restore from backup |
| `/api/backups` | GET | List backups |
| `/api/health` | GET | Health check |

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5001 | Backend server port |
| `NODE_ENV` | development | Environment mode |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `DIRECT_URL` | — | Direct PostgreSQL URL (for Neon) |
| `VITE_API_URL` | /api | Frontend API base URL |
| `TZ` | Europe/Lisbon | Timezone |
| `RESET_SECRET` | — | Secret key for DB reset endpoint |
| `UPLOAD_DIR` | ./uploads | File upload directory |
| `MAX_FILE_SIZE_MB` | 10 | Maximum upload file size |

---

**Version**: 1.0.0 · **Last Updated**: February 2026 · **Status**: Production Ready
