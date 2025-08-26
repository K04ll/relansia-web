// lib/time/nextValidDate.ts
import { DateTime } from 'luxon';

export type SendWindow = {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  days: number[]; // 1..7 (Luxon: 1=Mon .. 7=Sun)
};

/**
 * Retourne la prochaine date/heure valide dans la fenêtre d’envoi (en UTC),
 * à partir d'un Date UTC de référence.
 */
export function nextValidDate(fromUTC: Date, timezone: string, window: SendWindow): Date {
  let dt = DateTime.fromJSDate(fromUTC, { zone: 'utc' }).setZone(timezone);

  // Helpers pour construire start/end du jour courant dans le TZ
  const toToday = (d: DateTime, hhmm: string) => {
    const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
    return d.set({ hour: h, minute: m, second: 0, millisecond: 0 });
  };

  // Avance au prochain jour autorisé à 'start'
  const advanceToNextAllowedDay = (d: DateTime): DateTime => {
    for (let i = 0; i < 8; i++) {
      const cand = d.plus({ days: i });
      if (window.days.includes(cand.weekday)) {
        return toToday(cand, window.start);
      }
    }
    // Fallback théorique si days=[] → renvoyer start demain
    return toToday(d.plus({ days: 1 }), window.start);
  };

  // 1) Si le jour n'est pas autorisé → prochain jour autorisé @start
  if (!window.days.includes(dt.weekday)) {
    dt = advanceToNextAllowedDay(dt);
    return dt.setZone('utc').toJSDate();
  }

  // 2) Si l’heure est avant start → today @start
  const startToday = toToday(dt, window.start);
  const endToday = toToday(dt, window.end);

  if (dt < startToday) {
    return startToday.setZone('utc').toJSDate();
  }

  // 3) Si après end → prochain jour autorisé @start
  if (dt > endToday) {
    const next = advanceToNextAllowedDay(dt.plus({ days: 1 }));
    return next.setZone('utc').toJSDate();
  }

  // 4) Sinon, on est dans la fenêtre → renvoyer tel quel en UTC
  return dt.setZone('utc').toJSDate();
}

/**
 * Utilitaire : ajoute N jours puis “clamp” dans la fenêtre d’envoi la plus proche.
 */
export function addDaysAndClamp(startUTC: Date, days: number, timezone: string, window: SendWindow): Date {
  const base = DateTime.fromJSDate(startUTC, { zone: 'utc' }).setZone(timezone).plus({ days });
  // retransforme en UTC pour nextValidDate
  return nextValidDate(base.setZone('utc').toJSDate(), timezone, window);
}
