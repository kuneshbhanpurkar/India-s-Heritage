import React from 'react';
import { CATEGORY_DEFINITIONS, DynamicFormField } from '../../config/categoryDefinitions';

export interface DynamicCategoryFieldsProps {
  categorySlug: string;
  values: Record<string, any>;
  onChange: (fieldName: string, value: any) => void;
  disabled?: boolean;
}

export const DynamicCategoryFields: React.FC<DynamicCategoryFieldsProps> = ({
  categorySlug,
  values = {},
  onChange,
  disabled = false,
}) => {
  const definition = CATEGORY_DEFINITIONS[categorySlug];

  if (!definition || !definition.fields || definition.fields.length === 0) {
    return null;
  }

  const renderField = (field: DynamicFormField) => {
    const value = values[field.name];

    if (field.type === 'text') {
      return (
        <div key={field.name} className="space-y-1.5">
          <label htmlFor={`dynamic-field-${field.name}`} className="block text-xs font-semibold text-on-surface">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            id={`dynamic-field-${field.name}`}
            type="text"
            disabled={disabled}
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 transition-colors"
          />
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.name} className="space-y-1.5">
          <label htmlFor={`dynamic-field-${field.name}`} className="block text-xs font-semibold text-on-surface">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            id={`dynamic-field-${field.name}`}
            disabled={disabled}
            value={value || (field.options?.[0] ?? '')}
            onChange={(e) => onChange(field.name, e.target.value)}
            className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 cursor-pointer transition-colors"
          >
            <option value="" disabled>
              Select {field.label}
            </option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'group' && field.fields) {
      const groupValues = (typeof value === 'object' && value !== null) ? value : {};

      const handleGroupSubChange = (subName: string, subVal: string) => {
        onChange(field.name, {
          ...groupValues,
          [subName]: subVal,
        });
      };

      return (
        <div key={field.name} className="col-span-full space-y-2.5 p-4 rounded-xl bg-surface-container-lowest border border-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">payments</span>
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">{field.label}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {field.fields.map((sub) => (
              <div key={sub.name} className="space-y-1">
                <label htmlFor={`dynamic-sub-${field.name}-${sub.name}`} className="block text-[0.7rem] font-medium text-secondary">
                  {sub.label}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-secondary text-xs pointer-events-none">₹</span>
                  <input
                    id={`dynamic-sub-${field.name}-${sub.name}`}
                    type="text"
                    disabled={disabled}
                    value={groupValues[sub.name] || ''}
                    onChange={(e) => handleGroupSubChange(sub.name, e.target.value)}
                    placeholder="0"
                    className="w-full pl-6 pr-3 py-1.5 bg-surface-container-low border border-surface-container rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      id={`dynamic-category-fields-${categorySlug}`}
      className="p-5 rounded-xl bg-surface-container-low/60 border border-surface-container space-y-4 animate-fade-in"
    >
      <div className="flex items-center justify-between pb-3 border-b border-surface-container">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">{definition.icon || 'category'}</span>
          <div>
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              {definition.title} Attributes
            </h3>
            <p className="text-[0.68rem] text-secondary">{definition.description}</p>
          </div>
        </div>
        <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
          Category Specific
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {definition.fields.map(renderField)}
      </div>
    </div>
  );
};
