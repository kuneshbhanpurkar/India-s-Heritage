import React from 'react';
import { FilterTabItem } from '../../types';

export interface FilterTabsProps<T = string> {
  tabs: FilterTabItem<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  className?: string;
}

export function FilterTabs<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: FilterTabsProps<T>) {
  return (
    <div
      className={`w-full md:w-auto flex items-center gap-1.5 p-1 bg-surface-container-low rounded-lg border border-surface-container overflow-x-auto shrink-0 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={String(tab.id)}
            id={`tab-${String(tab.id)}`}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs transition-all shrink-0 flex items-center gap-1.5 ${
              isActive
                ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                : 'text-secondary hover:text-on-surface font-medium'
            }`}
          >
            {tab.dotColor && (
              <span className={`w-1.5 h-1.5 rounded-full ${tab.dotColor}`} />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded text-[0.66rem] font-bold ${
                  tab.badgeClass || 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
