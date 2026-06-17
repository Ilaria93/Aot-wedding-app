import { Check } from 'lucide-react';
import './styles/RememberMeToggle.scss';

type RememberMeToggleProps = {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

/** Bronze checkbox toggle used on auth screens. */
export function RememberMeToggle({ checked, label, onChange }: RememberMeToggleProps) {
  return (
    <button
      type="button"
      className="inline-toggle"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}>
      <span className={`inline-toggle__box${checked ? ' is-active' : ''}`}>
        {checked ? <Check size={11} aria-hidden /> : null}
      </span>
      <span>{label}</span>
    </button>
  );
}
