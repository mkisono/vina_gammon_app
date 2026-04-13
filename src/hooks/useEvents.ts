import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

const createEventId = (): string => {
  const ts = Date.now().toString(16);
  const rand = Math.random().toString(16).slice(2, 18).padEnd(16, "0");
  return `${ts}-${rand}`;
};

type UseEventsReturn = {
  events: Array<Schema["Event"]["type"]>;
  sortedEvents: Array<Schema["Event"]["type"]>;
  eventMap: Map<string, Schema["Event"]["type"]>;
  eventName: string;
  eventDate: string;
  eventStatus: "open" | "close" | "hide";
  isSubmitting: boolean;
  isUpdatingStatus: boolean;
  setEventName: (value: string) => void;
  setEventDate: (value: string) => void;
  setEventStatus: (value: "open" | "close" | "hide") => void;
  createEvent: () => Promise<void>;
  updateEventStatus: (eventId: string, status: "open" | "close" | "hide") => Promise<void>;
};

export function useEvents(enabled = true): UseEventsReturn {
  const [events, setEvents] = useState<Array<Schema["Event"]["type"]>>([]);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventStatus, setEventStatus] = useState<"open" | "close" | "hide">("open");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const sub = client.models.Event.observeQuery().subscribe({
      next: ({ items }) => setEvents([...items]),
    });
    return () => sub.unsubscribe();
  }, [enabled]);

  const sortedEvents = useMemo(
    () =>
      [...events]
        .filter((event) => (event.status ?? "open") !== "hide")
        .sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? "")),
    [events]
  );

  const eventMap = useMemo(() => {
    const map = new Map<string, Schema["Event"]["type"]>();
    for (const event of events) {
      map.set(event.eventId, event);
    }
    return map;
  }, [events]);

  const createEvent = async () => {
    if (!eventName || !eventDate) {
      window.alert("イベント名と開催日を入力してください。");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await client.models.Event.create({
        eventId: createEventId(),
        name: eventName,
        eventDate,
        status: eventStatus,
      });
      if (result.errors?.length) {
        window.alert(`イベント作成に失敗しました: ${result.errors[0].message}`);
        return;
      }
      setEventName("");
      setEventDate("");
      setEventStatus("open");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateEventStatus = async (eventId: string, status: "open" | "close" | "hide") => {
    if (!eventId) {
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const result = await client.models.Event.update({
        eventId,
        status,
      });
      if (result.errors?.length) {
        window.alert(`イベント状態の更新に失敗しました: ${result.errors[0].message}`);
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return {
    events,
    sortedEvents,
    eventMap,
    eventName,
    eventDate,
    eventStatus,
    isSubmitting,
    isUpdatingStatus,
    setEventName,
    setEventDate,
    setEventStatus,
    createEvent,
    updateEventStatus,
  };
}
