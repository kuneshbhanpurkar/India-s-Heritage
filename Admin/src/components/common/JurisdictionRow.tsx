import React from 'react';
import { JurisdictionLedgerItem } from '../../types';

export interface JurisdictionRowProps {
  item: JurisdictionLedgerItem;
  isSelected?: boolean;
  onSelect: (state: string, district: string) => void;
}

export const JurisdictionRow: React.FC<JurisdictionRowProps> = ({
  item,
  isSelected,
  onSelect,
}) => {
  const isHighlightedOrSelected = isSelected || item.isHighlighted;

  return (
    <tr
      onClick={() => onSelect(item.state, item.district)}
      className={`hover:bg-surface-container-low/50 transition-colors cursor-pointer ${
        isHighlightedOrSelected ? 'bg-surface-container-low/40' : ''
      }`}
      title={`Click to set operational scope to ${item.district}, ${item.state}`}
    >
      <td className="p-3 pl-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[0.65rem] shrink-0 ${
              isHighlightedOrSelected
                ? 'bg-primary text-white'
                : 'bg-surface-container text-on-surface-variant border border-surface-container'
            }`}
          >
            {item.code}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-on-surface text-xs">{item.state}</span>
            {isHighlightedOrSelected && (
              <span className="text-[0.62rem] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                ACTIVE
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="p-3">
        <span className="text-secondary text-xs">{item.district} Circle</span>
      </td>
      <td className="p-3">
        <span className="inline-flex items-center gap-1 text-[0.7rem] text-secondary font-medium bg-surface-container px-2 py-0.5 rounded border border-surface-container">
          <span className="material-symbols-outlined text-xs text-primary">category</span>
          {item.activeCategories}
        </span>
      </td>
      <td className="p-3 text-right">
        <span className="font-semibold text-emerald-700 text-xs">
          {item.published}
        </span>
      </td>
      <td className="p-3 text-right">
        <span className="font-medium text-amber-800 text-xs">{item.draft}</span>
      </td>
    </tr>
  );
};
