import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

const client = generateClient<Schema>();
type MatchResult = Schema["MatchResult"]["type"];
type MatchResultsByEventResponse = Awaited<
  ReturnType<typeof client.models.MatchResult.listMatchResultsByEvent>
>;

type UseMatchResultsSubscriptionReturn = {
  results: Array<MatchResult>;
};

type PendingMatchResultChange =
  | { type: "upsert"; item: MatchResult }
  | { type: "delete"; resultId: string };

const sortMatchResults = (items: MatchResult[]): MatchResult[] => {
  return [...items].sort((a, b) => {
    const dateCompare = (a.matchDate ?? "").localeCompare(b.matchDate ?? "");
    if (dateCompare !== 0) return dateCompare;
    return (a.matchTime ?? "").localeCompare(b.matchTime ?? "");
  });
};

const upsertMatchResult = (items: MatchResult[], item: MatchResult): MatchResult[] => {
  const next = [...items];
  const index = next.findIndex((x) => x.resultId === item.resultId);
  if (index >= 0) {
    next[index] = item;
  } else {
    next.push(item);
  }
  return sortMatchResults(next);
};

const removeMatchResult = (items: MatchResult[], resultId?: string): MatchResult[] => {
  if (!resultId) {
    return items;
  }
  return items.filter((item) => item.resultId !== resultId);
};

const applyPendingChange = (
  items: MatchResult[],
  change: PendingMatchResultChange
): MatchResult[] => {
  if (change.type === "upsert") {
    return upsertMatchResult(items, change.item);
  }
  return removeMatchResult(items, change.resultId);
};

const mergeInitialResults = (
  currentItems: MatchResult[],
  fetchedItems: MatchResult[],
  pendingChanges: PendingMatchResultChange[]
): MatchResult[] => {
  let nextItems = currentItems;

  for (const item of fetchedItems) {
    nextItems = upsertMatchResult(nextItems, item);
  }

  for (const change of pendingChanges) {
    nextItems = applyPendingChange(nextItems, change);
  }

  return nextItems;
};

export function useMatchResultsSubscription(
  currentEventId: string,
  enabled = true
): UseMatchResultsSubscriptionReturn {
  const [results, setResults] = useState<Array<MatchResult>>([]);
  const [restartCount, setRestartCount] = useState(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setRestartCount((c) => c + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !currentEventId) {
      setResults([]);
      return;
    }

    let cancelled = false;
    let isBootstrapping = true;
    const pendingChanges: PendingMatchResultChange[] = [];

    const fetchInitial = async () => {
      try {
        let nextToken: string | null | undefined = undefined;
        const all: MatchResult[] = [];
        do {
          const response: MatchResultsByEventResponse = await client.models.MatchResult.listMatchResultsByEvent(
            { eventId: currentEventId },
            {
              sortDirection: "ASC",
              nextToken,
              limit: 1000,
            }
          );
          all.push(...(response.data ?? []));
          nextToken = response.nextToken;
        } while (nextToken);

        if (!cancelled) {
          setResults((prev) => mergeInitialResults(prev, all, pendingChanges));
        }
      } catch (error) {
        console.error("Failed to fetch initial match results.", error);
      } finally {
        isBootstrapping = false;
      }
    };

    void fetchInitial();

    const onCreateSub = client.models.MatchResult.onCreate({
      filter: { eventId: { eq: currentEventId } },
    }).subscribe({
      next: (created) => {
        const change: PendingMatchResultChange = { type: "upsert", item: created };
        if (isBootstrapping) {
          pendingChanges.push(change);
        }
        setResults((prev) => applyPendingChange(prev, change));
      },
    });

    const onUpdateSub = client.models.MatchResult.onUpdate({
      filter: { eventId: { eq: currentEventId } },
    }).subscribe({
      next: (updated) => {
        const change: PendingMatchResultChange = { type: "upsert", item: updated };
        if (isBootstrapping) {
          pendingChanges.push(change);
        }
        setResults((prev) => applyPendingChange(prev, change));
      },
    });

    const onDeleteSub = client.models.MatchResult.onDelete({
      filter: { eventId: { eq: currentEventId } },
    }).subscribe({
      next: (deleted) => {
        const change: PendingMatchResultChange = {
          type: "delete",
          resultId: deleted.resultId,
        };
        if (isBootstrapping) {
          pendingChanges.push(change);
        }
        setResults((prev) => applyPendingChange(prev, change));
      },
    });

    return () => {
      cancelled = true;
      onCreateSub.unsubscribe();
      onUpdateSub.unsubscribe();
      onDeleteSub.unsubscribe();
    };
  }, [enabled, currentEventId, restartCount]);

  return { results };
}
