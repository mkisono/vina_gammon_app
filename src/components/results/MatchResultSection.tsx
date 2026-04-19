import { Button, Heading, Text, View } from "@aws-amplify/ui-react";
import type { Schema } from "../../../amplify/data/resource";
import { AdminMatchResultForm, type AdminMatchResultFormProps } from "./AdminMatchResultForm";
import { MatchResultForm, type MatchResultFormProps } from "./MatchResultForm";
import { MatchResultTable, type MatchResultTableProps } from "./MatchResultTable";
import { MatchResultEditDialog, type MatchResultEditDialogProps } from "./MatchResultEditDialog";

type MatchResultEventContextProps = {
  currentEventId: string;
  currentEvent: Schema["Event"]["type"] | null;
  filteredResults: Array<Schema["MatchResult"]["type"]>;
};

type MatchResultUserContextProps = {
  isAdmin: boolean;
  currentUserId?: string;
  profileNicknameByUserId: Record<string, string>;
};

type MatchResultCreateFormProps = {
  opponentNickname: string;
  opponentNicknameOptions: string[];
  adminMatchTime?: string;
  adminWinnerNickname?: string;
  adminLoserNickname?: string;
  adminPlayerNicknameOptions?: string[];
  adminLoserNicknameOptions?: string[];
  point: number;
  isJbsRated: boolean;
  isResultSubmitting: boolean;
};

type MatchResultEditFormProps = {
  editingOpponentNicknameOptions: string[];
  editingResultId: string;
  editingOpponentNickname: string;
  editingPoint: number;
  editingIsJbsRated: boolean;
  isUpdatingResult: boolean;
  isDeletingResult: boolean;
};

type MatchResultActionProps = {
  onGoToHomePage: () => void;
  create: {
    user: Pick<
      MatchResultFormProps,
      "onChangeOpponentNickname" | "onChangePoint" | "onChangeIsJbsRated" | "onCreateMatchResult"
    >;
    admin: Pick<
      AdminMatchResultFormProps,
      | "onChangeAdminMatchTime"
      | "onChangeAdminWinnerNickname"
      | "onChangeAdminLoserNickname"
      | "onChangePoint"
      | "onChangeIsJbsRated"
      | "onCreateAdminMatchResult"
    >;
  };
  edit: Pick<
    MatchResultEditDialogProps,
    | "onChangeEditingOpponentNickname"
    | "onChangeEditingPoint"
    | "onChangeEditingIsJbsRated"
    | "onUpdateMatchResult"
    | "onCancelEditResult"
  >;
  table: Pick<MatchResultTableProps, "onStartEditResult" | "onDeleteMatchResult">;
};

type MatchResultSectionProps = {
  eventContext: MatchResultEventContextProps;
  userContext: MatchResultUserContextProps;
  createForm: MatchResultCreateFormProps;
  editForm: MatchResultEditFormProps;
  actions: MatchResultActionProps;
};

export function MatchResultSection({
  eventContext,
  userContext,
  createForm,
  editForm,
  actions,
}: MatchResultSectionProps) {
  const { currentEventId, currentEvent, filteredResults } = eventContext;
  const { isAdmin, currentUserId, profileNicknameByUserId } = userContext;
  const {
    opponentNickname,
    opponentNicknameOptions,
    adminMatchTime = "",
    adminWinnerNickname = "",
    adminLoserNickname = "",
    adminPlayerNicknameOptions = [],
    adminLoserNicknameOptions = [],
    point,
    isJbsRated,
    isResultSubmitting,
  } = createForm;
  const {
    editingOpponentNicknameOptions,
    editingResultId,
    editingOpponentNickname,
    editingPoint,
    editingIsJbsRated,
    isUpdatingResult,
    isDeletingResult,
  } = editForm;
  const {
    onGoToHomePage,
    create,
    edit,
    table,
  } = actions;

  const createUserActions = create.user;
  const createAdminActions = create.admin;

  const currentEventStatus = currentEvent?.status ?? "open";
  const canCreateResult = isAdmin || currentEventStatus === "open";
  const registrationClosedMessage =
    currentEventStatus === "close"
      ? "このイベントは終了しました。試合結果の新規登録はできません。"
      : "このイベントでは試合結果の新規登録はできません。";
  const editingResult = filteredResults.find((result) => result.resultId === editingResultId) ?? null;
  const editingWinnerDisplayName = editingResult
    ? profileNicknameByUserId[editingResult.playerUserId ?? ""] ?? editingResult.playerUserId ?? "—"
    : "—";
  const winCount = currentUserId
    ? filteredResults.filter((result) => result.playerUserId === currentUserId).length
    : 0;
  const lossCount = currentUserId
    ? filteredResults.filter((result) => result.loserUserId === currentUserId).length
    : 0;

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
          {!isAdmin && !canCreateResult && (
            <Text marginTop="0.75rem">{registrationClosedMessage}</Text>
          )}
          {isAdmin ? (
            <AdminMatchResultForm
              canCreateResult={canCreateResult}
              adminMatchTime={adminMatchTime}
              adminWinnerNickname={adminWinnerNickname}
              adminLoserNickname={adminLoserNickname}
              adminPlayerNicknameOptions={adminPlayerNicknameOptions}
              adminLoserNicknameOptions={adminLoserNicknameOptions}
              point={point}
              isJbsRated={isJbsRated}
              isResultSubmitting={isResultSubmitting}
              {...createAdminActions}
            />
          ) : (
            <MatchResultForm
              canCreateResult={canCreateResult}
              opponentNickname={opponentNickname}
              opponentNicknameOptions={opponentNicknameOptions}
              point={point}
              isJbsRated={isJbsRated}
              isResultSubmitting={isResultSubmitting}
              {...createUserActions}
            />
          )}
          <MatchResultTable
            filteredResults={filteredResults}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
            winCount={winCount}
            lossCount={lossCount}
            profileNicknameByUserId={profileNicknameByUserId}
            editingResultId={editingResultId}
            isDeletingResult={isDeletingResult}
            {...table}
          />
          <MatchResultEditDialog
            editingResult={editingResult}
            editingWinnerDisplayName={editingWinnerDisplayName}
            editingOpponentNickname={editingOpponentNickname}
            editingOpponentNicknameOptions={editingOpponentNicknameOptions}
            editingPoint={editingPoint}
            editingIsJbsRated={editingIsJbsRated}
            isUpdatingResult={isUpdatingResult}
            {...edit}
          />
        </>
      )}
    </View>
  );
}
