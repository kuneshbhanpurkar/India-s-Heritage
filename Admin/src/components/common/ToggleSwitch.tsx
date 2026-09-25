import React from 'react';

export interface ToggleSwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  statusLabels?: {
    active: string;
    inactive: string;
  };
  color?: 'emerald' | 'amber' | 'primary';
  inCard?: boolean;
  title?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  checked,
  onChange,
  label,
  statusLabels = { active: 'Active', inactive: 'Disabled' },
  color = 'emerald',
  inCard = false,
  title,
  className = '',
  size = 'md',
}) => {
  const getActiveBgColor = () => {
    switch (color) {
      case 'amber':
        return 'bg-amber-600';
      case 'primary':
        return 'bg-primary';
      case 'emerald':
      default:
        return 'bg-emerald-600';
    }
  };

  const getActiveTextColor = () => {
    switch (color) {
      case 'amber':
        return 'text-amber-700';
      case 'primary':
        return 'text-primary';
      case 'emerald':
      default:
        return 'text-emerald-700';
    }
  };

  const switchButton = (
    <button
      id={id}
      type="button"
      onClick={() => onChange(!checked)}
      className={`toggle-btn relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? getActiveBgColor() : 'bg-stone-300'
      }`}
      role="switch"
      aria-checked={checked}
      title={title || label || 'Toggle state'}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );

  if (!inCard && !label) {
    return switchButton;
  }

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container shadow-sm ${className}`}
    >
      <div className="flex flex-col">
        {label && (
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-secondary leading-none">
            {label}
          </span>
        )}
        <span
          className={`text-[0.72rem] font-semibold leading-tight mt-0.5 ${
            checked ? getActiveTextColor() : 'text-stone-500'
          }`}
        >
          {checked ? statusLabels.active : statusLabels.inactive}
        </span>
      </div>
      {switchButton}
    </div>
  );
};
