import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';

export const ApprovalStatusCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { profile, isAdmin } = useAuth();

  if (!profile) return null;

  if (profile.status === 'pending') {
    return (
      <div className={`p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-200 relative overflow-hidden shadow-xl ${className}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0 animate-pulse">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-white">
              Your account is waiting for Admin approval
            </h3>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Welcome to <span className="font-semibold text-white">{APP_CONFIG.appName}</span>! Registration is complete, but publishing privileges require verification by an administrator. You can still browse public posts, edit your profile, and search content.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Status: Pending Review</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profile.status === 'suspended' || profile.status === 'blocked') {
    return (
      <div className={`p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-200 shadow-xl ${className}`}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex-shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">
              Account {profile.status === 'blocked' ? 'Blocked' : 'Suspended'}
            </h3>
            <p className="text-xs text-rose-200/80 leading-relaxed mt-1">
              Your account privileges have been restricted due to community policy violations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
