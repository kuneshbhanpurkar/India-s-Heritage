import React from 'react';
import { HeritagePlace } from '../../types';
import { StatusBadge } from './StatusBadge';

export interface PlaceTableRowProps {
  place: HeritagePlace;
  onView: (place: HeritagePlace) => void;
  onEdit: (place: HeritagePlace) => void;
  onDelete: (id: string) => void;
  onQuickPublish?: (place: HeritagePlace) => void;
  categoryIcon?: string;
}

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Fort':
    case 'Water Fort':
      return 'fort';
    case 'Temple':
      return 'temple_hindu';
    case 'Stepwell':
      return 'water_drop';
    case 'Palace':
    case 'Haveli':
      return 'castle';
    case 'Museum':
      return 'museum';
    case 'Monument':
      return 'monument';
    case 'Cultural Heritage':
      return 'theater_comedy';
    default:
      return 'account_balance';
  }
};

export const PlaceTableRow: React.FC<PlaceTableRowProps> = ({
  place,
  onView,
  onEdit,
  onDelete,
  onQuickPublish,
  categoryIcon,
}) => {
  const icon = categoryIcon || getCategoryIcon(place.category);

  return (
    <tr
      key={place.id}
      className="hover:bg-surface-container-low/50 transition-colors group"
    >
      <td className="py-3 px-4 text-center">
        <img
          alt={place.name}
          className="w-12 h-10 object-cover rounded border border-surface-container shadow-sm mx-auto cursor-pointer"
          src={place.imageUrl}
          onClick={() => onView(place)}
        />
      </td>
      <td className="py-3.5 px-4">
        <div
          className="font-bold text-sm text-on-surface hover:text-primary cursor-pointer transition-colors"
          onClick={() => onView(place)}
        >
          {place.name}
        </div>
        <div className="text-[0.68rem] font-mono text-secondary">{place.code}</div>
      </td>
      <td className="py-3.5 px-4">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.7rem] font-medium bg-surface-container text-on-surface-variant border border-outline-variant/60">
          <span className="material-symbols-outlined text-[12px] text-primary">
            {icon}
          </span>
          {place.category}
        </span>
      </td>
      <td className="py-3.5 px-4">
        <div className="font-medium text-on-surface">{place.city}</div>
        <div className="text-[0.68rem] text-secondary">{place.subLocation}</div>
      </td>
      <td className="py-3.5 px-4">
        <StatusBadge status={place.status} />
      </td>
      <td className="py-3.5 px-4 text-right relative">
        <div className="inline-flex items-center gap-1 justify-end">
          {place.status === 'Published' && (
            <button
              type="button"
              onClick={() => onView(place)}
              className="px-2 py-1 rounded hover:bg-surface-container text-primary font-semibold text-xs"
              title="View Public Profile"
            >
              View
            </button>
          )}
          {place.status.includes('Draft') && onQuickPublish && (
            <button
              type="button"
              onClick={() => onQuickPublish(place)}
              className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs"
              title="Publish this place"
            >
              Publish
            </button>
          )}
          {place.status === 'Verification Pending' && onQuickPublish && (
            <button
              type="button"
              onClick={() => onQuickPublish(place)}
              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs"
              title="Verify & Publish"
            >
              Verify
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(place)}
            className="p-1 rounded text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Edit Record"
          >
            <span className="material-symbols-outlined text-base">edit</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(place.id)}
            className="p-1 rounded text-secondary hover:text-tertiary hover:bg-red-50 transition-colors"
            title="Delete Record"
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
};
