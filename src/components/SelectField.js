import { useState, useRef, useEffect } from 'react';

export default function SelectField({ 
  id, 
  value, 
  onChange, 
  options = [], 
  className = '',
  placeholder = 'Select an option...',
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Search options...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Find the selected option based on value
  useEffect(() => {
    const option = options.find(opt => opt.value === value);
    setSelectedOption(option);
  }, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, searchable]);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    setSelectedOption(option);
    onChange({ target: { value: option.value } });
    setIsOpen(false);
    setSearchTerm('');
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Custom Dropdown Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          w-full text-left px-4 py-3 bg-white border border-border-light rounded-xl 
          focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all duration-200
          hover:border-sky-300 hover:shadow-sm
          ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'border-sky-500 ring-2 ring-sky-500 shadow-md' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={`truncate ${selectedOption ? 'text-text-primary' : 'text-text-secondary'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <i className={`
            fa-solid fa-chevron-down transition-transform duration-200 text-text-secondary
            ${isOpen ? 'rotate-180' : ''}
          `} />
        </div>
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border-light rounded-xl shadow-lg overflow-hidden">
          {/* Search Input */}
          {searchable && (
            <div className="p-3 border-b border-border-light bg-gray-50">
              <div className="relative">
                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-border-light rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-text-secondary text-sm text-center">
                {searchTerm ? 'No options match your search' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full text-left px-4 py-3 transition-colors duration-150
                    hover:bg-sky-50 hover:text-sky-700
                    ${option.value === value ? 'bg-sky-100 text-sky-700 font-medium' : 'text-text-primary'}
                    ${option.disabled ? 'text-gray-400 cursor-not-allowed hover:bg-transparent' : 'cursor-pointer'}
                  `}
                  disabled={option.disabled}
                >
                  <div className="flex items-center">
                    {option.value === value && (
                      <i className="fa-solid fa-check text-sky-600 mr-3 text-sm" />
                    )}
                    <span className={option.value === value ? 'ml-0' : 'ml-6'}>
                      {option.label}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Search Results Info */}
          {searchable && searchTerm && filteredOptions.length > 0 && (
            <div className="px-4 py-2 text-xs text-text-secondary bg-gray-50 border-t border-border-light">
              {filteredOptions.length} of {options.length} options
            </div>
          )}
        </div>
      )}

      {/* Hidden select for form compatibility */}
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="sr-only"
        disabled={disabled}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
} 