import { Button, Heading, Text, View } from "@aws-amplify/ui-react";
import type { Schema } from "../../../amplify/data/resource";
import { SearchableCombobox } from "./SearchableCombobox";

const POINT_OPTIONS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25];

type MatchResultSectionProps = {
  currentEventId: string;
  currentEvent: Schema["Event"]["type"] | null;
  filteredResults: Array<Schema["MatchResult"]["type"]>;
  isAdmin: boolean;
  currentUserId?: string;
  profileNicknameByUserId: Record<string, string>;
  opponentNickname: string;
  opponentNicknameOptions: string[];
  editingOpponentNicknameOptions: string[];
  point: number;
  isJbsRated: boolean;
  isResultSubmitting: boolean;
  editingResultId: string;
  editingOpponentNickname: string;
  editingPoint: number;
  editingIsJbsRated: boolean;
  isUpdatingResult: boolean;
  isDeletingResult: boolean;
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
  onDeleteMatchResult: (resultId: string) => void;
};

export function MatchResultSection({
  currentEventId,
  currentEvent,
  filteredResults,
  isAdmin,
  currentUserId,
  profileNicknameByUserId,
  opponentNickname,
  opponentNicknameOptions,
  editingOpponentNicknameOptions,
  point,
  isJbsRated,
  isResultSubmitting,
  editingResultId,
  editingOpponentNickname,
  editingPoint,
  editingIsJbsRated,
  isUpdatingResult,
  isDeletingResult,
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
  onDeleteMatchResult,
}: MatchResultSectionProps) {
  const currentEventStatus = currentEvent?.status ?? "open";
  const canCreateResult = currentEventStatus === "open";
  const registrationClosedMessage =
    currentEventStatus === "close"
      ? "このイベントは終了しました。試合結果の新規登録はできません。"
      : "このイベントでは試合結果の新規登録はできません。";
  const editingResult = filteredResults.find((result) => result.resultId === editingResultId) ?? null;
  const editingWinnerDisplayName = editingResult
    ? profileNicknameByUserId[editingResult.playerUserId ?? ""] ?? editingResult.playerUserId ?? "—"
    : "—";

  return (
    <View marginTop="1.5rem">
      <Heading level={4}>試合結果の登録</Heading>
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
              <SearchableCombobox
                value={opponentNickname}
                onChange={onChangeOpponentNickname}
                options={opponentNicknameOptions}
                placeholder="対戦相手ニックネームを検索して選択してください"
                inputClassName="result-field-input"
                disabled={!canCreateResult}
              />
            </View>

            <View className="result-field-group">
              <Text className="result-field-label">ポイント数</Text>
              <select
                value={point}
                onChange={(e) => onChangePoint(Number(e.target.value))}
                className="result-field-input"
                disabled={!canCreateResult}
              >
                {POINT_OPTIONS.map((pointOption) => (
                  <option key={pointOption} value={pointOption}>
                    {pointOption}
                  </option>
                ))}
              </select>
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
                          <td>
                            {result.isJbsRated ? (
                              "対象"
                            ) : (
                              "対象外"
                            )}
                          </td>
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

          {editingResult && (
            <View className="result-dialog-overlay" role="presentation" onClick={onCancelEditResult}>
              <View
                className="result-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="result-edit-dialog-title"
                onClick={(event) => event.stopPropagation()}
              >
                <Heading level={5} id="result-edit-dialog-title">
                  試合結果を編集
                </Heading>
                <Text marginTop="0.35rem">
                  {editingResult.matchTime} / 勝者: {editingWinnerDisplayName}
                </Text>

                <View marginTop="0.9rem" className="result-field-group">
                  <Text className="result-field-label">対戦相手</Text>
                  <SearchableCombobox
                    value={editingOpponentNickname}
                    onChange={onChangeEditingOpponentNickname}
                    options={editingOpponentNicknameOptions}
                    placeholder="対戦相手ニックネームを検索"
                    inputClassName="result-field-input"
                    aria-label="対戦相手ニックネーム"
                  />
                </View>

                <View className="result-field-group">
                  <Text className="result-field-label">ポイント数</Text>
                  <select
                    value={editingPoint}
                    onChange={(e) => onChangeEditingPoint(Number(e.target.value))}
                    className="result-field-input"
                    aria-label="ポイント"
                  >
                    {POINT_OPTIONS.map((pointOption) => (
                      <option key={pointOption} value={pointOption}>
                        {pointOption}
                      </option>
                    ))}
                  </select>
                </View>

                <View className="result-checkbox-row">
                  <input
                    type="checkbox"
                    checked={editingIsJbsRated}
                    onChange={(e) => onChangeEditingIsJbsRated(e.target.checked)}
                    className="result-checkbox"
                    id="editingIsJbsRated"
                  />
                  <label htmlFor="editingIsJbsRated" className="result-checkbox-label">
                    JBS レーティング対象
                  </label>
                </View>

                <View className="result-dialog-actions">
                  <Button onClick={onUpdateMatchResult} isLoading={isUpdatingResult} size="small">
                    更新
                  </Button>
                  <Button variation="link" size="small" onClick={onCancelEditResult}>
                    キャンセル
                  </Button>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}
