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
  isAdmin: true | false;
  currentUserId?: string;
  profileNicknameByUserId: Record<string, string>;
};

type MatchResultCreateFormCommonProps = {
  point: number;
  isJbsRated: boolean;
  isResultSubmitting: boolean;
};

type MatchResultUserCreateFormProps = MatchResultCreateFormCommonProps & {
  opponentNickname: string;
  opponentNicknameOptions: string[];
};

type MatchResultAdminCreateFormProps = MatchResultCreateFormCommonProps & {
  adminMatchTime: string;
  adminWinnerNickname: string;
  adminLoserNickname: string;
  adminPlayerNicknameOptions: string[];
  adminLoserNicknameOptions: string[];
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

type MatchResultUserActionProps = MatchResultActionProps & {
  create: {
    user: Pick<
      MatchResultFormProps,
      "onChangeOpponentNickname" | "onChangePoint" | "onChangeIsJbsRated" | "onCreateMatchResult"
    >;
  };
};

type MatchResultAdminActionProps = MatchResultActionProps & {
  create: {
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
};

type MatchResultSectionAdminProps = {
  eventContext: MatchResultEventContextProps;
  userContext: MatchResultUserContextProps & { isAdmin: true };
  createForm: MatchResultAdminCreateFormProps;
  editForm: MatchResultEditFormProps;
  actions: MatchResultAdminActionProps;
};

type MatchResultSectionUserProps = {
  eventContext: MatchResultEventContextProps;
  userContext: MatchResultUserContextProps & { isAdmin: false };
  createForm: MatchResultUserCreateFormProps;
  editForm: MatchResultEditFormProps;
  actions: MatchResultUserActionProps;
};

type MatchResultSectionProps = MatchResultSectionAdminProps | MatchResultSectionUserProps;

const isAdminSectionProps = (
  props: MatchResultSectionProps
): props is MatchResultSectionAdminProps => {
  return props.userContext.isAdmin;
};

export function MatchResultSection(props: MatchResultSectionProps) {
  const { currentEventId, currentEvent, filteredResults } = props.eventContext;
  const { currentUserId, profileNicknameByUserId } = props.userContext;
  const isAdmin = props.userContext.isAdmin;
  const { point, isJbsRated, isResultSubmitting } = props.createForm;
  const {
    editingOpponentNicknameOptions,
    editingResultId,
    editingOpponentNickname,
    editingPoint,
    editingIsJbsRated,
    isUpdatingResult,
    isDeletingResult,
  } = props.editForm;
  const {
    onGoToHomePage,
    edit,
    table,
  } = props.actions;

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
  const createFormNode = isAdminSectionProps(props) ? (
    <AdminMatchResultForm
      canCreateResult={canCreateResult}
      adminMatchTime={props.createForm.adminMatchTime}
      adminWinnerNickname={props.createForm.adminWinnerNickname}
      adminLoserNickname={props.createForm.adminLoserNickname}
      adminPlayerNicknameOptions={props.createForm.adminPlayerNicknameOptions}
      adminLoserNicknameOptions={props.createForm.adminLoserNicknameOptions}
      point={point}
      isJbsRated={isJbsRated}
      isResultSubmitting={isResultSubmitting}
      {...props.actions.create.admin}
    />
  ) : (
    <MatchResultForm
      canCreateResult={canCreateResult}
      opponentNickname={props.createForm.opponentNickname}
      opponentNicknameOptions={props.createForm.opponentNicknameOptions}
      point={point}
      isJbsRated={isJbsRated}
      isResultSubmitting={isResultSubmitting}
      {...props.actions.create.user}
    />
  );

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
          {createFormNode}
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
