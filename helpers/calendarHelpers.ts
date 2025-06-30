import { calendarData, weekData } from "@/constants/types";
import dayjs, { Dayjs } from "dayjs";

export class DateServ {
  private static instance: DateServ;

  public static getInstance(): DateServ {
    if (!DateServ.instance) {
      DateServ.instance = new DateServ();
    }
    return DateServ.instance;
  }

  /**
   * 
   * @param month
   * @param year 
   * @returns 
   */
  public getDaysInMonth(month: number, year: number): Dayjs[] {
    return Array.from({ length: dayjs().year(year).month(month).daysInMonth() }, (_, i) =>
      dayjs().year(year).month(month).date(i + 1)
    );
  }

  /**
   *
   * @param month
   * @param year 
   * @param complete
   * @returns 
   */
  public getDaysInMonthSplitByWeek(month: number, year: number, complete: boolean = true): calendarData {
    const dayInMonth = this.getDaysInMonth(month, year);
    const result: calendarData = [];
    let tempWeek: weekData = [];

    // create the data for the current month
    dayInMonth.forEach((day, i) => {
      const isToday = day.isSame(dayjs(), 'day');
      tempWeek.push({ date: day, isToday });

      // Push the week if it's Sunday (isoWeekday 7) or last day of month
      if (day.isoWeekday() === 7 || i === dayInMonth.length - 1) {
        result.push(tempWeek);
        tempWeek = [];
      }
    });

    if (complete) { // if we want to complete the week with the previous and next month days
      // if the first week is less than 7 day, add the previous month days
      result[0] = this.prependMissingDay(result[0], year, month);
      // if the last week is less than 7 day add the next month days
      const lastElem = result.length - 1;
      result[lastElem] = this.appendMissingDay(result[lastElem], year, month);
    }

    return result;
  }

  /**
   * 
   * @param data
   * @param currentYear 
   * @param currentMonth 
   * @returns 
   */
  public prependMissingDay(data: weekData, currentYear: number, currentMonth: number): weekData {
    if (data.length === 7) return data;   // if the week is already full, return it

    const numberOfMissingDays: number = 7 - data.length;
    let m = currentMonth - 1;  // in most cases, we want to previous month
    let y = currentYear;  // in most cases, we want the current year

    if (currentMonth === 1) {
      // if we are in January, we want to go to December of the previous year
      m = 12;
      y = currentYear - 1;
    }

    const numberOfDaysInThePreviousMonth: number = dayjs().year(y).month(m).daysInMonth();
    // add the missing days from the previous month
    if (numberOfDaysInThePreviousMonth !== undefined) {
      for (let i: number = 0; i < numberOfMissingDays; i++) {
        data = [{
          date: dayjs().month(m).year(y).day(numberOfDaysInThePreviousMonth - i),
          isToday: false
        }, ...data]
      }
    }

    return data;
  }
  /**
   * 
   * @param data
   * @param currentYear 
   * @param currentMonth 
   * @returns 
   */
  public appendMissingDay(data: weekData, currentYear: number, currentMonth: number): weekData {
    if (data.length === 7) return data;  // if the week is already full, return it

    const numberOfMissingDays: number = 7 - data.length;
    let m = currentMonth + 1;  // in most cases, we want to next month
    let y = currentYear;  // in most cases, we want the current year

    if (currentMonth === 12) {
      // if we are in December, we want to go to January of the next year
      m = 1;
      y = currentYear + 1;
    }

    for (let i: number = 0; i < numberOfMissingDays; i++) {
      data.push({
        date: dayjs().month(m).year(y).day(i + 1),
        isToday: false
      });
    }

    return data;
  }
}
