import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useChatbotPageContext } from '../components/chatbot/ChatbotContext.jsx';
import LearningLayout from '../components/learning/LearningLayout.jsx';

const SAMPLE_YEARS = ['2019', '2020', '2021', '2022', '2023', '2024'];

export default function PastPapers() {
  const { setPageContext } = useChatbotPageContext();

  useEffect(() => {
    setPageContext({ type: 'past_papers' });
    return () => setPageContext({});
  }, [setPageContext]);

  return (
    <LearningLayout title="Past papers">
      <div className="mx-auto max-w-2xl space-y-8">
        <Link to="/question-bank" className="text-sm font-semibold text-brand-emerald hover:text-deep-blue">
          ← Question bank
        </Link>

        <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-white via-amber-50/40 to-brand-emerald/5 p-8 shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-emerald/10 text-brand-emerald ring-1 ring-brand-emerald/25">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 4.5h8a3 3 0 013 3V19.5a1.5 1.5 0 01-2.25 1.299L10 18.25l-4.75 2.549A1.5 1.5 0 013 19.5V7.5a3 3 0 013-3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-deep-blue">Past papers</h1>
          <p className="mt-4 text-base leading-relaxed text-neutral-700">
            EUEE Past Papers will be available soon. For now, use the Question Bank for extensive practice.
          </p>
          <Link
            to="/question-bank"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-deep-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0a2b52]"
          >
            Go to Question Bank
          </Link>
        </div>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-deep-blue">Sample years (preview)</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SAMPLE_YEARS.map((y) => (
              <li
                key={y}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-600"
              >
                EUEE {y}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </LearningLayout>
  );
}
