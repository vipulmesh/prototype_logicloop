import { cn } from '@/lib/utils';
import { ReactNode, ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

/* ─────────────────────────────────────────────
   Card
   ───────────────────────────────────────────── */

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'surface-card rounded-2xl p-6',
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Badge
   ───────────────────────────────────────────── */

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold tracking-[0.01em] transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/25 bg-primary/10 text-violet-200',
        accent: 'border-accent/25 bg-accent/10 text-teal-200',
        success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
        warning: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
        muted: 'border-border bg-muted/60 text-slate-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, variant, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Button
   ───────────────────────────────────────────── */

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white shadow-[0_10px_22px_rgba(118,87,246,0.26)] hover:bg-[#866df8] hover:shadow-[0_14px_30px_rgba(118,87,246,0.34)] active:scale-[0.98]',
        ghost:
          'border border-border bg-transparent text-slate-300 hover:border-slate-500/50 hover:bg-white/[0.04] hover:text-white',
        outline:
          'border border-primary/45 bg-primary/[0.05] text-violet-200 hover:bg-primary/15',
      },
      size: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-7 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant, size, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

/* ─────────────────────────────────────────────
   Progress
   ───────────────────────────────────────────── */

interface ProgressProps {
  label?: string;
  value: number;
  max?: number;
  showValue?: boolean;
  className?: string;
  color?: 'primary' | 'accent' | 'success' | 'warning';
}

const progressColors = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
};

export function Progress({
  label,
  value,
  max = 100,
  showValue = true,
  className,
  color = 'primary',
}: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('mb-3', className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex justify-between text-sm">
          {label && <span className="text-slate-300">{label}</span>}
          {showValue && <span className="font-medium text-slate-200">{value}%</span>}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-slate-800/90 ring-1 ring-white/[0.03]">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            progressColors[color],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Score Circle
   ───────────────────────────────────────────── */

interface ScoreCircleProps {
  value: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const circleSizes = {
  sm: { container: 'h-20 w-20', text: 'text-xl', label: 'text-[10px]', stroke: 6, radius: 34 },
  md: { container: 'h-28 w-28', text: 'text-3xl', label: 'text-xs', stroke: 7, radius: 46 },
  lg: { container: 'h-36 w-36', text: 'text-4xl', label: 'text-sm', stroke: 8, radius: 58 },
};

export function ScoreCircle({ value, label, size = 'md', className }: ScoreCircleProps) {
  const config = circleSizes[size];
  const circumference = 2 * Math.PI * config.radius;
  const offset = circumference - (value / 100) * circumference;
  const svgSize = (config.radius + config.stroke) * 2;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className={cn('relative', config.container)}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${svgSize} ${svgSize}`}>
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={config.radius}
            fill="none"
            stroke="rgba(100, 116, 139, 0.38)"
            strokeWidth={config.stroke}
          />
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={config.radius}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7657f6" />
              <stop offset="100%" stopColor="#2dd4ff" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold text-white', config.text)}>{value}</span>
        </div>
      </div>
      <span className={cn('font-medium text-muted-foreground', config.label)}>{label}</span>
    </div>
  );
}
