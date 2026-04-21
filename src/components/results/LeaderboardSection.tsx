import { Heading, Text, View } from "@aws-amplify/ui-react";
import { useMemo, useState } from "react";
import type { LeaderboardRow } from "../../lib/leaderboard";

type SortKey = "totalPoint" | "totalPlayedPoint";
type SortDir = "asc" | "desc";

type LeaderboardSectionProps = {
  title: string;
  rows: LeaderboardRow[];
  emptyText?: string;
};

export function LeaderboardSection({
  title,
  rows,
  emptyText = "集計対象の試合結果がありません。",
}: LeaderboardSectionProps) {
  const [sortKey, setSortKey] = useState<SortKey>("totalPoint");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const diff = sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey];
      if (diff !== 0) return diff;
      return a.nickname.localeCompare(b.nickname, "ja");
    });
    return sorted.map((row, i) => ({ ...row, rank: i + 1 }));
  }, [rows, sortKey, sortDir]);

  const sortIcon = (key: SortKey) => {
    if (key !== sortKey) return <span className="leaderboard-sort-icon leaderboard-sort-icon--inactive">⇅</span>;
    return <span className="leaderboard-sort-icon">{sortDir === "desc" ? "▼" : "▲"}</span>;
  };

  return (
    <View marginTop="1.5rem">
      <Heading level={4}>{title}</Heading>
      {rows.length === 0 ? (
        <Text marginTop="0.75rem">{emptyText}</Text>
      ) : (
        <View className="leaderboard-table-wrap" marginTop="0.75rem">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th scope="col">順位</th>
                <th scope="col">ニックネーム</th>
                <th scope="col">勝ち</th>
                <th scope="col">負け</th>
                <th
                  scope="col"
                  className={`leaderboard-th-sortable${sortKey === "totalPoint" ? " leaderboard-th-active" : ""}`}
                  onClick={() => handleSort("totalPoint")}
                >
                  合計ポイント{sortIcon("totalPoint")}
                </th>
                <th
                  scope="col"
                  className={`leaderboard-th-sortable${sortKey === "totalPlayedPoint" ? " leaderboard-th-active" : ""}`}
                  onClick={() => handleSort("totalPlayedPoint")}
                >
                  通算ポイント数{sortIcon("totalPlayedPoint")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.userId}>
                  <td>{row.rank}</td>
                  <td>{row.nickname}</td>
                  <td>{row.winCount}</td>
                  <td>{row.lossCount}</td>
                  <td>{row.totalPoint}</td>
                  <td>{row.totalPlayedPoint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </View>
      )}
    </View>
  );
}
