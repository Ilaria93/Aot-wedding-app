import { Search } from 'lucide-react';
import './styles/SearchBar.scss';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

/** Icon + input search field — shared by every admin section's toolbar. */
export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <div className="search-bar">
      <Search size={16} className="search-bar__icon" aria-hidden />
      <input
        className="search-bar__input"
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
