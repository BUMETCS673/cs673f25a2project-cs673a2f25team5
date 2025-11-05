import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { FaAngleDown } from "react-icons/fa6";
import clsx from "clsx";


const sortOptions = [
 "Date",
 "Distance",
 "Price",
 "Capacity",
 "A to Z",
 "Z to A",
];


interface EventFilterProps {
 value: string;
 onChange: (newSort: string) => void;
}


export function EventFilter({ value, onChange }: EventFilterProps) {
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


       <PopoverPanel
         transition
         className="absolute right-0 z-10 mt-3 w-36 origin-top-right rounded-lg
                    bg-white/90 dark:bg-black/70 backdrop-blur-md shadow-2xl
                    transition-all duration-200 focus:outline-hidden
                    data-[closed]:scale-95 data-[closed]:opacity-0"
       >
         <div className="py-2 px-2 flex flex-col space-y-2">
           {sortOptions.map((option) => (
             <button
               key={option}
               type="button"
               onClick={() => onChange(option)}
               className={clsx(
                    "block w-full rounded-md px-5 py-3 text-sm text-center font-medium transition-all duration-300",
                    value === option
                      ? "bg-gradient-to-r from-[#5c1354] to-[#b34fa8] text-white shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-[#5c1354] hover:to-[#b34fa8] hover:text-white"
               )}
             >
               {option}
             </button>
           ))}
         </div>
       </PopoverPanel>
     </Popover>
   </div>
 );
}
