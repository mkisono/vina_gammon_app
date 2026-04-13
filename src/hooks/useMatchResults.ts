import { useEffect, useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { getJstTimeHHmm } from "../lib/eventPage";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();
const POINT_STORAGE_KEY = "vina_gammon:lastRegisteredPoint";
const DEFAULT_POINT = 5;

const getDefaultPoint = (): number => {
  const saved = window.localStorage.getItem(POINT_STORAGE_KEY);
  const parsed = Number(saved);
  if (validatePoint(parsed)) {
    return parsed;
  }
  return DEFAULT_POINT;
};

const createResultId = (): string => {
  const ts = Date.now().toString(16);
  const rand = Math.random().toString(16).slice(2, 18).padEnd(16, "0");
  return `${ts}-${rand}`;
};

const validatePoint = (value: number): boolean => {
  return Number.isInteger(value) && value >= 1 && value <= 25 && value % 2 === 1;
};

type UseMatchResultsReturn = {
  results: Array<Schema["MatchResult"]["type"]>;
  eventResults: Array<Schema["MatchResult"]["type"]>;
  filteredResults: Array<Schema["MatchResult"]["type"]>;
  opponentNicknameOptions: string[];
  opponentNickname: string;
  point: number;
  isJbsRated: boolean;
  isResultSubmitting: boolean;
  editingResultId: string;
  editingOpponentNickname: string;
  editingPoint: number;
  editingIsJbsRated: boolean;
  isUpdatingResult: boolean;
  setOpponentNickname: (value: string) => void;
  setPoint: (value: number) => void;
  setIsJbsRated: (value: boolean) => void;
  setEditingOpponentNickname: (value: string) => void;
  setEditingPoint: (value: number) => void;
  setEditingIsJbsRated: (value: boolean) => void;
  createMatchResult: (
    eventId: string,
    event: Schema["Event"]["type"],
    playerUserId: string
  ) => Promise<void>;
  startEditResult: (result: Schema["MatchResult"]["type"]) => void;
  cancelEditResult: () => void;
  updateMatchResult: (updaterUserId: string) => Promise<void>;
};

export function useMatchResults(
  profiles: Array<Schema["PublicProfile"]["type"]>,
  currentEventId: string,
  currentUserId?: string,
  isAdmin = false,
  enabled = true
): UseMatchResultsReturn {
  const [results, setResults] = useState<Array<Schema["MatchResult"]["type"]>>([]);
  const [opponentNickname, setOpponentNickname] = useState("");
  const [point, setPoint] = useState(() => getDefaultPoint());
  const [isJbsRated, setIsJbsRated] = useState(false);
  const [isResultSubmitting, setIsResultSubmitting] = useState(false);
  const [editingResultId, setEditingResultId] = useState("");
  const [editingOpponentNickname, setEditingOpponentNickname] = useState("");
  const [editingPoint, setEditingPoint] = useState(1);
  const [editingIsJbsRated, setEditingIsJbsRated] = useState(false);
  const [isUpdatingResult, setIsUpdatingResult] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const sub = client.models.MatchResult.observeQuery({
      filter: {
        eventId: { eq: currentEventId },
      },
    }).subscribe({
      next: ({ items }) => setResults([...items]),
    });
    return () => sub.unsubscribe();
  }, [enabled, currentEventId]);

  const opponentNicknameOptions = useMemo(() => {
    const nicknames = profiles
      .filter((p) => p.userId !== currentUserId)
      .map((p) => (p.nickname ?? "").trim())
      .filter((name) => name.length > 0);
    return [...new Set(nicknames)].sort((a, b) => a.localeCompare(b));
  }, [profiles, currentUserId]);

  const eventResults = useMemo(() => {
    if (!currentEventId) {
      return [];
    }
    return [...results]
      .filter((r) => r.eventId === currentEventId)
      .sort((a, b) => `${b.matchDate ?? ""} ${b.matchTime ?? ""}`.localeCompare(`${a.matchDate ?? ""} ${a.matchTime ?? ""}`));
  }, [results, currentEventId]);

  const filteredResults = useMemo(() => {
    if (isAdmin) {
      return eventResults;
    }
    if (!currentUserId) {
      return [];
    }
    return eventResults.filter((r) => {
      if (r.playerUserId === currentUserId) {
        return true;
      }
      if (r.loserUserId === currentUserId) {
        return true;
      }
      return false;
    });
  }, [eventResults, currentUserId, isAdmin]);

  const createMatchResult = async (
    eventId: string,
    event: Schema["Event"]["type"],
    playerUserId: string
  ) => {
    if (!eventId || !event) {
      window.alert("イベントページから登録してください。");
      return;
    }
    if (!playerUserId) {
      window.alert("ユーザー情報を取得できません。再ログインしてください。");
      return;
    }
    if ((event.status ?? "open") !== "open") {
      window.alert("このイベントは現在結果登録を受け付けていません。");
      return;
    }
    if (!opponentNickname) {
      window.alert("対戦相手ニックネームを選択してください。");
      return;
    }
    if (!opponentNicknameOptions.includes(opponentNickname)) {
      window.alert("対戦相手ニックネームは登録済みユーザー一覧から選択してください。");
      return;
    }
    if (!validatePoint(point)) {
      window.alert("ポイントは 1-25 の奇数で入力してください。");
      return;
    }

    const loserProfile = profiles.find((p) => (p.nickname ?? "").trim() === opponentNickname);
    if (!loserProfile?.userId) {
      window.alert("対戦相手ユーザーを特定できません。プロフィールを確認してください。");
      return;
    }
    if (loserProfile.userId === playerUserId) {
      window.alert("自分自身を対戦相手には指定できません。");
      return;
    }

    setIsResultSubmitting(true);
    try {
      const autoMatchDate = event.eventDate;
      const autoMatchTime = getJstTimeHHmm();
      const result = await client.models.MatchResult.create({
        resultId: createResultId(),
        eventId,
        playerUserId,
        loserUserId: loserProfile.userId,
        matchDate: autoMatchDate,
        matchTime: autoMatchTime,
        point,
        isJbsRated,
        createdByUserId: playerUserId,
      });
      if (result.errors?.length) {
        window.alert(`試合結果の登録に失敗しました: ${result.errors[0].message}`);
        return;
      }
      window.localStorage.setItem(POINT_STORAGE_KEY, String(point));
      setOpponentNickname("");
      setPoint(point);
      setIsJbsRated(false);
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

  const cancelEditResult = () => {
    setEditingResultId("");
  };

  const updateMatchResult = async (updaterUserId: string) => {
    if (!editingResultId) {
      return;
    }
    const editingResult = results.find((r) => r.resultId === editingResultId);
    if (!editingResult?.playerUserId) {
      window.alert("更新対象の試合結果を特定できません。画面を再読み込みして再試行してください。");
      return;
    }
    if (!editingOpponentNickname) {
      window.alert("対戦相手ニックネームを選択してください。");
      return;
    }
    if (!opponentNicknameOptions.includes(editingOpponentNickname)) {
      window.alert("対戦相手ニックネームは登録済みユーザー一覧から選択してください。");
      return;
    }
    if (!validatePoint(editingPoint)) {
      window.alert("ポイントは 1-25 の奇数で入力してください。");
      return;
    }
    if (!updaterUserId) {
      window.alert("ユーザー情報を取得できません。再ログインしてください。");
      return;
    }

    const loserProfile = profiles.find((p) => (p.nickname ?? "").trim() === editingOpponentNickname);
    if (!loserProfile?.userId) {
      window.alert("対戦相手ユーザーを特定できません。プロフィールを確認してください。");
      return;
    }
    if (loserProfile.userId === editingResult.playerUserId) {
      window.alert("勝者と敗者を同一ユーザーには指定できません。");
      return;
    }

    setIsUpdatingResult(true);
    try {
      const result = await client.models.MatchResult.update({
        resultId: editingResultId,
        loserUserId: loserProfile.userId,
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

  return {
    results,
    eventResults,
    filteredResults,
    opponentNicknameOptions,
    opponentNickname,
    point,
    isJbsRated,
    isResultSubmitting,
    editingResultId,
    editingOpponentNickname,
    editingPoint,
    editingIsJbsRated,
    isUpdatingResult,
    setOpponentNickname,
    setPoint,
    setIsJbsRated,
    setEditingOpponentNickname,
    setEditingPoint,
    setEditingIsJbsRated,
    createMatchResult,
    startEditResult,
    cancelEditResult,
    updateMatchResult,
  };
}
