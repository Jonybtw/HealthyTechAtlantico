import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { NumericStepper } from "@/components/ui/numeric-stepper";
import { RangeSlider } from "@/components/ui/range-slider";

function NumericStepperHarness() {
  const [value, setValue] = useState(6);

  return (
    <div>
      <NumericStepper
        label="Sleep hours"
        value={value}
        onChange={setValue}
        min={0}
        max={12}
        unit="h"
        helperText="Pick a close estimate."
        presets={[
          { label: "Short", value: 6 },
          { label: "Ideal", value: 8 },
          { label: "Long", value: 10 },
          { label: "Max boost", value: 18 },
        ]}
        decreaseLabel="Decrease"
        increaseLabel="Increase"
        stateLabels={{
          min: "Min",
          max: "Max",
          active: "Fine tune",
        }}
      />
      <output data-testid="numeric-value">{value}</output>
    </div>
  );
}

function RangeSliderHarness() {
  const [value, setValue] = useState(3);

  return (
    <div>
      <RangeSlider
        label="Energy level"
        value={value}
        onChange={setValue}
        min={0}
        max={10}
        helperText="Start with a quick feeling."
        quickChoices={[
          { label: "Low", value: 2 },
          { label: "Steady", value: 5 },
          { label: "High", value: 8 },
          { label: "Burst", value: 14 },
        ]}
        minLabel="low"
        maxLabel="high"
        labels={["low", "mid", "high"]}
      />
      <output data-testid="range-value">{value}</output>
    </div>
  );
}

describe("questionnaire controls", () => {
  it("syncs numeric presets with fine adjustment buttons", async () => {
    const user = userEvent.setup();
    render(<NumericStepperHarness />);

    expect(screen.getByTestId("numeric-value")).toHaveTextContent("6");

    await user.click(screen.getByRole("button", { name: "Long" }));
    expect(screen.getByTestId("numeric-value")).toHaveTextContent("10");

    await user.click(screen.getByRole("button", { name: /Decrease Sleep hours/i }));
    expect(screen.getByTestId("numeric-value")).toHaveTextContent("9");

    await user.click(screen.getByRole("button", { name: "Max boost" }));
    expect(screen.getByTestId("numeric-value")).toHaveTextContent("12");
  });

  it("keeps slider quick choices and manual dragging in sync", async () => {
    const user = userEvent.setup();
    render(<RangeSliderHarness />);

    await user.click(screen.getByRole("button", { name: "High" }));
    expect(screen.getByTestId("range-value")).toHaveTextContent("8");

    fireEvent.change(screen.getByRole("slider", { name: /Energy level/i }), { target: { value: "4" } });
    expect(screen.getByTestId("range-value")).toHaveTextContent("4");

    await user.click(screen.getByRole("button", { name: "Burst" }));
    expect(screen.getByTestId("range-value")).toHaveTextContent("10");
  });
});
