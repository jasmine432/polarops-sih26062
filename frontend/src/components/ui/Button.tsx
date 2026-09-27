import React, { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'link'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      iconLeft,
      iconRight,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD21C]/60 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer'

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-[#2C6A74] hover:bg-[#225760] active:bg-[#1A454C] text-white border border-[#2C6A74] dark:bg-[#FFD21C] dark:hover:bg-[#FFC928] dark:active:bg-[#E6BC15] dark:text-[#050708] dark:border-[#FFD21C] shadow-xs hover:shadow-sm font-bold',
      secondary:
        'bg-white dark:bg-[#0D1316] text-[#173B46] dark:text-[#F5F7F8] hover:bg-[#E5F3F8] dark:hover:bg-[#11191D] hover:text-[#2C6A74] dark:hover:text-white active:bg-slate-100 dark:active:bg-[#11191D] border border-[#B9D9E1] dark:border-[#263238] shadow-xs',
      outline:
        'bg-transparent text-[#173B46] dark:text-[#F5F7F8] hover:bg-[#E5F3F8]/80 dark:hover:bg-[#11191D] active:bg-[#D6EBF3] dark:active:bg-[#11191D] border border-[#B9D9E1] dark:border-[#263238]',
      destructive:
        'bg-rose-700 dark:bg-[#FF3038] text-white hover:bg-rose-800 dark:hover:bg-[#D92027] active:bg-rose-900 border border-rose-700 dark:border-[#FF3038] shadow-xs font-semibold',
      ghost:
        'bg-transparent text-[#173B46] dark:text-[#A7B2B8] hover:bg-[#E5F3F8] dark:hover:bg-[#11191D] dark:hover:text-white active:bg-[#D6EBF3] border border-transparent',
      link:
        'bg-transparent text-[#2C6A74] hover:text-[#173B46] dark:text-[#28B6FF] dark:hover:text-[#FFD21C] hover:underline p-0 h-auto font-normal border-transparent',
    }

    const sizeStyles: Record<ButtonSize, string> = {
      xs: 'h-7 px-2.5 text-xs gap-1.5',
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-3.5 text-xs font-semibold gap-2',
      lg: 'h-10 px-4 text-sm font-semibold gap-2',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : (
          iconLeft && <span className="inline-flex shrink-0">{iconLeft}</span>
        )}
        <span>{children}</span>
        {!isLoading && iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
