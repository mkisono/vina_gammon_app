import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

type UseProfilesReturn = {
  profiles: Array<Schema["PublicProfile"]["type"]>;
};

export function useProfiles(enabled = true): UseProfilesReturn {
  const [profiles, setProfiles] = useState<Array<Schema["PublicProfile"]["type"]>>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const sub = client.models.PublicProfile.observeQuery().subscribe({
      next: ({ items }) => setProfiles([...items]),
    });
    return () => sub.unsubscribe();
  }, [enabled]);

  return { profiles };
}
