import { observable } from "@legendapp/state";

export const toastShow$ = observable({
  title: '',
  description: '',
  type: '',
  toggleFire: false,
  whereToDisplay: 0,
})

/**
 * whereToDisplay
 * 0 — app/_layout.tsx
 * 1 — app/create.tsx
 */