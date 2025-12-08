import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthVisuals from '../components/AuthVisuals';

/**
 * Login Page Component
 * Requirements: 2.1, 2.2, 2.3, 2.4, 7.1, 7.3, 7.4
 */
const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const { signIn, signInWithOAuth, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect destination from location state or default to dashboard
  const from = (location.state as { from?: string })?.from || '/dashboard';

  // Redirect if user is already logged in
  React.useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  /**
   * Validate form fields
   * Requirements: 7.3 - Display inline error messages
   */
  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn(email, password, rememberMe);

      if (!result.success) {
        // Requirement 2.2: Display error without revealing which field is incorrect
        setError(result.error || 'Invalid email or password');
        setIsLoading(false);
      }
      // If success, the useEffect will handle the redirect once 'user' is updated
    } catch (err) {
      setError('Unable to connect. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    await signInWithOAuth(provider);
    // Redirect happens automatically via Supabase
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative z-10">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10">
            <Link to="/" className="inline-block mb-8">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-stone-500">
              Sign in to your Gather account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* General Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-xl text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            {/* Email Field */}
            <div>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  placeholder="Email"
                  className={`block w-full rounded-xl border-0 bg-stone-50 py-3.5 px-4 text-slate-900 shadow-sm ring-1 ring-inset ${fieldErrors.email ? 'ring-red-300 focus:ring-red-500' : 'ring-stone-200 focus:ring-slate-900'
                    } placeholder:text-stone-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-all`}
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-2 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  placeholder="Password"
                  className={`block w-full rounded-xl border-0 bg-stone-50 py-3.5 px-4 text-slate-900 shadow-sm ring-1 ring-inset ${fieldErrors.password ? 'ring-red-300 focus:ring-red-500' : 'ring-stone-200 focus:ring-slate-900'
                    } placeholder:text-stone-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-all`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-2 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 bg-stone-50 text-slate-900 focus:ring-slate-900"
                  disabled={isLoading}
                />
                <span className="text-sm text-stone-600">Remember me</span>
              </label>
              <Link
                to="/reset-password"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-full bg-slate-900 px-3 py-3.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign in'
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-stone-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-stone-200 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 transition-all"
              >
                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M12.0003 20.45c4.6667 0 7.3333-3.3333 7.3333-8.8 0-.9-.1-1.75-.2833-2.55h-7.05v3.4h4.15c-.2 1.25-1.1667 3.0167-4.15 3.0167-3.4 0-6.1667-2.7667-6.1667-6.1667s2.7667-6.1667 6.1667-6.1667c1.7833 0 3.25.7 4.1 1.5l2.6333-2.6333C17.3 1.05 14.9 0 12.0003 0 5.40033 0 .000329971 5.4 .000329971 12s5.400000029 12 12.000000029 12Z"
                    fill="#EA4335" // Changed to official Google brand color for recognition
                  />
                  <path d="M12.0003 20.45c4.6667 0 7.3333-3.3333 7.3333-8.8 0-.9-.1-1.75-.2833-2.55h-7.05v3.4h4.15c-.2 1.25-1.1667 3.0167-4.15 3.0167-3.4 0-6.1667-2.7667-6.1667-6.1667s2.7667-6.1667 6.1667-6.1667c1.7833 0 3.25.7 4.1 1.5l2.6333-2.6333C17.3 1.05 14.9 0 12.0003 0 5.40033 0 .000329971 5.4 .000329971 12s5.400000029 12 12.000000029 12Z" fillOpacity="0" /> {/* Hack to ensure viewbox is correct if path is partial */}
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('github')}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-stone-200 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 transition-all"
              >
                <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                GitHub
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-stone-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Visual Showcase */}
      <div className="hidden lg:block relative w-0 flex-1 overflow-hidden">
        <AuthVisuals />
      </div>
    </div>
  );
};

export default Login;
