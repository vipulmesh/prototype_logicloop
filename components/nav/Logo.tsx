import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  href?: string;
  className?: string;
  showText?: boolean;
}

export function Logo({ href = '/', className, showText = true }: LogoProps) {
  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="brand-mark flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-md">
        <BrainCircuit className="h-5 w-5" />
      </div>
      {showText && (
        <span className="text-xl font-extrabold tracking-[-0.04em] text-slate-900">Talent<span className="text-primary">AI</span></span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
