import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthError, AuthField, AuthShell, EMAIL_PATTERN, authInput, authPrimaryButton } from '../components/auth/AuthShell';

const ResetPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!EMAIL_PATTERN.test(email.trim())) { setFieldError('Enter a valid email address'); return; }
        setFieldError(null);
        setIsLoading(true);
        try {
            await resetPassword(email.trim());
            // Same message whether or not the address has an account.
            setSent(true);
        } catch {
            setError('Could not reach the server. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const back = <Link to="/login" className="font-medium text-[#18181A] underline underline-offset-2">Back to log in</Link>;

    if (sent) {
        return (
            <AuthShell title="Check your email" footer={back}>
                <div className="flex items-start gap-3 text-[14px] leading-relaxed text-[#5F5C56]">
                    <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#FF5A14]" />
                    <p>If <span className="font-medium text-[#18181A]">{email.trim()}</span> has a Gather account, a link to choose a new password is on its way. It can take a minute; check spam too.</p>
                </div>
                <button onClick={() => setSent(false)} className="mt-5 text-[13px] text-[#8C8981] underline underline-offset-2 hover:text-[#18181A]">Use a different email</button>
            </AuthShell>
        );
    }

    return (
        <AuthShell title="Reset your password" subtitle="We'll email you a link to choose a new one." footer={back}>
            {error && <AuthError>{error}</AuthError>}
            <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
                <AuthField id="email" label="Email" error={fieldError ?? undefined}>
                    <input id="email" type="email" autoComplete="email" value={email} disabled={isLoading} placeholder="you@example.com"
                        aria-invalid={!!fieldError || undefined} aria-describedby={fieldError ? 'email-error' : undefined}
                        onChange={e => { setEmail(e.target.value); setFieldError(null); }} className={authInput(!!fieldError)} />
                </AuthField>
                <button type="submit" disabled={isLoading} className={authPrimaryButton}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
                </button>
            </form>
        </AuthShell>
    );
};

export default ResetPassword;
