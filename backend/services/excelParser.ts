import xlsx from 'xlsx';
import { RawLearningEvent } from '../types';

const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const toDateString = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === 'number') {
    const date = xlsx.SSF.parse_date_code(value);
    if (date) {
      return new Date(Date.UTC(date.y, date.m - 1, date.d)).toISOString();
    }
  }

  if (typeof value === 'string') {
    const monthMap: Record<string, number> = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    const monthIndex = monthMap[value.trim().toLowerCase().slice(0, 3)];
    if (monthIndex !== undefined) {
      const now = new Date();
      return new Date(Date.UTC(now.getUTCFullYear(), monthIndex, 1)).toISOString();
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
};

const get = (row: Record<string, unknown>, aliases: string[], fallback: unknown): unknown => {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const match = keys.find((k) => k.toLowerCase().trim() === alias);
    if (match && row[match] !== undefined && row[match] !== null && row[match] !== '') {
      return row[match];
    }
  }

  return fallback;
};

export const parseLearningWorkbook = (buffer: Buffer): { studentName: string; events: RawLearningEvent[] } => {
  const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The workbook has no sheets.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  if (rows.length === 0) {
    throw new Error('No learning data found in the first sheet.');
  }

  const studentName = String(get(rows[0], ['student', 'student name', 'name', 'learner'], 'Uploaded Student'));

  const events = rows
    .map((row) => {
      const topic = String(get(row, ['topic', 'subject', 'unit', 'chapter', 'paper'], 'General')).trim();
      const score = toNumber(get(row, ['grade', 'score', 'marks', 'obtained'], 0), 0);
      const maxScore = toNumber(get(row, ['maxscore', 'max score', 'total', 'outof'], 100), 100);
      const durationMinutes = toNumber(get(row, ['duration', 'minutes', 'time spent'], 45), 45);
      const difficultyRaw = get(row, ['difficulty', 'level'], 3);
      const difficulty =
        typeof difficultyRaw === 'string'
          ? { easy: 1, medium: 3, hard: 5 }[difficultyRaw.trim().toLowerCase()] ?? 3
          : Math.max(1, Math.min(5, toNumber(difficultyRaw, 3)));
      const assessedAt = toDateString(get(row, ['date', 'assessedat', 'timestamp', 'assessment date'], new Date()));

      return {
        topic,
        score,
        maxScore,
        difficulty,
        durationMinutes,
        assessedAt,
      };
    })
    .filter((event) => event.topic.length > 0);

  if (events.length === 0) {
    throw new Error('No valid rows were parsed. Check your column names and values.');
  }

  return { studentName, events };
};
