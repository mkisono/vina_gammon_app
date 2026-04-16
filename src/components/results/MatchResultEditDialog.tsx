import { Button, Heading, Text, View } from "@aws-amplify/ui-react";
import type { Schema } from "../../../amplify/data/resource";
import { SearchableCombobox } from "./SearchableCombobox";
import { POINT_OPTIONS } from "./matchResultConstants";

type MatchResultEditDialogProps = {
  editingResult: Schema["MatchResult"]["type"] | null;
  editingWinnerDisplayName: string;
  editingOpponentNickname: string;
  editingOpponentNicknameOptions: string[];
  editingPoint: number;
  editingIsJbsRated: boolean;
  isUpdatingResult: boolean;
  onChangeEditingOpponentNickname: (value: string) => void;
  onChangeEditingPoint: (value: number) => void;
  onChangeEditingIsJbsRated: (value: boolean) => void;
  onUpdateMatchResult: () => void;
  onCancelEditResult: () => void;
};

export function MatchResultEditDialog({
  editingResult,
  editingWinnerDisplayName,
  editingOpponentNickname,
  editingOpponentNicknameOptions,
  editingPoint,
  editingIsJbsRated,
  isUpdatingResult,
  onChangeEditingOpponentNickname,
  onChangeEditingPoint,
  onChangeEditingIsJbsRated,
  onUpdateMatchResult,
  onCancelEditResult,
}: MatchResultEditDialogProps) {
  if (!editingResult) {
    return null;
  }

  return (
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
  );
}
