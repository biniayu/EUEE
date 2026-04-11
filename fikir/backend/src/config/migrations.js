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
    ALTER TABLE lessons
      ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 20,
      ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
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

/** Sample lessons for Subject & Lesson modules (Phase 6) */
async function seedLessons() {
  const count = await pool.query('SELECT COUNT(*)::int AS c FROM lessons');
  if (count.rows[0].c > 0) return;

  const subjectRows = await pool.query(`SELECT id, name FROM subjects ORDER BY id`);
  const byName = Object.fromEntries(subjectRows.rows.map((r) => [r.name, r.id]));

  const templates = [
    {
      names: ['Mathematics'],
      lessons: [
        {
          title: 'Linear equations refresher',
          content_type: 'video',
          content_url: 'https://www.youtube.com/watch?v=9DdtzGpsq3k',
          text_content: null,
          duration_minutes: 12,
          sort_order: 1,
        },
        {
          title: 'Percentages and ratios',
          content_type: 'text',
          content_url: null,
          text_content: `## Percentages\n\nA **percentage** is a number out of 100.\n\n- To find 15% of 200: multiply 200 × 0.15 = **30**.\n\n- To increase a value by 10%: multiply by **1.10**.\n\n### Practice tip\n\nAlways check whether the question asks for the *new value* or the *amount of change*.`,
          duration_minutes: 18,
          sort_order: 2,
        },
        {
          title: 'Geometry essentials',
          content_type: 'text',
          content_url: null,
          text_content: `## Triangles\n\n- Interior angles sum to **180°**.\n- Area of a triangle: **½ × base × height**.\n\n## Circles\n\n- Circumference: **2πr**\n- Area: **πr²**\n\nWork one diagram-based problem each day to build speed for EUEE.`,
          duration_minutes: 20,
          sort_order: 3,
        },
      ],
    },
    {
      names: ['Physics'],
      lessons: [
        {
          title: 'Vectors and motion basics',
          content_type: 'video',
          content_url: 'https://www.youtube.com/watch?v=FOxVMVrFCzI',
          text_content: null,
          duration_minutes: 14,
          sort_order: 1,
        },
        {
          title: 'Newton’s laws in exam problems',
          content_type: 'text',
          content_url: null,
          text_content: `## First law\n\nObjects stay at rest or constant velocity unless a **net force** acts.\n\n## Second law\n\n**F = ma** — force equals mass times acceleration.\n\n## Third law\n\nFor every force there is an equal and opposite reaction.\n\nWhen solving, draw a **free-body diagram** before writing equations.`,
          duration_minutes: 22,
          sort_order: 2,
        },
        {
          title: 'Energy and work',
          content_type: 'text',
          content_url: null,
          text_content: `## Work\n\n**W = Fd cos θ** when force and displacement align partially.\n\n## Kinetic energy\n\n**KE = ½mv²**\n\nConservation of energy is a favorite EUEE theme — track energy before and after.`,
          duration_minutes: 20,
          sort_order: 3,
        },
      ],
    },
    {
      names: ['Chemistry'],
      lessons: [
        {
          title: 'Atomic structure overview',
          content_type: 'video',
          content_url: 'https://www.youtube.com/watch?v=hQO1cD9_FbY',
          text_content: null,
          duration_minutes: 11,
          sort_order: 1,
        },
        {
          title: 'Acids, bases, and pH',
          content_type: 'text',
          content_url: null,
          text_content: `## pH scale\n\n- **pH < 7** acidic\n- **pH = 7** neutral\n- **pH > 7** basic\n\n## Common exam traps\n\nDistinguish **strong** vs **weak** electrolytes and remember indicator colors if your syllabus includes them.`,
          duration_minutes: 16,
          sort_order: 2,
        },
        {
          title: 'Organic basics: alkanes',
          content_type: 'text',
          content_url: null,
          text_content: `## Alkanes\n\nGeneral formula **CₙH₂ₙ₊₂** — saturated hydrocarbons.\n\nName chains, branches, and practice **IUPAC** style when your curriculum requires it.`,
          duration_minutes: 18,
          sort_order: 3,
        },
      ],
    },
    {
      names: ['Biology'],
      lessons: [
        {
          title: 'Cell structure tour',
          content_type: 'video',
          content_url: 'https://www.youtube.com/watch?v=8IlzKri08kk',
          text_content: null,
          duration_minutes: 13,
          sort_order: 1,
        },
        {
          title: 'Photosynthesis and respiration',
          content_type: 'text',
          content_url: null,
          text_content: `## Photosynthesis\n\nChloroplasts convert light energy into chemical energy (glucose).\n\n## Respiration\n\nMitochondria release usable energy from glucose.\n\nCompare **inputs/outputs** in exam short answers.`,
          duration_minutes: 19,
          sort_order: 2,
        },
        {
          title: 'Genetics vocabulary',
          content_type: 'text',
          content_url: null,
          text_content: `## Core terms\n\n- **DNA** stores hereditary information.\n- **Gene** — segment that codes for a trait.\n- **Allele** — variant of a gene.\n\nUse Punnett squares carefully and label generations (P, F1, F2) when asked.`,
          duration_minutes: 17,
          sort_order: 3,
        },
      ],
    },
    {
      names: ['English'],
      lessons: [
        {
          title: 'Reading comprehension strategy',
          content_type: 'video',
          content_url: 'https://www.youtube.com/watch?v=6ZAiXxjwmpA',
          text_content: null,
          duration_minutes: 10,
          sort_order: 1,
        },
        {
          title: 'Grammar: subject–verb agreement',
          content_type: 'text',
          content_url: null,
          text_content: `## Agreement\n\nSingular subjects need **singular** verbs.\n\n- *She **runs** every morning.*\n- *The data **are**…* vs *The dataset **is**…* — watch collective nouns.\n\nUnderline the **real subject** when sentences begin with *There* or *Here*.`,
          duration_minutes: 15,
          sort_order: 2,
        },
        {
          title: 'Vocabulary in context',
          content_type: 'text',
          content_url: null,
          text_content: `## Strategy\n\nRead the **sentence before and after** the blank.\n\nEliminate answers that change the tone (formal vs informal).\n\nKeep a small notebook of **confusable pairs** (affect/effect, accept/except).`,
          duration_minutes: 14,
          sort_order: 3,
        },
      ],
    },
    {
      names: ['SAT'],
      lessons: [
        {
          title: 'Logical reasoning patterns',
          content_type: 'video',
          content_url: 'https://www.youtube.com/watch?v=ENgM6z7gi8U',
          text_content: null,
          duration_minutes: 12,
          sort_order: 1,
        },
        {
          title: 'Number sense shortcuts',
          content_type: 'text',
          content_url: null,
          text_content: `## Compare decimals\n\nPad with zeros: **0.909** vs **0.9** → **0.909** vs **0.900**.\n\n## Percent change\n\n**(new − old) / old × 100%**.\n\nDouble-check whether the question asks for *increase* or *final value*.`,
          duration_minutes: 16,
          sort_order: 2,
        },
        {
          title: 'Reading charts and tables',
          content_type: 'text',
          content_url: null,
          text_content: `## Exam habit\n\nRead **titles, axes, and units** before answering.\n\nMark the question’s keyword and find the smallest table region that answers it — saves time under pressure.`,
          duration_minutes: 14,
          sort_order: 3,
        },
      ],
    },
  ];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const block of templates) {
      for (const subName of block.names) {
        const sid = byName[subName];
        if (!sid) continue;
        for (const L of block.lessons) {
          await client.query(
            `
              INSERT INTO lessons (
                subject_id, title, content_type, content_url, text_content,
                difficulty, duration_minutes, sort_order
              )
              VALUES ($1, $2, $3, $4, $5, 'medium', $6, $7)
            `,
            [
              sid,
              L.title,
              L.content_type,
              L.content_url,
              L.text_content,
              L.duration_minutes,
              L.sort_order,
            ]
          );
        }
      }
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/** Phase 7 — AI tutor chat history */
async function migrateChatMessages() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      is_ai BOOLEAN NOT NULL DEFAULT FALSE,
      context JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON chat_messages(user_id, created_at);
  `);
}

export async function runMigrations() {
  await migrateLegacy();
  await migrateCoreTables();
  await migrateChatMessages();
  await seedSubjects();
  await seedQuestions();
  await seedLessons();
}
