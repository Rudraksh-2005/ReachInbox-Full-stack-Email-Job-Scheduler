# ReachInbox Full-stack Email Job Scheduler

A production-grade email scheduler service and frontend dashboard built for the ReachInbox hiring assignment. This application allows users to schedule bulk email outreach campaigns with precise delay settings, rate limits, and real-time processing through BullMQ and Redis.

## 🚀 Features Implemented

### Backend
- **Scheduler**: Utilizes BullMQ's delayed jobs feature backed by Redis (no cron jobs used) to handle reliable execution of scheduled tasks.
- **Persistence**: BullMQ guarantees job idempotency and persistence. If the server crashes or restarts, future scheduled emails will remain safely in Redis and execute precisely at their requested time when the worker comes back online.
- **Rate Limiting & Concurrency**: Configurable `WORKER_CONCURRENCY` handles multiple jobs in parallel. Redis is used for strict rate limiting (max emails per hour per sender). If a sender hits their limit, their remaining jobs are delayed into the next hour window rather than dropping them.
- **Minimum Delays**: Throttles individual email sends via a configured minimum delay logic inside the worker to mimic real-world provider throttling.
- **Slack Notifications**: Integrating Slack OAuth, when an hourly rate limit is hit, an automated alert is fired to the user's connected Slack channel.
- **Elasticsearch Search**: Seamlessly indexes email jobs to Elasticsearch upon completion for fast, scalable searching.
- **Ethereal SMTP**: Mocks successful/failed email delivery using Ethereal's test SMTP service.

### Frontend
- **Google OAuth Login**: Complete authentication flow with Google via `@react-oauth/google`.
- **Dashboard Interface**: A clean, modern UI built with Tailwind CSS mimicking professional SaaS applications.
- **Compose Interface**: A modal form enabling users to set subjects, bodies, start times, limits, and **upload `.csv` files** of leads to queue immediately.
- **Email Tables**: Live "Scheduled" and "Sent / Failed" tracking tables.
- **Elasticsearch Querying**: Live search input directly filtering emails via the backend Elasticsearch cluster.

---

## 🛠️ Architecture Overview

The system uses a **Monorepo** structure:
- **`backend`**: Express.js + TypeScript REST API. Uses Prisma ORM to interact with PostgreSQL. A BullMQ worker constantly listens for delayed jobs and processes them with defined concurrency. Redis handles both the BullMQ queue and rate-limiting distributed counters.
- **`frontend`**: React + TypeScript (Vite). Interfaces with the backend REST endpoints.
- **Infrastructure (`docker-compose.yml`)**: PostgreSQL (port 5434), Redis, and Elasticsearch. 

---

## 💻 Setup & Installation

### 1. Prerequisites
- [Docker & Docker Compose](https://www.docker.com/) (Required for DB, Redis, and ES)
- [Node.js](https://nodejs.org/) (v16+)

### 2. Environment Variables & Ethereal setup
Create a `.env` file in the `backend/` directory (`backend/.env`). A sample configuration:

```env
PORT=4000
DATABASE_URL="postgresql://admin:adminpassword@localhost:5434/reachinbox?schema=public"
REDIS_URL="redis://127.0.0.1:6379"
ELASTICSEARCH_URL="http://localhost:9200"

MAX_EMAILS_PER_HOUR_PER_SENDER=200
MIN_DELAY_BETWEEN_EMAILS_MS=2000
WORKER_CONCURRENCY=5

# Ethereal Email Credentials
# Generate real credentials at https://ethereal.email/create
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_USER="your_ethereal_email@ethereal.email"
SMTP_PASS="your_ethereal_password"

# OAuth (For live testing)
GOOGLE_CLIENT_ID="your_google_client_id"
SLACK_CLIENT_ID="your_slack_client_id"
```
*(To get Ethereal credentials, simply visit [ethereal.email](https://ethereal.email/create), click "Create Account", and paste the provided SMTP Username and Password into your `.env`.)*

### 3. Spin up Infrastructure
From the root directory, start the required databases via Docker:
```bash
docker-compose up -d
```
*(Note: If this is your first time, the Elasticsearch image is large and may take a few minutes to download).*

### 4. Install Dependencies
Install packages for the monorepo from the root:
```bash
npm install
```

### 5. Setup the Database
Navigate to the backend and push the Prisma schema to create the PostgreSQL tables:
```bash
cd backend
npx prisma db push
cd ..
```

### 6. Run the Application
You can run both the frontend and backend simultaneously from the root directory using the monorepo script:
```bash
npm run start:all
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000

---

## 🧪 Testing the Scheduler Resilience

To test that jobs survive a server restart without relying on cron jobs:
1. Start the app and log in to the frontend.
2. Click **Compose New** and schedule a CSV batch of emails for **5 minutes in the future**.
3. Verify they appear in the **Scheduled** tab.
4. Kill the backend Node.js process (`Ctrl+C`).
5. Wait a few seconds, then restart the backend (`npm run start:all`).
6. Observe that when the scheduled time arrives, the BullMQ worker seamlessly processes and sends the emails without restarting from scratch or duplicating jobs!
