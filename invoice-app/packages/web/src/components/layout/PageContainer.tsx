import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageContainerProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  children: ReactNode;
}

export function PageContainer({ title, breadcrumbs, actions, children }: PageContainerProps) {
  return (
    <div className="flex flex-col min-h-full">
      {/* Breadcrumb bar */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="px-8 pt-4 pb-0">
          <ol className="flex items-center gap-1 text-sm text-gray-500">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={crumb.label} className="flex items-center gap-1">
                  {index > 0 && (
                    <ChevronRight className="w-3 h-3 text-gray-400" aria-hidden="true" />
                  )}
                  {crumb.href && !isLast ? (
                    <a
                      href={crumb.href}
                      className="hover:text-gray-700 hover:underline transition-colors"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className={isLast ? 'text-gray-700 font-medium' : ''}>
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Page header: title + actions */}
      <div className="flex items-center justify-between px-8 py-4">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Content area */}
      <div className="flex-1 px-8 pb-8">
        <div className="max-w-7xl">{children}</div>
      </div>
    </div>
  );
}

export type { Breadcrumb, PageContainerProps };
