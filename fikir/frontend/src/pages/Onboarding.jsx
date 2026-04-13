import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'SAT',
];

const DIAGNOSTIC_QUESTIONS = [
  { id: 'm1', subject: 'Mathematics', question: 'What is 15% of 200?', options: ['20', '25', '30', '35'], correctIndex: 2 },
  { id: 'm2', subject: 'Mathematics', question: 'If x + 7 = 12, x = ?', options: ['3', '4', '5', '6'], correctIndex: 2 },
  { id: 'm3', subject: 'Mathematics', question: 'Which is a prime number?', options: ['21', '27', '29', '39'], correctIndex: 2 },
  { id: 'm4', subject: 'Mathematics', question: 'Area of rectangle 4 by 8?', options: ['12', '24', '28', '32'], correctIndex: 3 },
  { id: 'm5', subject: 'Mathematics', question: '3^3 equals?', options: ['6', '9', '27', '81'], correctIndex: 2 },
  { id: 'p1', subject: 'Physics', question: 'SI unit of force is?', options: ['Joule', 'Newton', 'Watt', 'Pascal'], correctIndex: 1 },
  { id: 'p2', subject: 'Physics', question: 'Speed = distance / ?', options: ['time', 'mass', 'force', 'power'], correctIndex: 0 },
  { id: 'p3', subject: 'Physics', question: 'Device to measure current?', options: ['Voltmeter', 'Ammeter', 'Thermometer', 'Barometer'], correctIndex: 1 },
  { id: 'p4', subject: 'Physics', question: 'Earth pulls objects due to?', options: ['Friction', 'Magnetism', 'Gravity', 'Pressure'], correctIndex: 2 },
  { id: 'p5', subject: 'Physics', question: 'Light travels fastest in?', options: ['Water', 'Air', 'Glass', 'Vacuum'], correctIndex: 3 },
  { id: 'c1', subject: 'Chemistry', question: 'Water formula is?', options: ['CO2', 'H2O', 'O2', 'NaCl'], correctIndex: 1 },
  { id: 'c2', subject: 'Chemistry', question: 'pH 7 means?', options: ['Acidic', 'Basic', 'Neutral', 'Salt'], correctIndex: 2 },
  { id: 'c3', subject: 'Chemistry', question: 'Atomic number is number of?', options: ['Neutrons', 'Protons', 'Molecules', 'Isotopes'], correctIndex: 1 },
  { id: 'c4', subject: 'Chemistry', question: 'NaCl is common?', options: ['Sugar', 'Salt', 'Acid', 'Base'], correctIndex: 1 },
  { id: 'c5', subject: 'Chemistry', question: 'Gas needed for combustion?', options: ['Nitrogen', 'Oxygen', 'Hydrogen', 'Helium'], correctIndex: 1 },
  { id: 'b1', subject: 'Biology', question: 'Basic unit of life?', options: ['Atom', 'Cell', 'Tissue', 'Organ'], correctIndex: 1 },
  { id: 'b2', subject: 'Biology', question: 'Photosynthesis happens in?', options: ['Mitochondria', 'Nucleus', 'Chloroplast', 'Ribosome'], correctIndex: 2 },
  { id: 'b3', subject: 'Biology', question: 'Human blood is pumped by?', options: ['Lung', 'Kidney', 'Heart', 'Brain'], correctIndex: 2 },
  { id: 'b4', subject: 'Biology', question: 'DNA stands for?', options: ['Deoxyribonucleic Acid', 'Double Nitrogen Acid', 'Dynamic Nucleic Agent', 'Deoxy Nuclear Atom'], correctIndex: 0 },
  { id: 'b5', subject: 'Biology', question: 'Plant root mainly absorbs?', options: ['Sunlight', 'Water and minerals', 'Carbon dioxide', 'Oxygen'], correctIndex: 1 },
  { id: 'e1', subject: 'English', question: 'Choose correct: "She ___ to school."', options: ['go', 'goes', 'gone', 'going'], correctIndex: 1 },
  { id: 'e2', subject: 'English', question: 'Synonym of "rapid"?', options: ['slow', 'quick', 'weak', 'calm'], correctIndex: 1 },
  { id: 'e3', subject: 'English', question: 'Antonym of "increase"?', options: ['reduce', 'extend', 'improve', 'expand'], correctIndex: 0 },
  { id: 'e4', subject: 'English', question: 'Correct punctuation: "Hello___"', options: [',', ':', '!', ';'], correctIndex: 2 },
  { id: 'e5', subject: 'English', question: 'Identify noun in "Students study daily."', options: ['study', 'daily', 'students', 'none'], correctIndex: 2 },
  { id: 's1', subject: 'SAT', question: 'If all A are B and all B are C, then all A are?', options: ['A', 'B', 'C', 'none'], correctIndex: 2 },
  { id: 's2', subject: 'SAT', question: 'Next: 2, 4, 8, 16, ?', options: ['18', '24', '32', '64'], correctIndex: 2 },
  { id: 's3', subject: 'SAT', question: 'Odd one out: Apple, Banana, Carrot, Mango', options: ['Apple', 'Banana', 'Carrot', 'Mango'], correctIndex: 2 },
  { id: 's4', subject: 'SAT', question: 'If 5 pens cost 50 birr, 1 pen costs?', options: ['5', '10', '15', '20'], correctIndex: 1 },
  { id: 's5', subject: 'SAT', question: 'Which is largest?', options: ['0.9', '0.89', '0.099', '0.909'], correctIndex: 3 },
];

const TOTAL_STEPS = 6;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);

  const [profile, setProfile] = useState({
    name: '',
    targetUniversity: '',
    stream: 'Natural Science',
  });

  const [preferences, setPreferences] = useState({
    hoursPerWeek: 10,
    preferredStudyTimes: ['Evening'],
    languagePreference: 'English',
  });

  const [answers, setAnswers] = useState({});
  const answeredCount = Object.keys(answers).length;

  const groupedQuestions = useMemo(() => {
    return SUBJECTS.map((subject) => ({
      subject,
      questions: DIAGNOSTIC_QUESTIONS.filter((q) => q.subject === subject),
    }));
  }, []);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function apiCall(path, method, payload) {
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }

  async function nextStep() {
    setError('');
    setStatusMessage('');
    setSaving(true);
    try {
      if (step === 2) {
        if (!profile.name.trim()) throw new Error('Please enter your name.');
        await apiCall('/api/onboarding/profile', 'POST', profile);
        setStatusMessage('Profile saved.');
      }
      if (step === 3) {
        if (Number(preferences.hoursPerWeek) < 1) throw new Error('Hours per week must be at least 1.');
        if (!preferences.preferredStudyTimes.length) throw new Error('Select at least one study time.');
        await apiCall('/api/onboarding/preferences', 'POST', preferences);
        setStatusMessage('Study preferences saved.');
      }
      if (step === 4) {
        if (answeredCount !== DIAGNOSTIC_QUESTIONS.length) {
          throw new Error('Please answer all 30 diagnostic questions.');
        }
        const payload = DIAGNOSTIC_QUESTIONS.map((q) => ({
          questionId: q.id,
          subject: q.subject,
          selectedIndex: answers[q.id],
          isCorrect: Number(answers[q.id]) === q.correctIndex,
        }));
        const diagnosticRes = await apiCall('/api/onboarding/diagnostic', 'POST', {
          answers: payload,
        });
        setAnalysis(diagnosticRes.analysis);
        setStatusMessage('Diagnostic submitted successfully.');
      }
      if (step === 5) {
        const statusRes = await apiCall('/api/onboarding/status', 'GET');
        if (statusRes?.status?.diagnostic_results) {
          setAnalysis(statusRes.status.diagnostic_results);
        }
      }

      setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function completeOnboarding() {
    setError('');
    setStatusMessage('');
    setCompleting(true);
    try {
      const completeRes = await apiCall('/api/onboarding/complete', 'POST', {});
      setStudyPlan(completeRes.studyPlan);
      setStatusMessage(
        completeRes.message || 'Great work! Your profile and study plan are ready. Redirecting to dashboard...'
      );
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  }

  const progressPercent = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-deep-blue/5 via-white to-brand-emerald/5 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm font-medium text-neutral-600">
            <span>Onboarding progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-deep-blue via-brand-emerald to-brand-amber transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-neutral-100 bg-white p-5 shadow-inner sm:p-7">
          {step === 1 && (
            <section>
              <h1 className="text-3xl font-extrabold text-deep-blue">Welcome to Fikir!</h1>
              <p className="mt-3 text-neutral-600">
                Let&apos;s set up your profile so we can personalize your EUEE preparation journey.
              </p>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-deep-blue">Profile information</h2>
              <div>
                <label className="text-sm font-semibold text-neutral-700">Full Name</label>
                <input
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-brand-emerald"
                  value={profile.name}
                  onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-neutral-700">Target University</label>
                <input
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-brand-emerald"
                  value={profile.targetUniversity}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, targetUniversity: e.target.value }))
                  }
                  placeholder="Addis Ababa University"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-neutral-700">Stream</label>
                <input
                  disabled
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-600"
                  value={profile.stream}
                />
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-deep-blue">Study preferences</h2>
              <div>
                <label className="text-sm font-semibold text-neutral-700">Hours per week</label>
                <input
                  type="number"
                  min="1"
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-brand-emerald"
                  value={preferences.hoursPerWeek}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, hoursPerWeek: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-neutral-700">Preferred study times</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['Morning', 'Afternoon', 'Evening', 'Late Night'].map((slot) => {
                    const active = preferences.preferredStudyTimes.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() =>
                          setPreferences((prev) => ({
                            ...prev,
                            preferredStudyTimes: active
                              ? prev.preferredStudyTimes.filter((x) => x !== slot)
                              : [...prev.preferredStudyTimes, slot],
                          }))
                        }
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          active
                            ? 'border-brand-emerald bg-brand-emerald text-white'
                            : 'border-neutral-300 text-neutral-700'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-neutral-700">Language preference</label>
                <select
                  value={preferences.languagePreference}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, languagePreference: e.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-brand-emerald"
                >
                  <option>English</option>
                  <option>Amharic</option>
                  <option>Bilingual (English + Amharic)</option>
                </select>
              </div>
            </section>
          )}

          {step === 4 && (
            <section>
              <h2 className="text-2xl font-bold text-deep-blue">Subject diagnostic</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Answer all 30 questions. Progress: {answeredCount}/30.
              </p>
              <div className="mt-5 max-h-[55vh] space-y-6 overflow-y-auto pr-1">
                {groupedQuestions.map((group) => (
                  <div key={group.subject} className="rounded-xl border border-neutral-200 p-4">
                    <h3 className="font-bold text-deep-blue">{group.subject}</h3>
                    <div className="mt-3 space-y-4">
                      {group.questions.map((q, idx) => (
                        <div key={q.id} className="rounded-xl bg-neutral-50 p-3">
                          <p className="text-sm font-medium text-neutral-800">
                            {idx + 1}. {q.question}
                          </p>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {q.options.map((opt, optIdx) => (
                              <label
                                key={opt}
                                className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  checked={Number(answers[q.id]) === optIdx}
                                  onChange={() => setAnswer(q.id, optIdx)}
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {step === 5 && (
            <section>
              <h2 className="text-2xl font-bold text-deep-blue">AI-generated study plan preview</h2>
              <p className="mt-2 text-neutral-600">
                Based on your diagnostic, here is your initial personalized preview.
              </p>
              {analysis ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-brand-emerald/30 bg-brand-emerald/5 p-4">
                    <p className="text-sm font-semibold text-deep-blue">Overall score: {analysis.overallScore}%</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(analysis.subjectScores || []).map((item) => (
                      <div key={item.subject} className="rounded-xl border border-neutral-200 p-3">
                        <p className="font-semibold text-neutral-800">{item.subject}</p>
                        <p className="text-sm text-neutral-600">
                          {item.correct}/{item.total} correct ({item.scorePercent}%)
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-neutral-200 p-4">
                    <p className="text-sm font-semibold text-neutral-800">Focus subjects</p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {(analysis.planPreview?.focus || []).join(', ') || 'Balanced revision'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-neutral-500">Loading your plan preview...</p>
              )}
            </section>
          )}

          {step === 6 && (
            <section className="text-center">
              <h2 className="text-3xl font-extrabold text-deep-blue">Ready to Start Learning?</h2>
              <p className="mt-3 text-neutral-600">
                Your profile and study plan are ready. Click below to enter the app.
              </p>
              {studyPlan && (
                <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left">
                  <p className="font-semibold text-neutral-800">Plan highlights</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Weekly hours: {studyPlan.weeklyHours} · Focus: {(studyPlan.focusSubjects || []).join(', ')}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={completeOnboarding}
                disabled={saving || completing}
                className="mt-6 rounded-full bg-deep-blue px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#0a2b52] disabled:opacity-60"
              >
                {completing ? 'Finalizing your setup...' : 'Go to Dashboard'}
              </button>
              {completing && (
                <p className="mt-3 text-sm text-neutral-500">Please wait while we complete your onboarding.</p>
              )}
            </section>
          )}
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {statusMessage && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{statusMessage}</p>
        )}

        {step < 6 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              disabled={step === 1 || saving}
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={nextStep}
              className="rounded-full bg-deep-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0a2b52] disabled:opacity-60"
            >
              {saving ? 'Saving...' : step === 5 ? 'Continue' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
