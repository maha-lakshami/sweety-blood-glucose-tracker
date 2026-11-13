# Sweety – Blood Glucose Tracker 💜

Sweety is a full-stack web application that helps users record, manage and monitor their blood glucose readings. It provides a simple dashboard, reading history and reports for tracking glucose levels over different periods.

## Features

- User registration and login
- Secure password hashing using bcrypt
- JWT-based authentication
- Add, view, edit and delete glucose readings
- Four daily reading slots:
  - Morning (fasting)
  - After breakfast
  - After lunch
  - After dinner
- Dashboard with glucose statistics
- My Readings page for managing reading history
- Reports for daily, month-to-date and previous month
- User-specific reading access
- Input validation and duplicate reading prevention

## Technology Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React

**Backend**
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt

## Project Structure

```text
sweety-glucose-tracker/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.ts
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js and npm
- PostgreSQL
- Git

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/maha-lakshami/sweety-blood-glucose-tracker.git
cd sweety-blood-glucose-tracker
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` as a reference.

Configure your PostgreSQL connection and JWT secret in `.env`.

### 3. Set up the database

```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. Start the backend

```bash
npm run dev
```

Backend runs at:

`http://localhost:5000`

### 5. Configure the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

`http://localhost:5173`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |

### Glucose Readings

All reading endpoints require a valid JWT Bearer token.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/readings` | Add a reading |
| GET | `/api/readings` | View readings |
| PUT | `/api/readings/:id` | Update a reading |
| DELETE | `/api/readings/:id` | Delete a reading |

### Health Check

`GET /health`

## Validation and Assumptions

- Glucose values must be integers between 40 and 600 mg/dL.
- Future reading dates are not allowed.
- A user can record a maximum of four readings per day.
- Each reading slot can be recorded only once per date.
- Users can access only their own readings.
- Reports are calculated from the user's saved readings.

## Security

- Passwords are hashed using bcrypt.
- Protected API routes use JWT authentication.
- Environment variables and credentials must not be committed to GitHub.

## Future Improvements

- Export reports as PDF.
- Add glucose trend notifications.
- Improve mobile responsiveness.
- Add more advanced visual analytics.

## Author

Developed as a full-stack blood glucose tracking project.

**GitHub Repository:**  
https://github.com/maha-lakshami/sweety-blood-glucose-tracker
