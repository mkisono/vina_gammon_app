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

export function useMatchResultsSubscription(
  currentEventId: string,
  enabled = true
): UseMatchResultsSubscriptionReturn {
  const [results, setResults] = useState<Array<MatchResult>>([]);

  useEffect(() => {
    if (!enabled || !currentEventId) {
      setResults([]);
      return;
    }

    let cancelled = false;

    const fetchInitial = async () => {
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
        setResults(sortMatchResults(all));
      }
    };

    void fetchInitial();

    const onCreateSub = client.models.MatchResult.onCreate({
      filter: { eventId: { eq: currentEventId } },
    }).subscribe({
      next: (created) => {
        setResults((prev) => upsertMatchResult(prev, created));
      },
    });

    const onUpdateSub = client.models.MatchResult.onUpdate({
      filter: { eventId: { eq: currentEventId } },
    }).subscribe({
      next: (updated) => {
        setResults((prev) => upsertMatchResult(prev, updated));
      },
    });

    const onDeleteSub = client.models.MatchResult.onDelete({
      filter: { eventId: { eq: currentEventId } },
    }).subscribe({
      next: (deleted) => {
        setResults((prev) => removeMatchResult(prev, deleted.resultId));
      },
    });

    return () => {
      cancelled = true;
      onCreateSub.unsubscribe();
      onUpdateSub.unsubscribe();
      onDeleteSub.unsubscribe();
    };
  }, [enabled, currentEventId]);

  return { results };
}
