import type { ClickList, FishingState } from "../types/fishing.types";
import { baseApi } from "./api";

export interface SuccessResponse {
  success: boolean;
}

export const startFishing = async (): Promise<FishingState> => {
  const { data } = await baseApi.post(`/game/fishing/start/`);

  return data;
};

export const claimFish = async (clickList: ClickList): Promise<SuccessResponse> => {
  const { data } = await baseApi.post(`/game/fishing/claim/`, clickList);

  return data;
};
