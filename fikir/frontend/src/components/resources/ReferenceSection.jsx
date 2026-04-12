import { badgeClasses } from './resourceBadges.js';

function categoryLabel(c) {
  const m = {
    formula_sheet: 'Formula & reference',
    exam_guide: 'Exam guide',
    study_skills: 'Study skills',
    subject_guide: 'Subject guide',
    other: 'Resource',
  };
  return m[c] || 'Resource';
}

export default function ReferenceSection({ items }) {
  return (
    <section className="rounded-3xl border border-deep-blue/15 bg-gradient-to-br from-white via-white to-brand-emerald/5 p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-bold text-deep-blue">Reference materials</h2>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Curated links and files to support your Natural Science track — use alongside your uploads and
        Fikir practice.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {(items || []).map((r) => (
          <li
            key={r.id}
            className="flex flex-col rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm transition hover:border-brand-emerald/40 hover:shadow-md"
          >
            <span className={`self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${badgeClasses(r.category)}`}>
              {categoryLabel(r.category)}
            </span>
            <h3 className="mt-2 text-sm font-bold text-deep-blue">{r.title}</h3>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-neutral-600">{r.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-deep-blue px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#002a52]"
              >
                {r.fileType === 'pdf' ? 'Download PDF' : 'Open link'}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
