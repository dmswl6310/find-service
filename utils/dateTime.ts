type CurrentDateTime = {
  date: string;
  time: string;
};

function padTwo(value: number): string {
  return String(value).padStart(2, "0");
}

export function getCurrentDateTime(): CurrentDateTime {
  const now = new Date();
  return {
    date: `${now.getFullYear()}${padTwo(now.getMonth() + 1)}${padTwo(now.getDate())}`,
    time: `${padTwo(now.getHours())}${padTwo(now.getMinutes())}`,
  };
}

export function toDateInputValue(date: string): string {
  if (!date) return "";
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
}

export function toTimeInputValue(time: string): string {
  if (!time) return "";
  return `${time.slice(0, 2)}:${time.slice(2, 4)}`;
}

export function fromDateInputValue(dateInput: string): string {
  return dateInput.replace(/-/g, "");
}

export function fromTimeInputValue(timeInput: string): string {
  return timeInput.replace(":", "");
}
