import { formatDate } from "../formatDate";

describe("formatDate", () => {
  const testDate = new Date("2025-02-28T12:30:00Z");
  const expectedFormat = testDate.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  it("should format a Date object correctly", () => {
    const result = formatDate(testDate);
    expect(result).toBe(expectedFormat);
  });

  it("should format a date string correctly", () => {
    const dateString = "2025-02-28T12:30:00Z";
    const result = formatDate(dateString);
    expect(result).toBe(expectedFormat);
  });
});
