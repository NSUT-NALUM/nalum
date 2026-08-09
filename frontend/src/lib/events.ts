// Shared shape + formatting helpers for the dashboard Events surfaces
// (listing, detail page, My Events panel, host form).

export interface EventRecord {
  _id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  event_type: string;
  image_url?: string;
  registration_link?: string;
  max_participants?: number;
  contact_info?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  likes: number;
  creator_name?: string;
  creator_email?: string;
  /** Only present on /events/my/events — the public listing omits it. */
  status?: string;
  rejection_reason?: string;
  createdAt: string;
}

export const formatEventDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const formatEventDateLong = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

// The host form writes "HH:mm" (24h) via <input type="time">, but older rows
// hold an already-formatted 12h string — pass those through untouched rather
// than appending a second meridiem.
export const formatEventTime = (time?: string) => {
  if (!time) return "";
  if (/[ap]\.?m\.?/i.test(time)) return time.trim();

  const [rawHours, rawMinutes] = time.split(":");
  const hours = Number(rawHours);
  if (Number.isNaN(hours) || !rawMinutes) return time;

  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${rawMinutes.slice(0, 2)} ${suffix}`;
};

/** "Oct 15, 2024 • 7:00 PM" — the one-line stamp used on cards and rows. */
export const formatEventWhen = (dateStr: string, time?: string) => {
  const date = formatEventDate(dateStr);
  const at = formatEventTime(time);
  return at ? `${date} • ${at}` : date;
};

// Users routinely type "example.com" into the link fields; without a scheme the
// browser resolves it relative to the dashboard.
export const ensureUrlProtocol = (url: string) => {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
};

// No coordinates are stored, so the venue string is handed to Maps search.
export const mapsUrl = (location: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

export const isPastEvent = (dateStr: string) => {
  const eventDay = new Date(dateStr);
  eventDay.setHours(23, 59, 59, 999);
  return eventDay.getTime() < Date.now();
};
