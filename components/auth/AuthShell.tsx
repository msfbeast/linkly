import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import GatherMark from '../landing/GatherMark';

export const authInput = (invalid?: boolean) =>
    `block w-full rounded-2xl bg-[#F0EEEA] px-4 py-3.5 text-[15px] text-[#18181A] outline-none placeholder:text-[#A19E97] focus:ring-2 disabled:opacity-60 ${invalid ? 'ring-2 ring-[#B42318]/40' : 'focus:ring-[#FF5A14]/30'}`;

export const authPrimaryButton =
    'flex w-full items-center justify-center gap-2 rounded-full bg-[#18181A] py-3.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

/** Page frame for sign-in, sign-up and password pages: the mark, one card, a footnote. */
export const AuthShell: React.FC<{ title: string; subtitle?: React.ReactNode; footer?: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, footer, children }) => (
    <div className="flex min-h-screen flex-col bg-[#ECEBE7] text-[#18181A]">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-8">
            <Link to="/" className="inline-flex items-center gap-2" aria-label="Gather home">
                <GatherMark />
                <span className="text-[17px] font-medium tracking-tight">Gather</span>
            </Link>
        </div>
        <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
            <div className="w-full max-w-[420px]">
                <div className="rounded-3xl bg-[#FBFAF8] p-6 sm:p-8">
                    <h1 className="text-[26px] font-medium tracking-tight">{title}</h1>
                    {subtitle && <p className="mt-1.5 text-[14px] text-[#8C8981]">{subtitle}</p>}
                    <div className="mt-6">{children}</div>
                </div>
                {footer && <p className="mt-5 text-center text-[13px] text-[#8C8981]">{footer}</p>}
            </div>
        </main>
    </div>
);

export const AuthError: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-2xl bg-[#FDECEA] px-4 py-3 text-[13px] text-[#B42318]">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{children}</span>
    </div>
);

export const AuthField: React.FC<{ id: string; label: string; error?: string; hint?: React.ReactNode; children: React.ReactNode }> = ({ id, label, error, hint, children }) => (
    <div>
        <label htmlFor={id} className="mb-1.5 block text-[12px] text-[#8C8981]">{label}</label>
        {children}
        {error ? <p id={`${id}-error`} className="mt-1.5 text-[12px] text-[#B42318]">{error}</p>
            : hint ? <p className="mt-1.5 text-[12px] text-[#A19E97]">{hint}</p> : null}
    </div>
);

/** A password input with a show/hide toggle. */
export const PasswordInput: React.FC<{ id: string; value: string; onChange: (v: string) => void; invalid?: boolean; disabled?: boolean; autoComplete: string }> = ({ id, value, onChange, invalid, disabled, autoComplete }) => {
    const [shown, setShown] = useState(false);
    return (
        <div className="relative">
            <input id={id} type={shown ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} autoComplete={autoComplete}
                disabled={disabled} aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-error` : undefined} className={`${authInput(invalid)} pr-12`} />
            <button type="button" onClick={() => setShown(s => !s)} aria-label={shown ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#8C8981] hover:text-[#18181A]">
                {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
};

const GoogleIcon = () => (
    <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1Z" />
        <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.94 11.94 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z" />
    </svg>
);

const GitHubIcon = () => (
    <svg className="h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
);

/** "or" divider plus Google and GitHub buttons. */
export const SocialButtons: React.FC<{ onSelect: (p: 'google' | 'github') => void; disabled?: boolean }> = ({ onSelect, disabled }) => (
    <>
        <div className="my-5 flex items-center gap-3 text-[12px] text-[#A19E97]">
            <span className="h-px flex-1 bg-[#E2DFD8]" /> or <span className="h-px flex-1 bg-[#E2DFD8]" />
        </div>
        <div className="grid grid-cols-2 gap-2">
            {([['google', 'Google', GoogleIcon], ['github', 'GitHub', GitHubIcon]] as const).map(([p, name, Icon]) => (
                <button key={p} type="button" onClick={() => onSelect(p)} disabled={disabled}
                    className="flex items-center justify-center gap-2 rounded-full bg-[#F0EEEA] py-3 text-[13px] transition-colors hover:bg-[#E6E3DD] disabled:opacity-50">
                    <Icon /> {name}
                </button>
            ))}
        </div>
    </>
);

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
