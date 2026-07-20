import { Scene, GameObjects, Tilemaps, Tweens, Time, Input, Math as PhaserMath, Display } from 'phaser';
import { useGameStore } from '../../store/gameStore';

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

interface RodOffset {
    x: number;
    y: number;
}

interface RodFrameMap {
    [frameIndex: string]: RodOffset;
}

interface RodStateOffsets {
    idle: RodFrameMap;
    cast: RodFrameMap;
    pulling: RodFrameMap;
    fish: RodFrameMap;
}

interface RodDirectionOffsets {
    down: RodStateOffsets;
    up: RodStateOffsets;
    left: RodStateOffsets;
    right: RodStateOffsets;
}

type FishingState = 'IDLE' | 'CASTING' | 'WAITING' | 'BITE' | 'REELING' | 'CAUGHT' | 'LOST';
type Direction = 'up' | 'down' | 'left' | 'right';

export class FishingScene extends Scene {
    // --- Свойства класса с явными типами ---
    private waterEffects: GameObjects.Sprite[] = [];
    private fishingState: FishingState = 'IDLE';
    private biteTimer: Time.TimerEvent | null = null;
    private biteWindowTimer: Time.TimerEvent | null = null;
    private targetX: number = 0;
    private targetY: number = 0;
    private currentDirection: Direction = 'down';

    private fishShadows: GameObjects.Sprite[] = [];
    private maxShadows: number = 50;

    private timeOfDay: number = 25;
    private timeSpeed: number = 0.05;
    private skyRect: GameObjects.Rectangle | null = null;
    private waveLines: GameObjects.Sprite[] = [];

    private rodTipOffsets: RodDirectionOffsets;

    private groundLayer: Tilemaps.TilemapLayer | null = null;
    private boatContainer: GameObjects.Container | null = null;
    private boat: GameObjects.Sprite | null = null;
    private fisherContainer: GameObjects.Container | null = null;
    private fisher: GameObjects.Sprite | null = null;
    private bobber: GameObjects.Sprite | null = null;
    private line: GameObjects.Graphics | null = null;
    private debugRodTip: GameObjects.Rectangle | null = null;

    private shadowSpawnTimer: Time.TimerEvent | null = null;
    private timeCycleEvent: Time.TimerEvent | null = null;
    private boatBobTween: Tweens.Tween | null = null;

    private currentAnimKey: string = '';
    private currentFrameIndex: number = 0;
    private debugAnimName: string = 'idle';
    private debugFrameIndex: number = 0;

    constructor() {
        super('FishingScene');

        this.rodTipOffsets = {
            down: {
                idle: { '0': { x: -7, y: 20 } },
                cast: { '0': { x: -5, y: -25 }, '1': { x: -5, y: 25 } },
                pulling: { '0': { x: -5, y: -25 } },
                fish: { '0': { x: -5, y: -22 } },
            },
            up: {
                idle: { '0': { x: 5, y: -25 } },
                cast: { '0': { x: 20, y: -13 }, '1': { x: 5, y: -25 } },
                pulling: { '0': { x: 20, y: -13 } },
                fish: { '0': { x: 8, y: -25 } },
            },
            left: {
                idle: { '0': { x: -28, y: -2 } },
                cast: { '0': { x: 23, y: -16 }, '1': { x: -28, y: 6 } },
                pulling: { '0': { x: 23, y: -16 } },
                fish: { '0': { x: -28, y: -2 } },
            },
            right: {
                idle: { '0': { x: 30, y: 5 } },
                cast: { '0': { x: -25, y: -13 }, '1': { x: 30, y: 5 } },
                pulling: { '0': { x: -25, y: -13 } },
                fish: { '0': { x: 30, y: 5 } },
            }
        };
    }

    create(): void {
        const width = this.scale.width;
        const height = this.scale.height;
        const TILE_SIZE = 16;
        const cols = Math.ceil(width / TILE_SIZE);
        const rows = Math.ceil(height / TILE_SIZE);

        this.waterEffects = [];

        const map = this.make.tilemap({
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE,
            width: cols,
            height: rows
        });

        const tileset = map.addTilesetImage('ts_water', 'ts_water', TILE_SIZE, TILE_SIZE);

        if (!tileset) {
            console.error('Тайлсет TS_Water не найден!');
            return;
        }

        this.groundLayer = map.createBlankLayer('Ground', tileset);

        if (this.groundLayer) {
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    this.groundLayer.putTileAt(11, x, y);
                }
            }
        }

        this.startTimeCycle();

        const boatX = Math.floor(width / 2);
        const boatY = Math.floor(height / 2);

        this.boatContainer = this.add.container(boatX, boatY);
        this.boat = this.add.sprite(0, 8, 'boat_base', 2);
        this.boat.setScale(2);

        this.fisherContainer = this.add.container(0, -12);
        this.fisher = this.add.sprite(0, 0, 'fisher', 8);
        this.fisher.setScale(2);
        this.fisher.play('fisher_idle_down');

        this.fisher.on('animationupdate', (animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
            this.currentAnimKey = animation.key;
            this.currentFrameIndex = frame.index;
        });

        this.fisherContainer.add(this.fisher);
        this.boatContainer.add([this.boat, this.fisherContainer]);
        this.boatContainer.setDepth(10);

        this.createLongWaves();

        const rodPos = this.getRodWorldPosition();
        this.bobber = this.add.sprite(rodPos.x, rodPos.y, 'bobber', 0);
        this.bobber.setScale(1);
        this.bobber.setVisible(false);
        this.bobber.setDepth(100);

        this.line = this.add.graphics().setVisible(false).setDepth(200);
        this.debugRodTip = this.add.rectangle(0, 0, 6, 6, 0xff0000).setVisible(false).setDepth(999);

        this.shadowSpawnTimer = this.time.addEvent({
            delay: PhaserMath.Between(3000, 6000),
            callback: () => {
                const rand = Math.random();
                let schoolSize = 1;
                if (rand < 0.50) {
                    schoolSize = PhaserMath.Between(1, 3);
                } else if (rand < 0.80) {
                    schoolSize = PhaserMath.Between(3, 5);
                } else {
                    schoolSize = PhaserMath.Between(8, 18);
                }

                this.spawnFishSchool(schoolSize);
            },
            loop: true
        });

        this.input.on('pointerdown', (pointer: Input.Pointer) => this.handleInput(pointer));

        this.notifyUI('Нажмите, чтобы забросить');
    }

    createLongWaves(): void {
        const width = this.scale.width;
        const height = this.scale.height;
        const waveCount = 20;

        for (let i = 0; i < waveCount; i++) {
            const graphics = this.add.graphics();
            graphics.lineStyle(2, 0xffffff, 0.3);

            const startX = PhaserMath.Between(0, width);
            const startY = PhaserMath.Between(0, height);
            const length = PhaserMath.Between(30, 80);
            const angle = PhaserMath.FloatBetween(-0.1, 0.1);

            graphics.lineBetween(0, 0, length, 0);
            graphics.generateTexture(`wave_line_${i}`, length, 4);
            graphics.destroy();

            const wave = this.add.sprite(startX, startY, `wave_line_${i}`);
            wave.setDepth(3);
            wave.setAlpha(0.3);
            wave.setRotation(angle);

            this.waveLines.push(wave);

            this.tweens.add({
                targets: wave,
                x: wave.x + 100,
                alpha: 0,
                duration: PhaserMath.Between(3000, 6000),
                delay: PhaserMath.Between(0, 3000),
                ease: 'Linear',
                onComplete: () => {
                    wave.x = PhaserMath.Between(0, width);
                    wave.y = PhaserMath.Between(0, height);
                    wave.alpha = 0.3;

                    this.tweens.add({
                        targets: wave,
                        x: wave.x + 100,
                        alpha: 0,
                        duration: PhaserMath.Between(3000, 6000),
                        ease: 'Linear',
                        repeat: -1
                    });
                }
            });
        }
    }

    startTimeCycle(): void {
        this.timeCycleEvent = this.time.addEvent({
            delay: 100,
            callback: () => {
                this.timeOfDay += this.timeSpeed;
                if (this.timeOfDay >= 100) {
                    this.timeOfDay = 0;
                }
                this.updateDayNightCycle();
            },
            loop: true
        });
    }

    updateDayNightCycle(): void {
        type ColorRGB = { r: number; g: number; b: number };

        let skyColor: ColorRGB;
        let waterColor: ColorRGB;
        let ambientLight: number;

        if (this.timeOfDay < 25) {
            const progress = this.timeOfDay / 25;
            skyColor = Display.Color.Interpolate.ColorWithColor(
                new Display.Color(60, 70, 100),
                new Display.Color(255, 200, 150),
                100,
                progress * 100
            );
            waterColor = Display.Color.Interpolate.ColorWithColor(
                new Display.Color(80, 100, 140),
                new Display.Color(140, 180, 220),
                100,
                progress * 100
            );
            ambientLight = 0.5 + (progress * 0.3);
        } else if (this.timeOfDay < 50) {
            const progress = (this.timeOfDay - 25) / 25;
            skyColor = Display.Color.Interpolate.ColorWithColor(
                new Display.Color(255, 200, 150),
                new Display.Color(180, 220, 250),
                100,
                progress * 100
            );
            waterColor = Display.Color.Interpolate.ColorWithColor(
                new Display.Color(140, 180, 220),
                new Display.Color(100, 160, 210),
                100,
                progress * 100
            );
            ambientLight = 0.8 + (progress * 0.2);
        } else if (this.timeOfDay < 75) {
            const progress = (this.timeOfDay - 50) / 25;
            skyColor = Display.Color.Interpolate.ColorWithColor(
                new Display.Color(180, 220, 250),
                new Display.Color(255, 180, 120),
                100,
                progress * 100
            );
            waterColor = Display.Color.Interpolate.ColorWithColor(
                new Display.Color(100, 160, 210),
                new Display.Color(180, 140, 160),
                100,
                progress * 100
            );
            ambientLight = 1.0 - (progress * 0.15);
        } else {
            const progress = (this.timeOfDay - 75) / 25;
            skyColor = Display.Color.Interpolate.ColorWithColor(
                new Display.Color(255, 180, 120),
                new Display.Color(60, 70, 100),
                100,
                progress * 100
            );
            waterColor = Display.Color.Interpolate.ColorWithColor(
                new Display.Color(180, 140, 160),
                new Display.Color(80, 100, 140),
                100,
                progress * 100
            );
            ambientLight = 0.85 - (progress * 0.35);
        }

        const waterTint = Display.Color.GetColor(
            Math.floor(waterColor.r),
            Math.floor(waterColor.g),
            Math.floor(waterColor.b)
        );

        if (this.groundLayer) {
            this.groundLayer.setTint(waterTint);
        }

        this.waveLines.forEach(wave => {
            wave.setAlpha(0.3 * ambientLight);
        });
    }

    getRandomEdgePoint(edge: 'top' | 'bottom' | 'left' | 'right'): { x: number; y: number } {
        const width = this.scale.width;
        const height = this.scale.height;

        switch (edge) {
            case 'top': return { x: PhaserMath.Between(0, width), y: 0 };
            case 'bottom': return { x: PhaserMath.Between(0, width), y: height };
            case 'left': return { x: 0, y: PhaserMath.Between(0, height) };
            case 'right':
            default:
                return { x: width, y: PhaserMath.Between(0, height) };
        }
    }

    spawnFishSchool(size: number): void {
        const edges: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];
        const startEdge = PhaserMath.RND.pick(edges);
        const availableEndEdges = edges.filter(e => e !== startEdge);
        const endEdge = PhaserMath.RND.pick(availableEndEdges);

        const startPoint = this.getRandomEdgePoint(startEdge);
        const endPoint = this.getRandomEdgePoint(endEdge);

        for (let i = 0; i < size; i++) {
            const spread = 20;
            const offsetX = PhaserMath.Between(-spread, spread);
            const offsetY = PhaserMath.Between(-spread, spread);
            const speedMod = PhaserMath.FloatBetween(0.7, 1.7);

            const startX = startPoint.x + offsetX;
            const startY = startPoint.y + offsetY;

            const targetX = endPoint.x + offsetX;
            const targetY = endPoint.y + offsetY;

            this.createSingleFishShadow(startX, startY, targetX, targetY, speedMod);
        }
    }

    createSingleFishShadow(startX: number, startY: number, targetX: number, targetY: number, speedMod: number): void {
        if (this.fishShadows.length >= this.maxShadows) return;

        const angle = PhaserMath.Angle.Between(startX, startY, targetX, targetY);
        const degrees = PhaserMath.RadToDeg(angle);

        let direction = 'right';
        if (degrees >= -157.5 && degrees < -112.5) direction = 'up-left';
        else if (degrees >= -112.5 && degrees < -67.5) direction = 'up';
        else if (degrees >= -67.5 && degrees < -22.5) direction = 'up-right';
        else if (degrees >= -22.5 && degrees < 22.5) direction = 'right';
        else if (degrees >= 22.5 && degrees < 67.5) direction = 'down-right';
        else if (degrees >= 67.5 && degrees < 112.5) direction = 'down';
        else if (degrees >= 112.5 && degrees < 157.5) direction = 'down-left';
        else direction = 'left';

        const shadow = this.add.sprite(startX, startY, 'fish_shadow', 0);
        shadow.setDepth(2);
        shadow.setAlpha(0);
        shadow.setScale(1.2 + Math.random() * 0.6);

        this.fishShadows.push(shadow);
        shadow.play('fish_appear');

        const baseSpeed = 20;
        const distance = PhaserMath.Distance.Between(startX, startY, targetX, targetY);
        const duration = (distance / (baseSpeed * speedMod)) * 1000;

        this.tweens.add({
            targets: shadow,
            alpha: 0.6,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                const animKey = `fish_shadow_${direction}`;
                if (this.anims.exists(animKey)) {
                    shadow.play(animKey);
                }

                this.tweens.add({
                    targets: shadow,
                    x: targetX,
                    y: targetY,
                    duration: duration,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        shadow.play('fish_disappear');
                        this.tweens.add({
                            targets: shadow,
                            alpha: 0,
                            duration: 600,
                            ease: 'Power2',
                            onComplete: () => {
                                shadow.destroy();
                                const idx = this.fishShadows.indexOf(shadow);
                                if (idx > -1) this.fishShadows.splice(idx, 1);
                            }
                        });
                    }
                });
            }
        });
    }

    getRodWorldPosition(): { x: number; y: number } {
        let offset: RodOffset;

        let animName: keyof RodStateOffsets = 'idle';
        if (this.fishingState === 'CASTING') animName = 'cast';
        else if (this.fishingState === 'REELING') animName = 'pulling';
        else if (this.fishingState === 'CAUGHT') animName = 'fish';

        const dirOffsets = this.rodTipOffsets[this.currentDirection] || this.rodTipOffsets.down;
        const animOffsets = dirOffsets[animName] || dirOffsets.idle;

        let currentFrame = 0;
        if (this.fisher?.anims?.currentFrame) {
            currentFrame = this.fisher.anims.currentFrame.index;
        }

        // Защита от отрицательных индексов фреймов
        const frameKey = Math.max(0, currentFrame).toString();
        offset = animOffsets[frameKey] || animOffsets['0'];

        return {
            x: (this.boatContainer?.x || 0) + offset.x,
            y: ((this.boatContainer?.y || 0) - 12) + offset.y
        };
    }

    getOffsetForDebug(): RodOffset {
        const dirOffsets = this.rodTipOffsets[this.currentDirection] || this.rodTipOffsets.down;
        const animOffsets = dirOffsets[this.debugAnimName as keyof RodStateOffsets] || dirOffsets.idle;
        return animOffsets[this.debugFrameIndex.toString()] || animOffsets['0'];
    }

    handleInput(pointer: Input.Pointer): void {
        console.log('x y', pointer.x, pointer.y);
        switch (this.fishingState) {
            case 'IDLE':
                this.targetX = pointer.x;
                this.targetY = pointer.y;
                this.currentDirection = this.getDirection(pointer);
                this.startCasting();
                break;
            case 'BITE':
                this.startReeling();
                break;
            case 'CAUGHT':
            case 'LOST':
                this.reset();
                break;
        }
    }

    getDirection(pointer: Input.Pointer): Direction {
        const angle = PhaserMath.Angle.Between(this.boatContainer?.x || 0, this.boatContainer?.y || 0, pointer.x, pointer.y);
        const degrees = PhaserMath.RadToDeg(angle);

        if (degrees >= -45 && degrees < 45) return 'right';
        else if (degrees >= 45 && degrees < 135) return 'down';
        else if (degrees >= 135 || degrees < -135) return 'left';
        else return 'up';
    }

    playFisherAnimation(state: keyof RodStateOffsets): void {
        const animKey = `fisher_${state}_${this.currentDirection}`;
        if (this.anims.exists(animKey) && this.fisher) {
            this.fisher.play(animKey);
        }
    }

    startCasting(): void {
        this.fishingState = 'CASTING';
        this.playFisherAnimation('cast');
        if (window.gameSounds?.cast) window.gameSounds.cast.play();
        useGameStore.getState().castFishingRod();

        if (this.bobber) {
            this.bobber.setVisible(true);
        }
        if (this.line) {
            this.line.setVisible(true);
        }

        const rodPos = this.getRodWorldPosition();
        if (this.bobber) {
            this.bobber.setPosition(rodPos.x, rodPos.y);
            this.bobber.play('bobber_float');
        }

        const maxDistance = 120;
        const dx = this.targetX - rodPos.x;
        const dy = this.targetY - rodPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let finalX = this.targetX;
        let finalY = this.targetY;

        if (distance > maxDistance) {
            finalX = rodPos.x + (dx / distance) * maxDistance;
            finalY = rodPos.y + (dy / distance) * maxDistance;
        }

        if (this.bobber) {
            this.tweens.add({
                targets: this.bobber,
                x: finalX,
                y: finalY,
                duration: 600,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    this.playFisherAnimation('idle');
                    this.fishingState = 'WAITING';
                    this.notifyUI('Ждём клёва...');
                    this.scheduleBite();
                }
            });
        }
    }

    scheduleBite(): void {
        const castTime = useGameStore.getState().fishingState?.castTime;
        if (!castTime) return this.reset();
        const delay = castTime.getTime() - new Date().getTime();
        this.biteTimer = this.time.delayedCall(delay, () => this.onBite());
    }

    onBite(): void {
        if (this.fishingState !== 'WAITING') return;
        if (window.gameSounds?.bite) window.gameSounds.bite.play();

        if (this.bobber) {
            this.bobber.play('bobber_bite');
        }
        this.fishingState = 'BITE';

        if (this.bobber) {
            this.tweens.add({
                targets: this.bobber,
                y: this.bobber.y + 10,
                duration: 100,
                yoyo: true,
                repeat: 6
            });
        }

        this.notifyUI('КЛЮЁТ! Жми!');

        this.biteWindowTimer = this.time.delayedCall(2000, () => {
            if (this.fishingState === 'BITE') {
                this.fishingState = 'LOST';
                this.notifyUI('Рыба ушла...');
                this.reset();
            }
        });
    }

    startReeling(): void {
        if (this.biteWindowTimer) this.biteWindowTimer.remove();
        this.fishingState = 'REELING';
        this.playFisherAnimation('pulling');
        if (window.gameSounds?.reel) window.gameSounds.reel.play();

        const rodPos = this.getRodWorldPosition();

        if (this.bobber) {
            this.tweens.add({
                targets: this.bobber,
                x: rodPos.x,
                y: rodPos.y,
                duration: 1500,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    this.fishingState = 'CAUGHT';
                    this.showCaughtFish();
                }
            });
        }
    }

    showCaughtFish(): void {
        this.playFisherAnimation('fish');
        if (window.gameSounds?.fish_click) window.gameSounds.fish_click.play();

        useGameStore.getState().startFishCatching();
        this.reset();
    }

    reset(): void {
        this.fishingState = 'IDLE';
        if (window.gameSounds?.bite) window.gameSounds.bite.stop();
        this.playFisherAnimation('idle');

        if (this.bobber) this.bobber.setVisible(false);
        if (this.line) this.line.setVisible(false);

        if (this.biteTimer) this.biteTimer.remove();
    }

    update(): void {
        if (this.debugRodTip) {
            const pos = this.getRodWorldPosition();
            this.debugRodTip.setPosition(pos.x, pos.y);
        }

        if (this.line?.visible && this.bobber?.visible) {
            this.line.clear();
            this.line.lineStyle(1.5, 0xffffff, 0.6);
            const rodPos = this.getRodWorldPosition();
            this.line.lineBetween(rodPos.x, rodPos.y, this.bobber.x, this.bobber.y);
        }
    }

    notifyUI(message: string): void {
        // toast(message, { autoClose: 1500 });
    }

    shutdown(): void {
        if (this.biteTimer) this.biteTimer.remove();
        if (this.biteWindowTimer) this.biteWindowTimer.remove();
        if (this.boatBobTween) this.boatBobTween.stop();
        if (this.shadowSpawnTimer) this.shadowSpawnTimer.remove();
        if (this.timeCycleEvent) this.timeCycleEvent.remove();

        this.fishShadows.forEach(s => s.destroy());
        this.fishShadows = [];

        this.waveLines.forEach(w => w.destroy());
        this.waveLines = [];

        this.waterEffects.forEach(sprite => sprite.destroy());
        this.waterEffects = [];
    }
}