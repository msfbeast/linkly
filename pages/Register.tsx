import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Link as LinkIcon, Check, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { validatePassword, MIN_PASSWORD_LENGTH } from '../services/passwordValidation';
import AuthVisuals from '../components/AuthVisuals';

/**
 * Registration Page Component
 * Requirements: 1.1, 1.2, 1.3, 7.2, 7.3, 7.4
 */
const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [step, setStep] = useState(1); // Multi-step form state
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  /**
   * Validate form fields
   * Requirements: 1.3, 7.3 - Password validation with inline errors
   */
  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string; confirmPassword?: string } = {};

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation - Requirement 1.3
    const passwordValidation = validatePassword(password);
    if (!password) {
      errors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle step 1 submission (username validation)
   */
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && isUsernameAvailable) {
      setStep(2);
    }
  };

  /**
   * Handle final registration
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(e);
  };

  /**
   * Handle form submission
   * Requirements: 1.1, 1.2
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp(email, password);

      if (result.success) {
        // Check for pending link creation
        const pendingLinkUrl = sessionStorage.getItem('pending_link_url');
        if (pendingLinkUrl) {
          try {
            // We need to wait for the session to be established or use the user ID if available
            // Since signUp returns the user, we can use that ID if we were using a direct DB insert,
            // but supabaseAdapter.createLink relies on the current session.
            // For email signup, the user might not be fully logged in until verification, 
            // BUT Supabase usually logs you in immediately if email confirmation is disabled or optional.
            // If email confirmation is REQUIRED, this might fail until they click the link.
            // Assuming for this "quick start" flow, we might want to allow it.

            // However, a safer bet for "email verification required" flows is to store it in the DB 
            // associated with the user ID, or just let them create it after they log in.

            // For now, let's assume we can try to create it if we have a session, 
            // or we leave it in sessionStorage and create it on the Dashboard after first login.

            // Actually, the best UX for "email verification required" is:
            // 1. User signs up.
            // 2. We tell them "Check your email to verify and claim your link [URL]".
            // 3. When they click verify and log in, the Dashboard checks for pending work.

            // BUT, if we want to show a success message HERE:
            setSuccess(true);
            return;
          } catch (linkError) {
            console.error('Failed to create pending link:', linkError);
          }
        }

        // Show success message - verification email sent
        setSuccess(true);
      } else {
        // Requirement 1.2: Display error for already-used email
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state - verification email sent
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
            We've sent a verification link to <span className="text-slate-900 dark:text-white font-medium">{email}</span>.
            Click the link to verify your account{sessionStorage.getItem('pending_link_url') ? ' and claim your short link' : ''}.
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
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative z-10">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10">
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
              <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                    <span className="text-2xl font-bold text-white">L</span>
                  </div>
                </div>
                <h2 className="text-center text-3xl font-display font-bold text-slate-900">
                  {step === 1 ? 'Claim your link' : 'Create your account'}
                </h2>
                <p className="mt-2 text-center text-sm text-stone-600">
                  {step === 1 ? 'Start by choosing your unique username' : 'Almost there! Just a few more details.'}
                </p>
              </div>

              <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-stone-200/50 sm:rounded-2xl sm:px-10 border border-stone-100">
                  <AnimatePresence mode="wait">
                    {step === 1 ? (
                      <motion.form
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleStep1Submit}
                        className="space-y-6"
                      >
                        <div>
                          <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                            Username
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-stone-400 sm:text-sm">linkly.ai/</span>
                            </div>
                            <input
                              id="username"
                              name="username"
                              type="text"
                              required
                              value={username}
                              onChange={(e) => setUsername(e.target.value.toLowerCase())}
                              className={`block w-full pl-20 pr-10 py-3 border ${usernameError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' :
                                isUsernameAvailable ? 'border-green-300 focus:ring-green-500 focus:border-green-500' :
                                  'border-stone-200 focus:ring-slate-500 focus:border-slate-500'
                                } rounded-xl focus:outline-none focus:ring-2 transition-all`}
                              placeholder="username"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              {isCheckingUsername ? (
                                <Loader2 className="h-5 w-5 text-stone-400 animate-spin" />
                              ) : isUsernameAvailable === true ? (
                                <Check className="h-5 w-5 text-green-500" />
                              ) : isUsernameAvailable === false ? (
                                <X className="h-5 w-5 text-red-500" />
                              ) : null}
                            </div>
                          </div>
                          {usernameError && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {usernameError}
                            </p>
                          )}
                          {isUsernameAvailable && (
                            <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                              <Check className="w-4 h-4" />
                              Username available!
                            </p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={!isUsernameAvailable || isCheckingUsername}
                          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Continue <ArrowRight className="ml-2 w-4 h-4" />
                        </button>
                      </motion.form>
                    ) : (
                      <motion.form
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={handleRegister}
                        className="space-y-6"
                      >
                        <div className="bg-stone-50 p-3 rounded-lg flex items-center justify-between mb-4">
                          <span className="text-sm text-stone-600">Claiming: <span className="font-bold text-slate-900">linkly.ai/{username}</span></span>
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-xs text-slate-500 hover:text-slate-900 underline"
                          >
                            Change
                          </button>
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                            Email address
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-5 w-5 text-stone-400" />
                            </div>
                            <input
                              id="email"
                              name="email"
                              type="email"
                              autoComplete="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="block w-full pl-10 py-3 border border-stone-200 rounded-xl focus:ring-slate-500 focus:border-slate-500 transition-all"
                              placeholder="you@example.com"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                            Password
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="h-5 w-5 text-stone-400" />
                            </div>
                            <input
                              id="password"
                              name="password"
                              type="password"
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="block w-full pl-10 py-3 border border-stone-200 rounded-xl focus:ring-slate-500 focus:border-slate-500 transition-all"
                              placeholder="••••••••"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                            Confirm Password
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="h-5 w-5 text-stone-400" />
                            </div>
                            <input
                              id="confirmPassword"
                              name="confirmPassword"
                              type="password"
                              required
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="block w-full pl-10 py-3 border border-stone-200 rounded-xl focus:ring-slate-500 focus:border-slate-500 transition-all"
                              placeholder="••••••••"
                            />
                          </div>
                        </div>

                        {error && (
                          <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                              Creating account...
                            </>
                          ) : (
                            'Create Account'
                          )}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-stone-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-stone-500">
                          Already have an account?
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 text-center">
                      <Link to="/login" className="font-medium text-slate-900 hover:text-slate-800">
                        Sign in
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
