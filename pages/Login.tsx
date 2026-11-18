import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthError, AuthField, AuthShell, EMAIL_PATTERN, PasswordInput, SocialButtons, authInput, authPrimaryButton } from '../components/auth/AuthShell';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

    const { signIn, signInWithOAuth, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from || '/dashboard';

    useEffect(() => {
        if (user) navigate(from, { replace: true });
    }, [user, navigate, from]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const errors: typeof fieldErrors = {};
        if (!email.trim()) errors.email = 'Enter your email';
        else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'That doesn\'t look like an email address';
        if (!password) errors.password = 'Enter your password';
        setFieldErrors(errors);
        if (Object.keys(errors).length) return;

        setIsLoading(true);
        try {
            const result = await signIn(email.trim(), password, rememberMe);
            // On success the effect above redirects once the user is set.
            if (!result.success) {
                setError(result.error || 'Wrong email or password');
                setIsLoading(false);
            }
        } catch {
            setError('Could not reach the server. Try again.');
            setIsLoading(false);
        }
    };

    const social = async (provider: 'google' | 'github') => {
        setIsLoading(true);
        await signInWithOAuth(provider);
    };

    return (
        <AuthShell
            title="Log in"
            subtitle="Welcome back."
            footer={<>New to Gather? <Link to="/register" className="font-medium text-[#18181A] underline underline-offset-2">Create an account</Link></>}
        >
            {error && <AuthError>{error}</AuthError>}
            <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
                <AuthField id="email" label="Email" error={fieldErrors.email}>
                    <input id="email" type="email" autoComplete="email" value={email} disabled={isLoading}
                        aria-invalid={!!fieldErrors.email || undefined} aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                        onChange={e => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, email: undefined })); }}
                        className={authInput(!!fieldErrors.email)} placeholder="you@example.com" />
                </AuthField>
                <AuthField id="password" label="Password" error={fieldErrors.password}>
                    <PasswordInput id="password" autoComplete="current-password" value={password} disabled={isLoading} invalid={!!fieldErrors.password}
                        onChange={v => { setPassword(v); setFieldErrors(f => ({ ...f, password: undefined })); }} />
                </AuthField>
                <div className="flex items-center justify-between text-[13px]">
                    <label className="flex cursor-pointer items-center gap-2 text-[#5F5C56]">
                        <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} disabled={isLoading}
                            className="h-4 w-4 rounded border-[#C9C6BF] accent-[#18181A]" />
                        Stay signed in
                    </label>
                    <Link to="/reset-password" className="text-[#8C8981] underline-offset-2 hover:text-[#18181A] hover:underline">Forgot password?</Link>
                </div>
                <button type="submit" disabled={isLoading} className={authPrimaryButton}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log in'}
                </button>
            </form>
            <SocialButtons onSelect={social} disabled={isLoading} />
        </AuthShell>
    );
};

export default Login;
