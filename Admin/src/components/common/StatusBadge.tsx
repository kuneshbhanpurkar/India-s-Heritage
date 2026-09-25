import React from 'react';

export interface StatusBadgeProps {
  status: string;
  pill?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  pill = true,
  className = '',
}) => {
  const getStatusConfig = (s: string) => {
    const lower = s.toLowerCase();
    if (lower === 'published' || lower === 'active' || lower === 'active / live') {
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        dot: 'bg-emerald-600',
      };
    }
    if (lower.includes('draft') || lower.includes('pending') || lower.includes('curation')) {
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      };
    }
    if (lower.includes('review') || lower.includes('suspended') || lower.includes('action')) {
      return {
        bg: 'bg-red-50',
        text: 'text-tertiary',
        border: 'border-red-200',
        dot: 'bg-tertiary',
      };
    }
    return {
      bg: 'bg-surface-container',
      text: 'text-on-surface-variant',
      border: 'border-surface-container-high',
      dot: 'bg-secondary',
    };
  };

  const config = getStatusConfig(status);

  if (!pill) {
    return (
      <span className={`text-xs font-medium inline-flex items-center gap-1.5 ${config.text} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {status}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.68rem] font-bold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
};
