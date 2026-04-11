import { pool } from './db.js';

/** Legacy Phases 1–3 */
async function migrateLegacy() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS gradeLevel VARCHAR(50),
      ADD COLUMN IF NOT EXISTS stream VARCHAR(100) DEFAULT 'Natural Science',
      ADD COLUMN IF NOT EXISTS targetUniversity VARCHAR(255),
      ADD COLUMN IF NOT EXISTS weakSubjects JSONB DEFAULT '[]'::jsonb;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS studentProfiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      preferences JSONB DEFAULT '{}'::jsonb,
      onboarding_status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    ALTER TABLE studentProfiles
      ADD COLUMN IF NOT EXISTS diagnostic_results JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS initial_study_plan JSONB DEFAULT '{}'::jsonb;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON studentProfiles(user_id);
  `);
}

/** Phase 4 — core learning schema */
async function migrateCoreTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS subjects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE,
      description TEXT,
      euee_weightage NUMERIC(5,2) DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lessons (
      id SERIAL PRIMARY KEY,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'text')),
      content_url TEXT,
      text_content TEXT,
      difficulty VARCHAR(32) DEFAULT 'medium',
      tags JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON lessons(subject_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      completed BOOLEAN DEFAULT FALSE,
      time_spent INTEGER DEFAULT 0,
      completed_at TIMESTAMP,
      UNIQUE (user_id, lesson_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      topic VARCHAR(255) NOT NULL,
      question_text TEXT NOT NULL,
      options JSONB NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      difficulty VARCHAR(32) DEFAULT 'medium',
      question_type VARCHAR(32) NOT NULL DEFAULT 'multiple_choice'
        CHECK (question_type IN ('multiple_choice', 'short_answer'))
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS question_attempts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      selected_answer TEXT,
      is_correct BOOLEAN DEFAULT FALSE,
      attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON question_attempts(user_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_question_attempts_question ON question_attempts(question_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS practice_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_type VARCHAR(32) NOT NULL CHECK (session_type IN ('subject', 'mock')),
      total_questions INTEGER DEFAULT 0,
      score NUMERIC(6,2),
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_practice_sessions_user ON practice_sessions(user_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS session_questions (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      UNIQUE (session_id, question_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_session_questions_session ON session_questions(session_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_session_questions_question ON session_questions(question_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS weak_areas (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      topic VARCHAR(255) NOT NULL,
      strength_score INTEGER NOT NULL CHECK (strength_score >= 0 AND strength_score <= 100),
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, subject_id, topic)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_weak_areas_user ON weak_areas(user_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_weak_areas_subject ON weak_areas(subject_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_recommendations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recommendation_type VARCHAR(64) NOT NULL,
      content JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON ai_recommendations(user_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS study_plans (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_hours_per_week NUMERIC(6,2) NOT NULL,
      status VARCHAR(32) DEFAULT 'active'
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS study_plan_tasks (
      id SERIAL PRIMARY KEY,
      study_plan_id INTEGER NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
      day VARCHAR(32) NOT NULL,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
      question_set VARCHAR(255),
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      completed BOOLEAN DEFAULT FALSE
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_plan ON study_plan_tasks(study_plan_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS study_materials (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_name VARCHAR(255) NOT NULL,
      cloudinary_url TEXT NOT NULL,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
      tags JSONB DEFAULT '[]'::jsonb,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_study_materials_user ON study_materials(user_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_study_materials_subject ON study_materials(subject_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(64) DEFAULT 'info',
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
  `);

  /** Link studentProfiles to subjects + optional active study plan */
  await pool.query(`
    ALTER TABLE studentProfiles
      ADD COLUMN IF NOT EXISTS primary_subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL;
  `);

  await pool.query(`
    ALTER TABLE studentProfiles
      ADD COLUMN IF NOT EXISTS active_study_plan_id INTEGER REFERENCES study_plans(id) ON DELETE SET NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_student_profiles_primary_subject ON studentProfiles(primary_subject_id);
  `);
}

async function seedSubjects() {
  const count = await pool.query('SELECT COUNT(*)::int AS c FROM subjects');
  if (count.rows[0].c > 0) return;

  const rows = [
    ['Mathematics', 'Algebra, geometry, and quantitative reasoning for EUEE.', 20],
    ['Physics', 'Mechanics, electricity, waves, and modern topics.', 18],
    ['Chemistry', 'Organic, inorganic, and physical chemistry foundations.', 18],
    ['Biology', 'Cell biology, genetics, ecology, and human physiology.', 18],
    ['English', 'Reading comprehension, grammar, and writing skills.', 13],
    ['SAT', 'Scholastic Aptitude Test style reasoning and problem solving.', 13],
  ];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [name, description, weight] of rows) {
      await client.query(
        `INSERT INTO subjects (name, description, euee_weightage) VALUES ($1, $2, $3)`,
        [name, description, weight]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function seedQuestions() {
  const count = await pool.query('SELECT COUNT(*)::int AS c FROM questions');
  if (count.rows[0].c >= 20) return;

  const subjectRows = await pool.query(`SELECT id, name FROM subjects`);
  const byName = Object.fromEntries(subjectRows.rows.map((r) => [r.name, r.id]));

  const samples = [
    ['Mathematics', 'Algebra', 'Solve 2x + 5 = 15. What is x?', ['2', '3', '5', '7'], '2', 'Subtract 5 then divide by 2.'],
    ['Mathematics', 'Geometry', 'Sum of angles in a triangle?', ['90°', '180°', '270°', '360°'], '1', 'Interior angles sum to 180°.'],
    ['Mathematics', 'Arithmetic', '15% of 200 equals?', ['20', '25', '30', '35'], '2', '0.15 × 200 = 30.'],
    ['Mathematics', 'Functions', 'Which is linear in x?', ['x^2', '2x+1', '1/x', '√x'], '1', 'Linear means degree 1 in x.'],

    ['Physics', 'Mechanics', 'SI unit of force?', ['Joule', 'Newton', 'Watt', 'Pascal'], '1', 'Force is measured in newtons.'],
    ['Physics', 'Waves', 'Light speed is fastest in?', ['Water', 'Air', 'Glass', 'Vacuum'], '3', 'c is maximum in vacuum.'],
    ['Physics', 'Electricity', 'Device to measure current?', ['Voltmeter', 'Ammeter', 'Barometer', 'Hydrometer'], '1', 'Ammeter measures current.'],
    ['Physics', 'Thermodynamics', 'Water boils at 100°C at?', ['sea level', 'only vacuum', 'always 50°C', '0 K'], '0', 'Standard atmospheric pressure.'],

    ['Chemistry', 'Atomic structure', 'Atomic number counts?', ['Neutrons', 'Protons', 'Molecules', 'Ions'], '1', 'Atomic number = protons.'],
    ['Chemistry', 'Acids', 'pH 7 is?', ['acidic', 'basic', 'neutral', 'salt only'], '2', 'Neutral on pH scale.'],
    ['Chemistry', 'Bonding', 'NaCl is a?', ['covalent crystal', 'ionic compound', 'noble gas', 'acid'], '1', 'Sodium chloride is ionic.'],
    ['Chemistry', 'Organic', 'General formula of alkanes?', ['CnH2n', 'CnH2n+2', 'CnHn', 'CnH2n-2'], '1', 'Saturated hydrocarbons.'],

    ['Biology', 'Cell', 'Basic unit of life?', ['Atom', 'Cell', 'Tissue', 'Organ'], '1', 'Cell theory.'],
    ['Biology', 'Photosynthesis', 'Main site in plant cells?', ['Mitochondria', 'Chloroplast', 'Nucleus', 'Ribosome'], '1', 'Chloroplasts host chlorophyll.'],
    ['Biology', 'Genetics', 'DNA stores?', ['lipids', 'genetic information', 'glucose only', 'oxygen'], '1', 'DNA encodes hereditary info.'],
    ['Biology', 'Ecology', 'Producers in food chains are mostly?', ['fungi', 'plants', 'carnivores', 'decomposers'], '1', 'Plants photosynthesize.'],

    ['English', 'Grammar', 'Choose: She ___ to school daily.', ['go', 'goes', 'gone', 'going'], '1', 'Third-person singular present.'],
    ['English', 'Vocabulary', 'Synonym of "rapid"?', ['slow', 'quick', 'calm', 'weak'], '1', 'Rapid ≈ quick.'],

    ['SAT', 'Reasoning', 'If all Bloops are Razzies and all Razzies are Lazzies, then all Bloops are?', ['Bloops', 'Razzies', 'Lazzies', 'None'], '2', 'Transitive deduction.'],
    ['SAT', 'Numbers', 'Which is largest?', ['0.9', '0.89', '0.099', '0.909'], '3', 'Compare decimal places.'],
  ];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [subName, topic, text, opts, correctIdx, expl] of samples) {
      const sid = byName[subName];
      if (!sid) continue;
      const optionsJson = JSON.stringify({ choices: opts });
      await client.query(
        `
          INSERT INTO questions (subject_id, topic, question_text, options, correct_answer, explanation, difficulty, question_type)
          VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, 'multiple_choice')
        `,
        [sid, topic, text, optionsJson, String(correctIdx), expl, 'medium']
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function runMigrations() {
  await migrateLegacy();
  await migrateCoreTables();
  await seedSubjects();
  await seedQuestions();
}
