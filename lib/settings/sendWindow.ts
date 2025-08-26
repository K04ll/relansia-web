// lib/settings/sendWindow.ts
import type { SendWindow } from '@/lib/time/nextValidDate';

type RawSendWindow = {
  start?: string; // "HH:MM"
  end?: string;   // "HH:MM"
  days?: number[]; // 1..7
};

export function parseSendWindow(raw: RawSendWindow | null | undefined): SendWindow {
  // Défauts sûrs (Lun→Sam 09:00–19:00) si rien en DB
  const start = raw?.start ?? '09:00';
  const end = raw?.end ?? '19:00';
  const days = Array.isArray(raw?.days) && raw!.days.length > 0 ? raw!.days : [1,2,3,4,5,6]; // lun-sam
  return { start, end, days };
}
