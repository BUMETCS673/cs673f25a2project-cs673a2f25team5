import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventSearchField } from "./EventSearchField";

function Controlled({ onChange }: { onChange: (v: string) => void }) {
  const [q, setQ] = React.useState("");
  return (
    <EventSearchField
      query={q}
      onQueryChange={(v) => {
        setQ(v);
        onChange(v);
      }}
    />
  );
}

test("renders label and updates query on type", async () => {
  const user = userEvent.setup();
  const onQueryChange = jest.fn();

  render(<Controlled onChange={onQueryChange} />);

  const input = screen.getByLabelText(/search events/i);
  await user.type(input, "music");
  expect(onQueryChange).toHaveBeenLastCalledWith("music");
});
