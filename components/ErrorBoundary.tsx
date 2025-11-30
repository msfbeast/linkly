import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public handleReset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="w-full p-6 bg-red-50/50 border border-red-100 rounded-2xl flex flex-col items-center justify-center text-center min-h-[200px]">
                    <div className="p-3 bg-red-100 rounded-full mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Something went wrong</h3>
                    <p className="text-stone-500 text-sm mb-6 max-w-md">
                        We encountered an error while loading this section.
                        {this.state.error && (
                            <span className="block mt-2 font-mono text-xs bg-red-50 p-2 rounded text-red-800">
                                {this.state.error.message}
                            </span>
                        )}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 hover:text-slate-900 hover:border-stone-300 transition-all shadow-sm hover:shadow-md"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Try Again</span>
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
