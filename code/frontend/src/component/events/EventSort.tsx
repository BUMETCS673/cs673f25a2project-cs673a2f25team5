/*

 AI-generated code: 70% (functions: EventSort)

 Human code: 30% (integration adjustments and styling refinements)

 No framework-generated code.

*/

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { FaAngleDown } from "react-icons/fa6";
import clsx from "clsx";

const sortOptions = ["Date", "Price", "Capacity", "A to Z", "Z to A"];

interface EventSortProps {
  value: string;
  onChange: (value: string) => void;
}

export function EventSort({ value, onChange }: EventSortProps) {
  return (
    <div className="flex justify-end mr-6">
      <Popover className="relative inline-block text-left">
        <PopoverButton className="group inline-flex justify-center rounded-full cursor-pointer transition-all duration-200 bg-[#5c1354] px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#f8f1e8] hover:bg-[#6b1b62] hover:scale-105">
          Sort
          <FaAngleDown
            aria-hidden="true"
            className="-mr-1 ml-2 size-5 shrink-0 text-white"
          />
        </PopoverButton>

        <Transition
          enter="transition duration-100 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition duration-75 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <PopoverPanel className="absolute right-0 z-10 mt-3 w-36 origin-top-right rounded-lg bg-white dark:bg-black shadow-2xl backdrop-blur-md">
            <div className="py-2 px-2 flex flex-col space-y-2">
              {sortOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChange(option)}
                  className={clsx(
                    "block w-full rounded-md px-5 py-3 text-sm text-center font-medium transition-all",
                    value === option
                      ? "cursor-pointer bg-gradient-to-r from-[#5c1354] to-[#b34fa8] text-white shadow-md"
                      : "cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-[#5c1354] hover:to-[#b34fa8] hover:text-white",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  );
}
