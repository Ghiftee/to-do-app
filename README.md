# Focusboard — Todo + Notes App

A small full-stack productivity app built with Node.js, Express, and vanilla HTML/CSS/JavaScript.

## Features

- Create, edit, complete, and delete tasks
- Task descriptions, priorities, due dates, and categories
- Search, status filtering, priority filtering, and sorting
- Overdue task tracking and dashboard stats
- Create, edit, pin, search, and delete notes
- Notes can carry a lightweight tag
- Dark/light theme preference stored in the browser
- JSON-file persistence with atomic writes
- REST API with validation and basic automated API tests

## Requirements

- Node.js 20+
- npm

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

For development with automatic server restart:

```bash
npm run dev
```

## Tests

```bash
npm test
npm run check
```

## Project structure

```text
.
├── AGENTS.md
├── README.md
├── data/
│   └── db.json
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── src/
│   ├── app.js
│   ├── routes/
│   │   ├── notes.js
│   │   ├── stats.js
│   │   └── todos.js
│   ├── services/
│   │   └── store.js
│   └── utils/
│       └── validation.js
├── tests/
│   └── api.test.js
├── package.json
└── server.js
```

## API summary

- `GET /api/health`
- `GET /api/todos`
- `POST /api/todos`
- `PATCH /api/todos/:id`
- `DELETE /api/todos/:id`
- `GET /api/notes`
- `POST /api/notes`
- `PATCH /api/notes/:id`
- `DELETE /api/notes/:id`
- `GET /api/stats`

See `AGENTS.md` for detailed architecture and contribution guidance.

## Deploy to Railway

This project is deployment-ready for Railway. The application uses a JSON file for persistence, so production deployment should attach a Railway Volume.

1. Push this folder to a GitHub repository, or deploy it directly with the Railway CLI.
2. Create a Railway project and add this repository as a service.
3. Attach a Volume to the service and mount it at `/data`.
4. Add the service variable `DATA_FILE=/data/db.json`.
5. Enable Public Networking / Generate Domain in Railway.
6. Railway will use `npm start` and health-check `/api/health` based on `railway.json`.

The server reads Railway's injected `PORT` automatically and binds to `0.0.0.0`.

### Railway CLI alternative

```bash
npm install -g @railway/cli
railway login
railway up
```

After the initial service is created, attach the persistent volume in the Railway dashboard before relying on the app for saved data.

### Production storage

The default local datastore remains `./data/db.json`. In production, set `DATA_FILE` to a path inside a persistent volume. For Railway, the recommended setup for this project is:

```text
Volume mount path: /data
DATA_FILE=/data/db.json
```

Without a volume, data written to the deployed container can disappear when the service is redeployed or restarted.

