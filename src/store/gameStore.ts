import { create } from 'zustand';
import { Math as PhaserMath, Utils } from 'phaser';
import { startFishing } from '../api/fishingApi';

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

interface FishTemplate<TWeight = [number, number]> {
  name: string;
  weight: TWeight;
  value: number;
  img: string;
}

type CaughtFish = FishTemplate<string>;


interface GameState {
  showFish: boolean;
  fish: CaughtFish | null;
  showFishModal: () => void;
  closeFish: () => void;

  // Состояние мини-игры по поимке

  showFishCatching: boolean;
  catchClicks: number;
  catchTarget: number;
  fishPosition: { x: number; y: number };
  interval: ReturnType<typeof setInterval> | null;

  // api 
  castFishingRod: () => void;
  fishingState: {
    id: number;
    seed: number;
    finishTime: Date;
    castTime: Date
  } | null;

  // Действия мини-игры
  startFishCatching: () => void;
  clickFish: () => void;
  finishFishCatching: () => void;
}


const fishList: FishTemplate[] = [
  { name: 'Щука', weight: [1, 3.5], value: 60, img: '/assets/fish/pike.png' },

];

export const useGameStore = create<GameState>((set, get) => ({
  fishingState: null,
  showFish: false,
  fish: null,

  castFishingRod: async () => {
    const data = await startFishing();
    set({
      fishingState: {
        id: data.id,
        seed: data.seed,
        finishTime: data.finishTime,
        castTime: data.castTime
      },
      catchTarget: data.clicksCount
    });
  },

  showFishModal: () => {
    const randomFish = Utils.Array.GetRandom(fishList);

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

    if (state.interval) {
      clearInterval(state.interval);
    }

    set({
      showFish: false,
      interval: null
    });
  },

  showFishCatching: false,
  catchClicks: 0,
  catchTarget: 8,
  fishPosition: { x: 50, y: 50 },
  interval: null,

  startFishCatching: () => {
    const currentState = get();

    if (currentState.interval) {
      clearInterval(currentState.interval);
    }

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