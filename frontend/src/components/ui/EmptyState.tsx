import React from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  secondaryAction?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-10 text-center bg-white dark:bg-[#0D1316] border border-dashed border-slate-300 dark:border-[#263238] rounded-xl shadow-2xs',
        className
      )}
    >
      <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-[#11191D] border border-slate-200 dark:border-[#263238] flex items-center justify-center text-slate-500 dark:text-[#A7B2B8] mb-3 shadow-2xs">
        {icon || <Inbox className="w-5 h-5" />}
      </div>
      <h3 className="text-sm font-bold text-slate-800 dark:text-[#F5F7F8] tracking-tight">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 dark:text-[#A7B2B8] max-w-sm mt-1.5 mb-4 leading-relaxed font-normal">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2.5 mt-1">
          {secondaryAction}
          {action}
        </div>
      )}
    </div>
  )
}

