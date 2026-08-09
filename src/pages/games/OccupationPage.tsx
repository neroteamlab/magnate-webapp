import { Avatar, Button } from "@heroui/react";
import React from "react";
import { useParams } from "react-router";
import { appleTargetLocation } from "../../api/gameApi";
import { AimIcon } from "../../assets/AimIcon";
import { BoomIcon } from "../../assets/BoomIcon";
import { CloseIcon } from "../../assets/Close";
import { PositionIcon } from "../../assets/PositionIcon";
import Loading from "../../components/shared/Loading";
import RemainingTime from "../../components/shared/RemainingTime";
import MultipleIcon from "../../components/ui/MultipleIcon";
import type { Aim, Company, Position } from "../../types/battle.types";
import { cn } from "../../utils/classNames";
import { useFetchBattleData } from "../../utils/hooks/fetchBattleData";
import GameNotFoundPage from "../NotFoundPage";

const getTitleByStep = (step: number, status?: "WIN" | "LOSE" | "DRAW") => {
  switch (step) {
    case 1:
      return "Поставь объект на поле!";
    case 2:
      return "Сделай ход!";
    case 3:
      return "Ждем остальных игроков!";
    case 4:
      return status === "WIN"
        ? "Вы победили!"
        : status === "LOSE"
        ? "Вы проиграли!"
        : "Ничья!";
    default:
      return "Ждем остальных игроков!";
  }
};

const getIconByStep = (
  step: number,
  x?: number,
  y?: number,
  targetLocations?: Position[],
  targetAims?: Aim[],
  locations?: Position[],
  aims?: Aim[]
) => {
  const companyLocation = locations?.find(
    (location) => location.x === x && location.y === y
  );
  const targetCompanyLocation = targetLocations?.find(
    (location) => location.x === x && location.y === y
  );
  const companyAim = aims?.find((aim) => aim.x === x && aim.y === y);
  const targetCompanyAim = targetAims?.find(
    (aim) => aim.x === x && aim.y === y
  );
  switch (step) {
    case 1:
      return <PositionIcon color="#17C964" />;
    case 2:
      return <AimIcon />;
    case 3:
    case 4:
      if (companyAim?.isTarget || targetCompanyAim?.isTarget)
        return <BoomIcon />;

      if (companyLocation?.isDefeated) {
        return (
          <MultipleIcon
            second={<CloseIcon color="#000" />}
            first={<PositionIcon color="#17C964" />}
          />
        );
      }
      if (targetCompanyLocation?.isDefeated) {
        return (
          <MultipleIcon
            second={<CloseIcon color="#000" />}
            first={<PositionIcon color="#FF383C" />}
          />
        );
      }

      if (companyLocation && companyAim) {
        return <PositionIcon color="#17C964" />;
      }

      if (targetCompanyLocation) {
        return <PositionIcon color="#FF383C" />;
      }

      if (companyLocation || (companyAim && companyLocation)) {
        return <PositionIcon color="#17C964" />;
      }

      break;
    default:
      break;
  }
};

const getBackgroundSquare = (
  x: number,
  y: number,
  company: Company,
  targetCompany: Company
) => {
  const companyFoundLocation = company.aims.find(
    (aim) => aim.x === x && aim.y === y
  );
  const targetCompanyFoundLocation = targetCompany.aims.find(
    (aim) => aim.x === x && aim.y === y
  );

  if (companyFoundLocation && !targetCompanyFoundLocation) {
    return "bg-blue-400";
  }

  if (companyFoundLocation && targetCompanyFoundLocation) {
    return "bg-blue-400";
  }

  if (targetCompanyFoundLocation && !companyFoundLocation) {
    return "bg-blue-400";
  }

  return "bg-[#D9D9D9]";
};

const OccupationPage: React.FC = () => {
  const [selectedPosition, setSelectedPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);

  const id = useParams().id;

  const { battleData, loading, step, moveNextStep, remaining, isError } =
    useFetchBattleData(id);

  const onSelectPosition = React.useCallback(
    (x: number, y: number) => {
      if (step > 2) return;
      setSelectedPosition({ x, y });
    },
    [step]
  );

  const onApplyPosition = React.useCallback(async () => {
    if (!selectedPosition) return;

    const data = await appleTargetLocation(
      selectedPosition.x,
      selectedPosition.y
    );

    if (data.success) {
      moveNextStep();
      setSelectedPosition(null);
    }
  }, [selectedPosition, moveNextStep]);

  if (loading) return <Loading />;

  if (!battleData || isError) return <GameNotFoundPage />;

  return (
    <div className="space-y-3 max-w-[400px] mx-auto">
      <header className="space-y-3">
        <div className="flex gap-3 text-2xl items-center text-[#F31260]">
          <Avatar radius="lg" color="danger" /> {battleData.targetCompany.title}
        </div>
        {step < 4 && <RemainingTime remaining={remaining} />}

        <div className="text-center text-2xl">
          {getTitleByStep(step, battleData.status)}
        </div>
      </header>

      <main className="space-y-1">
        {Array.from({ length: 9 }, (_, y) => (
          <div className="flex gap-1" key={y}>
            {Array.from({ length: 9 }, (_, x) => {
              return (
                <button
                  disabled={step > 2}
                  onClick={() => onSelectPosition(x, y)}
                  className={cn(
                    getBackgroundSquare(
                      x,
                      y,
                      battleData.company,
                      battleData.targetCompany
                    ),
                    "rounded-sm disabled:opacity-80  flex-1 aspect-square"
                  )}
                  key={x}
                >
                  {step < 3
                    ? selectedPosition &&
                      selectedPosition.x === x &&
                      selectedPosition.y === y &&
                      getIconByStep(step)
                    : getIconByStep(
                        step,
                        x,
                        y,
                        battleData.targetCompany.locations,
                        battleData.targetCompany.aims,
                        battleData.company.locations,
                        battleData.company.aims
                      )}
                </button>
              );
            })}
          </div>
        ))}
        {step < 3 && (
          <Button
            disabled={!selectedPosition}
            className="w-full"
            onPress={onApplyPosition}
          >
            Применить ход
          </Button>
        )}
      </main>
    </div>
  );
};

export default OccupationPage;
