import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './config/db.js';
import { runMigrations } from './config/migrations.js';
import { createAuthController } from './controllers/authController.js';
import { createOnboardingController } from './controllers/onboardingController.js';
import * as coreController from './controllers/coreController.js';
import { createAuthRouter } from './routes/auth.js';
import { createOnboardingRouter } from './routes/onboarding.js';
import { createCoreRouter } from './routes/core.js';
import { createDashboardRouter } from './routes/dashboard.js';
import { createSubjectsRouter } from './routes/subjects.js';
import { createLessonsRouter } from './routes/lessons.js';
import { createChatbotRouter } from './routes/chatbot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const app = express();

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error', err);
});

app.use(
  cors({
    origin:
      NODE_ENV === 'production'
        ? true
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const authController = createAuthController({
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: JWT_EXPIRES_IN,
  nodeEnv: NODE_ENV,
});
const onboardingController = createOnboardingController();

app.use('/api/auth', createAuthRouter(authController));
app.use('/api/onboarding', createOnboardingRouter(onboardingController));
app.use('/api/core', createCoreRouter(coreController));
app.use('/api/dashboard', createDashboardRouter());
app.use('/api/subjects', createSubjectsRouter());
app.use('/api/lessons', createLessonsRouter());
app.use('/api/chatbot', createChatbotRouter());

if (NODE_ENV === 'production') {
  const dist = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

(async function start() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`Fikir API running on http://localhost:${PORT} (${NODE_ENV})`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
