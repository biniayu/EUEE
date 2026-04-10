const FEATURES = [
  {
    title: 'AI-Guided Practice',
    body: 'Adaptive drills in biology, chemistry, and physics that match your pace and close knowledge gaps fast.',
    icon: 'spark',
  },
  {
    title: 'Mock Exams & Timers',
    body: 'EUEE-style papers with realistic timing so exam day feels familiar—not frightening.',
    icon: 'clock',
  },
  {
    title: 'Instant Explanations',
    body: 'Step-by-step solutions in plain language—like a tutor who never gets tired of your questions.',
    icon: 'bolt',
  },
  {
    title: 'Progress You Can See',
    body: 'Chapter mastery, weak-topic alerts, and streaks that keep motivation high until the real test.',
    icon: 'chart',
  },
];

function FeatureIcon({ name }) {
  if (name === 'spark') {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    );
  }
  if (name === 'clock') {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  }
  if (name === 'bolt') {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

export default function FeaturesShowcase() {
  return (
    <section id="features" className="scroll-mt-24 bg-neutral-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-emerald">Product</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            Everything you need for Natural Science prep
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            One focused workspace—questions, explanations, and mock exams—designed around the Ethiopian
            university entrance journey.
          </p>
        </div>

        <ul className="mt-16 grid gap-8 sm:grid-cols-2 lg:gap-10">
          {FEATURES.map((f) => (
            <li
              key={f.title}
              className="group rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm transition hover:border-brand-emerald/30 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-deep-blue text-brand-emerald transition group-hover:bg-brand-emerald group-hover:text-white">
                <FeatureIcon name={f.icon} />
              </div>
              <h3 className="mt-5 text-xl font-bold text-neutral-900">{f.title}</h3>
              <p className="mt-2 text-neutral-600 leading-relaxed">{f.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
