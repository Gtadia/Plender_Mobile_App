// calendarDatabase.ts
import dayjs, { Dayjs } from 'dayjs';
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
      rrule TEXT NOT NULL,         -- e.g., FREQ=WEEKLY;BYDAY=MO,WE
      -- Extra Fields
      category INTEGER NOT NULL DEFAULT 0, -- 0: no category
      timeGoal INTEGER NOT NULL,        -- store in seconds
      timeSpent INTEGER NOT NULL,       -- store in seconds
      percentComplete INTEGER NOT NULL DEFAULT 0, -- 0-100%
      -- Optional Fields
      description TEXT,              -- Optional description
    );
  `);
}

export async function createEvent({
  title,
  startDate,
  rrule = '',
  category = 0,
  timeGoal = 3600, // 1 hour in seconds
  timeSpent = 0,
  percentComplete = 0,
  description = '',

}: {
  title: string;
  startDate: string; // 'YYYY-MM-DDTHH:mm:ss'
  rrule?: string;     // e.g., 'FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=2025-12-31'
  category?: number;
  timeGoal?: number;
  timeSpent?: number;
  percentComplete?: number;
  description?: string;
}) {
  console.log("TEST: ", { title, startDate, rrule, category, timeGoal, timeSpent, percentComplete, description });
  await db.runAsync(
    `INSERT INTO event (title, start_date, rrule, category, timeGoal, timeSpent, percentComplete, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, startDate, rrule, category, timeGoal, timeSpent, percentComplete, description]
  );
  console.log("TEST COMPLETED");
}

// export async function getEventOccurrences(start: Date, end: Date) {
//   const rows = await db.getAllAsync(`SELECT * FROM event`);
//   console.log("Rows fetched: ", rows.length);

//   // TODO — This checks which days each EVENT/TASK is active NOT the tasks that needs to be accomplished on THAT DAY

//   const allOccurrences: { title: string; date: Date }[] = [];

//   for (const row of rows) {
//     // console.log('occurrence row:', row);
//     const fullRule = `DTSTART:${dayjs(row.start_date).format('YYYYMMDD')}T000000Z\nRRULE:FREQ=DAILY;UNTIL=20250901T000000Z`;
//     const rule = RRule.fromString(fullRule);
//     // console.log('Rule:', rule);

//     const occurrences = rule.between(start, end);
//     // console.log("Occurrences for event:", occurrences.length);
//     occurrences.forEach(date => {
//       // console.log("Occurrences for event:", row.title, occurrences);
//       allOccurrences.push({ title: row.title, date });
//     });
//   }

//   return allOccurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
// }

// 🟡 targetDate should be a Date object representing the specific day
export async function getEventsForDate(targetDate: Date) {
  // console.log("FUNC IS CALLED WITH TARGET DATE: ", targetDate.toISOString());
  const rows = await db.getAllAsync(`SELECT * FROM event`);
  // console.log("Rows fetched: ", rows.length);

  const matchingEvents: { title: string; date: Date }[] = [];

  // 🟡 define a day window: start and end of the target day
  const startOfDay = dayjs(targetDate).startOf('day').toDate();
  const endOfDay = dayjs(targetDate).endOf('day').toDate();

  for (const row of rows) {
    try {
      const rruleOptions = RRule.parseString(row.rrule);
      rruleOptions.dtstart = new Date(row.start_date);

      const rule = new RRule(rruleOptions);

      // Check if this event occurs *on* the target day
      const occursOnDay = rule.between(startOfDay, endOfDay, true).length > 0;

      if (occursOnDay) {
        matchingEvents.push({
          title: row.title,
          date: targetDate,
        });
      }
    } catch (e) {
      console.warn('Invalid RRULE for row:', row, e);
    }
  }

  return matchingEvents;
}

export async function updateEvent({
  id,
  title,
  startDate,
  rrule,
  category,
  timeGoal,
  timeSpent,
  percentComplete,
  description
}: {
  id: number;
  title?: string;
  startDate?: string;
  rrule?: string;
  category?: number;
  timeGoal?: number;
  timeSpent?: number;
  percentComplete?: number;
  description?: string;
}) {
const fields: string[] = [];
  const values: any[] = [];

  if (title !== undefined) {
    fields.push('title = ?');
    values.push(title);
  }
  if (startDate !== undefined) {
    fields.push('start_date = ?');
    values.push(startDate);
  }
  if (rrule !== undefined) {
    fields.push('rrule = ?');
    values.push(rrule);
  }
  if (category !== undefined) {
    fields.push('category = ?');
    values.push(category);
  }
  if (timeGoal !== undefined) {
    fields.push('timeGoal = ?');
    values.push(timeGoal);
  }
  if (timeSpent !== undefined) {
    fields.push('timeSpent = ?');
    values.push(timeSpent);
  }
  if (percentComplete !== undefined) {
    fields.push('percentComplete = ?');
    values.push(percentComplete);
  }
  if (description !== undefined) {
    fields.push('description = ?');
    values.push(description);
  }

  if (fields.length === 0) {
    console.warn('No valid fields to update.');
    return;
  }

  const query = `UPDATE event SET ${fields.join(', ')} WHERE id = ?`;

  values.push(id); // add ID to the end

  await db.runAsync(query, values);
  console.log("Event Updated:", id);
}

export async function deleteEvent(id: number) {
  await db.runAsync(`DELETE FROM event WHERE id = ?`, [id]);
}

// DEBUGGING TOOLS
// TODO — Create x number of events

export async function getAllEvents() {
  const rows = await db.getAllAsync(`SELECT * FROM event`);
  return rows;
}

// TODO — Clear all events
export async function clearEvents() {
  await db.runAsync(`DROP TABLE IF EXISTS event`);


  await db.runAsync(`
    CREATE TABLE event (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      start_date TEXT NOT NULL,       -- ISO string
      rrule TEXT NOT NULL,            -- e.g., FREQ=WEEKLY;BYDAY=MO,WE
      category INTEGER NOT NULL DEFAULT 0,   -- 0: no category
      timeGoal INTEGER NOT NULL,      -- in seconds
      timeSpent INTEGER NOT NULL,     -- in seconds
      percentComplete INTEGER NOT NULL DEFAULT 0, -- 0–100%
      description TEXT                -- optional
    );
  `);
  await db.runAsync(`DELETE FROM event`);
  console.log("All events cleared");
}