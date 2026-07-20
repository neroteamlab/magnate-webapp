import type { ClickList, FishingState } from "../types/fishing.types";
import { baseApi } from "./api";

export interface SuccessResponse {
  success: boolean;
}

export const startFishing = async (): Promise<FishingState> => {
  // mock

  const data = {
    id: 1,
    clicksCount: 8,
    seed: 120012,
    castTime: new Date(Date.now() + 3_000), // rand
    finishTime: new Date(Date.now() + 30_000)
  };
  //const { data } = await baseApi.post(`/game/fishing/start/`);

  return data;
};

export const claimFish = async (clickList: ClickList): Promise<SuccessResponse> => {
  const { data } = await baseApi.post(`/game/fishing/claim/`, clickList);

  return data;
};
