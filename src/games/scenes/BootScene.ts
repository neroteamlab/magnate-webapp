import { Scene, Sound } from 'phaser';

declare global {
    interface Window {
        gameSounds: {
            bgm: Sound.BaseSound;
            cast: Sound.BaseSound;
            reel: Sound.BaseSound;
            bite: Sound.BaseSound;
            fish_click: Sound.BaseSound;
            muted: boolean;
        } | null;
    }
}

type FisherFrameData = number | number[];

interface FisherAnimState {
    frames: Record<string, FisherFrameData>;
    frameRate: number;
    repeat: number;
}

interface FisherAnimsConfig {
    directions: string[];
    states: Record<string, FisherAnimState>;
}

export class BootScene extends Scene {
    private bgm!: Sound.BaseSound;

    constructor() {
        super('BootScene');
    }

    preload(): void {
        this.load.image('ts_water', '/assets/TS_Water.png');
        this.load.spritesheet('boat_base', '/assets/boat.png', {
            frameWidth: 128,
            frameHeight: 128
        });

        this.load.spritesheet('bobber', '/assets/bobber_float.png', {
            frameWidth: 16,
            frameHeight: 48,
            margin: 0,
            spacing: 0
        });

        this.load.spritesheet('bobber_bite', '/assets/bobber_bite.png', {
            frameWidth: 48,
            frameHeight: 48,
            margin: 0,
            spacing: 0
        });

        this.load.spritesheet('fisher', '/assets/char1_fishingrod_animation_32x32.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.spritesheet('fish_shadow', '/assets/fish_shadow.png', {
            frameWidth: 32,
            frameHeight: 32,
            margin: 0,
            spacing: 0
        });

        this.load.spritesheet('fish_appearing', '/assets/fish_appearing.png', {
            frameWidth: 32,
            frameHeight: 32,
            margin: 0,
            spacing: 0
        });

        this.load.spritesheet('fish_disappearing', '/assets/fish_disappearing.png', {
            frameWidth: 32,
            frameHeight: 32,
            margin: 0,
            spacing: 0
        });

        this.load.audio('bgm', ['/assets/audio/ambient.mp3']);
        this.load.audio('fish_click', '/assets/audio/fish_click.aac');
        this.load.audio('cast', '/assets/audio/cast.wav');
        this.load.audio('reel', '/assets/audio/reel.wav');
        this.load.audio('bite', '/assets/audio/bite.wav');
    }

    create(): void {
        if (!this.anims.exists('bobber_float')) {
            this.anims.create({
                key: 'bobber_float',
                frames: this.anims.generateFrameNumbers('bobber', { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1
            });
        }

        if (!this.anims.exists('bobber_bite')) {
            this.anims.create({
                key: 'bobber_bite',
                frames: this.anims.generateFrameNumbers('bobber_bite', { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1
            });
        }

        const fisherAnims: FisherAnimsConfig = {
            directions: ['up', 'down', 'left', 'right'],
            states: {
                idle: {
                    frames: { up: 10, down: 2, left: 6, right: 13 },
                    frameRate: 3,
                    repeat: -1
                },
                cast: {
                    frames: { up: [8, 9], down: [0, 1], left: [4, 5], right: [12, 13] },
                    frameRate: 8,
                    repeat: 0
                },
                pulling: {
                    frames: { up: 8, down: 0, left: 4, right: 12 },
                    frameRate: 8,
                    repeat: 0
                },
                fish: {
                    frames: { up: 11, down: 3, left: [6, 7], right: [13, 14] },
                    frameRate: 8,
                    repeat: 0
                }
            }
        };

        fisherAnims.directions.forEach(direction => {
            Object.entries(fisherAnims.states).forEach(([state, config]) => {
                const animKey = `fisher_${state}_${direction}`;
                const frameList = config.frames[direction];

                if (!this.anims.exists(animKey)) {
                    this.anims.create({
                        key: animKey,
                        frames: Array.isArray(frameList)
                            ? this.anims.generateFrameNumbers('fisher', {
                                start: frameList[0],
                                end: frameList[1]
                            })
                            : this.anims.generateFrameNumbers('fisher', {
                                start: frameList as number,
                                end: frameList as number
                            }),
                        frameRate: config.frameRate,
                        repeat: config.repeat
                    });
                }
            });
        });

        const directions = ['left', 'up', 'right', 'down', 'up-left', 'up-right', 'down-right', 'down-left'];

        directions.forEach((direction, colIndex) => {
            const frames: number[] = [];
            for (let row = 0; row < 4; row++) {
                frames.push(colIndex + row * 8);
            }

            const animKey = `fish_shadow_${direction}`;
            if (!this.anims.exists(animKey)) {
                this.anims.create({
                    key: animKey,
                    frames: this.anims.generateFrameNumbers('fish_shadow', {
                        frames: frames
                    }),
                    frameRate: 6,
                    repeat: -1
                });
            }
        });

        if (!this.anims.exists('fish_appear')) {
            this.anims.create({
                key: 'fish_appear',
                frames: this.anims.generateFrameNumbers('fish_appearing', {
                    start: 0,
                    end: 3
                }),
                frameRate: 10,
                repeat: 0
            });
        }

        if (!this.anims.exists('fish_disappear')) {
            this.anims.create({
                key: 'fish_disappear',
                frames: this.anims.generateFrameNumbers('fish_disappearing', {
                    start: 0,
                    end: 3
                }),
                frameRate: 10,
                repeat: 0
            });
        }

        this.bgm = this.sound.add('bgm', {
            volume: 0.8,
            loop: true,
            detune: 0
        });

        this.bgm.play();

        window.gameSounds = {
            bgm: this.bgm,
            cast: this.sound.add('cast', { volume: 0.6 }),
            reel: this.sound.add('reel', { volume: 0.6 }),
            bite: this.sound.add('bite', { volume: 0.6 }),
            fish_click: this.sound.add('fish_click', { volume: 0.6 }),
            muted: false
        };

        this.scene.start('FishingScene');
    }
}