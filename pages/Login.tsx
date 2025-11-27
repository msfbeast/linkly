import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect destination from location state or default to dashboard
  const from = (location.state as { from?: string })?.from || '/';

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

      if (result.success) {
        // Redirect to intended destination or dashboard
        navigate(from, { replace: true });
      } else {
        // Requirement 2.2: Display error without revealing which field is incorrect
        setError(result.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] flex items-center justify-center p-4 transition-colors duration-200">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <LinkIcon className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-slate-600 dark:text-slate-400">Sign in to your Linkly account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* General Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Email Field - Requirement 7.1 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
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
                  placeholder="you@example.com"
                  className={`w-full bg-slate-50 dark:bg-[#0a0a0f] border ${
                    fieldErrors.email ? 'border-red-500/50' : 'border-slate-200 dark:border-white/10'
                  } text-slate-900 dark:text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
              </div>
              {/* Inline error - Requirement 7.3 */}
              {fieldErrors.email && (
                <p id="email-error" className="mt-2 text-sm text-red-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field - Requirement 7.1 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
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
                  placeholder="Enter your password"
                  className={`w-full bg-slate-50 dark:bg-[#0a0a0f] border ${
                    fieldErrors.password ? 'border-red-500/50' : 'border-slate-200 dark:border-white/10'
                  } text-slate-900 dark:text-white pl-12 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Inline error - Requirement 7.3 */}
              {fieldErrors.password && (
                <p id="password-error" className="mt-2 text-sm text-red-400">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password - Requirements 2.3, 2.4 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#0a0a0f] text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0"
                  disabled={isLoading}
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
              </label>
              <Link
                to="/reset-password"
                className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button - Requirement 7.4 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Link to Registration */}
          <div className="mt-6 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
