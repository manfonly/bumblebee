import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.score = 0;
        this.gameTime = 300; // 总游戏时间300秒
        this.waveInterval = 10; // 每10秒一波敌人
        this.baseEnemyCount = 5; // 初始敌机数量
        this.waveCount = 0; // 波数计数
    }

    preload() {
        // 加载游戏资源
        this.load.image('player', 'assets/player.png');
        this.load.image('enemy', 'assets/enemy.png');
        this.load.image('bullet', 'assets/bullet.png');
        
        // 修改爆炸图片的加载方式
        this.load.spritesheet('explosion', 'assets/explosion.png', {
            frameWidth: 341,   // 1024/3 ≈ 341
            frameHeight: 341,  // 1024/3 ≈ 341
            startFrame: 0,
            endFrame: 8        // 9帧动画
        });
    }
    create() {
        // 创建玩家飞机
        this.player = this.add.sprite(400, 550, 'player');
        this.player.setInteractive();
        this.input.setDraggable(this.player);
        
        // 启用玩家飞机的物理系统
        this.physics.add.existing(this.player);

        // 创建分数显示
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });
        this.timeText = this.add.text(16, 56, 'Time: 300', { fontSize: '32px', fill: '#fff' });

        // 设置拖动事件
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        // 创建子弹组
        this.bullets = this.physics.add.group();
        
        // 创建敌人组
        this.enemies = this.physics.add.group();

        // 设置定时器
        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        // 每10秒生成一波敌人
        this.time.addEvent({
            delay: 10000,
            callback: this.spawnEnemyWave,
            callbackScope: this,
            loop: true
        });

        // 设置自动发射子弹
        this.time.addEvent({
            delay: 200,
            callback: this.fireBullet,
            callbackScope: this,
            loop: true
        });

        // 添加爆炸动画配置
        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explosion', {
                start: 0,
                end: 8
            }),
            frameRate: 20,     // 动画播放速度
            repeat: 0          // 播放一次就停止
        });

        // 设置碰撞检测
        this.physics.add.collider(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.gameOver, null, this);  // 使用 overlap 替代 collider

        // 立即生成第一波敌机
        this.spawnEnemyWave();
    }

    update() {
        // 更新子弹位置
        this.bullets.children.each((bullet) => {
            bullet.y -= 5;
            if (bullet.y < 0) {
                bullet.destroy();
            }
        });

        // 更新敌人位置
        this.enemies.children.each((enemy) => {
            enemy.y += 2;
            if (enemy.y > 600) {
                enemy.destroy();
            }
        });
    }

    spawnEnemyWave() {
        this.waveCount++;
        // 计算当前波次的敌机数量（每波增加20%）
        const enemyCount = Math.floor(this.baseEnemyCount * Math.pow(1.2, this.waveCount - 1));
        
        for (let i = 0; i < enemyCount; i++) {
            const x = Phaser.Math.Between(50, 750);
            const enemy = this.enemies.create(x, 0, 'enemy');
            enemy.setScale(0.8);
        }
    }

    fireBullet() {
        const bullet = this.bullets.create(this.player.x, this.player.y - 20, 'bullet');
    }

    hitEnemy(bullet, enemy) {
        bullet.destroy();
        
        // 在敌机位置创建爆炸动画
        const explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
        explosion.play('explode');
        
        // 动画播放完成后销毁
        explosion.on('animationcomplete', () => {
            explosion.destroy();
        });
        
        enemy.destroy();
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
    }

    updateTimer() {
        this.gameTime--;
        this.timeText.setText('Time: ' + this.gameTime);
        if (this.gameTime <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        // 在玩家飞机位置创建爆炸动画
        const explosion = this.add.sprite(this.player.x, this.player.y, 'explosion');
        explosion.play('explode');
        
        // 隐藏玩家飞机
        this.player.setVisible(false);
        
        // 等待爆炸动画完成后显示游戏结算界面
        explosion.on('animationcomplete', () => {
            explosion.destroy();
            this.scene.pause();
            
            // 创建半透明黑色背景
            const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
            
            // 显示游戏结束文本
            this.add.text(400, 250, 'Game Over', {
                fontSize: '64px',
                fill: '#fff',
                align: 'center'
            }).setOrigin(0.5);
            
            // 显示最终得分
            this.add.text(400, 350, `Final Score: ${this.score}`, {
                fontSize: '48px',
                fill: '#fff',
                align: 'center'
            }).setOrigin(0.5);
        });
    }
}