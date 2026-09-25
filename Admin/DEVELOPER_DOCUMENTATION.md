# Developer Component Documentation & Integration Guide
## Dharohar — National Heritage Surveillance & Archival Portal

This guide provides a comprehensive technical manual for every dynamic and reusable UI component in the Dharohar system. It is designed to enable backend developers, frontend engineers, and API integrators to plug real database endpoints directly into the presentation layer without altering styling, layout, or accessibility semantics.

---

## 1. Architectural Data Pipeline

When integrating a backend database (PostgreSQL, Firestore, MySQL, MongoDB, or Supabase), data follows this standardized lifecycle:

```
┌──────────────────────────┐
│   DATABASE RECORD        │ (e.g., PostgreSQL `heritage_monuments` or Firestore `places/{id}`)
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   API RESPONSE JSON      │ (e.g., GET `/api/places` returning formatted DTOs)
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   REACT STATE HOOK /     │ (e.g., `useState<HeritagePlace[]>` or React Query)
│   CONTEXT PROVIDER       │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   DYNAMIC COMPONENT      │ (e.g., `<PlaceTableRow />` or `<MetricCard />`)
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   ACCESSIBLE DOM / UI    │ (Tailwind styled, high-contrast, responsive interface)
└──────────────────────────┘
```

### Type Definitions Reference (`src/types.ts`)
All components share strongly-typed contracts defined in `/src/types.ts`:
- `HeritagePlace`: Physical monument or cultural site record
- `AdminOfficer`: ASI administrative officer or surveyor account
- `MetricItem`: High-level KPI card descriptor
- `FilterTabItem`: Tab navigation item with optional dot color and count
- `JurisdictionLedgerItem`: State and district circular surveillance record
- `VideoRecord`: Curated streaming archival footage record
- `PdfDocument`: Statutory monograph or archival gazetteer record

---

## 2. Dynamic Component Catalog

---

### Component 1: `MetricCard`
- **File / Path**: `/src/components/common/MetricCard.tsx` (also exported from `/src/components/common/index.ts`)
- **What it does**: Renders an executive KPI metric card displaying title, primary metric value, secondary unit/metric, Material Symbols icon, trend badge (with optional pulsing live beacon), subtitle, and optional clickable hover action.
- **Where to call it**: In dashboard overviews, category landing pages, analytics summaries, or statistics grids.

#### Data Specification
- **Required Data**:
  - `title` (string): Metric label (e.g., `"Documented Assets"`, `"Annual Footfall"`)
  - `value` (string | number): Main display number (e.g., `"1,835"`, `48200`)
  - `icon` (string): Material Symbols icon identifier (e.g., `"account_balance"`, `"visibility"`)
- **Optional Data**:
  - `subValue` (string): Suffix or secondary stat (e.g., `"/ 2,400"`, `"sites"`)
  - `subtitle` (string): Explanatory footer text (e.g., `"Under Rajasthan Circle jurisdiction"`)
  - `badge` (object): Status or growth pill:
    - `text` (string): Label (e.g., `"+12.4% MoM"`, `"Live"`)
    - `variant` (`'emerald' | 'amber' | 'tertiary' | 'primary' | 'neutral'`): Color theme
    - `pulse` (boolean): Whether to animate a pulsing green indicator
  - `actionLabel` (string): Text shown on hover for clickable cards (e.g., `"Inspect Circle →"`)
  - `onClick` (() => void): Click event handler callback
  - `valueColorClass` (string): Custom Tailwind class for the value text (e.g., `"text-emerald-700"`)
  - `iconContainerClass` (string): Custom Tailwind background and color for icon container
  - `hoverBorderClass` (string): Custom border hover class (defaults to `"hover:border-outline-variant/60"`)
  - `className` (string): Additional wrapper CSS classes

#### Data Object Format
```typescript
interface MetricItem {
  id?: string;
  title: string;
  value: string | number;
  subValue?: string;
  icon: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: 'emerald' | 'amber' | 'tertiary' | 'primary' | 'neutral';
    pulse?: boolean;
  };
  actionLabel?: string;
  onClick?: () => void;
  hoverBorderClass?: string;
  valueColorClass?: string;
  iconContainerClass?: string;
}
```

#### How to Pass Data & Render Multiple Items
```tsx
import { MetricCard } from './components/common';
import { MetricItem } from './types';

// API Response Array:
const kpiData: MetricItem[] = [
  {
    id: 'kpi-monuments',
    title: 'Monuments Cataloged',
    value: '1,835',
    subValue: 'sites',
    icon: 'account_balance',
    subtitle: 'Across 28 states and territories',
    badge: { text: '+3.2%', variant: 'emerald', pulse: true },
    iconContainerClass: 'bg-primary/10 text-primary',
  },
  {
    id: 'kpi-footfall',
    title: 'Verified Footfall',
    value: '48.2K',
    icon: 'group',
    subtitle: 'This quarter nationwide',
    badge: { text: 'Surveillance Active', variant: 'amber' },
    iconContainerClass: 'bg-amber-50 text-amber-800',
  }
];

// Rendering multiple items in a responsive grid:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {kpiData.map((item) => (
    <MetricCard key={item.id} {...item} />
  ))}
</div>
```

---

### Component 2: `ToggleSwitch`
- **File / Path**: `/src/components/common/ToggleSwitch.tsx` (also exported from `/src/components/common/index.ts`)
- **What it does**: Accessible, accessible-keyboard-aware sliding switch for boolean flags. Supports standalone switches, in-card encapsulated toggles, customizable colors (`primary`, `amber`, `emerald`, `stone`), custom status labels (`"Active"` / `"Disabled"`), and sizes (`'sm' | 'md' | 'lg'`).
- **Where to call it**: Status headers, form wizard step enablers, location coordinate toggles, settings panels, or table inline switches.

#### Data Specification
- **Required Data**:
  - `checked` (boolean): Controlled state value
  - `onChange` ((checked: boolean) => void): Handler when switch is toggled
- **Optional Data**:
  - `id` (string): Unique DOM identifier (defaults to autogenerated)
  - `label` (string): Descriptive label displayed next to or above switch
  - `statusLabels` (`{ active: string; inactive: string }`): Labels corresponding to state (defaults to `{ active: 'Active', inactive: 'Inactive' }`)
  - `color` (`'primary' | 'amber' | 'emerald' | 'stone'`): Active track color (defaults to `'primary'`)
  - `size` (`'sm' | 'md' | 'lg'`): Physical switch size (defaults to `'md'`)
  - `disabled` (boolean): Disables user interaction
  - `inCard` (boolean): Wraps switch inside a high-contrast container with border
  - `title` (string): Tooltip text
  - `className` (string): Additional wrapper CSS classes

#### How to Pass Data & Example Usage
```tsx
import { useState } from 'react';
import { ToggleSwitch } from './components/common';

export function CategoryStatusControl() {
  const [isActive, setIsActive] = useState(true);

  return (
    <ToggleSwitch
      id="category-visibility-toggle"
      checked={isActive}
      onChange={setIsActive}
      label="Category Visibility"
      statusLabels={{ active: 'Published', inactive: 'Draft / Hidden' }}
      color="emerald"
      size="md"
      inCard={true}
      title="Toggle whether visitors can see this category"
    />
  );
}
```

---

### Component 3: `TariffInput`
- **File / Path**: `/src/components/common/TariffInput.tsx` (also exported from `/src/components/common/index.ts`)
- **What it does**: Standardized financial tariff and fee input. Handles currency symbols, step increments, validation hints, optional icons, and supports 3 layout variants:
  - `'vertical'`: Rich card layout with top icon and bottom statutory explanation
  - `'horizontal'`: Inline bar layout with left icon/title and right input
  - `'compact'`: Ultra-dense container for high-density grids
- **Where to call it**: Monument admission ticket fee configuration, photography/drone permit pricing, or concession rate editors.

#### Data Specification
- **Required Data**:
  - `label` (string): Name of the tariff tier (e.g., `"Domestic Citizens"`, `"Foreign Tourists"`)
  - `value` (string): Controlled numeric string input
  - `onChange` ((val: string) => void): Input change handler
- **Optional Data**:
  - `id` (string): Input element DOM ID
  - `currencySymbol` (string): Currency indicator (defaults to `"₹"`)
  - `placeholder` (string): Placeholder text (defaults to `"0"`)
  - `step` (string): Numeric step (defaults to `"5"`)
  - `min` (string): Minimum allowed number (defaults to `"0"`)
  - `icon` (string): Material Symbols icon identifier (e.g., `"person"`, `"flight"`, `"photo_camera"`)
  - `subtitle` (string): Statutory ID or policy note (e.g., `"Valid Govt Photo ID required"`)
  - `layout` (`'vertical' | 'horizontal' | 'compact'`): Visual display orientation
  - `className` (string): Custom CSS styling

#### How to Pass Data & Render Multiple Items
```tsx
import { useState } from 'react';
import { TariffInput } from './components/common';

export function MonumentTariffSection() {
  const [tariffs, setTariffs] = useState({
    domestic: '50',
    saarc: '100',
    foreign: '500',
    student: '25',
  });

  const tiers = [
    { key: 'domestic', label: 'Domestic Citizens', icon: 'person', subtitle: 'Govt Photo ID required' },
    { key: 'saarc', label: 'SAARC / BIMSTEC', icon: 'public', subtitle: 'Regional treaty passport' },
    { key: 'foreign', label: 'Foreign Tourists', icon: 'flight', subtitle: 'International passport' },
    { key: 'student', label: 'Student Concession', icon: 'school', subtitle: 'Valid Institutional ID' },
  ] as const;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {tiers.map((tier) => (
        <TariffInput
          key={tier.key}
          label={tier.label}
          icon={tier.icon}
          subtitle={tier.subtitle}
          value={tariffs[tier.key]}
          onChange={(val) => setTariffs((prev) => ({ ...prev, [tier.key]: val }))}
          layout="vertical"
        />
      ))}
    </div>
  );
}
```

---

### Component 4: `DaySelector`
- **File / Path**: `/src/components/common/DaySelector.tsx` (also exported from `/src/components/common/index.ts`)
- **What it does**: Interactive multi-select button group representing operational schedule days (Monday through Sunday). Automatically manages active button states, keyboard clicks, and emits updated day selections.
- **Where to call it**: Monument visiting schedules, ticket office operating hours, and maintenance calendars.

#### Data Specification
- **Required Data**:
  - `selectedDays` (string[]): Array of active day abbreviations (e.g., `['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']`)
- **Optional Data**:
  - `onChange` ((days: string[]) => void): Preferred handler returning full updated array
  - `onToggleDay` ((day: string) => void): Alternative handler returning only the toggled day
  - `days` (string[]): Custom day options (defaults to `['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']`)
  - `label` (string): Header label displayed above the day selector
  - `className` (string): Additional wrapper CSS classes

#### How to Pass Data & Example Usage
```tsx
import { useState } from 'react';
import { DaySelector } from './components/common';

export function ScheduleConfiguration() {
  const [openDays, setOpenDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

  return (
    <DaySelector
      label="Operating Schedule & Open Days"
      selectedDays={openDays}
      onChange={setOpenDays}
    />
  );
}
```

---

### Component 5: `FilterTabs`
- **File / Path**: `/src/components/common/FilterTabs.tsx` (also exported from `/src/components/common/index.ts`)
- **What it does**: Generic, type-safe horizontal tab bar for switching filtered views. Renders tab label, status dot indicator (e.g., green for published, amber for draft), dynamic badge count, and active highlights.
- **Where to call it**: Directory filter bars, administrative table views, and status triage screens.

#### Data Specification
- **Required Data**:
  - `tabs` (FilterTabItem<T>[]): Array of tab configuration objects:
    - `id` (T extends string): Unique tab identifier
    - `label` (string): Display text
    - `count` (number | string, optional): Number of matching records
    - `dotColor` (string, optional): Tailwind background class for dot (e.g., `'bg-emerald-500'`)
    - `badgeClass` (string, optional): Custom CSS for count badge
  - `activeTab` (T): Currently selected tab identifier
  - `onTabChange` ((tabId: T) => void): Selection callback
- **Optional Data**:
  - `className` (string): Custom CSS styling

#### How to Pass Data & Example Usage
```tsx
import { useState } from 'react';
import { FilterTabs } from './components/common';
import { FilterTabItem } from './types';

type PlaceTab = 'all' | 'published' | 'draft' | 'review';

export function PlaceFilterBar({ totalCounts }: { totalCounts: Record<PlaceTab, number> }) {
  const [activeTab, setActiveTab] = useState<PlaceTab>('published');

  const tabs: FilterTabItem<PlaceTab>[] = [
    { id: 'published', label: 'Published', count: totalCounts.published, dotColor: 'bg-emerald-500' },
    { id: 'draft', label: 'Draft', count: totalCounts.draft, dotColor: 'bg-amber-500' },
    { id: 'review', label: 'In Review', count: totalCounts.review, dotColor: 'bg-tertiary' },
    { id: 'all', label: 'All Records', count: totalCounts.all },
  ];

  return (
    <FilterTabs<PlaceTab>
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}
```

---

### Component 6: `StatusBadge`
- **File / Path**: `/src/components/common/StatusBadge.tsx` (also exported from `/src/components/common/index.ts`)
- **What it does**: Intelligently renders colored status badges with indicator dots according to standard government lifecycle states (`Published`, `Active`, `Draft`, `Pending Review`, `Suspended`). Supports pill and inline-dot variants.
- **Where to call it**: Inside table rows, preview headers, cards, and modal banners.

#### Data Specification
- **Required Data**:
  - `status` (string): Status text (e.g., `'Published'`, `'Active'`, `'Draft (In Curation)'`, `'Suspended'`)
- **Optional Data**:
  - `pill` (boolean): When true, renders rounded pill with border; when false, renders inline text with leading dot (defaults to `true`)
  - `className` (string): Custom CSS classes

#### How to Pass Data & Example Usage
```tsx
import { StatusBadge } from './components/common';

// Pill style (for tables and headers):
<StatusBadge status="Published" />
<StatusBadge status="Draft (Missing GIS)" />

// Inline style (for officer directories):
<StatusBadge status="Active" pill={false} />
```

---

### Component 7: `Pagination`
- **File / Path**: `/src/components/common/Pagination.tsx` (also exported from `/src/components/common/index.ts`)
- **What it does**: Accessible pagination footer bar with calculated page indexes, item ranges (e.g., "Showing 1-10 of 1,835"), rows-per-page dropdown, and previous/next page navigation buttons.
- **Where to call it**: Underneath any tabular or list view (Heritage Places table, Officers list, Jurisdiction ledger).

#### Data Specification
- **Required Data**:
  - `currentPage` (number): Active 1-indexed page
  - `totalItems` (number): Total count of records matching current query
  - `rowsPerPage` (string | number): Items displayed per page
  - `onPageChange` ((page: number) => void): Page change handler
- **Optional Data**:
  - `onRowsPerPageChange` ((rows: string) => void): Dropdown handler for page size
  - `rowOptions` ((string | number)[]): Options for page size (defaults to `['10', '25', '50']`)
  - `itemLabel` (string): Plural noun describing items (defaults to `'verified heritage places'`)
  - `className` (string): Custom CSS styling

#### How to Pass Data & Example Usage
```tsx
import { useState } from 'react';
import { Pagination } from './components/common';

export function PlaceListPagination({ totalCount }: { totalCount: number }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('10');

  return (
    <Pagination
      currentPage={page}
      totalItems={totalCount}
      rowsPerPage={pageSize}
      onPageChange={setPage}
      onRowsPerPageChange={setPageSize}
      itemLabel="monuments"
    />
  );
}
```

---

### Component 8: `PlaceTableRow`
- **File / Path**: `/src/components/common/PlaceTableRow.tsx` (also exported from `/src/components/common/index.ts`)
- **What it does**: Represents one verified heritage site inside an HTML `<tbody>` element. Displays thumbnail with fallback, title, ASI monument reference code, category badge with icon, district/city, status badge, and contextual action buttons (`View`, `Edit`, `Delete`, `Quick Publish`).
- **Where to call it**: Inside standard `<table>` elements in directory listings or search views.

#### Data Specification
- **Required Data**:
  - `place` (HeritagePlace): Record object with keys:
    ```typescript
    {
      id: string;
      name: string;
      code: string;
      category: 'Fort' | 'Temple' | 'Palace' | 'Stepwell' | 'Museum' | 'Monument' | 'Haveli' | 'Water Fort' | 'Cultural Heritage' | 'Other';
      city: string;
      subLocation: string;
      status: 'Published' | 'Draft (In Curation)' | 'Draft (Missing GIS)' | 'Verification Pending';
      imageUrl: string;
    }
    ```
  - `onView` ((place: HeritagePlace) => void): Triggered when clicking name, image, or View button
  - `onEdit` ((place: HeritagePlace) => void): Triggered when clicking Edit icon
  - `onDelete` ((id: string) => void): Triggered when clicking Delete icon
- **Optional Data**:
  - `onQuickPublish` ((place: HeritagePlace) => void): Shows "Publish" button on draft records
  - `categoryIcon` (string): Custom Material Symbols icon override

#### How to Pass Data & Render Multiple Items
```tsx
import { PlaceTableRow } from './components/common';
import { HeritagePlace } from './types';

interface PlacesTableProps {
  places: HeritagePlace[];
  onView: (p: HeritagePlace) => void;
  onEdit: (p: HeritagePlace) => void;
  onDelete: (id: string) => void;
  onPublish: (p: HeritagePlace) => void;
}

export const PlacesTable: React.FC<PlacesTableProps> = ({
  places,
  onView,
  onEdit,
  onDelete,
  onPublish,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-container-low border-b border-surface-container text-xs text-secondary uppercase font-bold">
          <tr>
            <th className="py-3 px-4 w-16 text-center">Visual</th>
            <th className="py-3 px-4">Monument Name & Code</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Circle / Sub-Precinct</th>
            <th className="py-3 px-4">Surveillance Status</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container text-xs">
          {places.map((place) => (
            <PlaceTableRow
              key={place.id}
              place={place}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onQuickPublish={onPublish}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

### Component 9: `OfficerTableRow`
- **File / Path**: `/src/components/common/OfficerTableRow.tsx` (also exported from `/src/components/common/index.ts`)
- **What it does**: Renders an administrative officer row inside an HTML `<tbody>`. Displays officer avatar image or monogram initials, presence dot indicator, name, official GovNet code, designation, circle jurisdiction, role badge, status badge, and action buttons (`Edit`, `Revoke`, `Reactivate`).
- **Where to call it**: Administrative governance dashboards and GovNet officer directory tables.

#### Data Specification
- **Required Data**:
  - `officer` (AdminOfficer): Account object:
    ```typescript
    {
      id: string;
      name: string;
      code: string;
      designation: string;
      role: 'Super Admin' | 'Circle Admin' | 'Archival Auditor';
      status: 'Active' | 'Pending Review' | 'Suspended';
      avatar?: string;
      initials?: string;
      circle: string;
      email: string;
    }
    ```
  - `onEdit` ((officer: AdminOfficer) => void): Triggered when editing credentials or title
  - `onRevoke` ((id: string) => void): Triggered to suspend access
- **Optional Data**:
  - `onReactivate` ((id: string) => void): Triggered to reinstate suspended account

#### How to Pass Data & Render Multiple Items
```tsx
import { OfficerTableRow } from './components/common';
import { AdminOfficer } from './types';

export function OfficersTable({
  officers,
  onEdit,
  onRevoke,
  onReactivate,
}: {
  officers: AdminOfficer[];
  onEdit: (officer: AdminOfficer) => void;
  onRevoke: (id: string) => void;
  onReactivate: (id: string) => void;
}) {
  return (
    <table className="w-full text-left">
      <tbody className="divide-y divide-surface-container">
        {officers.map((officer) => (
          <OfficerTableRow
            key={officer.id}
            officer={officer}
            onEdit={onEdit}
            onRevoke={onRevoke}
            onReactivate={onReactivate}
          />
        ))}
      </tbody>
    </table>
  );
}
```

---

### Component 10: `JurisdictionRow`
- **File / Path**: `/src/components/common/JurisdictionRow.tsx` (also exported from `/src/components/common/index.ts`)
- **What it does**: Renders an administrative territorial row representing a monitored state and district circle with its state code badge, active categories count, published sites count, draft count, and active selection indicator.
- **Where to call it**: Territorial jurisdiction tables, circle filter ledgers, and administrative audit panels.

#### Data Specification
- **Required Data**:
  - `item` (JurisdictionLedgerItem):
    ```typescript
    {
      code: string;             // e.g. "RJ", "UK", "MP"
      state: string;            // e.g. "Rajasthan"
      district: string;         // e.g. "Jaipur"
      activeCategories: string; // e.g. "6 Active Categories"
      published: number;        // e.g. 1691
      draft: number;            // e.g. 100
      isHighlighted?: boolean;
    }
    ```
  - `onSelect` ((state: string, district: string) => void): Triggered when clicked to scope the application
- **Optional Data**:
  - `isSelected` (boolean): Highlighting flag

#### How to Pass Data & Render Multiple Items
```tsx
import { JurisdictionRow } from './components/common';
import { JurisdictionLedgerItem } from './types';

export function JurisdictionLedger({
  ledger,
  selectedState,
  selectedDistrict,
  onSelect,
}: {
  ledger: JurisdictionLedgerItem[];
  selectedState: string;
  selectedDistrict: string;
  onSelect: (state: string, district: string) => void;
}) {
  return (
    <table className="w-full text-left">
      <tbody>
        {ledger.map((item) => (
          <JurisdictionRow
            key={`${item.state}-${item.district}`}
            item={item}
            isSelected={selectedState === item.state && selectedDistrict === item.district}
            onSelect={onSelect}
          />
        ))}
      </tbody>
    </table>
  );
}
```

---

### Component 11: `Modal` (Base Accessible Dialog)
- **File / Path**: `/src/components/common/Modal.tsx` (also exported from `/src/components/common/index.ts`)
- **What it does**: Reusable accessible modal container. Supports backdrop blur, click-outside-to-dismiss, `Escape` key capture, automatic focus trap support, responsive width sizing, customizable headers, and pinned footer slots.
- **Where to call it**: Use as the shell for custom forms, confirmation dialogs, media previews, or detail inspectors.

#### Data Specification
- **Required Data**:
  - `isOpen` (boolean): Visibility state
  - `onClose` (() => void): Close callback
  - `children` (React.ReactNode): Modal body content
- **Optional Data**:
  - `title` (React.ReactNode): Modal header title
  - `subtitle` (string): Secondary descriptive header line
  - `icon` (string): Material Symbols icon identifier
  - `iconColorClass` (string): Tailwind icon color (defaults to `'text-primary'`)
  - `maxWidth` (`'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'`): Maximum dialog width (defaults to `'xl'`)
  - `footer` (React.ReactNode): Bottom action bar content
  - `headerCustom` (React.ReactNode): Completely replaces default header
  - `showDefaultHeader` (boolean): Whether to render top bar (defaults to `true`)
  - `className` (string): Additional CSS styling for modal dialog

#### How to Pass Data & Example Usage
```tsx
import { useState } from 'react';
import { Modal } from './components/common';

export function ConfirmPublishDialog({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Publish Monument</button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Confirm Monument Publication"
        subtitle="This will publish the record to the public National Heritage Portal"
        icon="publish"
        maxWidth="md"
        footer={
          <div className="p-3 bg-surface-container flex justify-end gap-2">
            <button onClick={() => setOpen(false)}>Cancel</button>
            <button
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
              className="bg-primary text-white px-3 py-1.5 rounded"
            >
              Confirm Publication
            </button>
          </div>
        }
      >
        <div className="p-4 text-xs text-secondary">
          Are you sure you want to transition this monument record from Draft to Published?
        </div>
      </Modal>
    </>
  );
}
```

---

### Component 12–17: Specialized Application Modals
- **File / Path**: `/src/components/Modals.tsx`

| Modal Name | What It Does | Required Props | Data Object Format |
|---|---|---|---|
| `ImagePreviewModal` | Inspects high-resolution monument cover photos with error fallback | `isOpen: boolean`<br>`onClose: () => void`<br>`imageUrl: string`<br>`title: string` | URL string & Title |
| `VideoPreviewModal` | Displays 4K/1080p archival video player card with duration, stream tags, and link to YouTube | `video: VideoRecord \| null`<br>`onClose: () => void` | `VideoRecord` (see below) |
| `PdfPreviewModal` | Displays archival document details (file size, pagination, PDF/A compliance) and download action | `pdf: PdfDocument \| null`<br>`onClose: () => void` | `PdfDocument` (see below) |
| `PlaceDetailsModal` | Full visual dossier modal with hero banner, monument code, jurisdiction, and edit shortcut | `place: HeritagePlace \| null`<br>`onClose: () => void`<br>`onEdit: (place) => void` | `HeritagePlace` |
| `InviteAdminModal` | Form modal for issuing GovNet credentials to new Archaeologists | `isOpen: boolean`<br>`onClose: () => void`<br>`onAddOfficer: (officer) => void`<br>`selectedState: string` | `AdminOfficer` constructor |
| `AddJurisdictionModal` | Form modal to enroll a new monitored district and state circle | `isOpen: boolean`<br>`onClose: () => void`<br>`onAddJurisdiction: (state, district) => void` | State & District strings |

#### Video Record Data Structure (`VideoRecord`)
```typescript
{
  id: "vid-101",
  title: "Amer Fort Drone Aerial Architectural Survey",
  subtitle: "4K UHD Survey of Maota Lake & Ramparts",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  duration: "04:18",
  quality: "4K UHD",
  status: "Active / Live",
  thumbnail: "https://images.unsplash.com/photo-1599661046289-e31897846e41"
}
```

#### PDF Document Data Structure (`PdfDocument`)
```typescript
{
  id: "pdf-201",
  title: "Jaipur Circle Monograph & Structural Survey 2026",
  subtitle: "Official Survey Publication No. 448-B",
  url: "https://asi.nic.in/publications/jaipur_circle_monograph_2026.pdf",
  fileSize: "18.4 MB",
  pages: "142 Pages",
  status: "Active / Live"
}
```

---

### Component 18: `AdminSignInView`
- **File / Path**: `/src/components/AdminSignInView.tsx`
- **What it does**: Official ASI GovNet Single Sign-On / Authentication view. Clean Email & Password entry with zero sign-up noise, password-reset in-card notifications, configurable branding titles, and quick-demo accounts for testing.
- **Where to call it**: Rendered conditionally when session authentication is inactive (`currentView === 'signin'`).

#### Data Specification
- **Required Data**:
  - `onSignIn` ((officer: AdminOfficer) => void): Called upon successful credential verification
- **Optional Data**:
  - `onCancel` (() => void): Dismisses sign-in screen
  - `currentOfficer` (AdminOfficer): Pre-fills email if an existing officer is active
  - `brandTitle` (string): Brand title text (defaults to `'Dharohar'`)
  - `brandHindi` (string): Regional script title (defaults to `'धरोहर'`)
  - `portalSubtitle` (string): Header subtitle (defaults to `'National Heritage Portal • Archaeological Survey of India'`)
  - `quickDemoAccounts` (Array<{ label: string; email: string }>): Quick-switch demo logins

#### Example Usage
```tsx
import { AdminSignInView } from './components/AdminSignInView';
import { AdminOfficer } from './types';

export function AuthenticationScreen({ onAuthSuccess }: { onAuthSuccess: (user: AdminOfficer) => void }) {
  return (
    <AdminSignInView
      onSignIn={onAuthSuccess}
      brandTitle="Dharohar"
      brandHindi="धरोहर"
      quickDemoAccounts={[
        { label: 'Dr. Sunita Sharma (DG)', email: 'sunita.sharma@asi.gov.in' },
        { label: 'Rajesh Verma (Jaipur)', email: 'rajesh.verma@asi.gov.in' },
      ]}
    />
  );
}
```

---

## 3. Database to UI Mapping Guide

Use these reference patterns when wiring real endpoints to the frontend.

### A. Fetching Heritage Places Table (`GET /api/places`)
```typescript
// 1. Backend Controller / API Response:
// GET /api/places?state=Rajasthan&district=Jaipur&status=published
[
  {
    "id": "plc-rj-001",
    "name": "Amber Fort & Palace",
    "code": "#ASI-RJ-104",
    "category": "Fort",
    "city": "Jaipur",
    "subLocation": "Amer Town",
    "status": "Published",
    "imageUrl": "https://images.unsplash.com/photo-1599661046289-e31897846e41"
  }
]

// 2. React Hook Connection:
import { useState, useEffect } from 'react';
import { PlaceTableRow } from './components/common';
import { HeritagePlace } from './types';

export function PlacesContainer() {
  const [places, setPlaces] = useState<HeritagePlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/places')
      .then((res) => res.json())
      .then((data: HeritagePlace[]) => {
        setPlaces(data);
        setLoading(false);
      });
  }, []);

  return (
    <table>
      <tbody>
        {places.map((place) => (
          <PlaceTableRow
            key={place.id}
            place={place}
            onView={(p) => console.log('View', p)}
            onEdit={(p) => console.log('Edit', p)}
            onDelete={(id) => console.log('Delete', id)}
          />
        ))}
      </tbody>
    </table>
  );
}
```

### B. Fetching Dashboard Analytics (`GET /api/metrics`)
```typescript
// 1. API Response Format:
{
  "monuments": { "count": 1835, "growth": "+3.2%" },
  "videoArchives": { "count": 482 },
  "gazetteers": { "count": 194 },
  "officers": { "count": 42 }
}

// 2. Transforming to `MetricItem[]`:
const metrics: MetricItem[] = [
  {
    title: "Cataloged Monuments",
    value: data.monuments.count.toLocaleString(),
    icon: "account_balance",
    badge: { text: data.monuments.growth, variant: "emerald", pulse: true }
  },
  {
    title: "Video Archives",
    value: data.videoArchives.count,
    icon: "video_library",
    iconContainerClass: "bg-emerald-50 text-emerald-700"
  }
];

// 3. Render:
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  {metrics.map((m, i) => (
    <MetricCard key={i} {...m} />
  ))}
</div>
```

---

## 4. Component Hierarchy & File Map

```
src/
├── types.ts                              # Source of Truth for all interfaces
├── App.tsx                               # Primary state store & router shell
├── components/
│   ├── AdminSignInView.tsx               # GovNet Authentication UI
│   ├── CategoryView.tsx                  # Dynamic Category Dashboard
│   ├── DashboardView.tsx                 # Core Portal Dashboard
│   ├── PopularPlacesView.tsx             # Filterable Places Directory
│   ├── ManageAdminsView.tsx              # Officers & Jurisdiction Governance
│   ├── AddRecordWizard.tsx               # Multi-step creation workflow
│   ├── Modals.tsx                        # Specialized dialogs (Images, Videos, PDFs)
│   ├── Sidebar.tsx                       # High-contrast navigation sidebar
│   ├── MobileHeader.tsx                  # Mobile responsive header
│   └── common/                           # Universal Reusable UI Components
│       ├── index.ts                      # Central barrel export
│       ├── MetricCard.tsx                # Metric & KPI cards
│       ├── ToggleSwitch.tsx              # Controlled boolean switch
│       ├── TariffInput.tsx               # Financial input fields
│       ├── DaySelector.tsx               # Operational schedule selector
│       ├── FilterTabs.tsx                # Status filter tabs
│       ├── StatusBadge.tsx               # Lifecycle badges
│       ├── Pagination.tsx                # Tabular pagination bar
│       ├── PlaceTableRow.tsx             # Table row for monuments
│       ├── OfficerTableRow.tsx           # Table row for officers
│       ├── JurisdictionRow.tsx           # Table row for monitored circles
│       └── Modal.tsx                     # Generic accessible modal dialog
```

---

## 5. Summary of Best Practices for Backend Integration

1. **Keep Keys Consistent**: Match your API serializer keys with `/src/types.ts` (`id`, `name`, `code`, `status`, `imageUrl`, etc.).
2. **Use the Barrel Export**: Import all common widgets cleanly via `import { MetricCard, ToggleSwitch, FilterTabs, Pagination } from './components/common';`.
3. **No Inline CSS**: Every component is styled purely with Tailwind utility classes. Do not pass inline CSS style objects.
4. **Accessible Event Handlers**: Always pass the entity object or ID into action callbacks (`onView(place)`, `onEdit(place)`, `onDelete(place.id)`) to maintain clean decoupled state updates.
