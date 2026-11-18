import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validatePassword, MIN_PASSWORD_LENGTH } from '../services/passwordValidation';
import { AuthError, AuthField, AuthShell, EMAIL_PATTERN, PasswordInput, SocialButtons, authInput, authPrimaryButton } from '../components/auth/AuthShell';
import { storeAddressPrefix } from './LandingPage';

/** Usernames become the store address, so keep them URL-safe. */
export const cleanUsername = (v: string) => v.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._-]/g, '').slice(0, 30);

type Availability = 'idle' | 'checking' | 'free' | 'taken' | 'short';

const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [availability, setAvailability] = useState<Availability>('idle');
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkEmail, setCheckEmail] = useState(false);
    const latestCheck = useRef(0);

    const { signUp, checkUsernameAvailability, signInWithOAuth, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const checkUsername = async (value: string) => {
        const n = ++latestCheck.current;
        if (value.length < 3) { setAvailability(value ? 'short' : 'idle'); return; }
        setAvailability('checking');
        try {
            const free = await checkUsernameAvailability(value);
            if (n === latestCheck.current) setAvailability(free ? 'free' : 'taken');
        } catch {
            if (n === latestCheck.current) setAvailability('idle');
        }
    };

    useEffect(() => {
        const fromLanding = (location.state as { username?: string } | null)?.username;
        if (fromLanding) {
            const v = cleanUsername(fromLanding);
            setUsername(v);
            checkUsername(v);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state]);

    useEffect(() => {
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const errors: typeof fieldErrors = {};
        if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address';
        const pw = validatePassword(password);
        if (!pw.isValid) errors.password = pw.errors[0];
        setFieldErrors(errors);
        if (Object.keys(errors).length || availability !== 'free') return;

        setIsSubmitting(true);
        try {
            const result = await signUp(email.trim(), password, username);
            if (!result.success) {
                setError(result.error || 'Could not create the account');
                setIsSubmitting(false);
                return;
            }
            // With a session the effect above opens the dashboard; without one,
            // Supabase is waiting for the email to be confirmed.
            if (result.needsEmailConfirmation) { setCheckEmail(true); setIsSubmitting(false); }
        } catch {
            setError('Could not reach the server. Try again.');
            setIsSubmitting(false);
        }
    };

    if (checkEmail) {
        return (
            <AuthShell title="Check your email" footer={<Link to="/login" className="font-medium text-[#18181A] underline underline-offset-2">Back to log in</Link>}>
                <div className="flex items-start gap-3 text-[14px] leading-relaxed text-[#5F5C56]">
                    <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#FF5A14]" />
                    <p>We sent a link to <span className="font-medium text-[#18181A]">{email.trim()}</span>. Open it to finish creating your account.</p>
                </div>
            </AuthShell>
        );
    }

    const usernameNote = availability === 'taken' ? 'That username is taken.'
        : availability === 'short' ? 'At least 3 characters.'
        : availability === 'free' ? `Your store page: ${storeAddressPrefix()}${username}`
        : 'Letters, numbers, dots, dashes and underscores.';

    return (
        <AuthShell
            title="Create your account"
            subtitle="Free. No card needed."
            footer={<>Already have an account? <Link to="/login" className="font-medium text-[#18181A] underline underline-offset-2">Log in</Link></>}
        >
            {error && <AuthError>{error}</AuthError>}
            <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
                <AuthField id="username" label="Username">
                    <div className={`flex items-center rounded-2xl bg-[#F0EEEA] px-4 focus-within:ring-2 ${availability === 'taken' ? 'ring-2 ring-[#B42318]/40' : 'focus-within:ring-[#FF5A14]/30'}`}>
                        <span className="select-none font-mono text-[14px] text-[#8C8981]">@</span>
                        <input id="username" value={username} autoComplete="username" autoCapitalize="off" spellCheck={false} placeholder="yourname"
                            onChange={e => { const v = cleanUsername(e.target.value); setUsername(v); checkUsername(v); }}
                            aria-describedby="username-note" className="min-w-0 flex-1 bg-transparent py-3.5 pl-1 font-mono text-[15px] outline-none placeholder:text-[#A19E97]" />
                        {availability === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-[#A19E97]" />}
                        {availability === 'free' && <Check className="h-4 w-4 text-[#FF5A14]" aria-label="Available" />}
                    </div>
                    <p id="username-note" className={`mt-1.5 text-[12px] ${availability === 'taken' ? 'text-[#B42318]' : 'text-[#A19E97]'}`}>{usernameNote}</p>
                </AuthField>
                <AuthField id="email" label="Email" error={fieldErrors.email}>
                    <input id="email" type="email" autoComplete="email" value={email} placeholder="you@example.com"
                        aria-invalid={!!fieldErrors.email || undefined} aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                        onChange={e => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, email: undefined })); }} className={authInput(!!fieldErrors.email)} />
                </AuthField>
                <AuthField id="password" label="Password" error={fieldErrors.password} hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
                    <PasswordInput id="password" autoComplete="new-password" value={password} invalid={!!fieldErrors.password}
                        onChange={v => { setPassword(v); setFieldErrors(f => ({ ...f, password: undefined })); }} />
                </AuthField>
                <button type="submit" disabled={isSubmitting || availability !== 'free'} className={authPrimaryButton}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
                </button>
                <p className="text-center text-[12px] text-[#A19E97]">
                    By signing up you agree to the <Link to="/terms" className="underline underline-offset-2">Terms</Link> and <Link to="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
                </p>
            </form>
            <SocialButtons onSelect={p => { setIsSubmitting(true); signInWithOAuth(p); }} disabled={isSubmitting} />
        </AuthShell>
    );
};

export default Register;
