import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-deep-blue text-white">
              <svg className="h-5 w-5 text-brand-emerald" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 4L7 14h4.5l-1 6 7-10h-4l1-6z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-neutral-900">EUEE Prep</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-neutral-500">
            AI-powered Natural Science prep for Ethiopian Grade 12 students.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Product</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="#features" className="text-neutral-600 hover:text-deep-blue">
                  Features
                </a>
              </li>
              <li>
                <a href="#faq" className="text-neutral-600 hover:text-deep-blue">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Account</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/login" className="text-neutral-600 hover:text-deep-blue">
                  Log in
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-neutral-600 hover:text-deep-blue">
                  Sign up
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Contact</p>
            <p className="mt-3 text-sm text-neutral-600">hello@eueeprep.app</p>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-100 py-6 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} EUEE Prep. All rights reserved.
      </div>
    </footer>
  );
}
