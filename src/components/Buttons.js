export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`w-full py-3 bg-sky-600 text-white font-bold rounded-xl shadow-lg hover:bg-sky-700 transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`w-full py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
} 