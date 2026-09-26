import React, { useState, useMemo } from 'react';
import { AdminOfficer, MetricItem } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { OfficerTableRow } from '../components/common/OfficerTableRow';

export interface ManageAdminsPageProps {
  officers: AdminOfficer[];
  onInviteNewAdmin: () => void;
  onEditOfficer: (officer: AdminOfficer) => void;
  onRevokeOfficer: (id: string) => void;
  onReactivateOfficer: (id: string) => void;
  metrics?: MetricItem[];
}

export const ManageAdminsPage: React.FC<ManageAdminsPageProps> = ({
  officers,
  onInviteNewAdmin,
  onEditOfficer,
  onRevokeOfficer,
  onReactivateOfficer,
  metrics,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const displayMetrics = useMemo(() => {
    if (metrics) return metrics;
    const superAdmins = officers.filter((officer) => officer.role === 'Super Admin').length;
    const circleAdmins = officers.filter((officer) => officer.role === 'Circle Admin').length;
    const pendingReview = officers.filter((officer) => officer.status === 'Pending Review').length;
    return [
      { id: 'adm-total', title: 'Total Officers & Admins', value: officers.length.toLocaleString(), icon: 'admin_panel_settings', subtitle: 'Configured administrator accounts', iconContainerClass: 'bg-surface-container text-secondary' },
      { id: 'adm-super', title: 'Super Administrators', value: superAdmins.toString(), icon: 'security', subtitle: 'National level oversight', iconContainerClass: 'bg-surface-container text-secondary' },
      { id: 'adm-circle', title: 'Circle Admins', value: circleAdmins.toString(), icon: 'account_balance', subtitle: 'Operational administrators', iconContainerClass: 'bg-surface-container text-secondary' },
      { id: 'adm-pending', title: 'Pending Review', value: pendingReview.toString(), icon: 'pending_actions', subtitle: 'Awaiting approval', iconContainerClass: 'bg-surface-container text-secondary' },
    ];
  }, [metrics, officers]);

  const filteredOfficers = officers.filter(
    (off) =>
      off.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      off.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      off.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      off.circle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main
      id="manage-admins-main-view"
      className="w-full flex-1 px-4 md:px-7 py-6 space-y-6 max-w-[1720px] mx-auto select-text"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-container">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
              Admin Management
            </h1>
            <span className="text-[0.68rem] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-primary border border-primary/20 uppercase tracking-wide">
              National Portal
            </span>
          </div>
          <p className="text-xs text-secondary">
            Supervise administrator accounts, jurisdictional credentials, circle delegation, and
            role-based access control policies.
          </p>
        </div>
      </div>

      {/* Dynamic 4 Metric KPI Cards */}
      <section aria-label="Portal Metrics" className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 lg:grid-cols-4">
        {displayMetrics.map((metric, idx) => (
          <MetricCard
            key={metric.id || `adm-metric-${idx}`}
            {...metric}
          />
        ))}
      </section>

      {/* Directory & Jurisdiction Officers Card */}
      <section
        id="manage-admins-section"
        aria-label="Manage Admins and Jurisdiction Governance"
        className="bg-surface-container-lowest rounded-xl p-5 md:p-6 border border-surface-container shadow-sm space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-container pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-surface-container text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              </div>
              <h2 className="font-display text-base md:text-lg font-bold text-on-surface tracking-tight">
                Directory &amp; Jurisdiction Officers
              </h2>
            </div>
            <p className="text-xs text-secondary">
              Supervise administrator accounts, jurisdictional credentials, circle delegation, and
              role-based access control.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Search filter input */}
            <div className="relative flex items-center bg-surface-container-low rounded-lg px-2.5 py-1.5 border border-surface-container">
              <span className="material-symbols-outlined text-secondary text-sm mr-1.5">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search officer..."
                className="bg-transparent text-xs text-on-surface focus:outline-none w-36 sm:w-44"
              />
            </div>

            <button
              id="invite-admin-btn"
              type="button"
              onClick={onInviteNewAdmin}
              className="px-3.5 py-1.5 rounded bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary/90 flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              <span>+ Invite / Register New Admin</span>
            </button>
          </div>
        </div>

        {/* Officers Table */}
        <div className="border border-surface-container rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface-container-low/70 border-b border-surface-container text-secondary text-[0.68rem] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold text-secondary text-[0.7rem] tracking-wider uppercase">
                    Officer
                  </th>
                  <th className="py-3 px-4 font-semibold text-secondary text-[0.7rem] tracking-wider uppercase">
                    Role
                  </th>
                  <th className="py-3 px-4 font-semibold text-secondary text-[0.7rem] tracking-wider uppercase">
                    Status
                  </th>
                  <th className="py-3 pr-5 pl-4 text-right font-semibold text-secondary text-[0.7rem] tracking-wider uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container bg-surface-container-lowest">
                {filteredOfficers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-secondary text-xs">
                      No officers found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredOfficers.map((officer) => (
                    <OfficerTableRow
                      key={officer.id}
                      officer={officer}
                      onEdit={onEditOfficer}
                      onRevoke={onRevokeOfficer}
                      onReactivate={onReactivateOfficer}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
};

// Aliases for backwards compatibility
export const ManageAdminsView = ManageAdminsPage;
export type ManageAdminsViewProps = ManageAdminsPageProps;
