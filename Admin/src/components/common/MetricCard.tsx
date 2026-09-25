import React from 'react';
import { MetricItem } from '../../types';

export interface MetricCardProps extends MetricItem {
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  icon,
  subtitle,
  badge,
  actionLabel,
  onClick,
  hoverBorderClass = 'hover:border-outline-variant/60',
  valueColorClass = 'text-on-surface',
  iconContainerClass = 'bg-surface-container text-secondary',
  className = '',
}) => {
  const isClickable = Boolean(onClick);

  const getBadgeStyle = (variant?: string) => {
    switch (variant) {
      case 'emerald':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'amber':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      case 'tertiary':
        return 'text-tertiary bg-red-50 border-red-200';
      case 'primary':
        return 'text-primary bg-primary/10 border-primary/20';
      default:
        return 'text-secondary bg-surface-container border-surface-container-high';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-surface-container-lowest p-4 md:p-5 rounded-xl border border-surface-container shadow-sm flex flex-col justify-between transition-all h-full ${
        isClickable ? 'cursor-pointer group hover:border-primary/60' : hoverBorderClass
      } ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span
          className={`text-[0.68rem] md:text-xs font-semibold uppercase tracking-wider text-secondary ${
            isClickable ? 'group-hover:text-primary transition-colors' : ''
          }`}
        >
          {title}
        </span>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${iconContainerClass} ${
            isClickable ? 'group-hover:bg-primary/10 group-hover:text-primary' : ''
          }`}
        >
          <span className="material-symbols-outlined text-base md:text-lg">{icon}</span>
        </div>
      </div>

      {/* Middle Value Section */}
      <div className="my-2 flex items-baseline justify-between gap-1.5 flex-wrap">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-display text-2xl font-bold tracking-tight ${valueColorClass} ${
              isClickable ? 'group-hover:text-primary transition-colors' : ''
            }`}
          >
            {value}
          </span>
          {subValue && (
            <span className="text-xs text-secondary font-medium">{subValue}</span>
          )}
        </div>

        {badge && (
          <span
            className={`text-[0.68rem] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${getBadgeStyle(
              badge.variant
            )}`}
          >
            {badge.pulse && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
            {badge.text}
          </span>
        )}
      </div>

      {/* Bottom Subtitle / Action */}
      {(subtitle || actionLabel) && (
        <div className="text-[0.68rem] md:text-[0.7rem] text-secondary flex items-center justify-between mt-1">
          {subtitle && <span>{subtitle}</span>}
          {actionLabel && (
            <span
              className={`text-primary font-semibold transition-opacity ${
                isClickable ? 'opacity-0 group-hover:opacity-100' : ''
              }`}
            >
              {actionLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
