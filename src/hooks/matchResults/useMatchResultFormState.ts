import { useState } from "react";

type UseMatchResultFormStateReturn = {
  opponentNickname: string;
  point: number;
  isJbsRated: boolean;
  setOpponentNickname: (value: string) => void;
  setPoint: (value: number) => void;
  setIsJbsRated: (value: boolean) => void;
  resetAfterCreate: () => void;
};

export function useMatchResultFormState(initialPoint: number): UseMatchResultFormStateReturn {
  const [opponentNickname, setOpponentNickname] = useState("");
  const [point, setPoint] = useState(initialPoint);
  const [isJbsRated, setIsJbsRated] = useState(false);

  const resetAfterCreate = () => {
    setOpponentNickname("");
    setIsJbsRated(false);
  };

  return {
    opponentNickname,
    point,
    isJbsRated,
    setOpponentNickname,
    setPoint,
    setIsJbsRated,
    resetAfterCreate,
  };
}
