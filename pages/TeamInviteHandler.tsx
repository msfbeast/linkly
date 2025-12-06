import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTeam } from '../contexts/TeamContext';
import { supabaseAdapter } from '../services/storage/supabaseAdapter';

const TeamInviteHandler: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const { user, loading: authLoading } = useAuth();
    const { acceptInvite: contextAcceptInvite } = useTeam();
    const navigate = useNavigate();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying invite...');

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            // Redirect to login with return url
            navigate(`/login?returnUrl=/team/invite/${token}`);
            return;
        }

        if (!token) {
            setStatus('error');
            setMessage('Invalid invite link');
            return;
        }

        const handleAccept = async () => {
            try {
                // Use context method to ensure global state updates
                await contextAcceptInvite(token);
                setStatus('success');
                setMessage('You have successfully joined the team!');
                // Redirect after a short delay
                setTimeout(() => navigate('/dashboard'), 2000);
            } catch (error: any) {
                console.error('Failed to accept invite:', error);
                setStatus('error');
                setMessage(error.message || 'Failed to accept invite. It may have expired.');
            }
        };

        handleAccept();
    }, [token, user, authLoading, navigate, contextAcceptInvite]);

    if (authLoading) return null;

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-stone-100">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Joining Team...</h2>
                        <p className="text-stone-500">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome Aboard!</h2>
                        <p className="text-stone-500 mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Invite Failed</h2>
                        <p className="text-stone-500 mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full px-6 py-3 bg-stone-100 text-slate-900 font-bold rounded-xl hover:bg-stone-200 transition-colors"
                        >
                            Return to Dashboard
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default TeamInviteHandler;
