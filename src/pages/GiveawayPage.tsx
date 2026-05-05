import { Button, Spinner } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { useParams } from "react-router-dom";
import {
  fetchGiveawayStatus,
  joinGiveaway,
  type GiveawayStatus,
} from "../api/giveawayApi";

type GiveawayView = "entry" | "success" | "not-subscribed";

const channelFallback = import.meta.env.VITE_GIVEAWAY_CHANNEL_URL || "https://t.me/";
const stickers = ["💰", "💵", "💎", "🏆", "⭐", "🎉"];

const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] as const },
};

const formatCountdown = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
};

const useSyncedCountdown = (endsAt?: string, serverNow?: number) => {
  const [remaining, setRemaining] = React.useState(0);

  React.useEffect(() => {
    if (!endsAt || !serverNow) return;

    const startedAt = Date.now();
    const targetRemaining = new Date(endsAt).getTime() - serverNow;

    const tick = () => {
      setRemaining(Math.max(0, targetRemaining - (Date.now() - startedAt)));
    };

    tick();
    const interval = window.setInterval(tick, 1000);

    return () => window.clearInterval(interval);
  }, [endsAt, serverNow]);

  return remaining;
};

const GiveawayBadge = () => (
  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-3xl shadow-[0_24px_80px_rgba(99,102,241,0.22)]">
    🎁
  </div>
);

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
    <p className="text-xs uppercase tracking-[0.18em] text-white/38">{label}</p>
    <p className="mt-1 truncate text-base font-semibold text-white">{value}</p>
  </div>
);

const StickerRain: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
    {Array.from({ length: 28 }, (_, index) => {
      const left = (index * 37) % 100;
      const delay = (index % 8) * 0.1;
      const duration = 1.9 + (index % 5) * 0.16;
      const sticker = stickers[index % stickers.length];

      return (
        <motion.span
          key={`${sticker}-${index}`}
          className="absolute top-[-48px] text-2xl will-change-transform"
          style={{ left: `${left}%` }}
          initial={{ y: -60, rotate: -30, opacity: 0 }}
          animate={{ y: "112vh", rotate: 240, opacity: [0, 1, 1, 0] }}
          transition={{ duration, delay, ease: "easeIn" }}
        >
          {sticker}
        </motion.span>
      );
    })}
  </div>
);

const GiveawayPage: React.FC = () => {
  const { id = "" } = useParams();
  const [view, setView] = React.useState<GiveawayView>("entry");
  const [status, setStatus] = React.useState<GiveawayStatus | null>(null);
  const [serverNow, setServerNow] = React.useState<number>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isJoining, setIsJoining] = React.useState(false);
  const [error, setError] = React.useState("");
  const [joinMessage, setJoinMessage] = React.useState("");

  const joinedStorageKey = `giveaway:${id}:joined`;
  const remaining = useSyncedCountdown(status?.ends_at, serverNow);
  const isFinished = Boolean(status) && remaining <= 0;
  const channelUrl = status?.channel_url || channelFallback;

  const loadStatus = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const result = await fetchGiveawayStatus(id);
      const wasJoinedLocally = localStorage.getItem(joinedStorageKey) === "true";

      setStatus(result.status);
      setServerNow(result.serverNow);

      if (result.status.already_joined || wasJoinedLocally) {
        setView("success");
      } else {
        setView("entry");
      }
    } catch (e) {
      console.error(e);
      setError("Не удалось проверить подписку. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  }, [id, joinedStorageKey]);

  React.useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleJoin = async () => {
    if (isFinished || isJoining) return;

    try {
      setIsJoining(true);
      setError("");
      setJoinMessage("");

      const result = await joinGiveaway(id);

      if (result.success) {
        localStorage.setItem(joinedStorageKey, "true");
        setJoinMessage(result.message);
        setView("success");
        return;
      }

      setJoinMessage(result.message);
      setView("not-subscribed");
    } catch (e) {
      console.error(e);
      setError("Не удалось проверить подписку. Попробуйте позже.");
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[100dvh] w-full items-center justify-center bg-[#111113] px-5 text-white">
        <Spinner size="lg" color="secondary" />
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden bg-[#111113] px-5 py-5 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-40px)] w-full max-w-[430px] flex-col justify-center">
        {error ? (
          <div className="mb-4 rounded-lg border border-[#ef4444]/35 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#fecaca]">
            <p>{error}</p>
            <button
              className="mt-2 text-sm font-semibold text-white underline underline-offset-4"
              onClick={loadStatus}
              type="button"
            >
              Повторить
            </button>
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          {view === "entry" && (
            <motion.section key="entry" {...pageTransition} className="w-full">
              <div className="text-center">
                <GiveawayBadge />
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-[#818cf8]">
                  Розыгрыш
                </p>
                <h1 className="mt-3 bg-gradient-to-r from-[#818cf8] via-white to-[#34d399] bg-clip-text text-5xl font-black leading-tight text-transparent">
                  {status?.prize || "Приз"}
                </h1>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  Выдача приза начнется после окончания таймера.
                </p>
              </div>

              <div className="mt-8 rounded-lg border border-white/10 bg-black/22 px-5 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-white/38">
                  До выдачи
                </p>
                <p className="mt-2 font-mono text-4xl font-bold tabular-nums text-white">
                  {formatCountdown(remaining)}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <StatCard
                  label="Участники"
                  value={(status?.participants ?? 0).toLocaleString("ru-RU")}
                />
                <StatCard label="Фонд" value={status?.prize_fund || status?.prize || "-"} />
              </div>

              <Button
                className="mt-6 h-14 w-full rounded-2xl bg-[#6366f1] text-base font-bold text-white shadow-[0_16px_36px_rgba(99,102,241,0.34)] transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-55"
                isDisabled={isFinished}
                isLoading={isJoining}
                onPress={handleJoin}
              >
                {isFinished ? "Розыгрыш завершён" : "Участвовать в раздаче"}
              </Button>

              <p className="mt-4 text-center text-sm leading-6 text-white/48">
                Обязательное условие:{" "}
                <a
                  className="font-semibold text-[#a5b4fc] underline underline-offset-4"
                  href={channelUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  подписка на канал
                </a>
                .
              </p>

              <div className="mt-8 border-t border-white/10 pt-5">
                <p className="text-sm leading-6 text-white/58">
                  {status?.description ||
                    "Этот розыгрыш открыт по ссылке из бота. Участие фиксируется один раз, а результаты появятся после окончания таймера."}
                </p>
              </div>
            </motion.section>
          )}

          {view === "not-subscribed" && (
            <motion.section
              key="not-subscribed"
              {...pageTransition}
              className="w-full text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ef4444]/35 bg-[#ef4444]/10 text-3xl">
                !
              </div>
              <h1 className="mt-5 text-3xl font-black">Подписка не найдена</h1>
              <p className="mt-3 text-sm leading-6 text-white/58">
                Для участия нужно быть подписанным на канал. После подписки
                вернитесь и попробуйте снова.
              </p>
              {joinMessage ? (
                <p className="mt-3 rounded-lg bg-white/[0.04] px-4 py-3 text-sm text-white/62">
                  {joinMessage}
                </p>
              ) : null}
              <Button
                as="a"
                className="mt-7 h-14 w-full rounded-2xl bg-[#6366f1] text-base font-bold text-white"
                href={channelUrl}
                rel="noreferrer"
                target="_blank"
              >
                Подписаться на канал
              </Button>
              <Button
                className="mt-3 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-white"
                onPress={() => setView("entry")}
              >
                ← Вернуться назад
              </Button>
            </motion.section>
          )}

          {view === "success" && (
            <motion.section
              key="success"
              {...pageTransition}
              className="relative w-full text-center"
            >
              <StickerRain />
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#34d399]/35 bg-[#34d399]/10 text-3xl text-[#34d399]">
                ✓
              </div>
              <h1 className="mt-5 text-3xl font-black">Вы участвуете!</h1>
              <p className="mt-3 text-sm leading-6 text-white/58">
                Заявка принята. Результаты будут доступны после окончания таймера.
              </p>
              {joinMessage ? (
                <p className="mt-3 rounded-lg bg-white/[0.04] px-4 py-3 text-sm text-white/62">
                  {joinMessage}
                </p>
              ) : null}

              <div className="mt-8 rounded-lg border border-white/10 bg-black/22 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/38">
                  До розыгрыша
                </p>
                <p className="mt-2 font-mono text-4xl font-bold tabular-nums text-white">
                  {formatCountdown(remaining)}
                </p>
              </div>

              <Button
                className="mt-7 h-14 w-full rounded-2xl bg-[#34d399] text-base font-bold text-[#062015] transition-transform hover:scale-[1.01] active:scale-[0.98]"
                onPress={() => window.Telegram?.WebApp?.close?.()}
              >
                Понятно, жду результат
              </Button>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default GiveawayPage;
