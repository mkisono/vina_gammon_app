import { Button, Heading, Text, View } from "@aws-amplify/ui-react";
import type { Schema } from "../../../amplify/data/resource";

type MatchResultTableProps = {
  filteredResults: Array<Schema["MatchResult"]["type"]>;
  isAdmin: boolean;
  currentUserId?: string;
  winCount: number;
  lossCount: number;
  profileNicknameByUserId: Record<string, string>;
  editingResultId: string;
  isDeletingResult: boolean;
  onStartEditResult: (result: Schema["MatchResult"]["type"]) => void;
  onDeleteMatchResult: (resultId: string) => void;
};

export function MatchResultTable({
  filteredResults,
  isAdmin,
  currentUserId,
  winCount,
  lossCount,
  profileNicknameByUserId,
  editingResultId,
  isDeletingResult,
  onStartEditResult,
  onDeleteMatchResult,
}: MatchResultTableProps) {
  return (
    <View marginTop="1.25rem">
      <Heading level={5}>試合結果一覧</Heading>
      <Text marginTop="0.35rem" fontWeight={600}>
        {`${winCount}勝 ${lossCount}敗`}
      </Text>
      {filteredResults.length === 0 ? (
        <Text marginTop="0.75rem">このイベントの試合結果はまだありません。</Text>
      ) : (
        <View className="result-table-wrap" marginTop="0.75rem">
          <table className="result-table">
            <thead>
              <tr>
                <th scope="col">時刻</th>
                <th scope="col">勝ち</th>
                <th scope="col">負け</th>
                <th scope="col">ポイント</th>
                <th scope="col">JBS</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result) => {
                const isWinner = result.playerUserId === currentUserId;
                const canEdit = isWinner || isAdmin;
                const canDelete = isAdmin;
                const winnerDisplayName =
                  profileNicknameByUserId[result.playerUserId ?? ""] ?? result.playerUserId ?? "—";
                const loserDisplayName =
                  profileNicknameByUserId[result.loserUserId ?? ""] ?? result.loserUserId ?? "—";
                return (
                  <tr key={result.resultId}>
                    <td>{result.matchTime}</td>
                    <td>{winnerDisplayName}</td>
                    <td>{loserDisplayName}</td>
                    <td>{`${result.point}pt`}</td>
                    <td>{result.isJbsRated ? "対象" : "対象外"}</td>
                    <td>
                      {(canEdit || canDelete) && (
                        <View className="result-table-actions">
                          {canEdit && (
                            <Button size="small" onClick={() => onStartEditResult(result)}>
                              {editingResultId === result.resultId ? "編集中" : "編集"}
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="small"
                              className="result-delete-button"
                              onClick={() => onDeleteMatchResult(result.resultId)}
                              isLoading={isDeletingResult}
                            >
                              削除
                            </Button>
                          )}
                        </View>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </View>
      )}
    </View>
  );
}
