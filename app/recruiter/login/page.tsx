'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { Button, Card } from '@/components/ui';

export default function RecruiterLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'RECRUITER' }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to sign in.');
      }

      router.push('/recruiter?view=dashboard');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 px-5 py-16">
      <div className="mx-auto max-w-md">
        <Card className="p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Recruiter access</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Log in</h1>
          <p className="mt-2 text-sm text-slate-600">Access your hiring dashboard and candidate pipeline.</p>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block text-sm text-slate-700">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-primary"
                placeholder="recruiter@company.com"
              />
            </label>

            <label className="block text-sm text-slate-700">
              Password
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-primary"
                placeholder="••••••••"
              />
            </label>

            {error ? <p className="text-sm text-danger-emphasis">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Log in'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Need an account?{' '}
            <Link href="/recruiter/register" className="text-primary hover:underline">
              Register here
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
