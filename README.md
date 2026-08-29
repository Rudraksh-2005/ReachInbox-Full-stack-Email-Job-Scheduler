# ReachInbox Full-stack Email Job Scheduler

A production-grade email scheduler service and frontend dashboard built for the ReachInbox hiring assignment. This application allows users to schedule bulk email outreach campaigns with precise delay settings, rate limits, and real-time processing through BullMQ and Redis.

## 🚀 Features Implemented

### Backend
- **Scheduler**: Utilizes BullMQ's delayed jobs feature backed by Redis (no cron jobs used) to handle reliable execution of scheduled tasks.
- **Persistence**: BullMQ guarantees job idempotency and persistence. Scheduled jobs survive server restarts and crashes.
- **Rate Limiting**: Redis is used for strict rate limiting (max emails per hour per sender). If a limit is hit, remaining jobs are delayed into the next hour window rather than dropping them.
- **Concurrency**: Configurable `WORKER_CONCURRENCY` handles multiple email-sending jobs in parallel.
- **Minimum Delays**: Throttles individual email sends via a configured minimum delay logic inside the worker to mimic real-world provider throttling.
- **Slack Notifications**: Integrating Slack OAuth, when an hourly rate limit is hit, an automated alert is fired to the user's connected Slack channel.
- **Elasticsearch Search**: Seamlessly indexes email jobs to Elasticsearch upon completion for fast, scalable searching.
- **Ethereal SMTP**: Mocks successful/failed email delivery using Ethereal's test SMTP service.

### Frontend
- **Login / Authentication**: Sleek mock Google authentication flow (can easily be swapped to real OAuth) storing user sessions.
- **Dashboard Interface**: A clean, modern UI built with Tailwind CSS v4 in Dark Mode mimicking premium SaaS applications.
- **Compose Interface**: A modal form enabling users to set subjects, bodies, start times, limits, and **upload `.csv` files** of leads to queue immediately.
- **Email Tables**: Live "Scheduled" and "Sent / Failed" tracking tables with clickable rows to view full email contents.
- **Delete Functionality**: Capability to instantly delete scheduled emails, removing them from PostgreSQL, Redis, and Elasticsearch simultaneously.
- **Elasticsearch Querying**: Live search input directly filtering emails via the backend Elasticsearch cluster.

---

## 🛠️ Architecture Overview

The system uses a **Monorepo** structure separating the `backend` and `frontend`. 

### How Scheduling Works
When a user uploads a CSV and schedules an email outreach, the backend loops through the recipients and creates an `EmailJob` in PostgreSQL with `status: 'SCHEDULED'`. Simultaneously, it calculates the delay from the current time to the requested scheduled time in milliseconds and adds the job to the **BullMQ** queue with that specific delay. The BullMQ worker continuously listens for jobs whose delay has expired and processes them.

### How Persistence on Restart is Handled
Because BullMQ stores the entire job queue state in **Redis** rather than in local memory, the queue is highly resilient. If the Node.js backend crashes, is killed, or restarts, no scheduled emails are lost. When the server boots back up and reconnects to Redis, the BullMQ worker simply resumes where it left off, instantly processing any jobs whose scheduled time arrived while the server was offline.

### How Rate Limiting & Concurrency are Implemented
- **Concurrency**: The BullMQ worker is instantiated with a `concurrency` setting (driven by the `WORKER_CONCURRENCY` env variable). This allows the Node.js process to pick up and process exactly that many jobs in parallel asynchronously.
- **Rate Limiting**: To respect hourly limits, the worker uses Redis to maintain a counter of emails sent by each specific sender within the current hour. Before sending an email, it checks this counter. If the limit (`MAX_EMAILS_PER_HOUR_PER_SENDER`) is reached, the worker throws a specific `RateLimitError`. BullMQ is configured to catch this error, apply an exponential backoff (or push it to the next hour), and safely return the job to the queue without marking it as failed.

---

## 💻 Setup & Installation

### 1. How to set up Ethereal Email and env variables
Create a `.env` file in the `backend/` directory (`backend/.env`). A sample configuration:

```env
PORT=4000
DATABASE_URL="postgresql://admin:adminpassword@localhost:5434/reachinbox?schema=public"
# When using Docker Compose, use these hostnames:
# DATABASE_URL="postgresql://admin:adminpassword@postgres:5432/reachinbox?schema=public"
# REDIS_URL="redis://redis:6379"
# ELASTICSEARCH_URL="http://elasticsearch:9200"

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
```
*(To get Ethereal credentials, simply visit [ethereal.email](https://ethereal.email/create), click "Create Account", and paste the provided SMTP Username and Password into your `.env`.)*

### 2. How to run backend
*Note: Make sure you have Docker running to spin up PostgreSQL, Redis, and Elasticsearch using `docker-compose up -d` in the root folder before starting the backend.*

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
The backend API and BullMQ worker will start on `http://localhost:4000`.

### 3. How to run frontend
Create a `.env` file in the `frontend/` directory (if you want to override the default local API url):
```env
VITE_API_URL=http://localhost:4000/api
```

Run the React development server:
```bash
cd frontend
npm install
npm run dev
```
The frontend dashboard will be available at `http://localhost:5173`.

---

### Alternative: Run Everything via Docker
If you want to run the **Backend, Frontend, and all 3 Databases** simultaneously without manually installing Node modules, run this single command in the root folder:

```bash
docker-compose up -d --build
```
This builds the Dockerfiles for both services and connects them automatically. The app will be accessible at `http://localhost:5173`.
