import React from 'react';

interface ComingSoonNoticeProps {
  title?: string;
  message?: string;
  icon?: string;
  variant?: 'inline' | 'card' | 'banner';
  className?: string;
  badgeText?: string;
}

export const ComingSoonNotice: React.FC<ComingSoonNoticeProps> = ({
  title = 'Information Being Updated',
  message = "We're currently working on this. Verified information will be updated here soon.",
  icon = 'pending_actions',
  variant = 'card',
  className = '',
  badgeText = 'Under Verification',
}) => {
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-xs text-[#747878] ${className}`}>
        <span className="material-symbols-outlined text-[16px] text-[#a14009] shrink-0">
          {icon}
        </span>
        <span className="italic">{message}</span>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`p-4 rounded-xl bg-[#fdf8f5] border border-[#a14009]/20 flex items-start gap-3 text-xs text-[#6a2500] ${className}`}>
        <span className="material-symbols-outlined text-[#a14009] text-[20px] shrink-0 mt-0.5">
          {icon}
        </span>
        <div>
          {title && <strong className="block font-semibold text-sm text-[#a14009] mb-0.5">{title}</strong>}
          <p className="leading-relaxed opacity-90">{message}</p>
        </div>
      </div>
    );
  }

  // Default 'card' variant
  return (
    <div className={`p-5 rounded-xl bg-white border border-dashed border-[#dcdcdc] flex flex-col items-center justify-center text-center gap-2.5 py-7 text-neutral-600 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-[#f6eee9] text-[#a14009] flex items-center justify-center">
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      {badgeText && (
        <span className="px-2.5 py-0.5 rounded-full bg-[#a14009]/10 text-[#a14009] text-[10px] font-bold uppercase tracking-wider">
          {badgeText}
        </span>
      )}
      <h4 className="font-serif text-sm sm:text-base font-semibold text-[#1a1c1c]">{title}</h4>
      <p className="text-xs text-[#5f5e5e] max-w-sm leading-relaxed">{message}</p>
    </div>
  );
};
