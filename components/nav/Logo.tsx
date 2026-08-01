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
      <div className="brand-mark flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-[0_8px_20px_rgba(118,87,246,0.28)]">
        <BrainCircuit className="h-5 w-5" />
      </div>
      {showText && (
        <span className="text-xl font-extrabold tracking-[-0.04em] text-slate-100">Talent<span className="text-violet-300">AI</span></span>
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
