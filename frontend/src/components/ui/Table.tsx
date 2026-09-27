import React from 'react'
import { cn } from '@/lib/utils'

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  dense?: boolean
  striped?: boolean
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, dense = false, striped = false, ...props }, ref) => (
    <div className="w-full overflow-x-auto border border-slate-200 dark:border-[#263238] rounded-lg bg-white dark:bg-[#0D1316] shadow-xs transition-colors duration-200">
      <table
        ref={ref}
        className={cn(
          'w-full caption-bottom text-xs text-left border-collapse',
          dense ? 'dense-table' : '',
          striped ? 'striped-table' : '',
          className
        )}
        {...props}
      />
    </div>
  )
)
Table.displayName = 'Table'

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      'bg-slate-50/90 dark:bg-[#101619] border-b border-slate-200 dark:border-[#263238] uppercase tracking-wider text-[11px] font-semibold text-slate-600 dark:text-[#A7B2B8]',
      className
    )}
    {...props}
  />
))
TableHeader.displayName = 'TableHeader'

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      'divide-y divide-slate-100 dark:divide-[#263238] bg-white dark:bg-[#0D1316] text-slate-700 dark:text-[#F5F7F8]',
      className
    )}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t border-slate-200 dark:border-[#263238] bg-slate-50/80 dark:bg-[#101619] font-medium text-slate-700 dark:text-[#A7B2B8]',
      className
    )}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }
>(({ className, selected, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-slate-100 dark:border-[#263238] transition-colors duration-100 hover:bg-slate-50/80 dark:hover:bg-[#11191D] data-[state=selected]:bg-slate-100 dark:data-[state=selected]:bg-[#11191D]',
      selected && 'bg-slate-50/90 dark:bg-[#11191D]',
      className
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-9 px-3.5 py-2.5 text-left align-middle font-semibold text-slate-600 dark:text-[#A7B2B8] text-[11px] select-none whitespace-nowrap',
      className
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & { mono?: boolean }
>(({ className, mono, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'px-3.5 py-3 align-middle text-slate-700 dark:text-[#F5F7F8] text-xs',
      mono && 'tabular-code font-mono text-[11px] text-slate-800 dark:text-[#A7B2B8]',
      className
    )}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(
      'mt-2 text-xs text-slate-500 dark:text-[#6F7C82] italic px-3.5 pb-2.5 text-left',
      className
    )}
    {...props}
  />
))
TableCaption.displayName = 'TableCaption'
