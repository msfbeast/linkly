import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, AlertCircle, CheckCircle, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Password Reset Request Page Component
 * Requirements: 6.1, 6.2
 */
const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const { resetPassword } = useAuth();

  /**
   * Validate email field
   */
  const validateForm = (): boolean => {
    if (!email.trim()) {
      setFieldError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('Please enter a valid email address');
      return false;
    }
    setFieldError(null);
    return true;
  };

  /**
   * Handle form submission
   * Requirements: 6.1, 6.2 - Send reset link, same message for all emails
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(email);

      // Requirement 6.2: Always show success to prevent email enumeration
      // The resetPassword function already handles this by always returning success
      setSuccess(true);
    } catch (err) {
      setError('Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state - email sent (or appears to be sent)
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] flex items-center justify-center p-4 transition-colors duration-200">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Check your email</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            If an account exists for <span className="text-slate-900 dark:text-white font-medium">{email}</span>,
            you'll receive a password reset link shortly.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-colors"
          >
            Back to Sign in
          </Link>
        </motion.div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Reset your password</h1>
          <p className="text-slate-600 dark:text-slate-400">Enter your email and we'll send you a reset link</p>
        </div>

        {/* Reset Password Form */}
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

            {/* Email Field */}
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
                    if (fieldError) setFieldError(null);
                  }}
                  placeholder="you@example.com"
                  className={`w-full bg-slate-50 dark:bg-[#0a0a0f] border ${
                    fieldError ? 'border-red-500/50' : 'border-slate-200 dark:border-white/10'
                  } text-slate-900 dark:text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                  disabled={isLoading}
                  aria-invalid={!!fieldError}
                  aria-describedby={fieldError ? 'email-error' : undefined}
                />
              </div>
              {fieldError && (
                <p id="email-error" className="mt-2 text-sm text-red-400">
                  {fieldError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 text-sm inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
