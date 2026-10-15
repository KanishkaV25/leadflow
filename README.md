# LeadFlow

LeadFlow is a lightweight CRM for managing leads, tracking discussion history,
and scheduling follow-ups from a single dashboard.

## Features

- Create leads with a name, company, and phone number.
- Track lead status: New, Contacted, Qualified, Proposal Sent, Won, and Lost.
- Filter leads by status and search by name.
- View discussion history in newest-first order.
- Add discussion notes and optional follow-up dates and times.
- See today's follow-ups and overdue follow-ups on the dashboard.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic, SQLAlchemy
- Database: SQLite

## Prerequisites

Install:
- Node.js and npm
- Python 3.11 or a compatible Python version supported by the dependencies

## Local Setup

Run the frontend and backend in separate terminals.

### 1. Clone the repository

```bash
git clone https://github.com/KanishkaV25/leadflow.git
cd leadflow
```

### 2. Configure the frontend

Create the local environment file:

```bash
cp .env.example frontend/.env.local
```

The default API URL is:

`NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`

### 3. Start the backend

In the first terminal, from the repository root:

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate
python -m pip install -r requirements.txt
python create_tables.py
uvicorn app.main:app --reload
```

On Windows Command Prompt, activate the environment with:

```bat
.venv\Scripts\activate.bat
```

The API runs at `http://127.0.0.1:8000`.

Interactive API documentation is available at
`http://127.0.0.1:8000/docs`.

### 4. Start the frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Database and Seed Data

The backend uses SQLite. The database is created locally when you run
`python create_tables.py` from the `backend` directory.

A seed script is provided at `backend/seed.py`. Review its behavior before
running it against an existing database.

## Tests

From the repository root, activate the backend virtual environment and run:

```bash
cd backend
python -m pytest
```

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Health check |
| GET | `/api/leads` | List leads, with optional filters |
| POST | `/api/leads` | Create a lead |
| PATCH | `/api/leads/{lead_id}` | Update lead details or status |
| GET | `/api/leads/{lead_id}/discussions` | Retrieve discussion history |
| POST | `/api/leads/{lead_id}/discussions` | Add a discussion and optional follow-up |

## Design Notes

- A lead stores its current follow-up date, while each discussion can retain
  the follow-up associated with that conversation.
- Discussion history is returned newest first.
- SQLite is used to keep local setup lightweight.

## Known Limitations

- The application is intended as a lightweight assessment project, not a
  production CRM.
- Authentication is not included.
- The API currently returns the lead list without pagination.

## Project Structure

```text
leadflow/
├── backend/
│   ├── app/
│   ├── tests/
│   ├── create_tables.py
│   ├── requirements.txt
│   └── seed.py
├── frontend/
├── .env.example
├── .gitignore
└── README.md
```
