import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { DeveloperCredit } from '../../components/common/DeveloperCredit';
import { APP_CONFIG } from '../../config/appConfig';
import { 
  Mail, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  ShieldAlert, 
  Copy, 
  Check, 
  Globe, 
  Sparkles,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface LoginPageProps {
  initialAdminMode?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialAdminMode = false }) => {
  const { signInWithEmail, signInWithGoogle, resetPassword, adminQuickLogin } = useAuth();
  const { navigate } = useRouter();

  const [activeTab, setActiveTab] = useState<'user' | 'admin'>(initialAdminMode ? 'admin' : 'user');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState<boolean>(false);
  const [forgotSent, setForgotSent] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Standard User Sign In
  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setError(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim();
    const isAdminTarget = cleanEmail.toLowerCase() === APP_CONFIG.adminEmail.toLowerCase();

    try {
      await signInWithEmail(cleanEmail, password);
      if (isAdminTarget) {
        navigate('/admin/dashboard');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      const errCode = err.code || '';
      const errMsg = err.message || '';

      if (
        errCode === 'auth/user-not-found' || 
        errCode === 'auth/invalid-credential' || 
        errMsg.includes('user-not-found') || 
        errMsg.includes('invalid-credential')
      ) {
        if (isAdminTarget) {
          setError(`No password set yet for ${APP_CONFIG.adminEmail}. Switch to the "Admin Portal" tab above to initialize your Admin credentials.`);
        } else {
          setError('Invalid email or password. Please check your credentials or create a new account.');
        }
      } else {
        setError(errMsg || 'Unable to sign in. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Dedicated Admin Quick Sign In & Initialization
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) {
      setError('Please enter your admin password.');
      return;
    }
    if (adminPassword.length < 6) {
      setError('Admin password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessNotice(null);

    try {
      await adminQuickLogin(adminPassword);
      setSuccessNotice('Admin authentication successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 400);
    } catch (err: any) {
      setError(err?.message || 'Admin authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Authentication with Unauthorized Domain Handling
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessNotice(null);

    try {
      await signInWithGoogle();
      navigate('/home');
    } catch (err: any) {
      const errCode = err.code || '';
      const errMsg = err.message || '';

      if (errCode === 'auth/unauthorized-domain' || errMsg.includes('unauthorized-domain')) {
        setError('গুগল লগইন এই ডোমেনে সীমাবদ্ধ। সব ডোমেনে সরাসরি ব্যবহার করতে নিচের Email ও Password দিয়ে বা Admin Portal দিয়ে সাইন ইন করুন!');
      } else {
        setError(errMsg || 'Google sign-in was cancelled or encountered an error.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = activeTab === 'admin' ? APP_CONFIG.adminEmail : email.trim();
    if (!targetEmail) return;
    try {
      await resetPassword(targetEmail);
      setForgotSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch password recovery link.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#070a13] text-slate-100 p-4">
      {/* Header */}
      <header className="py-4 flex justify-center">
        <BrandLogo size="md" showSubtitle onClick={() => navigate('/home')} />
      </header>

      {/* Main Authentication Card */}
      <main className="max-w-md w-full mx-auto my-auto py-6">
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-5 relative overflow-hidden backdrop-blur-xl">
          
          {/* Tab Selector: User Login vs Admin Access */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('user');
                setError(null);
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'user'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>User Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setError(null);
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          </div>

          {/* Heading */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {showForgot
                ? 'Reset Password'
                : activeTab === 'admin'
                ? 'Administrator Access'
                : 'Welcome Back'}
            </h2>
            <p className="text-xs text-slate-400">
              {showForgot
                ? 'Enter your email to receive recovery instructions'
                : activeTab === 'admin'
                ? 'Control panel access for authorized developer & superadmin'
                : 'Sign in to share images, connect and explore'}
            </p>
          </div>

          {/* Success Notice */}
          {successNotice && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px] leading-relaxed">
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* ADMIN PORTAL TAB CONTENT */}
          {activeTab === 'admin' ? (
            <div className="space-y-4">
              {/* Admin Identity Display */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Designated Super Admin
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono font-bold">
                    ROOT
                  </span>
                </div>
                <div className="font-mono text-xs text-white font-semibold flex items-center justify-between">
                  <span>{APP_CONFIG.adminEmail}</span>
                  <span className="text-[10px] text-slate-400 font-sans">Maim</span>
                </div>
              </div>

              {showForgot ? (
                /* Admin Forgot Password Form */
                <form onSubmit={handleForgot} className="space-y-4">
                  {forgotSent ? (
                    <div className="text-center space-y-2 py-3">
                      <p className="text-xs text-emerald-400 font-semibold">
                        Password reset link dispatched to {APP_CONFIG.adminEmail}.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgot(false);
                          setForgotSent(false);
                        }}
                        className="text-xs text-amber-400 hover:underline"
                      >
                        Return to Admin Sign In
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Send a password reset link to the admin inbox (<span className="text-amber-300 font-mono">{APP_CONFIG.adminEmail}</span>).
                      </p>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow"
                      >
                        Send Admin Reset Link
                      </button>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setShowForgot(false)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </form>
              ) : (
                /* Admin Sign In Form */
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Admin Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-[11px] text-amber-400 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Enter admin password (min 6 chars)"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                      <span>💡 প্রথমবার হলে যেকোনো ৬+ অক্ষরের পাসওয়ার্ড দিন</span>
                      <button
                        type="button"
                        onClick={() => setAdminPassword('admin123')}
                        className="px-2 py-0.5 rounded bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-mono font-bold transition-colors"
                      >
                        পাসওয়ার্ড দিন: admin123
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:opacity-95 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>{isLoading ? 'Authenticating Admin...' : 'Enter Admin Control Panel'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* REGULAR USER LOGIN TAB */
            <div className="space-y-4">
              {showForgot ? (
                /* User Forgot Password Form */
                forgotSent ? (
                  <div className="text-center space-y-3 py-4">
                    <p className="text-xs text-emerald-400 font-semibold">
                      Password reset email has been dispatched to {email}.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgot(false);
                        setForgotSent(false);
                      }}
                      className="text-xs text-purple-400 hover:underline"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgot} className="space-y-4">
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
                          placeholder="you@domain.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-md"
                    >
                      Send Recovery Link
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgot(false)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                )
              ) : (
                /* User Email & Password Form */
                <form onSubmit={handleUserLogin} className="space-y-4">
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
                        placeholder="you@domain.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">Password</label>
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-[11px] text-purple-400 hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:opacity-95 transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                  >
                    <span>{isLoading ? 'Signing In...' : 'Sign In with Email'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center my-3">
                    <div className="border-t border-white/10 w-full" />
                    <span className="bg-[#0b101e] px-3 text-[11px] text-slate-500 font-medium">OR</span>
                    <div className="border-t border-white/10 w-full" />
                  </div>

                  {/* Google Sign-in */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-2xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2.5 group"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-400">
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/register')}
                      className="font-bold text-purple-400 hover:underline"
                    >
                      Create Account
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <DeveloperCredit variant="footer" />
    </div>
  );
};
