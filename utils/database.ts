// calendarDatabase.ts
import dayjs, { Dayjs } from 'dayjs';
import * as SQLite from 'expo-sqlite';
import { RRule, RRuleSet } from 'rrule';

const db = SQLite.openDatabaseSync('calendar.db');

// CREATE TABLE
export async function initializeDB() {
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS event (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
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
  rrule,
  timeGoal, // 1 hour in seconds
  timeSpent = 0,
  category = 0,
  percentComplete = 0,
  description = '',

}: {
  title: string;
  rrule: string;     // e.g., 'FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=2025-12-31'
  timeGoal: number;
  timeSpent?: number;
  category?: number;
  percentComplete?: number;
  description?: string;
}) {
  console.log("TEST: ", { title, rrule, category, timeGoal, timeSpent, percentComplete, description });
  await db.runAsync(
    `INSERT INTO event (title, rrule, category, timeGoal, timeSpent, percentComplete, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, rrule, category, timeGoal, timeSpent, percentComplete, description]
  );
  console.log("TEST COMPLETED");
}

type Row = {
  id: number;
  title: string;

  // you should persist at least these:
  dtstart: string;        // ISO string for DTSTART (e.g., "2025-08-13T14:00:00.000Z")
  rrule?: string | null;  // e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR"
  rdates?: string | null; // JSON array of ISO strings (e.g., '["2025-08-20T14:00:00.000Z"]')
  exdates?: string | null;// JSON array of ISO strings (dates to skip)

  // strongly recommended:
  durationMin?: number | null; // duration in minutes (or instead store dtend)
  dtend?: string | null;       // if you prefer end timestamp over duration
  allDay?: 0 | 1;              // optional
  tzid?: string | null;        // optional, if you’ll localize boundaries
};

export async function getEventsForDate(targetDate: Date) {
  const rows: Row[] = await db.getAllAsync(`SELECT * FROM event`);

  const startOfDay = dayjs(targetDate).startOf('day').toDate();
  const endOfDay   = dayjs(targetDate).endOf('day').toDate();

  const matches: { id: number; title: string; date: Date }[] = [];

  for (const row of rows) {
    // Parse fields from DB
    const dtstart = row.dtstart ? new Date(row.dtstart) : null;
    const rdates: Date[] = safeParseDates(row.rdates);
    const exdates: Date[] = safeParseDates(row.exdates);

    // 1) If the row has an RRULE/RDATE/EXDATE, use an RRuleSet (handles exceptions properly)
    if (row.rrule || rdates.length || exdates.length) {
      if (!dtstart) {
        console.warn('Skipping event missing DTSTART:', row);
        continue;
      }

      const set = new RRuleSet();

      // RRULE (recurrence pattern)
      if (row.rrule) {
        try {
          const opts = RRule.parseString(row.rrule);
          // CRITICAL: supply dtstart (parseString doesn’t include it)
          opts.dtstart = dtstart;
          set.rrule(new RRule(opts));
        } catch (e) {
          console.warn('Invalid RRULE:', row.rrule, e);
          // fall through to use only RDATEs if present
        }
      }

      // RDATEs (extra single occurrences)
      for (const d of rdates) set.rdate(d);

      // EXDATEs (skip specific dates)
      for (const d of exdates) set.exdate(d);

      // Get occurrences on this day (inclusive)
      const occurrences = set.between(startOfDay, endOfDay, true);

      for (const occ of occurrences) {
        matches.push({ id: row.id, title: row.title, date: occ });
      }
      continue;
    }

    // 2) Non-recurring single event
    if (dtstart) {
      // If you store dtend, check interval overlap with the day;
      // otherwise treat it as an instant occurring on dtstart’s day.
      const occursSameDay =
        dtstart >= startOfDay && dtstart <= endOfDay;

      if (occursSameDay) {
        matches.push({ id: row.id, title: row.title, date: dtstart });
      }
    }
  }

  return matches.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Helpers
function safeParseDates(jsonish?: string | null): Date[] {
  if (!jsonish) return [];
  try {
    const arr = JSON.parse(jsonish) as string[];
    return arr.map(s => new Date(s)).filter(d => !isNaN(d.getTime()));
  } catch {
    return [];
  }
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