import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import './styles/RoleSelect.scss';

type RoleSelectOption<T extends string> = {
  value: T;
  label: string;
};

type RoleSelectProps<T extends string> = {
  label: string;
  value: T;
  options: RoleSelectOption<T>[];
  onChange: (value: T) => void;
};

/** Custom role picker matching the original Expo register dropdown. */
export function RoleSelect<T extends string>({ label, value, options, onChange }: RoleSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="role-select">
      <span className="field-label">{label}</span>
      <button type="button" className="role-select__field" onClick={() => setIsOpen((current) => !current)}>
        <span>{selected.label}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isOpen ? (
        <div className="role-select__menu">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                className={`role-select__option${isSelected ? ' is-selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}>
                <span>{option.label}</span>
                {isSelected ? <Check size={12} color="var(--aot-bronze)" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
