# StudyHabits Server

API server built with **Node.js**, **TypeScript**, **Express**, and **mysql2**.

## Project Structure

```
src/
├── auth/
│   └── token.ts                     # JWT signing + secret validation
├── config/
│   └── db.ts                        # mysql2 connection pool (MySQL-specific)
├── repositories/
│   ├── IHealthRepository.ts         # IHealthRepository interface (port)
│   ├── IUserRepository.ts           # IUserRepository interface (port)
│   └── mysql/
│       ├── MySqlHealthRepository.ts # MySQL implementation (owns its SQL)
│       └── MySqlUserRepository.ts   # MySQL implementation (owns its SQL)
├── routes/
│   ├── auth.ts            # Sign-up / log-in endpoints
│   └── health.ts          # Health check endpoint
├── scripts/
│   └── seed.ts            # Applies db/seed.sql
├── services/
│   └── AuthService.ts     # Registration, login, password hashing
├── container.ts           # Composition root: wires implementations
├── app.ts                 # Express app setup
├── errors.ts              # Domain errors
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

   | Variable         | Default         |
   | ---------------- | --------------- |
   | `PORT`           | `3000`          |
   | `DB_HOST`        | `localhost`     |
   | `DB_PORT`        | `3306`          |
   | `DB_USER`        | `root`          |
   | `DB_PASSWORD`    | —               |
   | `DB_NAME`        | `studyhabits`   |
   | `JWT_SECRET`     | — (required)    |
   | `JWT_EXPIRES_IN` | `7d`            |

   Generate a signing secret with:

   ```bash
   openssl rand -base64 48
   ```

3. Create the database and tables:

   ```bash
   npm run db:seed
   ```

## Commands

| Command         | Description                                              |
| --------------- | -------------------------------------------------------- |
| `npm run dev`   | Start with hot-reload (tsx)                              |
| `npm run db:seed` | Apply `db/seed.sql` (creates the database and `users` table) |
| `npm run build` | Compile TypeScript to `dist/`                            |
| `npm start`     | Run the compiled build                                   |
| `npm run lint`  | Type-check without emitting (`tsc --noEmit`)             |

## Endpoints

### `GET /health`

Returns server and database connectivity status.

### `POST /auth/register`

Creates an account and returns an auth token.

```json
{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "correct horse battery" }
```

Responds `201` with:

```json
{
  "token": "<jwt>",
  "user": { "id": 1, "name": "Ada Lovelace", "email": "ada@example.com" }
}
```

Errors: `400` when input is invalid (the body includes a `fields` object naming each
problem), `409` when the email is already registered.

### `POST /auth/login`

Verifies credentials and returns an auth token.

```json
{ "email": "ada@example.com", "password": "correct horse battery" }
```

Responds `200` with the same body shape as `/auth/register`.
Errors: `400` when input is invalid, `401` for an unknown email **or** a wrong password.

## Security

- Passwords are hashed with bcrypt (work factor 10); plaintext is never stored or logged.
- Every statement is parameterised, so user input is never interpolated into SQL.
- Sign-up validates email format and password length, and rejects passwords over
  bcrypt's 72-byte limit (longer ones would be silently truncated).
- Login failures are indistinguishable: an unknown email and a wrong password return
  the same `401`, and a bcrypt comparison always runs so response times can't be used
  to discover which emails have accounts.
- `/auth` is rate limited to 20 requests per 15 minutes per client to slow brute-force
  and credential-stuffing attempts.
- `email` is unique and stored lower-cased, so addresses can't be registered twice with
  different casing.
- `JWT_SECRET` has no default — the server refuses to start unless it is set to at least
  32 characters.

Not handled here, but needed before production:

- Terminate TLS so credentials and tokens are only sent over HTTPS.
- Set `app.set('trust proxy', 1)` when running behind a reverse proxy, otherwise rate
  limiting sees the proxy's IP for every request.
- Restrict CORS to the client's origin and add security headers (e.g. `helmet`).
- Signed tokens are issued on login/registration; protecting routes with them
  (verification middleware) comes with the first authenticated endpoint.
