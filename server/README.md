# StudyHabits Server

API server built with **Node.js**, **TypeScript**, **Express**, and **mysql2**.

## Project Structure

```
src/
├── config/
│   └── db.ts              # mysql2 connection pool
├── routes/
│   └── health.routes.ts   # Health check endpoint
├── app.ts                 # Express app setup
└── index.ts               # Entry point
```

## Prerequisites

- Node.js 18+
- A running MySQL server

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file from the example and fill in your database credentials:

   ```bash
   cp .env.example .env
   ```

   | Variable      | Default     |
   | ------------- | ----------- |
   | `PORT`        | `3000`      |
   | `DB_HOST`     | `localhost` |
   | `DB_PORT`     | `3306`      |
   | `DB_USER`     | `root`      |
   | `DB_PASSWORD` | —           |
   | `DB_NAME`     | `studyhabits` |

## Commands

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start with hot-reload (tsx)              |
| `npm run build` | Compile TypeScript to `dist/`            |
| `npm start`     | Run the compiled build                   |
| `npm run lint`  | Type-check without emitting (`tsc --noEmit`) |

## Endpoints

- `GET /health` — returns server and database connectivity status.
