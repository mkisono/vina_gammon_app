import { Heading, Text, View } from "@aws-amplify/ui-react";
import type { LeaderboardRow } from "../../lib/leaderboard";

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
                <th scope="col">合計ポイント</th>
                <th scope="col">通算ポイント数</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId}>
                  <td>{row.rank}</td>
                  <td>{row.nickname}</td>
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
