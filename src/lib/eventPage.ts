const EVENT_PAGE_PATH_RE = /^\/events\/([^/]+)$/;

export const getEventIdFromPath = (): string => {
  if (typeof window === "undefined") {
    return "";
  }
  const matched = window.location.pathname.match(EVENT_PAGE_PATH_RE);
  if (!matched?.[1]) {
    return "";
  }
  return decodeURIComponent(matched[1]);
};

export const buildEventPagePath = (eventId: string): string => {
  return `/events/${encodeURIComponent(eventId)}`;
};

export const getJstTimeHHmm = (): string => {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
};
