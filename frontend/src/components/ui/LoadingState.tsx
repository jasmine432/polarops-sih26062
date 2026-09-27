import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LoadingStateProps {
  message?: string
  subtext?: string
  type?: 'spinner' | 'skeleton'
  rows?: number
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Synchronizing operational telemetry...',
  subtext = 'Establishing link with station transponders via Iridium Certus',
  type = 'spinner',
  rows = 4,
  className,
}) => {
  if (type === 'skeleton') {
    return (
      <div className={cn('space-y-3 p-5 bg-white dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238] rounded-xl shadow-xs', className)}>
        <div className="h-4 bg-slate-100 dark:bg-[#11191D] rounded w-1/3 animate-pulse" />
        <div className="space-y-2.5 pt-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-50 dark:bg-[#0A0E10] border border-slate-100 dark:border-[#1B2529] rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#0D1316] border border-slate-200 dark:border-[#263238] rounded-xl shadow-xs',
        className
      )}
    >
      <div className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-[#263238] border-t-[#02457A] dark:border-t-[#FFD21C] animate-spin mb-3.5 flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-[#02457A] dark:text-[#FFD21C] sr-only" />
      </div>
      <p className="text-xs font-bold text-slate-800 dark:text-[#F5F7F8] tracking-wider uppercase">{message}</p>
      {subtext && <p className="text-[11px] text-slate-500 dark:text-[#A7B2B8] mt-1 max-w-sm font-normal leading-relaxed">{subtext}</p>}
    </div>
  )
}

