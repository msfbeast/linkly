import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const { signUp, checkUsernameAvailability, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill username from Landing Page
  useEffect(() => {
    if (location.state?.username) {
      setUsername(location.state.username);
      handleCheckUsername(location.state.username);
    }
  }, [location.state]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleCheckUsername = async (val: string) => {
    if (val.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setIsCheckingUsername(true);
    try {
      const available = await checkUsernameAvailability(val);
      setUsernameAvailable(available);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!usernameAvailable) {
        throw new Error("Please choose a valid, available username.");
      }
      await signUp(email, password, username);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-yellow-200">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-24 py-12 relative z-10">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-12 group w-fit">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20 group-hover:scale-105 transition-transform">
              <div className="w-6 h-6 bg-yellow-400 rounded-full" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Gather</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Claim your corner.</h1>
            <p className="text-stone-500 mb-8 text-lg">Join thousands of creators building their world with Gather.</p>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-medium border border-red-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium select-none">
                    gather.link/
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
                      setUsername(val);
                      handleCheckUsername(val);
                    }}
                    className={`w-full pl-28 pr-10 py-3.5 bg-stone-50 border-2 rounded-xl text-slate-900 font-bold focus:ring-0 transition-colors ${usernameAvailable === true ? 'border-green-500 focus:border-green-500' :
                      usernameAvailable === false ? 'border-red-300 focus:border-red-300' :
                        'border-stone-100 focus:border-slate-900'
                      }`}
                    placeholder="yourname"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isCheckingUsername ? (
                      <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
                    ) : usernameAvailable === true ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : null}
                  </div>
                </div>
                {usernameAvailable === false && (
                  <p className="text-red-500 text-sm mt-2 font-medium">That username is taken.</p>
                )}
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-stone-50 border-2 border-stone-100 rounded-xl text-slate-900 focus:border-slate-900 focus:ring-0 transition-colors font-medium"
                  placeholder="hello@example.com"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-stone-50 border-2 border-stone-100 rounded-xl text-slate-900 focus:border-slate-900 focus:ring-0 transition-colors font-medium"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !usernameAvailable}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Create Account <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-stone-500">
              Already have an account?{' '}
              <Link to="/login" className="text-slate-900 font-bold hover:underline">
                Log in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Visual Showcase */}
      <div className="hidden lg:block w-1/2 bg-slate-900 relative overflow-hidden">
        {/* Aurora Background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-yellow-500/30 via-purple-500/30 to-blue-500/30 rounded-full blur-[100px] animate-pulse-slow" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center p-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative"
          >
            {/* Abstract Phone Mockup Container */}
            <div className="relative w-80 h-[600px]">
              {/* Phone Body (Clipped Content) */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[3rem] shadow-2xl p-4 flex flex-col overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent" />

                {/* Mock Content */}
                <div className="w-24 h-24 bg-yellow-400 rounded-full mx-auto mt-12 mb-6 shadow-lg shadow-yellow-400/20" />
                <div className="h-4 w-32 bg-white/20 rounded-full mx-auto mb-2" />
                <div className="h-3 w-20 bg-white/10 rounded-full mx-auto mb-8" />

                <div className="space-y-3 px-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 w-full bg-white/5 rounded-2xl border border-white/10" />
                  ))}
                </div>
              </div>

              {/* Floating Elements (Outside Clipping) */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-20 -right-12 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 z-20"
              >
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-stone-500 font-bold">New Sale</div>
                  <div className="text-sm font-bold text-slate-900">+$49.00</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
