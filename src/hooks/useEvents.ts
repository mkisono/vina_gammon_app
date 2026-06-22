import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import type { EventStatus } from "../lib/schemaTypes";
import { fetchAllPages } from "./fetchAllPages";

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
  eventStatus: EventStatus;
  eventIsTest: boolean;
  isSubmitting: boolean;
  isUpdatingStatus: boolean;
  setEventName: (value: string) => void;
  setEventDate: (value: string) => void;
  setEventStatus: (value: EventStatus) => void;
  setEventIsTest: (value: boolean) => void;
  createEvent: () => Promise<void>;
  updateEventStatus: (eventId: string, status: EventStatus) => Promise<void>;
};

type UseEventsOptions = {
  enabled?: boolean;
  realTime?: boolean;
};

export function useEvents(options: boolean | UseEventsOptions = true): UseEventsReturn {
  const enabled = typeof options === "boolean" ? options : options.enabled ?? true;
  const realTime = typeof options === "boolean" ? options : options.realTime ?? true;
  const [events, setEvents] = useState<Array<Schema["Event"]["type"]>>([]);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventStatus, setEventStatus] = useState<EventStatus>("open");
  const [eventIsTest, setEventIsTest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!realTime) {
      let cancelled = false;
      const fetchEvents = async () => {
        try {
          const items = await fetchAllPages((nextToken) =>
            client.models.Event.list({ authMode: "iam", nextToken })
          );
          if (!cancelled) {
            setEvents(items);
          }
        } catch (error) {
          console.error("Failed to fetch events.", error);
        }
      };

      void fetchEvents();
      return () => {
        cancelled = true;
      };
    }

    const sub = client.models.Event.observeQuery().subscribe({
      next: ({ items }) => setEvents([...items]),
    });
    return () => sub.unsubscribe();
  }, [enabled, realTime]);

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

  const updateEventStatus = async (eventId: string, status: EventStatus) => {
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
