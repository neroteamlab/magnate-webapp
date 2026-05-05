// import { baseApi } from "./api";

export interface GiveawayStatus {
  is_subscribed: boolean;
  already_joined: boolean;
  prize: string;
  ends_at: string;
  participants?: number;
  prize_fund?: string;
  channel_url?: string;
  description?: string;
}

export interface GiveawayJoinResponse {
  success: boolean;
  message: string;
}

interface GiveawayStatusResult {
  status: GiveawayStatus;
  serverNow: number;
}

const MOCK_DELAY = 600;

const wait = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const getMockMode = () => new URLSearchParams(window.location.search).get("mock");

export const getTelegramUserId = (): number | null => {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

  return typeof user?.id === "number" ? user.id : null;
};

export const fetchGiveawayStatus = async (
  giveawayId: string
): Promise<GiveawayStatusResult> => {
  await wait(MOCK_DELAY);

  const mockMode = getMockMode();
  const serverNow = Date.now();
  const isFinished = mockMode === "finished";
  const endsAt = new Date(
    serverNow + (isFinished ? -5 * 60 * 1000 : 3 * 60 * 60 * 1000 + 18 * 60 * 1000)
  ).toISOString();

  return {
    status: {
      is_subscribed: mockMode !== "not-subscribed",
      already_joined: mockMode === "success",
      prize: "25 000 ₽",
      ends_at: endsAt,
      participants: 1284,
      prize_fund: "25 000 ₽",
      channel_url: "https://t.me/magnate_game",
      description:
        `Тестовый розыгрыш #${giveawayId || "demo"} открыт из Telegram-бота. ` +
        "После подключения бэкенда здесь будут реальные условия, участники и время выдачи.",
    },
    serverNow,
  };

  // const userId = getTelegramUserId();
  // const { data, headers } = await baseApi.get<GiveawayStatus>(
  //   "/api/giveaway/status",
  //   {
  //     params: {
  //       giveaway_id: giveawayId,
  //       user_id: userId,
  //       telegram_token: localStorage.getItem("telegram-init-data") || null,
  //     },
  //   }
  // );
  //
  // const serverNow = headers.date
  //   ? new Date(headers.date).getTime()
  //   : Date.now();
  //
  // return {
  //   status: data,
  //   serverNow: Number.isFinite(serverNow) ? serverNow : Date.now(),
  // };
};

export const joinGiveaway = async (
  giveawayId: string
): Promise<GiveawayJoinResponse> => {
  await wait(MOCK_DELAY);

  const mockMode = getMockMode();

  if (mockMode === "network-error") {
    throw new Error("Mock network error");
  }

  if (mockMode === "not-subscribed") {
    return {
      success: false,
      message: "Тестовый ответ: подписка на канал пока не подтверждена.",
    };
  }

  return {
    success: true,
    message: `Тестовый ответ: участие в розыгрыше #${giveawayId || "demo"} принято.`,
  };

  // const userId = getTelegramUserId();
  // const { data } = await baseApi.post<GiveawayJoinResponse>(
  //   "/api/giveaway/join",
  //   {
  //     giveaway_id: giveawayId,
  //     user_id: userId,
  //   }
  // );
  //
  // return data;
};
