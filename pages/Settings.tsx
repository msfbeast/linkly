import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Camera, Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import DomainManager from '../components/DomainManager';
import DeleteAccount from '../components/settings/DeleteAccount';
import { Label, Tile } from '../components/ui/bento';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';
import { validatePassword, MIN_PASSWORD_LENGTH } from '../services/passwordValidation';
import { FREE_LINK_LIMIT } from '../utils/planLimits';

const SUPPORT_EMAIL = 'support@gather.link';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const inputClass = 'w-full rounded-2xl bg-[#F0EEEA] px-4 py-3 text-[14px] text-[#18181A] placeholder:text-[#A19E97] outline-none ring-[#FF5A14]/40 focus:ring-2 disabled:text-[#8C8981]';
const primaryButton = 'inline-flex items-center gap-2 rounded-full bg-[#18181A] px-5 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40';
const secondaryButton = 'inline-flex items-center gap-2 rounded-full bg-[#F0EEEA] px-4 py-2 text-[13px] text-[#18181A] transition-colors hover:bg-[#E6E3DD] disabled:opacity-50';

type Tier = 'free' | 'pro' | 'business' | string;

/** What the account's plan includes and whether its billing needs attention. */
export function planSummary(tier: Tier | undefined, status: string | undefined) {
    const t = tier || 'free';
    if (t === 'free') return { name: 'Free', perks: `${FREE_LINK_LIMIT} links, analytics, a store page`, note: null as string | null, upgrade: true };
    const name = t.charAt(0).toUpperCase() + t.slice(1);
    const perks = t === 'business' ? 'Unlimited links, 90-day analytics, priority support' : 'Unlimited links, 90-day analytics';
    const note = status === 'past_due'
        ? 'Your last renewal payment failed. It will be retried; update your payment method to keep the plan.'
        : null;
    return { name, perks, note, upgrade: false };
}

const Field: React.FC<{ label: string; htmlFor: string; children: React.ReactNode; hint?: React.ReactNode }> = ({ label, htmlFor, children, hint }) => (
    <div>
        <label htmlFor={htmlFor} className="mb-1.5 block text-[12px] text-[#8C8981]">{label}</label>
        {children}
        {hint && <p className="mt-1.5 text-[12px] text-[#A19E97]">{hint}</p>}
    </div>
);

const Settings: React.FC = () => {
    const { user, signOut, updateProfile, updatePassword } = useAuth();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [savingName, setSavingName] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [newPassword, setNewPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const [amazonTag, setAmazonTag] = useState(user?.amazonAssociateTag || '');
    const [flipkartId, setFlipkartId] = useState(user?.flipkartAffiliateId || '');
    const [savingTags, setSavingTags] = useState(false);

    const [signingOut, setSigningOut] = useState<'here' | 'everywhere' | null>(null);

    useEffect(() => {
        if (user?.displayName) setDisplayName(user.displayName);
        setAmazonTag(user?.amazonAssociateTag || '');
        setFlipkartId(user?.flipkartAffiliateId || '');
    }, [user?.displayName, user?.amazonAssociateTag, user?.flipkartAffiliateId]);

    const plan = planSummary(user?.preferences?.subscription_tier, user?.preferences?.subscription_status);
    const nameChanged = displayName.trim() !== (user?.displayName || '') && displayName.trim().length > 0;
    const tagsChanged = amazonTag.trim() !== (user?.amazonAssociateTag || '') || flipkartId.trim() !== (user?.flipkartAffiliateId || '');

    const saveName = async () => {
        setSavingName(true);
        try {
            const result = await updateProfile({ displayName: displayName.trim() });
            if (result.success) toast.success('Name saved');
            else toast.error(result.error || 'Could not save your name');
        } finally {
            setSavingName(false);
        }
    };

    const uploadAvatar = async (file: File | undefined) => {
        if (!file || !user) return;
        if (!file.type.startsWith('image/')) { toast.error('Choose an image file'); return; }
        if (file.size > MAX_AVATAR_BYTES) { toast.error('The photo must be under 5 MB'); return; }
        setUploading(true);
        const toastId = toast.loading('Uploading photo…');
        try {
            await supabaseAdapter.uploadAvatar(user.id, file);
            toast.success('Photo updated', { id: toastId });
            window.location.reload();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not upload the photo', { id: toastId });
            setUploading(false);
        }
    };

    const savePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const check = validatePassword(newPassword);
        if (!check.isValid) { setPasswordError(check.errors[0] ?? 'Choose a stronger password'); return; }
        setSavingPassword(true);
        setPasswordError(null);
        try {
            const result = await updatePassword(newPassword);
            if (result.success) {
                setNewPassword('');
                toast.success('Password changed');
            } else {
                setPasswordError(result.error || 'Could not change the password');
            }
        } finally {
            setSavingPassword(false);
        }
    };

    const saveTags = async () => {
        if (!user) return;
        setSavingTags(true);
        try {
            const amazon = amazonTag.trim();
            const flipkart = flipkartId.trim();
            const result = await updateProfile({ amazonAssociateTag: amazon, flipkartAffiliateId: flipkart });
            if (!result.success) { toast.error(result.error || 'Could not save the tags'); return; }
            await supabaseAdapter.propagateAffiliateTags(user.id, amazon, flipkart);
            toast.success('Tags saved and added to your existing Amazon and Flipkart links');
        } catch (err) {
            console.error('[Settings] saving affiliate tags failed', err);
            toast.error('Saved, but updating existing links failed. Try saving again.');
        } finally {
            setSavingTags(false);
        }
    };

    const doSignOut = async (everywhere: boolean) => {
        if (everywhere && !window.confirm('Sign out on every device, including this one?')) return;
        setSigningOut(everywhere ? 'everywhere' : 'here');
        try {
            await signOut(everywhere);
            navigate('/');
        } catch {
            toast.error('Could not sign out. Try again.');
            setSigningOut(null);
        }
    };

    const initial = (displayName || user?.email || '?').charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-[#ECEBE7] p-4 text-[#18181A] sm:p-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-5">
                    <h1 className="text-[28px] font-medium tracking-tight sm:text-[32px]">Settings</h1>
                    <p className="mt-1 text-[13px] text-[#8C8981]">Your account, plan and links.</p>
                </div>

                <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
                    {/* Profile */}
                    <Tile className="lg:col-span-7">
                        <Label>Profile</Label>
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                            <label className="group relative h-20 w-20 shrink-0 cursor-pointer" aria-label="Change profile photo">
                                <span className="block h-20 w-20 overflow-hidden rounded-full bg-[#18181A]">
                                    {user?.avatar_url
                                        ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                                        : <span className="flex h-full w-full items-center justify-center text-2xl font-medium text-white">{initial}</span>}
                                </span>
                                <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#FF5A14] text-white ring-4 ring-[#FBFAF8]">
                                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                                </span>
                                <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={e => uploadAvatar(e.target.files?.[0])} />
                            </label>
                            <div className="grid flex-1 gap-4">
                                <Field label="Name" htmlFor="settings-name">
                                    <input id="settings-name" className={inputClass} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" maxLength={80} />
                                </Field>
                                <Field label="Email" htmlFor="settings-email" hint={`To change it, email ${SUPPORT_EMAIL}.`}>
                                    <input id="settings-email" className={inputClass} value={user?.email || ''} disabled />
                                </Field>
                                <div>
                                    <button onClick={saveName} disabled={!nameChanged || savingName} className={primaryButton}>
                                        {savingName && <Loader2 className="h-4 w-4 animate-spin" />} Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Tile>

                    {/* Plan */}
                    <Tile dark className="flex flex-col lg:col-span-5">
                        <Label dark right={plan.note ? <span className="rounded-md bg-[#2E2A28] px-2 py-0.5 font-mono text-[11px] text-[#FF9B6A]">payment due</span> : undefined}>Plan</Label>
                        <span className="font-mono text-[clamp(40px,5vw,56px)] font-medium leading-none tracking-[-0.04em]">{plan.name}</span>
                        <p className="mt-3 text-[13px] text-[#A19E97]">{plan.perks}</p>
                        {plan.note && <p className="mt-3 text-[13px] text-[#FF9B6A]">{plan.note}</p>}
                        <div className="mt-auto pt-6">
                            {plan.upgrade ? (
                                <button onClick={() => navigate('/pricing')} className="inline-flex items-center gap-2 rounded-full bg-[#FF5A14] px-5 py-2.5 text-[13px] font-medium text-white hover:opacity-90">
                                    See plans <ArrowRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <p className="text-[12px] text-[#8E8B84]">To change or cancel your plan, email {SUPPORT_EMAIL}.</p>
                            )}
                        </div>
                    </Tile>

                    {/* Affiliate tags */}
                    <Tile className="lg:col-span-7">
                        <Label>Affiliate tags</Label>
                        <p className="mb-4 text-[13px] text-[#8C8981]">Added to every Amazon and Flipkart link you shorten. Saving also updates your existing links.</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Amazon Associates tag" htmlFor="settings-amazon">
                                <input id="settings-amazon" className={inputClass} value={amazonTag} onChange={e => setAmazonTag(e.target.value)} placeholder="yourname-21" />
                            </Field>
                            <Field label="Flipkart affiliate ID" htmlFor="settings-flipkart">
                                <input id="settings-flipkart" className={inputClass} value={flipkartId} onChange={e => setFlipkartId(e.target.value)} placeholder="yourname" />
                            </Field>
                        </div>
                        <button onClick={saveTags} disabled={!tagsChanged || savingTags} className={`${primaryButton} mt-4`}>
                            {savingTags && <Loader2 className="h-4 w-4 animate-spin" />} Save tags
                        </button>
                    </Tile>

                    {/* Password */}
                    <Tile className="lg:col-span-5">
                        <Label>Password</Label>
                        <form onSubmit={savePassword} className="grid gap-4">
                            <Field label="New password" htmlFor="settings-password" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
                                <input id="settings-password" type="password" autoComplete="new-password" className={inputClass}
                                    value={newPassword} onChange={e => { setNewPassword(e.target.value); setPasswordError(null); }} />
                            </Field>
                            {passwordError && <p role="alert" className="text-[13px] text-[#B42318]">{passwordError}</p>}
                            <div>
                                <button type="submit" disabled={!newPassword || savingPassword} className={primaryButton}>
                                    {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />} Change password
                                </button>
                            </div>
                        </form>
                    </Tile>

                    {/* Custom domains */}
                    {user && (
                        <Tile className="lg:col-span-12">
                            <DomainManager userId={user.id} />
                        </Tile>
                    )}

                    {/* Developer API */}
                    <Tile className="flex flex-col lg:col-span-6">
                        <Label>Developer API</Label>
                        <p className="text-[13px] text-[#8C8981]">Create short links from your own apps and scripts. Keys and docs are on the API page.</p>
                        <div className="mt-auto pt-4">
                            <button onClick={() => navigate('/api-access')} className={secondaryButton}>API keys and docs <ArrowRight className="h-4 w-4" /></button>
                        </div>
                    </Tile>

                    {/* Sign out */}
                    <Tile className="flex flex-col lg:col-span-6">
                        <Label>Sign out</Label>
                        <p className="text-[13px] text-[#8C8981]">
                            Signing out everywhere ends every session, on phones and other browsers too.
                        </p>
                        <div className="mt-auto flex flex-wrap gap-2 pt-4">
                            <button onClick={() => doSignOut(false)} disabled={signingOut !== null} className={secondaryButton}>
                                {signingOut === 'here' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Sign out
                            </button>
                            <button onClick={() => doSignOut(true)} disabled={signingOut !== null} className={`${secondaryButton} text-[#B42318]`}>
                                {signingOut === 'everywhere' && <Loader2 className="h-4 w-4 animate-spin" />} Sign out everywhere
                            </button>
                        </div>
                    </Tile>

                    {/* Delete account */}
                    <Tile className="flex flex-col lg:col-span-12">
                        <Label>Delete account</Label>
                        <DeleteAccount isPaid={!plan.upgrade} supportEmail={SUPPORT_EMAIL} />
                    </Tile>
                </div>

            </div>
        </div>
    );
};

export default Settings;
