const TESTIMONIALS = [
  {
    id: '1',
    quote:
      'The AI tutor explains organic chemistry the way my teacher does—but I can ask at midnight before exams.',
    name: 'Meron Tadesse',
    school: 'Lideta, Addis Ababa',
    initials: 'MT',
  },
  {
    id: '2',
    quote:
      'Mock exams with the timer helped me fix my pacing. I stopped leaving blanks on chemistry.',
    name: 'Daniel Kebede',
    school: 'Bahir Dar',
    initials: 'DK',
  },
  {
    id: '3',
    quote:
      'Clean layout, no distractions. I finally have one place for past questions and explanations.',
    name: 'Hanna Solomon',
    school: 'Hawassa',
    initials: 'HS',
  },
  {
    id: '4',
    quote:
      'Biology diagrams finally make sense with step-by-step hints. My practice scores went up in three weeks.',
    name: 'Binyam Alemu',
    school: 'Adama',
    initials: 'BA',
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-amber">Stories</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            Students across Ethiopia are leveling up
          </h2>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.id}
              className="flex flex-col rounded-3xl border border-neutral-100 bg-neutral-50/80 p-6 shadow-sm"
            >
              <blockquote className="flex-1 text-sm leading-relaxed text-neutral-700">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-deep-blue text-sm font-bold text-white"
                  aria-hidden="true"
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{t.name}</p>
                  <p className="text-xs text-neutral-500">{t.school}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
