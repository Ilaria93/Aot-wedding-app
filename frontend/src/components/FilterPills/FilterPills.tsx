import type { ComponentType } from 'react';
import './styles/FilterPills.scss';

export type FilterPillOption<T extends string = string> = {
  id: T;
  label: string;
  icon?: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
};

type FilterPillsProps<T extends string = string> = {
  options: FilterPillOption<T>[];
  active: T;
  onChange: (id: T) => void;
};

/** Row of gold-on-active filter chips — shared by every admin section's toolbar. */
export function FilterPills<T extends string = string>({ options, active, onChange }: FilterPillsProps<T>) {
  return (
    <div className="filter-pills">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`filter-pills__item${option.id === active ? ' is-active' : ''}`}
          onClick={() => onChange(option.id)}>
          {option.icon ? <option.icon size={14} aria-hidden /> : null}
          {option.label}
        </button>
      ))}
    </div>
  );
}
