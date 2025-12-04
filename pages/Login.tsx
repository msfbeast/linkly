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

  const { signIn, user } = useAuth();
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
