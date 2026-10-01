import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { AppHeader } from '../components/layout/AppHeader';
import { DeveloperCredit } from '../components/common/DeveloperCredit';
import { APP_CONFIG } from '../config/appConfig';
import { 
  User, 
  Key, 
  Bell, 
  Shield, 
  Trash2, 
  LogOut, 
  Sun, 
  Moon, 
  Check, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentUser, profile, logout, resetPassword } = useAuth();
  const { navigate } = useRouter();

  const [resetSent, setResetSent] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    try {
      await resetPassword(currentUser.email);
      setResetSent(true);
      setResetError(null);
    } catch (err: any) {
      setResetError(err.message || 'Failed to send password reset');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <AppHeader title="Settings & Privacy" />

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-6">
        {/* Account Information */}
        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Account Details</h3>
              <p className="text-xs text-slate-400">Your authentication credentials</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-slate-400">Email Address</span>
              <span className="font-mono text-white">{currentUser?.email || 'Not logged in'}</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-slate-400">Unique Username</span>
              <span className="font-mono text-purple-300">@{profile?.username}</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-slate-400">Publishing Status</span>
              <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
                {profile?.status || 'Guest'}
              </span>
            </div>
          </div>

          {/* Password Reset */}
          {currentUser?.email && (
            <div className="pt-2 border-t border-white/5">
              {resetSent ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>Password reset link sent to your email!</span>
                </div>
              ) : (
                <button
                  onClick={handlePasswordReset}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 flex items-center gap-2 transition-all"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Send Password Reset Email</span>
                </button>
              )}
              {resetError && <p className="text-xs text-rose-400 mt-1">{resetError}</p>}
            </div>
          )}
        </div>

        {/* Developer Credit & Official Identity */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Developer Information
          </h3>
          <DeveloperCredit variant="card" />
        </div>

        {/* Sign Out & Destructive Actions */}
        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
          <h3 className="font-bold text-sm text-white">Session Controls</h3>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 flex items-center justify-center gap-2 border border-white/10 transition-all"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Sign Out of Gowa Mara</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
