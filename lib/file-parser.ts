/**
 * File parser for hospital data imports.
 * Supports Excel (.xls, .xlsx), CSV, and TSV.
 * Maps columns to PatientRecord fields with flexible header matching.
 */

import * as XLSX from 'xlsx';
import type { PatientRecord } from './types';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ROWS = 50000;

// Column name variants for mapping (case-insensitive)
const COLUMN_MAP: Record<string, string[]> = {
  patientId: ['patient id', 'patient_id', 'pt id', 'pt_id', 'id', 'patient no', 'reg no'],
  age: ['age', 'ages', 'patient age'],
  sex: ['sex', 'gender', 'sex/age', 'male/female'],
  department: ['department', 'dept', 'unit', 'clinic', 'ward'],
  diagnosis: ['diagnosis', 'diagnoses', 'disease', 'condition', 'icd', 'icd10'],
  serviceProvided: ['service', 'service provided', 'service_provided', 'treatment', 'procedure'],
  visitDate: ['visit date', 'visit_date', 'date', 'date of visit', 'attendance date', 'admission date'],
  outcome: ['outcome', 'outcomes', 'discharge outcome', 'result'],
  referralStatus: ['referral', 'referral status', 'referral_status', 'referred'],
  waitingTime: ['waiting time', 'waiting_time', 'wait time', 'minutes waited'],
  lengthOfStay: ['length of stay', 'length_of_stay', 'los', 'days stayed', 'duration'],
};

function normalizeHeader(h: string): string {
  return String(h || '').trim().toLowerCase();
}

function findMappedKey(headers: string[]): Record<string, number> {
  const mapped: Record<string, number> = {};
  headers.forEach((h, i) => {
    const norm = normalizeHeader(h);
    for (const [key, variants] of Object.entries(COLUMN_MAP)) {
      if (variants.some(v => norm.includes(v) || v.includes(norm))) {
        mapped[key] = i;
        break;
      }
    }
  });
  return mapped;
}

function safeInt(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? 0 : n;
}

function safeStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function parseSex(val: unknown): 'male' | 'female' {
  const s = safeStr(val).toLowerCase();
  if (s.startsWith('m') || s === '1' || s === 'male') return 'male';
  return 'female';
}

function parseDate(val: unknown): Date {
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const s = safeStr(val);
  if (!s) return new Date();
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}

export interface ParseResult {
  columns: string[];
  rows: Record<string, unknown>[];
  recordCount: number;
}

function isRowEmpty(raw: unknown[]): boolean {
  return !raw.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
}

export function parseExcel(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, cellNF: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) return { columns: [], rows: [], recordCount: 0 };
  const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false, dateNF: 'YYYY-MM-DD' });
  if (!data.length || !Array.isArray(data)) return { columns: [], rows: [], recordCount: 0 };

  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = (data[i] as unknown) as unknown[];
    if (!Array.isArray(row)) continue;
    const cells = row.map(c => String(c ?? '').trim());
    const nonEmpty = cells.filter(c => c.length > 0).length;
    if (nonEmpty >= 2) {
      headerRowIndex = i;
      break;
    }
  }

  const headerRow = (data[headerRowIndex] as unknown) as unknown[];
  const rawHeaders = Array.isArray(headerRow) ? headerRow.map(h => String(h ?? '').trim()) : [];
  const columns = rawHeaders.map((h, j) => (h && h.length) ? h : `col_${j}`);
  const rows: Record<string, unknown>[] = [];

  for (let i = headerRowIndex + 1; i < data.length && rows.length < MAX_ROWS; i++) {
    const raw = (data[i] as unknown) as unknown[];
    if (!Array.isArray(raw) || isRowEmpty(raw)) continue;
    const obj: Record<string, unknown> = {};
    columns.forEach((col, j) => { obj[col] = raw[j] ?? ''; });
    rows.push(obj);
  }
  return { columns, rows, recordCount: rows.length };
}

export function parseCsv(buffer: Buffer): ParseResult {
  const text = buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').filter(l => l.trim());
  if (!lines.length) return { columns: [], rows: [], recordCount: 0 };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const columns = headers.length ? headers : [];
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length && rows.length < MAX_ROWS; i++) {
    const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (vals.every(v => !v || v.length === 0)) continue;
    const obj: Record<string, unknown> = {};
    headers.forEach((h, j) => { obj[h || `col_${j}`] = vals[j] ?? ''; });
    rows.push(obj);
  }
  return { columns, rows, recordCount: rows.length };
}

export function parseTsv(buffer: Buffer): ParseResult {
  const text = buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').filter(l => l.trim());
  if (!lines.length) return { columns: [], rows: [], recordCount: 0 };
  const headers = lines[0].split('\t').map(h => h.trim());
  const columns = headers.length ? headers : [];
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length && rows.length < MAX_ROWS; i++) {
    const vals = lines[i].split('\t').map(v => v.trim());
    if (vals.every(v => !v || v.length === 0)) continue;
    const obj: Record<string, unknown> = {};
    headers.forEach((h, j) => { obj[h || `col_${j}`] = vals[j] ?? ''; });
    rows.push(obj);
  }
  return { columns, rows, recordCount: rows.length };
}

export function mapToPatientRecords(
  rows: Record<string, unknown>[],
  columns: string[],
  datasetId: string
): Omit<PatientRecord, 'id'>[] {
  const mapped = findMappedKey(columns);
  const rawHeaders = columns;
  return rows.map((row, idx) => {
    const get = (key: string): unknown => {
      const colIdx = mapped[key];
      if (colIdx === undefined) return '';
      const header = rawHeaders[colIdx];
      return row[header] ?? '';
    };
    return {
      datasetId,
      patientId: safeStr(get('patientId')) || `REC-${idx + 1}`,
      age: Math.min(120, Math.max(0, safeInt(get('age')))),
      sex: parseSex(get('sex')),
      department: safeStr(get('department')) || 'General',
      diagnosis: safeStr(get('diagnosis')) || 'Not specified',
      serviceProvided: safeStr(get('serviceProvided')) || 'Consultation',
      visitDate: parseDate(get('visitDate')),
      outcome: safeStr(get('outcome')) || 'Unknown',
      referralStatus: safeStr(get('referralStatus')) || 'Not Referred',
      waitingTime: safeInt(get('waitingTime')) || undefined,
      lengthOfStay: safeInt(get('lengthOfStay')) || undefined,
    };
  });
}

export function validateFileSize(size: number): { ok: boolean; message?: string } {
  if (size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, message: `File size must not exceed ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB` };
  }
  return { ok: true };
}

export function getParserForMime(mime: string): ((buffer: Buffer) => ParseResult) | null {
  const lower = mime.toLowerCase();
  if (lower.includes('spreadsheet') || lower.includes('excel') || lower === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || lower === 'application/vnd.ms-excel') return parseExcel;
  if (lower.includes('csv') || lower === 'text/csv') return parseCsv;
  if (lower === 'text/tab-separated-values' || lower === 'text/tsv') return parseTsv;
  return null;
}

export function getParserForFilename(filename: string): ((buffer: Buffer) => ParseResult) | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') return parseExcel;
  if (ext === 'csv') return parseCsv;
  if (ext === 'tsv') return parseTsv;
  return null;
}
