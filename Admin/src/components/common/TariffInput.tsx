import React from 'react';

export interface TariffFieldConfig {
  id?: string;
  label: string;
  currencySymbol?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  step?: string;
  min?: string;
  icon?: string;
  subtitle?: string;
  layout?: 'vertical' | 'horizontal' | 'compact';
  className?: string;
}

export const TariffInput: React.FC<TariffFieldConfig> = ({
  id,
  label,
  currencySymbol = '₹',
  value,
  onChange,
  placeholder = '0',
  step = '5',
  min = '0',
  icon,
  subtitle,
  layout = 'vertical',
  className = '',
}) => {
  const generatedId = id || `tariff-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  if (layout === 'horizontal') {
    return (
      <div className={`flex items-center justify-between p-2.5 rounded-lg border border-outline-variant/50 bg-[#fbf9f5] ${className}`}>
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className="material-symbols-outlined text-secondary text-base">
              {icon}
            </span>
          )}
          <div>
            <p className="text-xs text-on-surface font-semibold">{label}</p>
            {subtitle && <p className="text-[0.62rem] text-secondary">{subtitle}</p>}
          </div>
        </div>
        <div className="relative w-24 shrink-0 flex items-center">
          <span className="absolute left-2.5 text-xs font-bold text-secondary">{currencySymbol}</span>
          <input
            id={generatedId}
            type="number"
            min={min}
            step={step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white rounded-md pl-6 pr-2 py-1 text-xs text-on-surface border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none font-bold"
          />
        </div>
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div className={`bg-surface-container-low rounded-lg p-2.5 border border-surface-container space-y-1 ${className}`}>
        <label
          htmlFor={generatedId}
          className="block text-[0.62rem] font-bold text-secondary uppercase tracking-wider truncate"
        >
          {currencySymbol} {label}
        </label>
        <div className="flex items-center">
          <span className="text-secondary text-xs mr-1 select-none">{currencySymbol}</span>
          <input
            id={generatedId}
            type="number"
            min={min}
            step={step}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-surface-container-lowest border border-surface-container rounded px-2 py-1 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    );
  }

  // Default rich vertical card layout
  return (
    <div className={`space-y-1.5 p-3 rounded-lg bg-[#fbf9f5] border border-outline-variant/50 shadow-2xs ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={generatedId} className="block text-[0.68rem] font-semibold text-on-surface uppercase truncate cursor-pointer">
          {label}
        </label>
        {icon && (
          <span className="material-symbols-outlined text-secondary text-xs">
            {icon}
          </span>
        )}
      </div>
      <div className="relative flex items-center">
        <span className="absolute left-2.5 text-xs font-bold text-secondary">{currencySymbol}</span>
        <input
          id={generatedId}
          type="number"
          min={min}
          step={step}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white rounded-md pl-6 pr-2 py-1.5 text-xs text-on-surface border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all font-bold"
        />
      </div>
      {subtitle && (
        <p className="text-[0.62rem] text-secondary leading-tight">
          {subtitle}
        </p>
      )}
    </div>
  );
};
