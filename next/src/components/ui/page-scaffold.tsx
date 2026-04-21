import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageHeader, type PageHeaderProps } from "@/components/ui/page-header";

interface PageScaffoldProps {
  header?: ReactNode;
  headerProps?: PageHeaderProps;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function PageScaffold({
  header,
  headerProps,
  headerActions,
  children,
  className,
  contentClassName,
}: PageScaffoldProps) {
  const headerNode =
    header ??
    (headerProps ? (
      <PageHeader {...headerProps}>{headerActions}</PageHeader>
    ) : null);

  return (
    <div className={cn("page-stack", className)}>
      {headerNode}
      <div className={cn("page-content-stack", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
