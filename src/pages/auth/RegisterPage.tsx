import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { DeveloperCredit } from '../../components/common/DeveloperCredit';
import { Mail, Lock, User, AtSign, Check, AlertCircle, ArrowRight, Clock } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';

export const RegisterPage: React.FC = () => {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const { navigate } = useRouter();

  const [displayName, setDisplayName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredPending, setRegisteredPending] = useState<boolean>(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters and contain only letters, numbers, dot, or underscore.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, cleanUsername, displayName.trim());
      setRegisteredPending(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#070a13] text-slate-100 p-4">
      <header className="py-4 flex justify-center">
        <BrandLogo size="md" showSubtitle onClick={() => navigate('/home')} />
      </header>

      <main className="max-w-md w-full mx-auto my-auto py-6">
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
          {registeredPending ? (
            /* Successful Registration -> Waiting for Admin Approval state */
            <div className="text-center space-y-5 py-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto animate-pulse">
                <Clock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">
                  Account Created Successfully
                </h2>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs leading-relaxed space-y-2">
                  <p className="font-semibold text-sm text-white">
                    Your account is waiting for Admin approval
                  </p>
                  <p className="text-slate-300">
                    Welcome to <span className="font-semibold text-white">{APP_CONFIG.appName}</span>! Registration does not automatically grant posting privileges. An administrator will review your account in the Admin Approval Center.
                  </p>
                  <p className="text-[11px] text-amber-300/80">
                    You can now browse public posts, customize your profile bio, and explore the platform while awaiting review.
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/home')}
                className="w-full py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-600/30"
              >
                Proceed to Home Feed
              </button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Create Account
                </h2>
                <p className="text-xs text-slate-400">
                  Join Gowa Mara social image platform
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unique Username
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="alex_mercer"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@domain.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:opacity-95 transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 mt-2"
                >
                  <span>{isLoading ? 'Creating Account...' : 'Register Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="pt-2 text-center text-xs text-slate-400">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="font-bold text-purple-400 hover:underline"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      <DeveloperCredit variant="footer" />
    </div>
  );
};
