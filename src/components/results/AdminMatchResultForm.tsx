import { Button, Text, View } from "@aws-amplify/ui-react";
import { SearchableCombobox } from "./SearchableCombobox";
import { POINT_OPTIONS } from "./matchResultConstants";
import { JBS_MIN_POINT } from "../../hooks/matchResults/validation";

type AdminMatchResultFormProps = {
  canCreateResult: boolean;
  adminMatchTime: string;
  adminWinnerNickname: string;
  adminLoserNickname: string;
  adminPlayerNicknameOptions: string[];
  adminLoserNicknameOptions: string[];
  point: number;
  isJbsRated: boolean;
  isResultSubmitting: boolean;
  onChangeAdminMatchTime: (value: string) => void;
  onChangeAdminWinnerNickname: (value: string) => void;
  onChangeAdminLoserNickname: (value: string) => void;
  onChangePoint: (value: number) => void;
  onChangeIsJbsRated: (value: boolean) => void;
  onCreateAdminMatchResult: () => void;
};

export function AdminMatchResultForm({
  canCreateResult,
  adminMatchTime,
  adminWinnerNickname,
  adminLoserNickname,
  adminPlayerNicknameOptions,
  adminLoserNicknameOptions,
  point,
  isJbsRated,
  isResultSubmitting,
  onChangeAdminMatchTime,
  onChangeAdminWinnerNickname,
  onChangeAdminLoserNickname,
  onChangePoint,
  onChangeIsJbsRated,
  onCreateAdminMatchResult,
}: AdminMatchResultFormProps) {
  const handleIsJbsRatedChange = (checked: boolean) => {
    if (checked && point < JBS_MIN_POINT) {
      onChangePoint(JBS_MIN_POINT);
    }
    onChangeIsJbsRated(checked);
  };

  return (
    <View marginTop="0.75rem" className="result-form">
      <View className="result-field-group">
        <Text className="result-field-label">時刻</Text>
        <input
          type="time"
          value={adminMatchTime}
          onChange={(event) => onChangeAdminMatchTime(event.target.value)}
          className="result-field-input"
          step={60}
          disabled={!canCreateResult}
          aria-label="試合時刻"
        />
      </View>

      <View className="result-field-group">
        <Text className="result-field-label">勝者</Text>
        <SearchableCombobox
          value={adminWinnerNickname}
          onChange={onChangeAdminWinnerNickname}
          options={adminPlayerNicknameOptions}
          placeholder="勝者ニックネームを検索して選択してください"
          inputClassName="result-field-input"
          disabled={!canCreateResult}
        />
      </View>

      <View className="result-field-group">
        <Text className="result-field-label">敗者</Text>
        <SearchableCombobox
          value={adminLoserNickname}
          onChange={onChangeAdminLoserNickname}
          options={adminLoserNicknameOptions}
          placeholder="敗者ニックネームを検索して選択してください"
          inputClassName="result-field-input"
          disabled={!canCreateResult}
        />
      </View>

      <View className="result-field-group">
        <Text className="result-field-label">ポイント数</Text>
        <select
          value={point}
          onChange={(event) => onChangePoint(Number(event.target.value))}
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
          onChange={(event) => handleIsJbsRatedChange(event.target.checked)}
          className="result-checkbox"
          id="adminIsJbsRated"
          disabled={!canCreateResult}
        />
        <label htmlFor="adminIsJbsRated" className="result-checkbox-label">
          JBS レーティング対象
        </label>
      </View>

      <Button
        marginTop="0.25rem"
        onClick={onCreateAdminMatchResult}
        isLoading={isResultSubmitting}
        isDisabled={!canCreateResult}
      >
        試合結果を登録
      </Button>
    </View>
  );
}
