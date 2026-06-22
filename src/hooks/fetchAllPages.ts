type PageResponse<TItem> = {
  data?: Array<TItem | null | undefined>;
  nextToken?: string | null;
};

export async function fetchAllPages<TItem>(
  fetchPage: (nextToken?: string | null) => Promise<PageResponse<TItem>>
): Promise<TItem[]> {
  const items: TItem[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    const response = await fetchPage(nextToken);
    items.push(...(response.data ?? []).filter((item): item is TItem => item != null));
    nextToken = response.nextToken;
  } while (nextToken);

  return items;
}