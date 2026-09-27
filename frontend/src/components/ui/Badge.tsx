import React from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'operational'
  | 'warning'
  | 'critical'
  | 'info'
  | 'neutral'
  | 'normal'
  | 'live'
  | 'active'
  | 'low-stock'
  | 'resolved'

export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  withDot?: boolean
  mono?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'sm',
  withDot = false,
  mono = false,
  children,
  ...props
}) => {
  // Comprehensive semantic styling matching Antarctic operations palette
  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    critical: {
      container: 'bg-rose-50 dark:bg-[#381115] text-rose-800 dark:text-[#FF3038] border-rose-200 dark:border-[#FF3038]/50 font-semibold',
      dot: 'bg-rose-600 dark:bg-[#FF3038]',
    },
    warning: {
      container: 'bg-amber-50 dark:bg-[#332608] text-amber-900 dark:text-[#FFD21C] border-amber-200 dark:border-[#FFD21C]/50 font-medium',
      dot: 'bg-amber-600 dark:bg-[#FFD21C]',
    },
    'low-stock': {
      container: 'bg-amber-50 dark:bg-[#332608] text-amber-900 dark:text-[#FFD21C] border-amber-200 dark:border-[#FFD21C]/50 font-medium',
      dot: 'bg-amber-600 dark:bg-[#FFD21C]',
    },
    operational: {
      container: 'bg-emerald-50 dark:bg-[#0E3827] text-emerald-800 dark:text-[#16C784] border-emerald-200 dark:border-[#16C784]/50 font-medium',
      dot: 'bg-emerald-600 dark:bg-[#16C784]',
    },
    normal: {
      container: 'bg-emerald-50 dark:bg-[#0E3827] text-emerald-800 dark:text-[#16C784] border-emerald-200 dark:border-[#16C784]/50 font-medium',
      dot: 'bg-emerald-600 dark:bg-[#16C784]',
    },
    live: {
      container: 'bg-emerald-50 dark:bg-[#0E3827] text-emerald-800 dark:text-[#16C784] border-emerald-200 dark:border-[#16C784]/50 font-semibold',
      dot: 'bg-emerald-500 dark:bg-[#16C784] animate-pulse',
    },
    active: {
      container: 'bg-sky-50 dark:bg-[#0B253D] text-sky-800 dark:text-[#28B6FF] border-sky-200 dark:border-[#28B6FF]/50 font-medium',
      dot: 'bg-sky-600 dark:bg-[#28B6FF]',
    },
    info: {
      container: 'bg-sky-50 dark:bg-[#0B253D] text-sky-800 dark:text-[#28B6FF] border-sky-200 dark:border-[#28B6FF]/50 font-medium',
      dot: 'bg-sky-600 dark:bg-[#28B6FF]',
    },
    resolved: {
      container: 'bg-slate-100 dark:bg-[#0E3827] text-slate-700 dark:text-[#16C784] border-slate-200 dark:border-[#16C784]/50 font-medium',
      dot: 'bg-slate-500 dark:bg-[#16C784]',
    },
    neutral: {
      container: 'bg-slate-100 dark:bg-[#11191D] text-slate-700 dark:text-[#A7B2B8] border-slate-200 dark:border-[#263238] font-medium',
      dot: 'bg-slate-400 dark:bg-[#6F7C82]',
    },
  }

  const styles = variantStyles[variant] || variantStyles.neutral

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-2 py-0.5 leading-normal',
    md: 'text-xs px-2.5 py-0.5 leading-normal',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border select-none whitespace-nowrap shadow-2xs',
        styles.container,
        sizeStyles[size],
        mono && 'tabular-code font-mono',
        className
      )}
      {...props}
    >
      {withDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', styles.dot)}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  )
}
