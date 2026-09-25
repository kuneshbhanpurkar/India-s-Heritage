import React from 'react';

export interface DaySelectorProps {
  days?: string[];
  selectedDays: string[];
  onToggleDay?: (day: string) => void;
  onChange?: (days: string[]) => void;
  label?: string;
  className?: string;
}

export const DEFAULT_WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DaySelector: React.FC<DaySelectorProps> = ({
  days = DEFAULT_WEEK_DAYS,
  selectedDays,
  onToggleDay,
  onChange,
  label,
  className = '',
}) => {
  const handleToggle = (day: string) => {
    if (onToggleDay) {
      onToggleDay(day);
    } else if (onChange) {
      if (selectedDays.includes(day)) {
        onChange(selectedDays.filter((d) => d !== day));
      } else {
        onChange([...selectedDays, day]);
      }
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {days.map((day) => {
          const isSelected = selectedDays.includes(day);
          return (
            <button
              key={day}
              id={`day-select-${day.toLowerCase()}`}
              type="button"
              onClick={() => handleToggle(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container hover:bg-surface-container-high text-secondary border border-surface-container'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};
