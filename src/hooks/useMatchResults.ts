import { useMemo, useState } from "react";
import { getJstTimeHHmm } from "../lib/eventPage";
import type { Schema } from "../../amplify/data/resource";
import {
  buildEventResults,
  buildFilteredResults,
  buildOpponentNicknameOptions,
} from "./matchResults/derived";
import { useMatchResultsSubscription } from "./matchResults/useMatchResultsSubscription";
import { useMatchResultFormState } from "./matchResults/useMatchResultFormState";
import { useMatchResultEditState } from "./matchResults/useMatchResultEditState";
import {
  createMatchResultRecord,
  updateMatchResultRecord,
  deleteMatchResultRecord,
} from "./matchResults/matchResultService";
import {
  validateCreateInput,
  validateUpdateInput,
  validateAdminCreateInput,
  resolveUserIdByNickname,
  isValidPoint,
} from "./matchResults/validation";

const POINT_STORAGE_KEY = "vina_gammon:lastRegisteredPoint";
const DEFAULT_POINT = 5;

const getDefaultPoint = (): number => {
  const saved = window.localStorage.getItem(POINT_STORAGE_KEY);
  const parsed = Number(saved);
  if (isValidPoint(parsed)) {
    return parsed;
  }
  return DEFAULT_POINT;
};

const createResultId = (): string => {
  const ts = Date.now().toString(16);
  const rand = Math.random().toString(16).slice(2, 18).padEnd(16, "0");
  return `${ts}-${rand}`;
};

const getDefaultAdminMatchTime = (): string => {
  return getJstTimeHHmm();
};

type UseMatchResultsReturn = {
  results: Array<Schema["MatchResult"]["type"]>;
  eventResults: Array<Schema["MatchResult"]["type"]>;
  filteredResults: Array<Schema["MatchResult"]["type"]>;
  opponentNicknameOptions: string[];
  editingOpponentNicknameOptions: string[];
  adminPlayerNicknameOptions: string[];
  adminLoserNicknameOptions: string[];
  opponentNickname: string;
  adminMatchTime: string;
  adminWinnerNickname: string;
  adminLoserNickname: string;
  point: number;
  isJbsRated: boolean;
  isResultSubmitting: boolean;
  editingResultId: string;
  editingOpponentNickname: string;
  editingPoint: number;
  editingIsJbsRated: boolean;
  isUpdatingResult: boolean;
  setOpponentNickname: (value: string) => void;
  setAdminMatchTime: (value: string) => void;
  setAdminWinnerNickname: (value: string) => void;
  setAdminLoserNickname: (value: string) => void;
  setPoint: (value: number) => void;
  setIsJbsRated: (value: boolean) => void;
  setEditingOpponentNickname: (value: string) => void;
  setEditingPoint: (value: number) => void;
  setEditingIsJbsRated: (value: boolean) => void;
  isDeletingResult: boolean;
  createMatchResult: (
    eventId: string,
    event: Schema["Event"]["type"],
    playerUserId: string
  ) => Promise<void>;
  createAdminMatchResult: (eventId: string, event: Schema["Event"]["type"]) => Promise<void>;
  startEditResult: (result: Schema["MatchResult"]["type"]) => void;
  cancelEditResult: () => void;
  updateMatchResult: (updaterUserId: string) => Promise<void>;
  deleteMatchResult: (resultId: string) => Promise<void>;
};

export function useMatchResults(
  profiles: Array<Schema["PublicProfile"]["type"]>,
  currentEventId: string,
  currentUserId?: string,
  isAdmin = false,
  enabled = true
): UseMatchResultsReturn {
  const { results } = useMatchResultsSubscription(currentEventId, enabled);
  const {
    opponentNickname,
    point,
    isJbsRated,
    setOpponentNickname,
    setPoint,
    setIsJbsRated,
    resetAfterCreate,
  } = useMatchResultFormState(getDefaultPoint());
  const [adminMatchTime, setAdminMatchTime] = useState(getDefaultAdminMatchTime());
  const [adminWinnerNickname, setAdminWinnerNickname] = useState("");
  const [adminLoserNickname, setAdminLoserNickname] = useState("");
  const {
    editingResultId,
    editingOpponentNickname,
    editingPoint,
    editingIsJbsRated,
    setEditingResultId,
    setEditingOpponentNickname,
    setEditingPoint,
    setEditingIsJbsRated,
    cancelEditResult,
  } = useMatchResultEditState(1);
  const [isResultSubmitting, setIsResultSubmitting] = useState(false);
  const [isUpdatingResult, setIsUpdatingResult] = useState(false);
  const [isDeletingResult, setIsDeletingResult] = useState(false);

  const opponentNicknameOptions = useMemo(() => {
    return buildOpponentNicknameOptions(profiles, currentUserId);
  }, [profiles, currentUserId]);

  const editingOpponentNicknameOptions = useMemo(() => {
    const nicknames = profiles
      .map((profile) => (profile.nickname ?? "").trim())
      .filter((name) => name.length > 0);
    return [...new Set(nicknames)].sort((a, b) => a.localeCompare(b));
  }, [profiles]);

  const adminPlayerNicknameOptions = useMemo(() => {
    return editingOpponentNicknameOptions;
  }, [editingOpponentNicknameOptions]);

  const adminLoserNicknameOptions = useMemo(() => {
    return editingOpponentNicknameOptions;
  }, [editingOpponentNicknameOptions]);

  const eventResults = useMemo(() => {
    return buildEventResults(results, currentEventId);
  }, [results, currentEventId]);

  const filteredResults = useMemo(() => {
    return buildFilteredResults(eventResults, currentUserId, isAdmin);
  }, [eventResults, currentUserId, isAdmin]);

  const createMatchResult = async (
    eventId: string,
    event: Schema["Event"]["type"],
    playerUserId: string
  ) => {
    const createValidationError = validateCreateInput({
      eventId,
      event,
      playerUserId,
      opponentNickname,
      opponentNicknameOptions,
      point,
      isJbsRated,
    });
    if (createValidationError) {
      window.alert(createValidationError);
      return;
    }

    const loserUserId = resolveUserIdByNickname(profiles, opponentNickname);
    if (!loserUserId) {
      window.alert("対戦相手ユーザーを特定できません。プロフィールを確認してください。");
      return;
    }
    if (loserUserId === playerUserId) {
      window.alert("自分自身を対戦相手には指定できません。");
      return;
    }

    setIsResultSubmitting(true);
    try {
      const autoMatchDate = event.eventDate;
      const autoMatchTime = getJstTimeHHmm();
      const result = await createMatchResultRecord({
        resultId: createResultId(),
        eventId,
        playerUserId,
        loserUserId,
        matchDate: autoMatchDate,
        matchTime: autoMatchTime,
        point,
        isJbsRated,
      });
      if (result.errors?.length) {
        window.alert(`試合結果の登録に失敗しました: ${result.errors[0].message}`);
        return;
      }
      window.localStorage.setItem(POINT_STORAGE_KEY, String(point));
      resetAfterCreate();
    } finally {
      setIsResultSubmitting(false);
    }
  };

  const createAdminMatchResult = async (eventId: string, event: Schema["Event"]["type"]) => {
    const adminCreateValidationError = validateAdminCreateInput({
      isAdmin,
      eventId,
      event,
      adminMatchTime,
      adminWinnerNickname,
      adminLoserNickname,
      adminPlayerNicknameOptions,
      adminLoserNicknameOptions,
      point,
      isJbsRated,
    });
    if (adminCreateValidationError) {
      window.alert(adminCreateValidationError);
      return;
    }

    const winnerUserId = resolveUserIdByNickname(profiles, adminWinnerNickname);
    const loserUserId = resolveUserIdByNickname(profiles, adminLoserNickname);
    if (!winnerUserId || !loserUserId) {
      window.alert("ユーザーを特定できません。プロフィールを確認してください。");
      return;
    }
    if (winnerUserId === loserUserId) {
      window.alert("勝者と敗者を同一ユーザーには指定できません。");
      return;
    }

    setIsResultSubmitting(true);
    try {
      const result = await createMatchResultRecord({
        resultId: createResultId(),
        eventId,
        playerUserId: winnerUserId,
        loserUserId,
        matchDate: event.eventDate,
        matchTime: adminMatchTime,
        point,
        isJbsRated,
      });
      if (result.errors?.length) {
        window.alert(`試合結果の登録に失敗しました: ${result.errors[0].message}`);
        return;
      }
      window.localStorage.setItem(POINT_STORAGE_KEY, String(point));
      setAdminMatchTime(getDefaultAdminMatchTime());
      setAdminWinnerNickname("");
      setAdminLoserNickname("");
      resetAfterCreate();
    } finally {
      setIsResultSubmitting(false);
    }
  };

  const startEditResult = (result: Schema["MatchResult"]["type"]) => {
    const currentLoserNickname = profiles.find((p) => p.userId === result.loserUserId)?.nickname ?? "";
    setEditingResultId(result.resultId);
    setEditingOpponentNickname(currentLoserNickname);
    setEditingPoint(result.point ?? DEFAULT_POINT);
    setEditingIsJbsRated(!!result.isJbsRated);
  };

  const updateMatchResult = async (updaterUserId: string) => {
    const editingResult = results.find((r) => r.resultId === editingResultId);
    const updateValidationError = validateUpdateInput({
      editingResultId,
      editingOpponentNickname,
      opponentNicknameOptions: editingOpponentNicknameOptions,
      editingPoint,
      editingIsJbsRated,
      updaterUserId,
      hasEditingResult: Boolean(editingResult?.playerUserId),
    });
    if (updateValidationError) {
      window.alert(updateValidationError);
      return;
    }

    const loserUserId = resolveUserIdByNickname(profiles, editingOpponentNickname);
    if (!loserUserId || !editingResult?.playerUserId) {
      window.alert("対戦相手ユーザーを特定できません。プロフィールを確認してください。");
      return;
    }
    if (loserUserId === editingResult.playerUserId) {
      window.alert("勝者と敗者を同一ユーザーには指定できません。");
      return;
    }

    setIsUpdatingResult(true);
    try {
      const result = await updateMatchResultRecord({
        resultId: editingResultId,
        loserUserId,
        point: editingPoint,
        isJbsRated: editingIsJbsRated,
      });
      if (result.errors?.length) {
        window.alert(`試合結果の更新に失敗しました: ${result.errors[0].message}`);
        return;
      }
      setEditingResultId("");
    } finally {
      setIsUpdatingResult(false);
    }
  };

  const deleteMatchResult = async (resultId: string) => {
    setIsDeletingResult(true);
    try {
      const result = await deleteMatchResultRecord(resultId);
      if (result.errors?.length) {
        window.alert(`試合結果の削除に失敗しました: ${result.errors[0].message}`);
      }
    } finally {
      setIsDeletingResult(false);
    }
  };

  return {
    results,
    eventResults,
    filteredResults,
    opponentNicknameOptions,
    editingOpponentNicknameOptions,
    adminPlayerNicknameOptions,
    adminLoserNicknameOptions,
    opponentNickname,
    adminMatchTime,
    adminWinnerNickname,
    adminLoserNickname,
    point,
    isJbsRated,
    isResultSubmitting,
    editingResultId,
    editingOpponentNickname,
    editingPoint,
    editingIsJbsRated,
    isUpdatingResult,
    isDeletingResult,
    setOpponentNickname,
    setAdminMatchTime,
    setAdminWinnerNickname,
    setAdminLoserNickname,
    setPoint,
    setIsJbsRated,
    setEditingOpponentNickname,
    setEditingPoint,
    setEditingIsJbsRated,
    createMatchResult,
    createAdminMatchResult,
    startEditResult,
    cancelEditResult,
    updateMatchResult,
    deleteMatchResult,
  };
}
