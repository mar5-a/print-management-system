# 🖨️ Print Management System - Backend

Backend API for the Print Management System using Node.js, Express, TypeScript, and PostgreSQL.

## 📋 Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm 10+

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your database credentials
```

Database Setup
bash
# Create database
createdb print_management_dev

# Run migrations
psql $DATABASE_URL -f src/db/migrations/001_create_enums.sql
psql $DATABASE_URL -f src/db/migrations/002_create_core_tables.sql
psql $DATABASE_URL -f src/db/migrations/003_create_indexes.sql

# Seed with mock data (coming soon)
npm run db:seed
Development
bash
npm run dev
Server runs on http://localhost:4000

📁 Project Structure
Code
src/
├── db/
│   ├── migrations/     # SQL migration files
│   ├── client.ts       # Database connection pool
│   └── seed.ts         # Mock data seeding
├── routes/             # API endpoints
├── services/           # Business logic
├── lib/                # Utilities and helpers
├── types/              # TypeScript types
├── middleware/         # Express middleware
└── server.ts           # Express app setup
Code

---

## **✅ Checkpoint 3: Verify Everything**

Open your terminal and run:

```bash
cd backend
npm install
```

You should see all dependencies being installed! ✅
