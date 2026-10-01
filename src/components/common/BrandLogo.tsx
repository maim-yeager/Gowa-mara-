import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  iconOnly?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  iconOnly = false,
  className = '',
  onClick
}) => {
  const sizeMap = {
    sm: {
      icon: 'w-7 h-7',
      textSize: 'text-lg',
      subSize: 'text-[9px]',
      gap: 'gap-2',
      gLetter: 'text-sm font-black'
    },
    md: {
      icon: 'w-9 h-9',
      textSize: 'text-2xl',
      subSize: 'text-[10px]',
      gap: 'gap-2.5',
      gLetter: 'text-base font-black'
    },
    lg: {
      icon: 'w-14 h-14',
      textSize: 'text-4xl',
      subSize: 'text-xs',
      gap: 'gap-3.5',
      gLetter: 'text-2xl font-black'
    },
    xl: {
      icon: 'w-20 h-20',
      textSize: 'text-5xl sm:text-6xl',
      subSize: 'text-sm',
      gap: 'gap-4',
      gLetter: 'text-3xl font-black'
    }
  };

  const s = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${s.gap} select-none cursor-pointer group transition-transform duration-200 active:scale-95 ${className}`}
    >
      {/* Custom Geometric Rounded "G" Symbol */}
      <div className={`relative ${s.icon} flex-shrink-0 flex items-center justify-center`}>
        {/* Soft atmospheric ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity" />

        {/* Outer glass ring & geometric chassis */}
        <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-[#1a1236] via-[#0d1224] to-[#12182b] p-[1.5px] shadow-lg shadow-purple-900/30 border border-white/20">
          <svg
            viewBox="0 0 40 40"
            className="w-full h-full rounded-full drop-shadow-[0_2px_6px_rgba(168,85,247,0.4)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="gGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="innerGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Circular track */}
            <circle cx="20" cy="20" r="16.5" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />

            {/* Geometric stylized "G" curve */}
            <path
              d="M 31 15 C 29 10 24 7 19 7 C 11.8 7 6 12.8 6 20 C 6 27.2 11.8 33 19 33 C 25.5 33 30.5 28.5 31.8 22.5 L 19 22.5"
              stroke="url(#gGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Inner highlight core dot */}
            <circle cx="19" cy="20" r="2.5" fill="#fbcfe8" />
            <circle cx="13" cy="14" r="1.5" fill="url(#innerGlow)" />
          </svg>
        </div>
      </div>

      {/* Typography: "G" + "owa Mara" Wordmark */}
      {!iconOnly && (
        <div className="flex flex-col">
          <div className="flex items-baseline tracking-tight">
            <span className={`font-extrabold ${s.textSize} bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-300 text-transparent bg-clip-text`}>
              G
            </span>
            <span className={`font-bold ${s.textSize} text-white tracking-tight ml-[1px]`}>
              owa Mara
            </span>
          </div>

          {showSubtitle && (
            <span className={`font-semibold tracking-[0.25em] uppercase text-slate-400 ${s.subSize} -mt-0.5`}>
              Social Image Space
            </span>
          )}
        </div>
      )}
    </div>
  );
};
