import React, { useState } from "react";
import { EventFilter } from "./EventFilter";

export default function SelectEventFilter() {
  const [currentSortOption, setCurrentSortOption] = useState("Date");

  const handleSortChange = (newSortOption: string) => {
    setCurrentSortOption(newSortOption);
  };

  return (
    <div className="p-4">
      <EventFilter value={currentSortOption} onChange={handleSortChange} />

      <p className="mt-4 text-center">
        Currently sorting by: <strong>{currentSortOption}</strong>
      </p>
    </div>
  );
}
