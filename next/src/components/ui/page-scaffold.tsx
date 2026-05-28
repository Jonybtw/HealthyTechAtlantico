import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import type { PageHeaderProps } from "@/components/ui/page-header";

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
  return (
    <div className={cn("page-stack", className)}>
      {header ? (
        header
      ) : headerProps ? (
        <PageHeader {...headerProps}>{headerActions}</PageHeader>
      ) : headerActions ? (
        <div className="flex flex-wrap items-center justify-end gap-2">{headerActions}</div>
      ) : null}
      <div className={cn("page-content-stack", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
