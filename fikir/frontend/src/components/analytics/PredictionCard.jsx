import { Link } from 'react-router-dom';

export default function PredictionCard({ prediction }) {
  const p = prediction || {};
  const low = p.bandLow ?? Math.max(200, (p.predictedScore || 0) - (p.margin || 40));
  const high = p.bandHigh ?? Math.min(700, (p.predictedScore || 0) + (p.margin || 40));

  return (
    <section className="overflow-hidden rounded-3xl border border-brand-amber/30 bg-gradient-to-br from-brand-amber/15 via-white to-brand-emerald/10 p-6 shadow-md sm:p-8">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-900/80">EUEE outlook</p>
      <h3 className="mt-2 text-2xl font-extrabold text-deep-blue">Predicted score</h3>
      <p className="mt-4 text-4xl font-black text-deep-blue sm:text-5xl">
        {p.predictedScore ?? '—'}
        <span className="text-xl font-bold text-neutral-500 sm:text-2xl"> / 700</span>
      </p>
      <p className="mt-2 text-lg font-semibold text-neutral-700">
        ± {p.margin ?? '—'} &nbsp;·&nbsp; likely band {low}–{high}
      </p>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600">{p.narrative}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/practice"
          className="inline-flex rounded-full bg-deep-blue px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#0a2b52]"
        >
          Train now
        </Link>
        <Link
          to="/subjects"
          className="inline-flex rounded-full border border-deep-blue/30 px-6 py-3 text-sm font-bold text-deep-blue hover:bg-white"
        >
          Review subjects
        </Link>
      </div>
    </section>
  );
}
