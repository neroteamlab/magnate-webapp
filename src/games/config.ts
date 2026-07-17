import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { FishingScene } from './scenes/FishingScene';

export const gameConfig = {
    type: Phaser.AUTO,
    width: 180,
    height: 320,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    backgroundColor: '#1e3d59',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
    },
    scene: [BootScene, FishingScene],
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
};