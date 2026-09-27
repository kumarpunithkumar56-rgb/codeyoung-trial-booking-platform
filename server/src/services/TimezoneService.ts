import { DateTime } from 'luxon';
import { SUPPORTED_TIMEZONES } from '../config/constants';

/**
 * TimezoneService handles all timezone conversions and DST calculations
 * using Luxon library with IANA timezone identifiers.
 * 
 * CRITICAL: Never use hardcoded timezone offsets.
 * Always use IANA timezone identifiers for proper DST handling.
 */
class TimezoneService {
  /**
   * Convert local time in a specific timezone to UTC
   */
  convertToUTC(localTime: string, timezone: string): Date {
    const dt = DateTime.fromISO(localTime, { zone: timezone });
    
    if (!dt.isValid) {
      throw new Error(`Invalid datetime: ${localTime} in timezone ${timezone}. Reason: ${dt.invalidReason}`);
    }
    
    return dt.toUTC().toJSDate();
  }

  /**
   * Convert UTC date to local time in a specific timezone
   */
  convertFromUTC(utcTime: Date, timezone: string): string {
    const dt = DateTime.fromJSDate(utcTime, { zone: 'utc' });
    return dt.setZone(timezone).toISO() || '';
  }

  /**
   * Format UTC time in a specific timezone with custom format
   */
  formatInTimezone(utcTime: Date, timezone: string, format: string = 'yyyy-MM-dd HH:mm:ss ZZZZ'): string {
    const dt = DateTime.fromJSDate(utcTime, { zone: 'utc' });
    return dt.setZone(timezone).toFormat(format);
  }

  /**
   * Get the start and end of a local calendar day in UTC
   * CRITICAL for daily capacity calculations.
   */
  getLocalDayBoundaries(date: string, timezone: string): { start: Date; end: Date } {
    const dt = DateTime.fromISO(date, { zone: timezone });
    
    if (!dt.isValid) {
      throw new Error(`Invalid date: ${date} in timezone ${timezone}`);
    }
    
    return {
      start: dt.startOf('day').toUTC().toJSDate(),
      end: dt.endOf('day').toUTC().toJSDate(),
    };
  }

  /**
   * Validate if a timezone identifier is valid
   */
  validateTimezone(timezone: string): boolean {
    try {
      const dt = DateTime.now().setZone(timezone);
      return dt.isValid;
    } catch {
      return false;
    }
  }

  /**
   * Check if DST is currently active
   */
  isDSTActive(date: Date, timezone: string): boolean {
    const dt = DateTime.fromJSDate(date, { zone: timezone });
    return dt.isInDST;
  }

  /**
   * Get timezone abbreviation (e.g., "EST", "EDT")
   */
  getTimezoneAbbreviation(date: Date, timezone: string): string {
    const dt = DateTime.fromJSDate(date, { zone: timezone });
    return dt.toFormat('ZZZZ');
  }

  /**
   * Get current date in a specific timezone (YYYY-MM-DD)
   */
  getCurrentDateInTimezone(timezone: string): string {
    return DateTime.now().setZone(timezone).toISODate() || '';
  }

  /**
   * Check if a timezone is supported
   */
  isSupportedTimezone(timezone: string): boolean {
    return SUPPORTED_TIMEZONES.includes(timezone as any) || this.validateTimezone(timezone);
  }
}

export default new TimezoneService();
