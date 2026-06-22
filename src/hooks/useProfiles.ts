import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { fetchAllPages } from "./fetchAllPages";

const client = generateClient<Schema>();

type UseProfilesReturn = {
  profiles: Array<Schema["PublicProfile"]["type"]>;
};

type UseProfilesOptions = {
  enabled?: boolean;
  realTime?: boolean;
};

export function useProfiles(options: boolean | UseProfilesOptions = true): UseProfilesReturn {
  const enabled = typeof options === "boolean" ? options : options.enabled ?? true;
  const realTime = typeof options === "boolean" ? options : options.realTime ?? true;
  const [profiles, setProfiles] = useState<Array<Schema["PublicProfile"]["type"]>>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!realTime) {
      let cancelled = false;
      const fetchProfiles = async () => {
        try {
          const items = await fetchAllPages((nextToken) =>
            client.models.PublicProfile.list({ authMode: "iam", nextToken })
          );
          if (!cancelled) {
            setProfiles(items);
          }
        } catch (error) {
          console.error("Failed to fetch profiles.", error);
        }
      };

      void fetchProfiles();
      return () => {
        cancelled = true;
      };
    }

    const sub = client.models.PublicProfile.observeQuery().subscribe({
      next: ({ items }) => setProfiles([...items]),
    });
    return () => sub.unsubscribe();
  }, [enabled, realTime]);

  return { profiles };
}
