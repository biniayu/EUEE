import { Link } from 'react-router-dom';

function LogoMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-deep-blue text-white">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M13 4L7 14h4.5l-1 6 7-10h-4l1-6z"
          fill="currentColor"
          className="text-brand-emerald"
        />
      </svg>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-6 md:pb-24">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="text-lg font-bold tracking-tight text-neutral-900">EUEE Prep</span>
        </Link>

        <nav
          className="hidden items-center gap-8 text-sm font-medium text-neutral-700 md:flex"
          aria-label="Primary"
        >
          <a href="#features" className="transition hover:text-deep-blue">
            Product
          </a>
          <a href="#testimonials" className="transition hover:text-deep-blue">
            Stories
          </a>
          <a href="#faq" className="transition hover:text-deep-blue">
            FAQ
          </a>
          <span className="text-neutral-400">Support</span>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-neutral-600 sm:inline">Pricing</span>
          <Link
            to="/login"
            className="rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
          >
            Start for Web
          </Link>
        </div>
      </header>

      <div className="mx-auto mt-14 max-w-4xl px-4 text-center sm:mt-20 sm:px-6">
        <h1 className="text-balance text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
          Master the EUEE with AI. Your Personal Natural Science Mentor
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-neutral-600 sm:text-xl">
          Personalized study plans, AI tutor, mock exams for Grade 12 Natural Science students in
          Ethiopia
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
          <Link
            to="/signup"
            className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-neutral-900 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-neutral-800"
          >
            Start Free Trial
          </Link>
          <a
            href="#features"
            className="inline-flex min-w-[200px] items-center justify-center rounded-full border-2 border-neutral-900 bg-white px-8 py-3.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
          >
            Learn More
          </a>
        </div>
      </div>

      <div className="relative mx-auto mt-16 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative aspect-[16/10] w-full overflow-hidden rounded-[2rem] shadow-2xl shadow-deep-blue/20 ring-1 ring-black/5"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-hero-yellow via-brand-emerald to-deep-blue" />
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/25 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-deep-blue/40 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex h-full items-center justify-center p-6 sm:p-10">
            <div className="relative flex w-full max-w-md flex-col items-center">
              <div className="relative z-10 flex h-48 w-40 items-end justify-center rounded-2xl bg-gradient-to-b from-white/30 to-white/5 shadow-xl ring-1 ring-white/40 backdrop-blur sm:h-56 sm:w-44">
                <div className="mb-3 flex h-28 w-24 items-center justify-center rounded-xl bg-white/90 shadow-lg">
                  <span className="text-4xl" aria-hidden="true">
                    🎓
                  </span>
                </div>
              </div>

              <div className="absolute -left-4 top-6 z-20 w-44 rounded-2xl border border-white/70 bg-white p-3 shadow-xl sm:-left-8 sm:top-10 sm:w-52">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-emerald/15 text-xs font-bold text-deep-blue">
                    A
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-neutral-900">Yonas M.</p>
                    <p className="text-[10px] text-neutral-500">Biology · streak 12</p>
                  </div>
                  <span className="rounded-full bg-brand-amber px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    +18%
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-[10px] text-neutral-600">
                  <p>“AI explained photosynthesis step by step.”</p>
                </div>
              </div>

              <div className="absolute -right-2 bottom-10 z-20 w-48 rounded-2xl border border-white/70 bg-white p-3 shadow-xl sm:-right-6 sm:bottom-14 sm:w-56">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-deep-blue/10 px-2 py-0.5 text-[10px] font-semibold text-deep-blue">
                    Mock Exam
                  </span>
                  <span className="text-[10px] text-neutral-400">Timer ON</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-neutral-900">Natural Science · Set 4</p>
                <p className="text-[10px] text-neutral-500">Question 12 of 80 · Chemistry</p>
              </div>

              <div className="absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-[10px] font-medium text-neutral-700 shadow-lg backdrop-blur sm:text-xs">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-emerald" />
                Co-Pilot · Ask anything
              </div>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm font-medium text-neutral-400">
          Built for Grade 12 Natural Science students across Ethiopia
        </p>
      </div>
    </section>
  );
}
