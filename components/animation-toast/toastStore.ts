import { observable } from "@legendapp/state";

export const toastShow$ = observable({
  title: '',
  description: '',
  type: '',
})