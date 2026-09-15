const OPTIONS = [
  {
    value: 'Sombra',
    icon: <path d="M5 18c5-1 7-5 8-11 4 4 5 9 1 13-3 3-7 2-9-2Zm2 1c2-3 4-5 7-7" />,
  },
  {
    value: 'Meia sombra',
    icon: <><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7" /><path d="M12 8a4 4 0 0 0 0 8Z" /></>,
  },
  {
    value: 'Sol pleno',
    icon: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></>,
  },
];

export default function LightOptionField({ value, onChange, error }) {
  return (
    <fieldset aria-describedby={error ? 'initial-light-error' : undefined}>
      <legend className="mb-2 font-bold">Luminosidade inicial</legend>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 border-4 border-charcoal p-2 text-center font-bold shadow-hard transition-transform focus-within:ring-4 focus-within:ring-lime ${selected ? 'translate-x-1 translate-y-1 bg-lime shadow-none' : 'bg-offwhite hover:bg-lime/30'}`}
            >
              <input
                type="radio"
                name="initial_light"
                value={option.value}
                checked={selected}
                onChange={(event) => onChange(event.target.value)}
                className="sr-only"
              />
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-9 w-9 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
                {option.icon}
              </svg>
              <span>{option.value}</span>
            </label>
          );
        })}
      </div>
      {error && <p id="initial-light-error" className="mt-2 font-bold text-red-700">{error}</p>}
    </fieldset>
  );
}
