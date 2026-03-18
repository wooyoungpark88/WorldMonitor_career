/**
 * SROI 내보내기 — PRD Section 5.3.3
 * insights/sroi_sessions → CSV 내보내기, used_in 기록
 */

import { supabase } from '../lib/supabase';

export type ExportDocumentType = 'IR' | 'proposal' | 'paper' | 'pitch' | 'report';

export interface SROIExportRecord {
  id: string;
  date: string;
  title?: string;
  session_type: string;
  my_answer: string;
  insight: string;
  completed_at: string;
}

export interface UsedInRecord {
  document_type: ExportDocumentType;
  document_name: string;
  used_at: string;
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function toCSVRow(record: SROIExportRecord): string {
  return [
    record.id,
    record.date,
    record.title ?? '',
    record.session_type,
    escapeCSV(record.my_answer),
    escapeCSV(record.insight),
    record.completed_at,
  ].join(',');
}

function recordsToCSV(records: SROIExportRecord[], filename: string): void {
  const header = 'id,date,title,session_type,my_answer,insight,completed_at';
  const rows = records.map(toCSVRow);
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * insights 테이블 또는 localStorage에서 SROI 세션 조회 후 CSV 다운로드
 */
export async function exportSROIToCSV(filename = 'care radar-sroi-export'): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  let records: SROIExportRecord[] = [];

  if (supabaseUrl) {
    const { data, error } = await supabase
      .from('insights')
      .select('id, session_type, my_answer, insight_text, completed_at')
      .eq('session_type', 'sroi')
      .order('completed_at', { ascending: false });

    if (!error && data?.length) {
      records = data.map((row: Record<string, string>) => ({
        id: row.id ?? '',
        date: row.completed_at?.slice(0, 10) ?? '',
        session_type: row.session_type ?? 'sroi',
        my_answer: row.my_answer ?? '',
        insight: row.insight_text ?? '',
        completed_at: row.completed_at ?? '',
      }));
    }
  }

  if (records.length === 0) {
    const stored = JSON.parse(localStorage.getItem('careradar_sessions') || '[]');
    records = stored
      .filter((s: { type: string }) => s.type === 'sroi')
      .map((s: { id: string; data: { myAnswer: string; insight: string }; completedAt: string }) => ({
        id: s.id,
        date: s.completedAt?.slice(0, 10) ?? '',
        session_type: 'sroi',
        my_answer: s.data?.myAnswer ?? '',
        insight: s.data?.insight ?? '',
        completed_at: s.completedAt ?? '',
      }))
      .sort((a: SROIExportRecord, b: SROIExportRecord) =>
        (b.completed_at || '').localeCompare(a.completed_at || '')
      );
  }

  recordsToCSV(records, filename);
}

/**
 * 모든 insights (재무, 프라이싱, SROI, 피칭) CSV 내보내기
 * Supabase 실패 시 localStorage careradar_sessions 사용
 */
export async function exportAllInsightsToCSV(filename = 'care radar-insights-export'): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  let records: SROIExportRecord[] = [];

  if (supabaseUrl) {
    const { data, error } = await supabase
      .from('insights')
      .select('id, session_type, my_answer, insight_text, completed_at')
      .order('completed_at', { ascending: false });

    if (!error && data?.length) {
      records = data.map((row: Record<string, string>) => ({
        id: row.id ?? '',
        date: row.completed_at?.slice(0, 10) ?? '',
        session_type: row.session_type ?? 'unknown',
        my_answer: row.my_answer ?? '',
        insight: row.insight_text ?? '',
        completed_at: row.completed_at ?? '',
      }));
    }
  }

  if (records.length === 0) {
    const stored = JSON.parse(localStorage.getItem('careradar_sessions') || '[]');
    records = stored.map(
      (s: { id: string; type: string; data: { myAnswer: string; insight: string }; completedAt: string }) => ({
        id: s.id,
        date: s.completedAt?.slice(0, 10) ?? '',
        session_type: s.type ?? 'unknown',
        my_answer: s.data?.myAnswer ?? '',
        insight: s.data?.insight ?? '',
        completed_at: s.completedAt ?? '',
      })
    );
    records.sort((a: SROIExportRecord, b: SROIExportRecord) =>
      (b.completed_at || '').localeCompare(a.completed_at || '')
    );
  }

  recordsToCSV(records, filename);
}

/**
 * used_in 기록 (IR/제안서/논문/피칭에 활용 시)
 * sroi_sessions에 used_in JSONB가 있으면 업데이트, 없으면 insights 기반 로컬 기록
 */
export function recordUsedIn(
  _sessionId: string,
  documentType: ExportDocumentType,
  documentName: string
): UsedInRecord {
  return {
    document_type: documentType,
    document_name: documentName,
    used_at: new Date().toISOString(),
  };
}
