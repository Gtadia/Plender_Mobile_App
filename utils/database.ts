// calendarDatabase.ts
import dayjs from 'dayjs';
import * as SQLite from 'expo-sqlite';
import { RRule } from 'rrule';

const db = SQLite.openDatabaseSync('calendar.db');

// CREATE TABLE
export async function initializeDB() {
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS event (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      start_date TEXT NOT NULL,   -- ISO string
      rrule TEXT NOT NULL         -- e.g., FREQ=WEEKLY;BYDAY=MO,WE
    );
  `);
}

/*
      category NUMBER NOT NULL DEFAULT 0, -- 0: Work, 1: Personal, 2: Other
      timeGoal TEXT NOT NULL,        -- ISO string, e.g., '2023-10-01T10:00:00'
      timeSpent TEXT NOT NULL,       -- ISO string, e.g., '2023-10-01T11:00:00'
*/

export async function createEvent({
  title,
  startDate,
  rrule,
}: {
  title: string;
  startDate: string; // 'YYYY-MM-DDTHH:mm:ss'
  rrule: string;     // e.g., 'FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=2025-12-31'
}) {
  await db.runAsync(
    `INSERT INTO event (title, start_date, rrule) VALUES (?, ?, ?)`,
    [title, startDate, rrule]
  );
}

export async function getEventOccurrences(start: Date, end: Date) {
  console.log("This is running")
  const rows = await db.getAllAsync(`SELECT * FROM event`);
  console.log("Rows fetched: ", rows.length);

  const allOccurrences: { title: string; date: Date }[] = [];

  for (const row of rows) {
    console.log('occurrence row:', row);
    // TODO — Convert to dayjs, WITH MONTH and DATE ebing 2 digits (ex: 0801 for August 1st)
    const fullRule = `DTSTART:${dayjs(row.start_date).format('YYYYMMDD')}T000000Z\nRRULE:FREQ=DAILY;UNTIL=20250901T000000Z`;
    const rule = RRule.fromString(fullRule);
    console.log('Rule:', rule);
    console.log("rule rule rule");

    const occurrences = rule.between(start, end);
    console.log("Occurrences for event:", occurrences.length);
    occurrences.forEach(date => {
      console.log("Occurrences for event:", row.title, occurrences);
      allOccurrences.push({ title: row.title, date });
    });
  }

  return allOccurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function updateEvent({
  id,
  title,
  startDate,
  rrule,
}: {
  id: number;
  title: string;
  startDate: string;
  rrule: string;
}) {
  await db.runAsync(
    `UPDATE event SET title = ?, start_date = ?, rrule = ? WHERE id = ?`,
    [title, startDate, rrule, id]
  );
}


// DEBUGGING TOOLS
// TODO — Create x number of events

// TODO — Clear all events
export async function clearEvents() {
  await db.runAsync(`DELETE FROM event`);
  console.log("All events cleared");
}