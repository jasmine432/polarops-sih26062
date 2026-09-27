import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: 'none' | 'operational' | 'warning' | 'critical' | 'info'
  dense?: boolean
}

export const Card: React.FC<CardProps> = ({
  className,
  accent = 'none',
  dense = false,
  children,
  ...props
}) => {
  const accentBorder: Record<string, string> = {
    none: '',
    operational: 'border-t-2 border-t-emerald-600 dark:border-t-[#16C784]',
    warning: 'border-t-2 border-t-amber-500 dark:border-t-[#FFD21C]',
    critical: 'border-t-2 border-t-rose-600 dark:border-t-[#FF3038]',
    info: 'border-t-2 border-t-[#447F98] dark:border-t-[#169FE5]',
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-[#0D1316] border border-[#B9D9E1] dark:border-[#263238] rounded-xl shadow-xs overflow-hidden transition-colors duration-200',
        accentBorder[accent],
        dense ? 'p-3.5' : '',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'px-4 py-3.5 border-b border-[#E5F3F8] dark:border-[#263238] flex flex-col space-y-1 bg-transparent dark:bg-[#0D1316]',
      className
    )}
    {...props}
  />
)

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3
    className={cn(
      'text-sm font-bold text-[#173B46] dark:text-[#F5F7F8] tracking-tight flex items-center gap-2',
      className
    )}
    {...props}
  />
)

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p
    className={cn(
      'text-xs text-[#466A75] dark:text-[#A7B2B8] font-normal leading-relaxed',
      className
    )}
    {...props}
  />
)

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('p-4 sm:p-5 text-[#173B46] dark:text-[#F5F7F8]', className)} {...props} />

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'px-4 py-3 bg-[#E5F3F8]/50 dark:bg-[#080C0E] border-t border-[#E5F3F8] dark:border-[#263238] flex items-center justify-between text-xs text-[#466A75] dark:text-[#A7B2B8]',
      className
    )}
    {...props}
  />
)
