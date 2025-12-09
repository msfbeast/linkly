import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class WidgetErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full min-h-[100px] bg-stone-50 rounded-2xl border border-stone-200 text-stone-400 p-4">
                    <AlertTriangle className="w-6 h-6 mb-2 text-stone-300" />
                    <p className="text-xs font-medium">Widget unavailable</p>
                </div>
            );
        }

        return this.props.children;
    }
}
