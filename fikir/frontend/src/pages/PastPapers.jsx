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
          <h1 className="text-2xl font-bold text-deep-blue">Past papers</h1>
          <p className="mt-4 text-base leading-relaxed text-neutral-700">
            Full past papers upload is <span className="font-semibold text-amber-700">coming soon</span>. You will
            be able to sit timed PDF-style sessions with automatic scoring where rubrics allow.
          </p>
          <p className="mt-4 text-sm text-neutral-600">
            Until then, use the <Link className="font-semibold text-brand-emerald underline" to="/question-bank">Question bank</Link> for
            authentic multiple-choice practice and instant explanations.
          </p>
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
