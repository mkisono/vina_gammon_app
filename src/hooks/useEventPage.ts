import { useEffect, useState } from "react";
import { buildEventPagePath, getEventIdFromPath } from "../lib/eventPage";

type UseEventPageReturn = {
  currentEventId: string;
  setCurrentEventId: (id: string) => void;
  openEventPage: (eventId: string) => void;
  goToHomePage: () => void;
  isEventPage: boolean;
};

export function useEventPage(): UseEventPageReturn {
  const [currentEventId, setCurrentEventId] = useState(() => getEventIdFromPath());

  useEffect(() => {
    const onPopState = () => {
      setCurrentEventId(getEventIdFromPath());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const openEventPage = (eventId: string) => {
    window.history.pushState({}, "", buildEventPagePath(eventId));
    setCurrentEventId(eventId);
  };

  const goToHomePage = () => {
    window.history.pushState({}, "", "/");
    setCurrentEventId("");
  };

  return {
    currentEventId,
    setCurrentEventId,
    openEventPage,
    goToHomePage,
    isEventPage: currentEventId.length > 0,
  };
}
