// Canonical event categories. Must stay in sync with the `event_type` enum in
// backend/models/admin/event.model.js — the model rejects anything else, so a
// dropdown offering a value that is missing there silently fails validation.
export const EVENT_TYPES = [
  "workshop",
  "seminar",
  "conference",
  "meetup",
  "webinar",
  "networking",
  "social",
  "career",
  "sports",
  "cultural",
  "other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<string, string> = {
  workshop: "Workshop",
  seminar: "Seminar",
  conference: "Conference",
  meetup: "Meetup",
  webinar: "Webinar",
  networking: "Networking",
  social: "Social",
  career: "Career",
  sports: "Sports",
  cultural: "Cultural",
  other: "Other",
};

export const eventTypeLabel = (type?: string) =>
  (type && EVENT_TYPE_LABELS[type]) || "Event";
