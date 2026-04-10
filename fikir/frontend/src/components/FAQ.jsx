import { useState } from 'react';

const FAQS = [
  {
    id: '1',
    q: 'Which subjects does EUEE Prep cover?',
    a: 'Natural Science: biology, chemistry, and physics—aligned with how Grade 12 students prepare for the Ethiopian university entrance exam.',
  },
  {
    id: '2',
    q: 'Is there a free trial?',
    a: 'Yes. Start a free trial to explore AI-guided practice and sample mock exams before you subscribe.',
  },
  {
    id: '3',
    q: 'Can I use it on my phone?',
    a: 'The app is responsive and works in modern mobile browsers so you can study between classes or on the road.',
  },
  {
    id: '4',
    q: 'How is my progress saved?',
    a: 'Your sessions sync to your account so you can pick up where you left off. More account features will roll out over time.',
  },
];

export default function FAQ() {
  const [openId, setOpenId] = useState(FAQS[0].id);

  return (
    <section id="faq" className="scroll-mt-24 border-t border-neutral-100 bg-neutral-50 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-deep-blue">FAQ</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            Questions, answered
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-neutral-900 transition hover:bg-neutral-50"
                  aria-expanded={isOpen}
                >
                  {item.q}
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-lg leading-none text-neutral-500 transition ${
                      isOpen ? 'rotate-180 border-brand-emerald/40 text-brand-emerald' : ''
                    }`}
                    aria-hidden="true"
                  >
                    ⌄
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-neutral-100 px-5 pb-5 pt-2 text-neutral-600 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
