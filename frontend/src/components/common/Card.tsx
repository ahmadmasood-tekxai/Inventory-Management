import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  noPadding?: boolean;
}

export function Card({ title, subtitle, action, noPadding, className, children, ...rest }: CardProps) {
  return (
    <div className={clsx('rounded-xl border border-slate-200 bg-white shadow-sm', className)} {...rest}>
      {(title || action) && (
        <div className="flex sm:flex-row flex-col gap-3 w-full items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="w-full">
            {title && <h3 className="text-sm font-semibold text-slate-800">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
