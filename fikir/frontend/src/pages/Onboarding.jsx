import { useEffect } from 'react';

export default function Onboarding() {
  useEffect(() => {
    console.log('Redirecting to onboarding...');
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Redirecting to onboarding...</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Your login is successful. We are preparing your onboarding experience.
        </p>
      </div>
    </div>
  );
}
