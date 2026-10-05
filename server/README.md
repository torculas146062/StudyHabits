# StudyHabits Server

API server built with **Node.js**, **TypeScript**, **Express**, and **mysql2**.

## Project Structure

```
src/
├── config/
│   └── db.ts                        # mysql2 connection pool (MySQL-specific)
├── repositories/
│   ├── IHealthRepository.ts         # IHealthRepository interface (port)
│   └── mysql/
│       └── MySqlHealthRepository.ts # MySQL implementation (owns all SQL)
├── routes/
│   └── health.ts          # Health check endpoint
├── container.ts           # Composition root: wires implementations
├── app.ts                 # Express app setup
└── index.ts               # Entry point
```

### Repository pattern

Route handlers never talk to the database directly. They depend on repository
interfaces (ports) in `src/repositories/`, while the database-specific
implementations live in a subfolder named after the technology
(`src/repositories/mysql/`). All SQL statements live in those implementations.

`src/container.ts` is the composition root — the only module that decides which
implementation is used. To switch databases, add an implementation for the new
database (e.g. `src/repositories/postgres/`) and point the container at it;
routes, app setup, and callers stay unchanged.

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
