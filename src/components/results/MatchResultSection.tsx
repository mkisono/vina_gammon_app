import { Button, Heading, Text, View } from "@aws-amplify/ui-react";
import type { Schema } from "../../../amplify/data/resource";
import { AdminMatchResultForm } from "./AdminMatchResultForm";
import { MatchResultForm } from "./MatchResultForm";
import { MatchResultTable } from "./MatchResultTable";
import { MatchResultEditDialog } from "./MatchResultEditDialog";

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
  adminMatchTime?: string;
  adminWinnerNickname?: string;
  adminLoserNickname?: string;
  adminPlayerNicknameOptions?: string[];
  adminLoserNicknameOptions?: string[];
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
  onChangeAdminMatchTime?: (value: string) => void;
  onChangeAdminWinnerNickname?: (value: string) => void;
  onChangeAdminLoserNickname?: (value: string) => void;
  onChangePoint: (value: number) => void;
  onChangeIsJbsRated: (value: boolean) => void;
  onCreateMatchResult: () => void;
  onCreateAdminMatchResult?: () => void;
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
  adminMatchTime = "",
  adminWinnerNickname = "",
  adminLoserNickname = "",
  adminPlayerNicknameOptions = [],
  adminLoserNicknameOptions = [],
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
  onChangeAdminMatchTime = () => {},
  onChangeAdminWinnerNickname = () => {},
  onChangeAdminLoserNickname = () => {},
  onChangePoint,
  onChangeIsJbsRated,
  onCreateMatchResult,
  onCreateAdminMatchResult = () => {},
  onStartEditResult,
  onCancelEditResult,
  onChangeEditingOpponentNickname,
  onChangeEditingPoint,
  onChangeEditingIsJbsRated,
  onUpdateMatchResult,
  onDeleteMatchResult,
}: MatchResultSectionProps) {
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
              onChangeAdminMatchTime={onChangeAdminMatchTime}
              onChangeAdminWinnerNickname={onChangeAdminWinnerNickname}
              onChangeAdminLoserNickname={onChangeAdminLoserNickname}
              onChangePoint={onChangePoint}
              onChangeIsJbsRated={onChangeIsJbsRated}
              onCreateAdminMatchResult={onCreateAdminMatchResult}
            />
          ) : (
            <MatchResultForm
              canCreateResult={canCreateResult}
              opponentNickname={opponentNickname}
              opponentNicknameOptions={opponentNicknameOptions}
              point={point}
              isJbsRated={isJbsRated}
              isResultSubmitting={isResultSubmitting}
              onChangeOpponentNickname={onChangeOpponentNickname}
              onChangePoint={onChangePoint}
              onChangeIsJbsRated={onChangeIsJbsRated}
              onCreateMatchResult={onCreateMatchResult}
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
            onStartEditResult={onStartEditResult}
            onDeleteMatchResult={onDeleteMatchResult}
          />
          <MatchResultEditDialog
            editingResult={editingResult}
            editingWinnerDisplayName={editingWinnerDisplayName}
            editingOpponentNickname={editingOpponentNickname}
            editingOpponentNicknameOptions={editingOpponentNicknameOptions}
            editingPoint={editingPoint}
            editingIsJbsRated={editingIsJbsRated}
            isUpdatingResult={isUpdatingResult}
            onChangeEditingOpponentNickname={onChangeEditingOpponentNickname}
            onChangeEditingPoint={onChangeEditingPoint}
            onChangeEditingIsJbsRated={onChangeEditingIsJbsRated}
            onUpdateMatchResult={onUpdateMatchResult}
            onCancelEditResult={onCancelEditResult}
          />
        </>
      )}
    </View>
  );
}
