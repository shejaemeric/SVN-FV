export default function SectionBlock({ title, children }) {
  return (
    <div className="border-t border-dashed pt-5">
      {title ? (
        <h3 className="text-lg font-semibold text-text-primary mb-3">{title}</h3>
      ) : null}
      {children}
    </div>
  );
} 