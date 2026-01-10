import { Dayjs } from "dayjs"

export interface Event {
  label: string,
  description?: string,   // optional
  // created_date ==> use today's date
  created_date?: Dayjs,
  due_date?: Dayjs,
  // repeated_date?: Repeated_Date,
  goal_time: number,
  // progress_time ==> Always set to 0
  progress_time?: number,
  tagIDs?: number[],       // link to tag object        `null` ==> no tag
  categoryID?: number,  // link to category object       `null` ==> no category
}

interface Repeated_Date {
  mode: string,
  start: Dayjs,
  stop?: Dayjs,
  weekdays?: number[],
  custom_days?: Dayjs[],
}

export interface UpdateEvent {  //todo — if the entire thing is null, just return immediately when `save` is pressed
  label: string,
  description: string,
  created_date: number,
  due_date: Dayjs,
  // repeated_date: Repeated_Date,
  goal_time: number,
  progress_time: number,
  tagIDs: number[],
  categoryID: number,
}

export interface dateRange {
  start: Date | null,
  end?: Date | null
}
export interface dateRangeString {
  start: string,
  end?: string
}

export interface FilterEvent {
  event_id: number,
  label: string,
  due_or_repeated_dates: dateRangeString,
  created_dates: dateRangeString,
  tagIDs: number[],
  categoryIDs: number[]
}

export interface Tag {
  id?: number,
  label: string,
  color: string,    // EX: "#F23A6B"
}

export interface stateTags {
  label: string,
  color: string,
  id: number,
}

export interface UpdateTag {
  label?: string,
  color?: string,   // EX: "#F23A6B"
}

export interface Category {
  label: string,
  color: string,    // EX: "#F23A6B"
}

export interface UpdateCategory {
  label?: string,
  color?: string,   // EX: "#F23A6B"
}

export interface Event_Tag {
  tagID: number,
  eventID: number,
}