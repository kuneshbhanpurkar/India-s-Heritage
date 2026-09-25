import React from 'react';
import { AdminOfficer } from '../../types';
import { StatusBadge } from './StatusBadge';

export interface OfficerTableRowProps {
  officer: AdminOfficer;
  onEdit: (officer: AdminOfficer) => void;
  onRevoke: (id: string) => void;
  onReactivate?: (id: string) => void;
}

export const OfficerTableRow: React.FC<OfficerTableRowProps> = ({
  officer,
  onEdit,
  onRevoke,
  onReactivate,
}) => {
  return (
    <tr className="hover:bg-surface-container-low/50 transition-colors group">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {officer.avatar ? (
              <img
                alt={officer.name}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-surface-container shadow-sm"
                src={officer.avatar}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-surface-container text-secondary flex items-center justify-center font-medium text-xs ring-1 ring-surface-container shrink-0">
                {officer.initials || officer.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-white ${
                officer.status === 'Active'
                  ? 'bg-emerald-500'
                  : officer.status === 'Pending Review'
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              title={officer.status}
            />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-on-surface text-sm truncate">
              {officer.name}
            </div>
            <div className="text-xs text-secondary flex items-center gap-1.5 mt-0.5">
              <span>{officer.code}</span>
              <span>•</span>
              <span>{officer.designation}</span>
            </div>
            <div className="text-[0.66rem] text-secondary/70 truncate">
              {officer.circle}
            </div>
          </div>
        </div>
      </td>

      <td className="py-3 px-4">
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-surface-container text-on-surface border border-surface-container inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-xs text-secondary">
            {officer.role === 'Super Admin' ? 'shield' : 'account_balance'}
          </span>
          {officer.role}
        </span>
      </td>

      <td className="py-3 px-4">
        <StatusBadge status={officer.status} pill={false} />
      </td>

      <td className="py-3 pr-5 pl-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(officer)}
            className="p-1.5 text-secondary hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
            title="Edit Officer details"
          >
            <span className="material-symbols-outlined text-base">edit</span>
          </button>
          {officer.status === 'Active' ? (
            <button
              type="button"
              onClick={() => onRevoke(officer.id)}
              className="p-1.5 text-secondary hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              title="Revoke / Suspend Access"
            >
              <span className="material-symbols-outlined text-base">block</span>
            </button>
          ) : (
            onReactivate && (
              <button
                type="button"
                onClick={() => onReactivate(officer.id)}
                className="p-1.5 text-secondary hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Re-activate Access"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
              </button>
            )
          )}
        </div>
      </td>
    </tr>
  );
};
