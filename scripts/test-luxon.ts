import { DateTime } from 'luxon';

export function nowParisISO() {
  return DateTime.now().setZone('Europe/Paris').toISO();
}
