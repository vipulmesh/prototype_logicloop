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
  accentTop?: boolean;
  accentLeft?: boolean;
  accentColor?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
}

const accentTopColors = {
  primary: 'border-t-4 border-t-primary',
  secondary: 'border-t-4 border-t-secondary',
  accent: 'border-t-4 border-t-accent',
  success: 'border-t-4 border-t-success',
  warning: 'border-t-4 border-t-warning',
  danger: 'border-t-4 border-t-danger',
};

const accentLeftColors = {
  primary: 'border-l-4 border-l-primary',
  secondary: 'border-l-4 border-l-secondary',
  accent: 'border-l-4 border-l-accent',
  success: 'border-l-4 border-l-success',
  warning: 'border-l-4 border-l-warning',
  danger: 'border-l-4 border-l-danger',
};

export function Card({ children, className, hover = false, accentTop, accentLeft, accentColor = 'primary' }: CardProps) {
  return (
    <div
      className={cn(
        'surface-card rounded-2xl p-6 overflow-hidden',
        hover && 'transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md',
        accentTop && accentTopColors[accentColor],
        accentLeft && accentLeftColors[accentColor],
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
  'inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-semibold tracking-[0.01em] transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/20 bg-primary-subtle text-primary-emphasis',
        accent: 'border-accent/25 bg-accent-subtle text-accent-emphasis',
        success: 'border-success/25 bg-success-subtle text-success-emphasis',
        warning: 'border-warning/25 bg-warning-subtle text-warning-emphasis',
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
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary-emphasis hover:shadow-md active:scale-[0.98] border border-primary-emphasis/20',
        ghost:
          'border border-transparent bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        outline:
          'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400 shadow-sm',
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
  success: 'bg-success',
  warning: 'bg-warning',
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
          {label && <span className="font-medium text-slate-700">{label}</span>}
          {showValue && <span className="font-bold text-slate-900">{value}%</span>}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-900/5">
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
            stroke="rgba(15, 23, 42, 0.1)"
            strokeWidth={config.stroke}
          />
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={config.radius}
            fill="none"
            stroke="#6D28D9"
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold text-slate-900', config.text)}>{value}</span>
        </div>
      </div>
      <span className={cn('font-medium text-slate-700', config.label)}>{label}</span>
    </div>
  );
}
