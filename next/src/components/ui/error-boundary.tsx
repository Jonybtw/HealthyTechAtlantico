"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: React.ReactNode;
    /** Custom fallback UI — if omitted, renders the default error card */
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Global React Error Boundary.
 * Prevents unhandled render errors from crashing the full page.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <MyComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Replace with a real logger (Sentry, etc.) in production
        console.error("[ErrorBoundary]", error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-danger-500/30 bg-danger-50/30 dark:bg-danger-900/10 p-8 text-center animate-fade-in-up">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-100 dark:bg-danger-500/20">
                        <AlertTriangle className="size-7 text-danger-600 dark:text-danger-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">Algo correu mal</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {this.state.error?.message ?? "Erro inesperado. Tenta novamente."}
                        </p>
                    </div>
                    <button
                        onClick={this.handleReset}
                        className="inline-flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
                    >
                        <RefreshCw className="size-4" />
                        Tentar novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
