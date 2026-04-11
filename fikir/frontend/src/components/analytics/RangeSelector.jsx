const options = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
];

export default function RangeSelector({ value, onChange, disabled }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-sm">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            value === o.value
              ? 'bg-deep-blue text-white shadow-md'
              : 'text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
