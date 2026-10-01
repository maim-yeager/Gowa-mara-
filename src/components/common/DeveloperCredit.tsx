import React from 'react';
import { APP_CONFIG } from '../../config/appConfig';
import { ExternalLinkIcon } from './Icons';

interface DeveloperCreditProps {
  variant?: 'card' | 'compact' | 'footer';
  className?: string;
}

export const DeveloperCredit: React.FC<DeveloperCreditProps> = ({
  variant = 'compact',
  className = ''
}) => {
  if (variant === 'footer') {
    return (
      <footer className={`py-8 px-4 text-center text-xs text-slate-400 border-t border-white/5 ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <p className="font-medium text-slate-300">
            {APP_CONFIG.appName} &bull; <span className="text-purple-400 font-semibold">Developed by {APP_CONFIG.developerName}</span>
          </p>
          <p className="text-[11px] text-slate-500 max-w-md">
            {APP_CONFIG.developerTitle}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <a 
              href={APP_CONFIG.whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 text-[11px] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20"
            >
              WhatsApp
            </a>
            <a 
              href={APP_CONFIG.gmailUrl}
              className="text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1 text-[11px] bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20"
            >
              Gmail Contact
            </a>
          </div>
        </div>
      </footer>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`glass-card p-6 rounded-2xl border border-purple-500/20 shadow-xl relative overflow-hidden ${className}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-purple-400/40 shadow-lg relative bg-slate-800">
              {APP_CONFIG.adminPicUrl ? (
                <img 
                  src={APP_CONFIG.adminPicUrl} 
                  alt={APP_CONFIG.developerName}
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    // Fallback to placeholder if link fails
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-950 text-purple-300 font-bold text-2xl">
                  {APP_CONFIG.developerName[0]}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-purple-600 text-[10px] text-white px-1.5 py-0.5 rounded font-mono font-bold">
              DEV
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="inline-block px-2.5 py-0.5 text-[11px] font-semibold text-purple-300 bg-purple-500/15 rounded-full border border-purple-500/30 mb-1">
              Developed by {APP_CONFIG.developerName}
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {APP_CONFIG.developerName}
            </h3>
            <p className="text-xs text-purple-200/80 font-medium mt-0.5">
              {APP_CONFIG.developerTitle}
            </p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-lg">
              {APP_CONFIG.developerBio}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
              <a
                href={APP_CONFIG.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl transition-all"
              >
                <span>WhatsApp</span>
                <ExternalLinkIcon className="w-3 h-3" />
              </a>

              <a
                href={APP_CONFIG.gmailUrl}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 px-3.5 py-1.5 rounded-xl transition-all"
              >
                <span>Email Developer</span>
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-xs text-slate-400 ${className}`}>
      <span>Developed by</span>
      <span className="font-semibold text-purple-400">{APP_CONFIG.developerName}</span>
    </div>
  );
};
