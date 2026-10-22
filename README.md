# FlagBoard

A feature flag dashboard with percentage rollouts, Redis caching and an audit log.

Toggle a feature on or off, or release it to a percentage of users, without redeploying.

## Features

- Create, list, update and delete flags per environment (dev / staging / prod)
- On/off toggle and rollout percentage slider
- Evaluation API: `GET /api/evaluate/:key?userId=...&env=...`
- Consistent rollout: the same user always gets the same result
- Redis cache with invalidation on every change
- Audit log: every create and update is recorded with old and new values
- Live demo page that reacts to dashboard changes

## Tech stack

Next.js, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Redis, Zod, Docker

## How rollout works

For a flag with a rollout percentage, a user's bucket is computed like this:

```
bucket = hash(flagKey + ":" + userId) % 100
enabled = bucket < rolloutPercent
```

- The same user and flag always give the same bucket, so users don't flip between old and new.
- Increasing 30% to 50% keeps the first 30% users enabled, because buckets don't change.
- The flag key is part of the hash, so different flags select different users.

## Architecture

```
Dashboard (Next.js) -> Flag API -> PostgreSQL (source of truth)
                                      |
                                      v
                                 Redis cache (60s TTL)
                                      ^
Client app -> GET /api/evaluate/:key -+
```

- Reads go to Redis first. On a miss, the flag is read from PostgreSQL and cached.
- Every update or delete clears the cached flag.
- If Redis is down, the API falls back to PostgreSQL. If the flag doesn't exist, it returns `enabled: false`.

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/flags?env=dev` | List flags |
| POST | `/api/flags` | Create a flag |
| PATCH | `/api/flags/:id` | Update enabled / rolloutPercent / name |
| DELETE | `/api/flags/:id` | Delete a flag |
| GET | `/api/flags/:id/history` | Audit log for a flag |
| GET | `/api/evaluate/:key?userId=&env=` | Is the flag enabled for this user? |

## Run locally

Requires Node.js and Docker.

```bash
git clone https://github.com/Jananisridhar4/flagboard.git
cd flagboard
cp .env.example .env
```

Fill in `.env`:

```
DATABASE_URL="postgresql://flagboard:flagboard@localhost:5432/flagboard"
REDIS_URL="redis://localhost:6379"
```

Start the database and Redis, then the app:

```bash
docker compose up -d postgres redis
npm install
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000 for the dashboard and http://localhost:3000/demo for the demo page.

### Run everything in Docker

```bash
docker compose up -d --build
```

The app is available at http://localhost:3001.

## Screenshots

![Dashboard](docs/dashboard.png)

![History panel](docs/history.png)

![Demo page](docs/demo.png)
## Limitations and future improvements

- Percentage rollout only, no user targeting rules
- The demo page polls every 2 seconds. Server-sent events or WebSockets would push changes instantly.
- Deleting a flag also deletes its audit history. A soft delete would keep it.
- No authentication yet. The audit log records every change as `admin`.