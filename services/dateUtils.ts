
export const EDMONTON_TZ = 'America/Edmonton';

export const toEdmontonISOString = (dateInput: Date | string | number) => {
    const date = new Date(dateInput);
    
    // Get Edmonton Parts
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: EDMONTON_TZ,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    }).formatToParts(date);
    
    const get = (t: string) => parts.find(p => p.type === t)?.value || '00';
    const y = parseInt(get('year'));
    const m = parseInt(get('month'));
    const d = parseInt(get('day'));
    const h = parseInt(get('hour'));
    const min = parseInt(get('minute'));
    const s = parseInt(get('second'));
    const ms = date.getMilliseconds();

    // Construct "Local" Date as if it were UTC
    const asUtc = Date.UTC(y, m - 1, d, h, min, s, ms);
    const realUtc = date.getTime();
    
    const diff = asUtc - realUtc;
    const sign = diff >= 0 ? '+' : '-';
    const absDiff = Math.abs(diff);
    const offH = Math.floor(absDiff / 3600000);
    const offM = Math.floor((absDiff % 3600000) / 60000);
    
    const pad = (n: number, len = 2) => String(n).padStart(len, '0');
    
    return `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:${pad(s)}.${pad(ms, 3)}${sign}${pad(offH)}:${pad(offM)}`;
};

// Generates current time as ISO string with Edmonton offset
export const getCurrentEdmontonISOString = () => {
    return toEdmontonISOString(new Date());
};

// Format a date object/string/timestamp into a locale date string for Edmonton
export const formatEdmontonDate = (date: string | number | Date, options?: Intl.DateTimeFormatOptions) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    timeZone: EDMONTON_TZ,
    ...options
  });
};

// Format a date object/string/timestamp into a locale time string for Edmonton
export const formatEdmontonTime = (date: string | number | Date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', {
    timeZone: EDMONTON_TZ,
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Returns YYYY-MM-DD in Edmonton Time
export const getEdmontonISOString = (dateInput: string | number | Date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: EDMONTON_TZ
    }).formatToParts(new Date(dateInput));
    
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    return `${y}-${m}-${d}`;
};

// Returns YYYY-MM in Edmonton Time
export const getEdmontonMonthString = () => {
    const today = getEdmontonISOString();
    return today.substring(0, 7);
};

// Returns the full year in Edmonton Time
export const getEdmontonYear = () => {
    return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        timeZone: EDMONTON_TZ
    });
};

// Get the short day name (Sun, Mon, etc.) in Edmonton Time
export const getEdmontonDayName = (date: string | number | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: EDMONTON_TZ
    });
};

// Get the day index (0=Sun, 6=Sat) in Edmonton Time
export const getEdmontonDayIndex = (dateInput: string | number | Date = new Date()) => {
    const dayName = getEdmontonDayName(dateInput);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.findIndex(d => d === dayName);
};
