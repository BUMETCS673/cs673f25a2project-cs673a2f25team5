import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { FaAngleDown } from "react-icons/fa6";

const sortEvents = [
  { name: "Date", href: "#", current: true },
  { name: "Distance", href: "#", current: false },
  { name: "Price", href: "#", current: false },
  { name: "Capacity", href: "#", current: false },
  { name: "A to Z", href: "#", current: false },
  { name: "Z to A", href: "#", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export function EventFilter() {
  return (
    <div className="flex justify-end mr-6">
      <Popover className="relative inline-block text-left">
        <PopoverButton className="group inline-flex justify-center rounded-full cursor-pointer bg-[#5c1354] px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#f8f1e8] hover:bg-[#6b1b62] hover:scale-110">
          Sort
          <FaAngleDown
            aria-hidden="true"
            className="-mr-1 ml-1 size-5 shrink-0 text-white group-hover:text-gray-500"
          />
        </PopoverButton>

        <PopoverPanel
          transition
          className="absolute right-0 z-10 mt-2 w-30 origin-top-right rounded-md bg-transparent shadow-2xl transition focus:outline-hidden data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75"
        >
          <div className="py-1">
            {sortEvents.map((option) => (
              <a
                key={option.name}
                href={option.href}
                className={classNames(
                    option.current
                      ? "font-medium text-white"
                      : "text-gray-300 block px-4 py-2 text-sm rounded-md transition duration-200 hover:bg-gradient-to-r hover:from-[#5c1354]/90 hover:to-[#b34fa8]/80 hover:text-white",
                  )}
              >
                {option.name}
              </a>
            ))}
          </div>
        </PopoverPanel>
      </Popover>
    </div>
  );
}