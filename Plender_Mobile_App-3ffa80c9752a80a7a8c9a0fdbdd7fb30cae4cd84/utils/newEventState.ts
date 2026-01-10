import { observable } from "@legendapp/state";
import dayjs, { Dayjs } from "dayjs";
import { Event } from "./interface";

export const toggle$ = observable({
  closeSheet: false,
  tagModal: false,
  categoryModal: false,
  dateModal: false,
  timeModal: false,
})

export const newEvent$ = observable<Event>({
  label: "",
  description: "",
  tagIDs: [],  // number[]
  categoryID: 1,
  due_date: dayjs(),
  goal_time: 0,
});

