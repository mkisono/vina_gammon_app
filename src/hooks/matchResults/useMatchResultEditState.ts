import { useState } from "react";

type UseMatchResultEditStateReturn = {
  editingResultId: string;
  editingOpponentNickname: string;
  editingPoint: number;
  editingIsJbsRated: boolean;
  setEditingResultId: (value: string) => void;
  setEditingOpponentNickname: (value: string) => void;
  setEditingPoint: (value: number) => void;
  setEditingIsJbsRated: (value: boolean) => void;
  cancelEditResult: () => void;
};

export function useMatchResultEditState(initialPoint: number): UseMatchResultEditStateReturn {
  const [editingResultId, setEditingResultId] = useState("");
  const [editingOpponentNickname, setEditingOpponentNickname] = useState("");
  const [editingPoint, setEditingPoint] = useState(initialPoint);
  const [editingIsJbsRated, setEditingIsJbsRated] = useState(false);

  const cancelEditResult = () => {
    setEditingResultId("");
  };

  return {
    editingResultId,
    editingOpponentNickname,
    editingPoint,
    editingIsJbsRated,
    setEditingResultId,
    setEditingOpponentNickname,
    setEditingPoint,
    setEditingIsJbsRated,
    cancelEditResult,
  };
}
