import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import clsx from "clsx";
import { FaAngleDown } from "react-icons/fa6";

type PriceFilterProps = {
  selectedMinPrice: number | null;
  selectedMaxPrice: number | null;
  onSelectPriceRange: (min: number | null, max: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
};

function formatLabel(min: number | null, max: number | null, cap: number) {
  if (min === null && max === null) return "Any price";
  if (min !== null && max !== null) return `$${min} – $${max}`;
  if (min !== null) return `From $${min}`;
  return `Up to $${max ?? cap}`;
}

export function PriceFilter({
  selectedMinPrice,
  selectedMaxPrice,
  onSelectPriceRange,
  min = 0,
  max = 500,
  step = 5,
}: PriceFilterProps) {
  const label = formatLabel(selectedMinPrice, selectedMaxPrice, max);

  const clamp = (value: number | null) => {
    if (value === null) return null;
    return Math.min(Math.max(value, min), max);
  };

  const handleMinChange = (value: number) => {
    const nextMin = clamp(value);
    const nextMax = clamp(selectedMaxPrice);
    if (nextMax !== null && nextMin !== null && nextMin > nextMax) {
      onSelectPriceRange(nextMin, nextMin);
      return;
    }
    onSelectPriceRange(nextMin, nextMax);
  };

  const handleMaxChange = (value: number) => {
    const nextMax = clamp(value);
    const nextMin = clamp(selectedMinPrice);
    if (nextMax !== null && nextMin !== null && nextMin > nextMax) {
      onSelectPriceRange(nextMax, nextMax);
      return;
    }
    onSelectPriceRange(nextMin, nextMax);
  };

  return (
    <Popover className="relative w-1/3">
      <PopoverButton className="flex w-full items-center justify-between rounded-full border border-neutral-200 bg-white/90 px-4 py-3 text-left text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-amber-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 dark:border-white/10 dark:bg-neutral-900/70 dark:text-neutral-100">
        <span className="truncate">{label}</span>
        <FaAngleDown
          aria-hidden
          className="ml-2 text-neutral-500 dark:text-neutral-300"
        />
      </PopoverButton>

      <PopoverPanel
        className={clsx(
          "absolute right-0 z-20 mt-3 w-[320px] rounded-2xl border border-neutral-200",
          "bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-neutral-900/90",
        )}
      >
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-300">
          <span>Price range</span>
          <button
            type="button"
            className="text-amber-600 underline underline-offset-2 hover:text-amber-500 dark:text-amber-300"
            onClick={() => onSelectPriceRange(null, null)}
          >
            Clear
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm font-medium text-neutral-700 dark:text-neutral-200">
              <span>Min: {selectedMinPrice ?? 0}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                ${min} - ${max}
              </span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={selectedMinPrice ?? min}
              onChange={(event) => handleMinChange(Number(event.target.value))}
              className="mt-2 w-full accent-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm font-medium text-neutral-700 dark:text-neutral-200">
              <span>Max: {selectedMaxPrice ?? "Any"}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                ${min} - ${max}
              </span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={selectedMaxPrice ?? max}
              onChange={(event) => handleMaxChange(Number(event.target.value))}
              className="mt-2 w-full accent-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
            />
          </div>

          <div className="flex justify-between text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            <span>${selectedMinPrice ?? min}</span>
            <span>to</span>
            <span>${selectedMaxPrice ?? max}+</span>
          </div>
        </div>
      </PopoverPanel>
    </Popover>
  );
}
