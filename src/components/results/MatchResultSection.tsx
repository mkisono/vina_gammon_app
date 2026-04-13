import { Button, Heading, Text, View } from "@aws-amplify/ui-react";
import type { Schema } from "../../../amplify/data/resource";

type MatchResultSectionProps = {
  currentEventId: string;
  currentEvent: Schema["Event"]["type"] | null;
  filteredResults: Array<Schema["MatchResult"]["type"]>;
  currentUserId?: string;
  profileNicknameByUserId: Record<string, string>;
  opponentNickname: string;
  opponentNicknameOptions: string[];
  point: number;
  isJbsRated: boolean;
  isResultSubmitting: boolean;
  editingResultId: string;
  editingOpponentNickname: string;
  editingPoint: number;
  editingIsJbsRated: boolean;
  isUpdatingResult: boolean;
  onGoToHomePage: () => void;
  onChangeOpponentNickname: (value: string) => void;
  onChangePoint: (value: number) => void;
  onChangeIsJbsRated: (value: boolean) => void;
  onCreateMatchResult: () => void;
  onStartEditResult: (result: Schema["MatchResult"]["type"]) => void;
  onCancelEditResult: () => void;
  onChangeEditingOpponentNickname: (value: string) => void;
  onChangeEditingPoint: (value: number) => void;
  onChangeEditingIsJbsRated: (value: boolean) => void;
  onUpdateMatchResult: () => void;
};

export function MatchResultSection({
  currentEventId,
  currentEvent,
  filteredResults,
  currentUserId,
  profileNicknameByUserId,
  opponentNickname,
  opponentNicknameOptions,
  point,
  isJbsRated,
  isResultSubmitting,
  editingResultId,
  editingOpponentNickname,
  editingPoint,
  editingIsJbsRated,
  isUpdatingResult,
  onGoToHomePage,
  onChangeOpponentNickname,
  onChangePoint,
  onChangeIsJbsRated,
  onCreateMatchResult,
  onStartEditResult,
  onCancelEditResult,
  onChangeEditingOpponentNickname,
  onChangeEditingPoint,
  onChangeEditingIsJbsRated,
  onUpdateMatchResult,
}: MatchResultSectionProps) {
  const currentEventStatus = currentEvent?.status ?? "open";
  const canCreateResult = currentEventStatus === "open";
  const registrationClosedMessage =
    currentEventStatus === "close"
      ? "このイベントは終了しました。試合結果の新規登録はできません。"
      : "このイベントでは試合結果の新規登録はできません。";

  return (
    <View marginTop="1.5rem">
      <Heading level={4}>試合結果の登録・編集</Heading>
      <Text marginTop="0.35rem">運用ルール: 試合結果は勝者が登録してください。</Text>
      {!currentEventId ? (
        <Text marginTop="0.75rem">
          試合結果はイベントページでのみ登録できます。イベント一覧の「イベントページを開く」から移動してください。
        </Text>
      ) : !currentEvent ? (
        <>
          <Text marginTop="0.75rem">指定されたイベントが見つかりません。</Text>
          <Button marginTop="0.75rem" size="small" onClick={onGoToHomePage}>
            ホームへ戻る
          </Button>
        </>
      ) : (
        <>
          {!canCreateResult && (
            <Text marginTop="0.75rem">{registrationClosedMessage}</Text>
          )}
          <View marginTop="0.75rem" className="result-form">
            <View className="result-field-group">
              <Text className="result-field-label">対戦相手</Text>
              <select
                value={opponentNickname}
                onChange={(e) => onChangeOpponentNickname(e.target.value)}
                className="result-field-input"
                disabled={!canCreateResult}
              >
                <option value="">対戦相手ニックネームを選択してください</option>
                {opponentNicknameOptions.map((nickname) => (
                  <option key={nickname} value={nickname}>
                    {nickname}
                  </option>
                ))}
              </select>
            </View>

            <View className="result-field-group">
              <Text className="result-field-label">ポイント数</Text>
              <input
                type="number"
                min={1}
                max={25}
                step={2}
                value={point}
                onChange={(e) => onChangePoint(Number(e.target.value))}
                className="result-field-input"
                disabled={!canCreateResult}
              />
            </View>

            <View className="result-checkbox-row">
              <input
                type="checkbox"
                checked={isJbsRated}
                onChange={(e) => onChangeIsJbsRated(e.target.checked)}
                className="result-checkbox"
                id="isJbsRated"
                disabled={!canCreateResult}
              />
              <label htmlFor="isJbsRated" className="result-checkbox-label">
                JBS レーティング対象
              </label>
            </View>

            <Button
              marginTop="0.25rem"
              onClick={onCreateMatchResult}
              isLoading={isResultSubmitting}
              isDisabled={!canCreateResult}
            >
              試合結果を登録
            </Button>
          </View>

          <View marginTop="1.25rem">
            <Heading level={5}>試合結果一覧</Heading>
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
                      const canEdit = isWinner;
                      const isEditing = editingResultId === result.resultId;
                      const winnerDisplayName =
                        profileNicknameByUserId[result.playerUserId ?? ""] ?? result.playerUserId ?? "—";
                      const loserDisplayName =
                        profileNicknameByUserId[result.loserUserId ?? ""] ?? result.loserUserId ?? "—";
                      return (
                        <tr key={result.resultId}>
                          <td>{result.matchTime}</td>
                          <td>{winnerDisplayName}</td>
                          <td>
                            {isEditing ? (
                              <select
                                value={editingOpponentNickname}
                                onChange={(e) => onChangeEditingOpponentNickname(e.target.value)}
                                className="result-table-input"
                                aria-label="対戦相手ニックネーム"
                              >
                                <option value="">対戦相手ニックネームを選択</option>
                                {opponentNicknameOptions.map((nickname) => (
                                  <option key={nickname} value={nickname}>
                                    {nickname}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              loserDisplayName
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                min={1}
                                max={25}
                                step={2}
                                value={editingPoint}
                                onChange={(e) => onChangeEditingPoint(Number(e.target.value))}
                                className="result-table-input"
                                aria-label="ポイント"
                              />
                            ) : (
                              `${result.point}pt`
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <label className="result-table-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={editingIsJbsRated}
                                  onChange={(e) => onChangeEditingIsJbsRated(e.target.checked)}
                                  className="result-checkbox"
                                />
                                <span>対象</span>
                              </label>
                            ) : result.isJbsRated ? (
                              "対象"
                            ) : (
                              "対象外"
                            )}
                          </td>
                          <td>
                            {canEdit && !isEditing && (
                              <Button size="small" onClick={() => onStartEditResult(result)}>
                                編集
                              </Button>
                            )}
                            {canEdit && isEditing && (
                              <View className="result-table-actions">
                                <Button onClick={onUpdateMatchResult} isLoading={isUpdatingResult} size="small">
                                  更新
                                </Button>
                                <Button variation="link" size="small" onClick={onCancelEditResult}>
                                  キャンセル
                                </Button>
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
        </>
      )}
    </View>
  );
}
