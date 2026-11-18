import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validatePassword, MIN_PASSWORD_LENGTH } from '../services/passwordValidation';
import { AuthError, AuthField, AuthShell, PasswordInput, authPrimaryButton } from '../components/auth/AuthShell';

const UpdatePassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
    const [done, setDone] = useState(false);
    const { updatePassword } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!done) return;
        const t = setTimeout(() => navigate('/login', { replace: true }), 3000);
        return () => clearTimeout(t);
    }, [done, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const errors: typeof fieldErrors = {};
        const check = validatePassword(password);
        if (!check.isValid) errors.password = check.errors[0];
        if (!confirm) errors.confirm = 'Type the password again';
        else if (password !== confirm) errors.confirm = 'The passwords don\'t match';
        setFieldErrors(errors);
        if (Object.keys(errors).length) return;

        setIsLoading(true);
        try {
            const result = await updatePassword(password);
            if (result.success) setDone(true);
            else setError(result.error || 'Could not change the password. The reset link may have expired; ask for a new one.');
        } catch {
            setError('Could not reach the server. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (done) {
        return (
            <AuthShell title="Password changed" footer={<Link to="/login" className="font-medium text-[#18181A] underline underline-offset-2">Log in now</Link>}>
                <p className="flex items-center gap-2.5 text-[14px] text-[#5F5C56]">
                    <Check className="h-5 w-5 text-[#FF5A14]" /> Taking you to log in…
                </p>
            </AuthShell>
        );
    }

    return (
        <AuthShell title="Choose a new password" footer={<Link to="/reset-password" className="underline underline-offset-2 hover:text-[#18181A]">Need a new reset link?</Link>}>
            {error && <AuthError>{error}</AuthError>}
            <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
                <AuthField id="password" label="New password" error={fieldErrors.password} hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
                    <PasswordInput id="password" autoComplete="new-password" value={password} disabled={isLoading} invalid={!!fieldErrors.password}
                        onChange={v => { setPassword(v); setFieldErrors(f => ({ ...f, password: undefined })); }} />
                </AuthField>
                <AuthField id="confirm" label="Same password again" error={fieldErrors.confirm}>
                    <PasswordInput id="confirm" autoComplete="new-password" value={confirm} disabled={isLoading} invalid={!!fieldErrors.confirm}
                        onChange={v => { setConfirm(v); setFieldErrors(f => ({ ...f, confirm: undefined })); }} />
                </AuthField>
                <button type="submit" disabled={isLoading} className={authPrimaryButton}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save password'}
                </button>
            </form>
        </AuthShell>
    );
};

export default UpdatePassword;
