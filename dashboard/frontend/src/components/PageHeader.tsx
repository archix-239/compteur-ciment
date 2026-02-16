import { ReactNode } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, children, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="space-y-6">
      {breadcrumbs && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-orange-500 transition-colors">Accueil</BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((crumb, i) => (
              <div key={i} className="flex items-center gap-2">
                <BreadcrumbSeparator className="text-zinc-800" />
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink href={crumb.href} className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-orange-500 transition-colors">
                      {crumb.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="text-[10px] uppercase font-bold tracking-widest text-orange-500">
                      {crumb.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
