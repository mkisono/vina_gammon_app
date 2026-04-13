import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

const client = generateClient<Schema>();

type UseMatchResultsSubscriptionReturn = {
  results: Array<Schema["MatchResult"]["type"]>;
};

export function useMatchResultsSubscription(
  currentEventId: string,
  enabled = true
): UseMatchResultsSubscriptionReturn {
  const [results, setResults] = useState<Array<Schema["MatchResult"]["type"]>>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const sub = client.models.MatchResult.observeQuery({
      filter: {
        eventId: { eq: currentEventId },
      },
    }).subscribe({
      next: ({ items }) => setResults([...items]),
    });

    return () => sub.unsubscribe();
  }, [enabled, currentEventId]);

  return { results };
}
