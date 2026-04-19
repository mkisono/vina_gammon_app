import { Button, Text, View } from "@aws-amplify/ui-react";
import { SearchableCombobox } from "./SearchableCombobox";
import { POINT_OPTIONS } from "./matchResultConstants";
import { JBS_MIN_POINT } from "../../hooks/matchResults/validation";

export type MatchResultFormProps = {
  canCreateResult: boolean;
  opponentNickname: string;
  opponentNicknameOptions: string[];
  point: number;
  isJbsRated: boolean;
  isResultSubmitting: boolean;
  onChangeOpponentNickname: (value: string) => void;
  onChangePoint: (value: number) => void;
  onChangeIsJbsRated: (value: boolean) => void;
  onCreateMatchResult: () => void;
};

export function MatchResultForm({
  canCreateResult,
  opponentNickname,
  opponentNicknameOptions,
  point,
  isJbsRated,
  isResultSubmitting,
  onChangeOpponentNickname,
  onChangePoint,
  onChangeIsJbsRated,
  onCreateMatchResult,
}: MatchResultFormProps) {
  const handleIsJbsRatedChange = (checked: boolean) => {
    if (checked && point < JBS_MIN_POINT) {
      onChangePoint(JBS_MIN_POINT);
    }
    onChangeIsJbsRated(checked);
  };

  return (
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
          onChange={(e) => handleIsJbsRatedChange(e.target.checked)}
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
  );
}
