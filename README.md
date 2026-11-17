# EUEE Prep

A web-based study platform for Grade 12 students preparing for the Ethiopian University Entrance Examination (EUEE). EUEE Prep brings practice, learning resources, and progress tracking together in one place.

## Features

- **Practice and mock exams** — work through subject- and topic-based questions, timed practice, and exam-style sessions.
- **AI study support** — use the in-app tutor for EUEE-related questions and explanations.
- **Study plans** — generate a personalized plan based on your exam date and weekly study availability.
- **Progress analytics** — review recent practice, performance trends, and areas that need more attention.
- **Lessons and subjects** — access learning content and track lesson completion.
- **Study resources** — upload and manage learning materials.
- **Student dashboard** — get a central view of tasks, progress, and notifications.

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Integrations:** Groq for AI features; Cloudinary for resource uploads

## Repository structure

The application source lives in the `fikir/` directory.

```text
fikir/
├── backend/       # Express API and database migrations
├── frontend/      # React + Vite web application
└── TESTING.md     # Manual testing checklist
```

## Prerequisites

- Node.js (a current LTS release is recommended) and npm
- PostgreSQL
- A Groq API key for AI tutor and study-plan features (optional)
- Cloudinary credentials for resource uploads (optional)

## Getting started

### 1. Configure the backend

```bash
cd fikir/backend
npm install
cp .env.example .env
```

Edit `fikir/backend/.env` and set your PostgreSQL connection and a secure JWT secret. For example:

```dotenv
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/euee_prep
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
```

Create the database named in `DATABASE_URL` before starting the API. The application runs its database migrations during startup.

To enable optional integrations, configure `GROQ_API_KEY` (and, if needed, `GROQ_MODEL`) for AI features, and the `CLOUDINARY_*` variables for uploads. See [`fikir/backend/.env.example`](fikir/backend/.env.example) for the full list. Never commit your `.env` file or real credentials.

### 2. Start the API

From `fikir/backend/`:

```bash
npm run dev
```

The API listens on `http://localhost:5000` by default.

### 3. Start the frontend

In a second terminal:

```bash
cd fikir/frontend
npm install
npm run dev
```

Open the local URL printed by Vite (by default, `http://localhost:5173`). The Vite development server proxies `/api` requests to the backend at `http://localhost:5000`.

## Production build

Build the frontend, then run the backend in production mode. The production API serves the built frontend from `fikir/frontend/dist`.

```bash
cd fikir/frontend
npm install
npm run build

cd ../backend
npm install
# Set production environment variables, then:
NODE_ENV=production npm start
```

Set `DATABASE_URL` and a strong `JWT_SECRET` in the production environment. Configure CORS, hosting, and any external service credentials according to your deployment environment.

## Testing

See [`fikir/TESTING.md`](fikir/TESTING.md) for the manual end-to-end testing checklist. The checklist covers signup and onboarding, lessons, practice, AI tutoring, study plans, uploads, and notifications. The package manifests currently provide development and build scripts; automated tests are not yet configured.

## Contributing

Contributions and suggestions are welcome. For substantial changes, please open an issue to discuss the proposed work before submitting a pull request. Keep credentials and personal data out of commits, and include relevant testing details with your changes.

## License

No license is currently specified. Unless a license is added to this repository, all rights remain with the copyright holder.
