type EventsPaginationBannerProps = {
  rangeStart: number;
  rangeEnd: number;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  disablePrevious: boolean;
  disableNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function EventsPaginationBanner({
  rangeStart,
  rangeEnd,
  totalCount,
  currentPage,
  totalPages,
  disablePrevious,
  disableNext,
  onPrevious,
  onNext,
}: EventsPaginationBannerProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/70 px-6 py-4 text-sm text-amber-900 shadow-sm dark:border-amber-300/40 dark:bg-amber-950/50 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-semibold">
        Showing {rangeStart}–{rangeEnd} of {totalCount} events
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={disablePrevious}
          className="inline-flex items-center justify-center rounded-full border border-amber-400/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900 transition disabled:cursor-not-allowed disabled:border-amber-200/50 disabled:text-amber-300 dark:text-amber-200"
        >
          Previous
        </button>
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={disableNext}
          className="inline-flex items-center justify-center rounded-full border border-amber-400/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900 transition disabled:cursor-not-allowed disabled:border-amber-200/50 disabled:text-amber-300 dark:text-amber-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}
