import type { Schema } from "../../../amplify/data/resource";

export const JBS_MIN_POINT = 5;

type CreateInputValidationParams = {
  eventId: string;
  event: Schema["Event"]["type"] | null | undefined;
  playerUserId: string;
  opponentNickname: string;
  opponentNicknameOptions: string[];
  point: number;
  isJbsRated: boolean;
};

type UpdateInputValidationParams = {
  editingResultId: string;
  editingOpponentNickname: string;
  opponentNicknameOptions: string[];
  editingPoint: number;
  editingIsJbsRated: boolean;
  updaterUserId: string;
  hasEditingResult: boolean;
};

export const isValidPoint = (value: number): boolean => {
  return Number.isInteger(value) && value >= 1 && value <= 25 && value % 2 === 1;
};

export const validateJbsRatingConstraint = (point: number, isJbsRated: boolean): string | null => {
  if (isJbsRated && point < JBS_MIN_POINT) {
    return `JBSレーティング対象にするには、ポイント数を ${JBS_MIN_POINT} 以上にしてください。`;
  }
  return null;
};

export const validateCreateInput = ({
  eventId,
  event,
  playerUserId,
  opponentNickname,
  opponentNicknameOptions,
  point,
  isJbsRated,
}: CreateInputValidationParams): string | null => {
  if (!eventId || !event) {
    return "イベントページから登録してください。";
  }
  if (!playerUserId) {
    return "ユーザー情報を取得できません。再ログインしてください。";
  }
  if ((event.status ?? "open") !== "open") {
    return "このイベントは現在結果登録を受け付けていません。";
  }
  if (!opponentNickname) {
    return "対戦相手ニックネームを選択してください。";
  }
  if (!opponentNicknameOptions.includes(opponentNickname)) {
    return "対戦相手ニックネームは登録済みユーザー一覧から選択してください。";
  }
  if (!isValidPoint(point)) {
    return "ポイントは 1-25 の奇数で入力してください。";
  }
  const jbsError = validateJbsRatingConstraint(point, isJbsRated);
  if (jbsError) {
    return jbsError;
  }
  return null;
};

export const validateUpdateInput = ({
  editingResultId,
  editingOpponentNickname,
  opponentNicknameOptions,
  editingPoint,
  editingIsJbsRated,
  updaterUserId,
  hasEditingResult,
}: UpdateInputValidationParams): string | null => {
  if (!editingResultId) {
    return "更新対象の試合結果を特定できません。画面を再読み込みして再試行してください。";
  }
  if (!hasEditingResult) {
    return "更新対象の試合結果を特定できません。画面を再読み込みして再試行してください。";
  }
  if (!editingOpponentNickname) {
    return "対戦相手ニックネームを選択してください。";
  }
  if (!opponentNicknameOptions.includes(editingOpponentNickname)) {
    return "対戦相手ニックネームは登録済みユーザー一覧から選択してください。";
  }
  if (!isValidPoint(editingPoint)) {
    return "ポイントは 1-25 の奇数で入力してください。";
  }
  const jbsError = validateJbsRatingConstraint(editingPoint, editingIsJbsRated);
  if (jbsError) {
    return jbsError;
  }
  if (!updaterUserId) {
    return "ユーザー情報を取得できません。再ログインしてください。";
  }
  return null;
};

export const resolveUserIdByNickname = (
  profiles: Array<Schema["PublicProfile"]["type"]>,
  nickname: string
): string | null => {
  const profile = profiles.find((p) => (p.nickname ?? "").trim() === nickname);
  return profile?.userId ?? null;
};
