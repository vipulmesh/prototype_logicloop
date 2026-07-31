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
        'glass rounded-2xl p-6',
        hover && 'transition-all duration-300 hover:border-primary/30 hover:shadow-glow hover:-translate-y-0.5',
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
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/20 bg-primary/10 text-primary',
        accent: 'border-accent/20 bg-accent/10 text-accent',
        success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-400',
        warning: 'border-amber-400/20 bg-amber-400/10 text-amber-400',
        muted: 'border-border bg-muted text-muted-foreground',
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
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-primary to-accent text-white hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0',
        ghost:
          'border border-border text-slate-300 hover:bg-white/5 hover:border-primary/30',
        outline:
          'border border-primary/40 text-primary hover:bg-primary/10',
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
  primary: 'from-primary to-cyan-400',
  accent: 'from-accent to-purple-400',
  success: 'from-emerald-500 to-emerald-400',
  warning: 'from-amber-500 to-amber-400',
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
      <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
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
            stroke="rgba(30, 41, 59, 0.8)"
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
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
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
