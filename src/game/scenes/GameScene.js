import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.score = 0;
        this.gameTime = 300;
        this.waveInterval = 7;
        this.baseEnemyCount = 5;
        this.waveCount = 0;
        this.treasureTypes = ['C-RUN', 'C-STAT', 'EW', 'BX', 'FuSa', 'eTrust', 'VS'];
        this.treasureImages = {
            'C-RUN': 'JewelBlue',
            'C-STAT': 'JewelBrown',
            'EW': 'JewelGreen',
            'BX': 'JewelOrange',
            'FuSa': 'JewelRed',
            'eTrust': 'JewelViolet',
            'VS': 'JewelWhite'
        };
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
        
        // 加载所有宝石图片
        this.load.image('JewelBlue', 'assets/JewelBlue.png');
        this.load.image('JewelBrown', 'assets/JewelBrown.png');
        this.load.image('JewelGreen', 'assets/JewelGreen.png');
        this.load.image('JewelOrange', 'assets/JewelOrange.png');
        this.load.image('JewelRed', 'assets/JewelRed.png');
        this.load.image('JewelViolet', 'assets/JewelViolet.png');
        this.load.image('JewelWhite', 'assets/JewelWhite.png');
    }

    spawnTreasure() {
        const x = Phaser.Math.Between(50, 750);
        const type = this.treasureTypes[Phaser.Math.Between(0, this.treasureTypes.length - 1)];
        const imageKey = this.treasureImages[type];
        
        const treasure = this.treasures.create(x, 0, imageKey);
        treasure.setScale(0.1);
        treasure.type = type;
        
        // 设置宝箱的碰撞体积
        treasure.body.setSize(treasure.width * 0.8, treasure.height * 0.8);
        
        // 在宝石上方显示类型文本
        const text = this.add.text(x, -20, type, {
            fontSize: '16px',
            fill: '#fff'
        }).setOrigin(0.5);
        
        // 让文本跟随宝石移动
        treasure.textLabel = text;
        
        // 更新时同步文本位置
        treasure.update = function() {
            this.textLabel.x = this.x;
            this.textLabel.y = this.y - 20;
        };
    }
    create() {
        // 创建玩家飞机
        this.player = this.add.sprite(400, 550, 'player');
        this.player.setInteractive();
        this.input.setDraggable(this.player);
        
        // 启用玩家飞机的物理系统
        this.physics.add.existing(this.player);
        this.player.body.setSize(this.player.width * 0.8, this.player.height * 0.8); // 添加这行，设置碰撞体积

        // 修改状态显示的字体大小和添加速度显示
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '22px', fill: '#fff' });
        this.timeText = this.add.text(16, 46, 'Time: 300', { fontSize: '22px', fill: '#fff' });
        this.speedText = this.add.text(16, 76, 'Speed: LOW', { fontSize: '22px', fill: '#fff' });
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

        // 每7秒生成一波敌人
        this.time.addEvent({
            delay: 7000,
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

        // 创建宝箱组 - 移到这里
        this.treasures = this.physics.add.group();

        // 设置碰撞检测
        this.physics.add.collider(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.gameOver, null, this);
        this.physics.add.overlap(this.player, this.treasures, this.collectTreasure, null, this);

        // 立即生成第一波敌机
        this.spawnEnemyWave();

        // 每5秒生成一个宝箱
        this.time.addEvent({
            delay: 5000,
            callback: this.spawnTreasure,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        // 更新子弹位置
        this.bullets.children.each((bullet) => {
            bullet.y -= 7.5;  // 从5提升到7.5，提速50%
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

        // 更新宝箱位置
        this.treasures.children.each((treasure) => {
            treasure.y += 2.2; // 敌机速度的1.1倍
            if (treasure.y > 600) {
                treasure.destroy();
            }
        });
    }

    spawnEnemyWave() {
        this.waveCount++;
        // 计算当前波次的敌机数量（每波增加20%）
        const enemyCount = Math.floor(this.baseEnemyCount * Math.pow(1.2, this.waveCount - 1));
        
        const enemiesPerRow = 8; // 每排8架敌机
        const rows = Math.ceil(enemyCount / enemiesPerRow); // 计算需要多少排
        const minSpacing = 60; // 最小间距
        
        for (let row = 0; row < rows; row++) {
            const enemiesInThisRow = Math.min(enemiesPerRow, enemyCount - row * enemiesPerRow);
            let lastX = 50; // 起始位置
            
            for (let col = 0; col < enemiesInThisRow; col++) {
                // 在最小间距基础上添加随机间距
                const spacing = minSpacing + Phaser.Math.Between(0, 40);
                const x = lastX + spacing;
                const y = row * 60; // 每排之间的垂直间距
                
                // 确保不超出屏幕右边界
                if (x < 750) {
                    const enemy = this.enemies.create(x, y, 'enemy');
                    enemy.setScale(0.8);
                    lastX = x; // 更新上一个敌机的位置
                }
            }
        }
    }
    fireBullet() {
        const fireChance = this.hasEWBoost ? 0.6 : 0.4; // EW加速后80%概率发射，否则60%概率发射
        if (Math.random() < fireChance) {
            const bullet = this.bullets.create(this.player.x, this.player.y - 20, 'bullet');
        }
    }

    collectTreasure(player, treasure) {
        console.log('Treasure collected:', treasure);
        
        // 处理 EW 宝箱效果
        if (treasure.type === 'EW' && !this.hasEWBoost) {
            this.hasEWBoost = true;
            this.speedText.setText('Speed: MID');  // 添加这行，更新速度显示
        }
        
        // 销毁宝箱文本标签
        if (treasure.textLabel) {
            treasure.textLabel.destroy();
        }
        // 销毁宝箱
        treasure.destroy();
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
    // 添加收集宝箱的方法
    collectTreasure(player, treasure) {
        console.log('Treasure collected:', treasure);
        // 销毁宝箱文本标签
        if (treasure.textLabel) {
            treasure.textLabel.destroy();
        }
        // 销毁宝箱
        treasure.destroy();
    }
}