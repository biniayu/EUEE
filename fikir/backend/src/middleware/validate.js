import { body, param, validationResult } from 'express-validator';

/** Phase 14: Central validation result → JSON error. */
export function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const first = result.array({ onlyFirstError: true })[0];
    return res.status(400).json({
      success: false,
      error: first.msg || 'Invalid request data.',
    });
  }
  return next();
}

export const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required.'),
  body('password').isString().notEmpty().withMessage('Password is required.'),
];

export const signupRules = [
  body('email').trim().isEmail().withMessage('Valid email is required.'),
  body('password')
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters.'),
  body('name').optional().trim().isLength({ min: 1, max: 200 }),
  body('fullName').optional().trim().isLength({ min: 1, max: 200 }),
  body().custom((_, { req }) => {
    const n = String(req.body?.name ?? req.body?.fullName ?? '').trim();
    if (!n) throw new Error('Name or fullName is required.');
    if (n.length > 200) throw new Error('Name must be at most 200 characters.');
    return true;
  }),
  body('gradeLevel').optional().trim().isLength({ max: 80 }),
  body('stream').optional().trim().isLength({ max: 120 }),
  body('targetUniversity').optional().trim().isLength({ max: 255 }),
];

export const resourceSubjectRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid resource id.'),
  body('subjectId').custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    const n = Number(value);
    return Number.isInteger(n) && n >= 1;
  }).withMessage('Invalid subject id.'),
];

export const chatbotPostRules = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 8000 })
    .withMessage('Message must be 1–8000 characters.'),
  body('context').optional().isObject().withMessage('context must be an object when provided.'),
];

export const practiceStartRules = [
  body('type').isIn(['subject', 'topic', 'mock']).withMessage('type must be subject, topic, or mock.'),
  body('subjectId')
    .optional({ nullable: true })
    .custom((v, { req }) => {
      if (req.body.type === 'mock') return true;
      const n = Number(v);
      return Number.isInteger(n) && n >= 1;
    })
    .withMessage('subjectId is required for subject and topic practice.'),
  body('topic').optional().trim().isLength({ max: 400 }),
  body().custom((_, { req }) => {
    if (req.body.type === 'topic') {
      const t = String(req.body.topic ?? '').trim();
      if (!t) throw new Error('topic is required for topic practice.');
    }
    return true;
  }),
  body('targetQuestions').optional().isInt({ min: 5, max: 30 }),
];

export const practiceSubmitAnswerRules = [
  body('sessionId').isInt({ min: 1 }).withMessage('sessionId is required.'),
  body('questionId').isInt({ min: 1 }).withMessage('questionId is required.'),
  body('selectedAnswer').optional(),
  body('skipped').optional().isBoolean(),
  body('markForReview').optional().isBoolean(),
];

export const practiceCompleteRules = [
  body('sessionId').isInt({ min: 1 }).withMessage('sessionId is required.'),
  body('timeTakenSeconds').optional().isInt({ min: 0, max: 86400 }),
];

export const studyPlanGenerateRules = [
  body('examDate')
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('examDate must be YYYY-MM-DD.'),
  body('hoursPerWeek').isFloat({ min: 3, max: 60 }).withMessage('hoursPerWeek must be between 3 and 60.'),
  body('preferences')
    .optional({ nullable: true })
    .custom((v) => v == null || (typeof v === 'object' && !Array.isArray(v)))
    .withMessage('preferences must be an object when provided.'),
];

export const studyPlanCompleteTaskRules = [
  body('taskId').isInt({ min: 1 }).withMessage('taskId is required.'),
];

export const studyPlanAdjustRules = [
  body('moves').optional().isArray(),
  body('swaps').optional().isArray(),
  body('durationUpdates').optional().isArray(),
];

export const onboardingProfileRules = [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Name is required.'),
  body('stream')
    .optional({ checkFalsy: true })
    .trim()
    .equals('Natural Science')
    .withMessage('Stream must be Natural Science.'),
  body('targetUniversity').optional().trim().isLength({ max: 255 }),
];

export const onboardingPreferencesRules = [
  body('hoursPerWeek').isFloat({ min: 1, max: 80 }).withMessage('Hours per week must be between 1 and 80.'),
  body('preferredStudyTimes')
    .isArray({ min: 1 })
    .withMessage('Select at least one preferred study time.'),
  body('languagePreference').trim().notEmpty().withMessage('Language preference is required.'),
];

export const onboardingDiagnosticRules = [
  body('answers')
    .isArray({ min: 30, max: 30 })
    .withMessage('Diagnostic answers must include exactly 30 responses.'),
];

export const lessonCompleteRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid lesson id.'),
  body('timeSpentSeconds').optional().isInt({ min: 0, max: 86400 }),
];

export const questionAttemptRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid question id.'),
  body('selectedAnswer').isString().trim().notEmpty().withMessage('selectedAnswer is required.'),
];

export const questionFavoriteRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid question id.'),
  body('favorite').isBoolean().withMessage('favorite must be true or false.'),
];

export const notificationIdReadRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid notification id.'),
];
