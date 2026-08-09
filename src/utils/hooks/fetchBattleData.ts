import React from "react";
import type { Battle } from "../../types/battle.types";
import { fetchBattleship } from "../../api/gameApi";

export const useFetchBattleData = (id?: string) => {
  const [battleData, setBattleData] = React.useState<Battle | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [step, setStep] = React.useState<number>(1);
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [isError, setIsError] = React.useState<boolean>(false);

  const [moveNextStepCalled, setMoveStepCalled] =
    React.useState<boolean>(false);

  React.useEffect(() => {
    if (!battleData?.createdAt || !battleData?.duration) {
      setRemaining(null);
      return;
    }

    const startTime = new Date(battleData.createdAt).getTime();
    if (isNaN(startTime)) {
      setRemaining(null);
      return;
    }

    const updateTimer = () => {
      setRemaining(battleData.duration - (Date.now() - startTime));
    };

    const timerId = setInterval(updateTimer, 100);
    updateTimer();

    return () => clearInterval(timerId);
  }, [battleData?.createdAt, battleData?.duration]);

  React.useEffect(() => {
    const fetchBattleData = async () => {
      setLoading(step < 2);
      try {
        const data = await fetchBattleship(id);
        setBattleData(data);
        setStep(data.step);
      } catch (e) {
        console.error(e);
        setIsError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBattleData();
  }, [id, step]);
  
  const moveNextStep = React.useCallback(() => {
    setStep((prev) => (prev < 4 ? prev + 1 : prev));
  }, []);

  React.useEffect(() => {
    if (remaining && remaining < -1000 && !moveNextStepCalled) {
      setMoveStepCalled(true);

      moveNextStep();
    }
  }, [remaining, moveNextStepCalled, moveNextStep]);

  
  return {
    battleData,
    setBattleData,
    isError,
    loading,
    step,
    moveNextStep,
    remaining,
  };
};
