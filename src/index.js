import Phaser from 'phaser';
import GameScene from './game/scenes/GameScene';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.NONE,         // 改为 NONE 模式
        width: '100%',
        height: '100%',
        parent: 'game'
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: GameScene
};

new Phaser.Game(config);