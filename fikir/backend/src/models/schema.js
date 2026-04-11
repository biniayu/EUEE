/**
 * Phase 4 core schema — table names and documentation.
 * Actual DDL lives in config/migrations.js (run on server start).
 */

export const TABLES = {
  USERS: 'users',
  STUDENT_PROFILES: 'studentProfiles',
  SUBJECTS: 'subjects',
  LESSONS: 'lessons',
  LESSON_PROGRESS: 'lesson_progress',
  QUESTIONS: 'questions',
  QUESTION_ATTEMPTS: 'question_attempts',
  PRACTICE_SESSIONS: 'practice_sessions',
  SESSION_QUESTIONS: 'session_questions',
  WEAK_AREAS: 'weak_areas',
  AI_RECOMMENDATIONS: 'ai_recommendations',
  STUDY_PLANS: 'study_plans',
  STUDY_PLAN_TASKS: 'study_plan_tasks',
  STUDY_MATERIALS: 'study_materials',
  NOTIFICATIONS: 'notifications',
};
