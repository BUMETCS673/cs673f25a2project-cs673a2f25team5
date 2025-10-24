/*

 AI-generated code:  0%

 Human code: 100% (functions: EventSearchField, EventSearchFieldProps) 
 
 No framework-generated code.

*/
type EventSearchFieldProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function EventSearchField({
  query,
  onQueryChange,
}: EventSearchFieldProps) {
  return (
    <div>
      <label
        htmlFor="event-search"
        className="text-sm font-semibold text-neutral-600 dark:text-neutral-300"
      >
        Search events
      </label>
      <div className="mt-2">
        <div className="relative">
          <input
            id="event-search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by name, location, or keywords..."
            className="w-full rounded-2xl border border-neutral-200 bg-white/80 px-5 py-3 text-sm text-neutral-800 shadow-sm shadow-amber-100/40 transition focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-200/40 dark:border-white/10 dark:bg-neutral-900/70 dark:text-neutral-100 dark:shadow-neutral-900/40 dark:focus:border-amber-400/60 dark:focus:ring-amber-400/20"
            type="search"
            autoComplete="off"
          />
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-medium text-neutral-400 dark:text-neutral-500">
            Ctrl+K
          </span>
        </div>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Filter by event name, location, or descriptive keywords to find the
          experience that fits your vibe.
        </p>
      </div>
    </div>
  );
}
