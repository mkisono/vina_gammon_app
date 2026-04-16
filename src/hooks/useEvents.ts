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
  eventIsTestById: Map<string, boolean>;
  eventName: string;
  eventDate: string;
  eventStatus: "open" | "close";
  eventIsTest: boolean;
  isSubmitting: boolean;
  isUpdatingStatus: boolean;
  setEventName: (value: string) => void;
  setEventDate: (value: string) => void;
  setEventStatus: (value: "open" | "close") => void;
  setEventIsTest: (value: boolean) => void;
  createEvent: () => Promise<void>;
  updateEventStatus: (eventId: string, status: "open" | "close") => Promise<void>;
};

export function useEvents(enabled = true): UseEventsReturn {
  const [events, setEvents] = useState<Array<Schema["Event"]["type"]>>([]);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventStatus, setEventStatus] = useState<"open" | "close">("open");
  const [eventIsTest, setEventIsTest] = useState(false);
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

  const eventIsTestById = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const event of events) {
      map.set(event.eventId, Boolean(event.isTest));
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
        isTest: eventIsTest,
      });
      if (result.errors?.length) {
        window.alert(`イベント作成に失敗しました: ${result.errors[0].message}`);
        return;
      }
      setEventName("");
      setEventDate("");
      setEventStatus("open");
      setEventIsTest(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateEventStatus = async (eventId: string, status: "open" | "close") => {
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
    eventIsTestById,
    eventName,
    eventDate,
    eventStatus,
    eventIsTest,
    isSubmitting,
    isUpdatingStatus,
    setEventName,
    setEventDate,
    setEventStatus,
    setEventIsTest,
    createEvent,
    updateEventStatus,
  };
}
