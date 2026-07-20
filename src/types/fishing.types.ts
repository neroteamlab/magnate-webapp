export interface FishingState {
    id: number,
    seed: number,
    clicksCount: number,
    castTime: Date,
    finishTime: Date
};

export interface Click {
    time: Date,
    x: number,
    y: number
};

export interface ClickList {
    id: number,
    clicks: Click[]
};