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
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
        <BrainCircuit className="h-5 w-5 text-primary" />
      </div>
      {showText && (
        <span className="text-xl font-bold tracking-tight text-slate-100">TalentAI</span>
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
