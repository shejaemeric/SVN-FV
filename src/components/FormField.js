export default function FormField({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  leftIconClass,
  inputProps = {},
}) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIconClass ? (
          <i className={`${leftIconClass} absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary`} />
        ) : null}
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full ${leftIconClass ? 'pl-12' : 'px-4'} pr-4 py-2 bg-gray-50 border border-border-light rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none`}
          {...inputProps}
        />
      </div>
    </div>
  );
} 