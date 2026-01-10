import { observable } from "@legendapp/state";

// Holds an optional fake clock value for testing date-dependent flows
export const fakeNow$ = observable<Date | null>(null);
const fakeNowSetAt$ = observable<number | null>(null);

export const setFakeNow = (date: Date) => {
  fakeNow$.set(date);
  fakeNowSetAt$.set(Date.now());
};

export const clearFakeNow = () => {
  fakeNow$.set(null);
  fakeNowSetAt$.set(null);
};

export const getNow = () => {
  const v = fakeNow$.get();
  if (!v) return new Date();
  const setAt = fakeNowSetAt$.get();
  if (!setAt) return new Date(v);
  const delta = Date.now() - setAt;
  return new Date(v.getTime() + delta);
};
