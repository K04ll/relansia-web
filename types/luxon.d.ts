// types/luxon.d.ts
declare module "luxon" {
  /** Typages minimaux suffisants pour ton usage actuel */
  export class DateTime {
    static now(): DateTime;
    static utc(): DateTime;
    static fromJSDate(d: Date): DateTime;
    setZone(zone: string): DateTime;
    toISO(): string;
    toUTC(): DateTime;
    toJSDate(): Date;
  }
}
