import React, { useState } from 'react'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { Badge } from './Badge'

export interface ErrorStateProps {
  title?: string
  errorCode?: string
  message: string
  technicalDetails?: string
  onRetry?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Operational Telemetry Link Interrupted',
  errorCode = 'ERR-TELEMETRY-TIMEOUT',
  message,
  technicalDetails,
  onRetry,
  className,
}) => {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div
      className={cn(
        'p-5 bg-white dark:bg-[#0D1316] border border-rose-200 dark:border-[#FF3038]/40 border-l-4 border-l-rose-600 dark:border-l-[#FF3038] rounded-xl shadow-xs space-y-3.5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-rose-50 dark:bg-[#381115] border border-rose-200 dark:border-[#FF3038]/30 rounded-md text-rose-700 dark:text-[#FF3038] shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-[#F5F7F8]">{title}</h3>
              {errorCode && (
                <Badge variant="critical" size="sm" mono>
                  {errorCode}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-[#A7B2B8] mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {onRetry && (
          <Button
            variant="secondary"
            size="xs"
            onClick={onRetry}
            iconLeft={<RefreshCw className="w-3 h-3" />}
          >
            Retry Telemetry
          </Button>
        )}
      </div>

      {technicalDetails && (
        <div className="pt-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors font-mono cursor-pointer"
          >
            {showDetails ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            Diagnostics & Log Trace
          </button>
          {showDetails && (
            <pre className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-md text-[11px] font-mono whitespace-pre-wrap overflow-x-auto leading-normal">
              {technicalDetails}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

