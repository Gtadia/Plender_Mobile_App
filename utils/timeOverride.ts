import { observable } from "@legendapp/state";

// Holds an optional fake clock value for testing date-dependent flows
export const fakeNow$ = observable<Date | null>(null);

export const setFakeNow = (date: Date) => {
  fakeNow$.set(date);
};

export const clearFakeNow = () => {
  fakeNow$.set(null);
};

export const getNow = () => {
  const v = fakeNow$.get();
  return v ? new Date(v) : new Date();
};
