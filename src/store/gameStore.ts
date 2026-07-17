import { create } from 'zustand';
import { Math as PhaserMath, Utils } from 'phaser';

// Убедимся, что TypeScript знает о window.gameSounds (как в предыдущих файлах)
declare global {
  interface Window {
    gameSounds: {
      bgm: Phaser.Sound.BaseSound;
      cast: Phaser.Sound.BaseSound;
      reel: Phaser.Sound.BaseSound;
      bite: Phaser.Sound.BaseSound;
      fish_click: Phaser.Sound.BaseSound;
      muted: boolean;
    } | null;
  }
}

// --- Интерфейсы данных ---

interface FishTemplate<TWeight = [number, number]> {
  name: string;
  weight: TWeight;
  value: number;
  img: string;
}

type CaughtFish = FishTemplate<string>;

// --- Интерфейс состояния Zustand ---

interface GameState {
  // Состояние модального окна с пойманной рыбой
  showFish: boolean;
  fish: CaughtFish | null;
  showFishModal: () => void;
  closeFish: () => void;

  // Состояние мини-игры по поимке
  showFishCatching: boolean;
  catchClicks: number;
  catchTarget: number;
  fishPosition: { x: number; y: number };
  interval: ReturnType<typeof setInterval> | null; // Универсальный тип для setInterval

  // Действия мини-игры
  startFishCatching: () => void;
  clickFish: () => void;
  finishFishCatching: () => void;
}

// --- Данные ---

const fishList: FishTemplate[] = [
  { name: 'Щука', weight: [1, 3.5], value: 60, img: '/assets/fish/pike.png' },
  // Сюда можно добавлять других рыб
];

// --- Стор ---

export const useGameStore = create<GameState>((set, get) => ({
  // === Модалка с рыбой ===
  showFish: false,
  fish: null,

  showFishModal: () => {
    const randomFish = Utils.Array.GetRandom(fishList);
    
    // Явно передаем элементы кортежа, чтобы TS не ругался на spread operator
    const minWeight = randomFish.weight[0];
    const maxWeight = randomFish.weight[1];

    set({
      showFish: true,
      fish: {
        ...randomFish,
        weight: PhaserMath.FloatBetween(minWeight, maxWeight).toFixed(3)
      }
    });
  },

  closeFish: () => {
    const state = get();
    
    // Безопасность: очищаем интервал, если модалку закрыли вручную во время мини-игры
    if (state.interval) {
      clearInterval(state.interval);
    }

    set({ 
      showFish: false,
      interval: null 
    });
  },

  // === Мини-игра по поимке ===
  showFishCatching: false,
  catchClicks: 0,
  catchTarget: 8,
  fishPosition: { x: 50, y: 50 },
  interval: null,

  startFishCatching: () => {
    const currentState = get();
    
    // Безопасность: очищаем предыдущий интервал, если он вдруг остался
    if (currentState.interval) {
      clearInterval(currentState.interval);
    }

    // Создаем интервал отдельно, чтобы передать его в set
    const newInterval = setInterval(() => {
      set({
        fishPosition: {
          x: PhaserMath.Between(15, 85),
          y: PhaserMath.Between(15, 85),
        }
      });
    }, 700);

    set({
      showFishCatching: true,
      catchClicks: 0,
      fishPosition: {
        x: PhaserMath.Between(20, 80),
        y: PhaserMath.Between(20, 80),
      },
      interval: newInterval
    });
  },

  clickFish: () => {
    const state = get();
    const newClicks = state.catchClicks + 1;

    if (window.gameSounds?.fish_click && !window.gameSounds.muted) {
      window.gameSounds.fish_click.play();
    }

    if (newClicks >= state.catchTarget) {
      get().finishFishCatching();
    } else {
      set({
        catchClicks: newClicks
      });
    }
  },

  finishFishCatching: () => {
    const state = get();
    
    if (state.interval) {
      clearInterval(state.interval);
    }

    set({ 
      showFishCatching: false,
      interval: null 
    });
    
    get().showFishModal();
  }
}));