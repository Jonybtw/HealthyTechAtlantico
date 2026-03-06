import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in-up">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-navy-500/20 dark:bg-navy-400/20 blur-2xl rounded-full scale-150 animate-pulse-ring" />
                <div className="absolute inset-[-4px] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(194,151,13,0.5)_360deg)] rounded-3xl animate-[spin_4s_linear_infinite]" />
                <div className="relative flex items-center justify-center size-20 rounded-3xl bg-card glass shadow-float border border-border">
                    <Icon className="size-10 text-muted-foreground opacity-80" strokeWidth={1.5} />
                </div>
            </div>
            <h3 className="text-xl font-semibold text-foreground tracking-tight mb-2">
                {title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
                {description}
            </p>
            {action && <div className="animate-scale-in">{action}</div>}
        </div>
    );
}
