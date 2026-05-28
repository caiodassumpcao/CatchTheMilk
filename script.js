const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const scoreDisplay = document.getElementById('score-display');
const scoreSpan = scoreDisplay.querySelector('span');

let GAME_WIDTH = window.innerWidth;
let GAME_HEIGHT = window.innerHeight;

// Utility to load images with fallback
function loadImage(src) {
    const img = new Image();
    img.src = src;
    img.hasLoaded = false;
    img.onload = () => { img.hasLoaded = true; };
    img.onerror = () => { img.hasLoaded = false; };
    return img;
}

const playerImg1 = loadImage('sprites/player1.png');
const playerImg2 = loadImage('sprites/player2.png');
const itemImg = loadImage('sprites/item.png');

let score = 0;
let isRunning = false;
let animationFrameId;

// Input handling
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    a: false,
    d: false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// Resize handling
window.addEventListener('resize', () => {
    GAME_WIDTH = window.innerWidth;
    GAME_HEIGHT = window.innerHeight;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    if (player) {
        // Keep player at the bottom when resizing
        player.y = GAME_HEIGHT - player.height;
    }
});

class Player {
    constructor() {
        this.width =128;
        this.height = 128;
        this.x = GAME_WIDTH / 2 - this.width / 2;
        this.y = GAME_HEIGHT - this.height - 20;
        this.speed = 8;
        this.frameCounter = 0;
        this.isMoving = false;
        this.currentFrame = 1;
    }

    update() {
        this.isMoving = false;
        if (keys.ArrowLeft || keys.a) {
            this.x -= this.speed;
            this.isMoving = true;
        }
        if (keys.ArrowRight || keys.d) {
            this.x += this.speed;
            this.isMoving = true;
        }

        // Screen constraints
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > GAME_WIDTH) this.x = GAME_WIDTH - this.width;

        // Animation
        if (this.isMoving) {
            this.frameCounter++;
            if (this.frameCounter > 10) { // change frame every 10 ticks
                this.currentFrame = this.currentFrame === 1 ? 2 : 1;
                this.frameCounter = 0;
            }
        } else {
            this.currentFrame = 1;
            this.frameCounter = 0;
        }
    }

    draw(ctx) {
        let img = this.currentFrame === 1 ? playerImg1 : playerImg2;
        if (img.hasLoaded) {
            ctx.drawImage(img, this.x, this.y, this.width, this.height);
        } else {
            // Fallback shape if image missing or blocked by CORS locally
            ctx.fillStyle = this.currentFrame === 1 ? '#00ff00' : '#00aa00';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x + 20, this.y + 20, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x + 44, this.y + 20, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Item {
    constructor() {
        this.width = 128;
        this.height = 128;
        this.x = Math.random() * (GAME_WIDTH - this.width);
        this.y = -this.height;
        this.speed = 5;
        this.markedForDeletion = false;
    }

    update() {
        this.y += this.speed;
        if (this.y > GAME_HEIGHT) {
            this.markedForDeletion = true; // Delete when it falls off screen
        }
    }

    draw(ctx) {
        if (itemImg.hasLoaded) {
            ctx.drawImage(itemImg, this.x, this.y, this.width, this.height);
        } else {
            // Fallback shape
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

let player;
let items = [];
let frameCount = 0;
const ITEM_SPAWN_RATE = 30; // spawn an item every 30 frames

function init() {
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    player = new Player();
    items = [];
    score = 0;
    scoreSpan.innerText = score;
    frameCount = 0;
}

function checkCollisions(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function gameLoop() {
    if (!isRunning) return;

    // Clear background
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Update & draw player
    player.update();
    player.draw(ctx);

    // Spawn items
    frameCount++;
    if (frameCount >= ITEM_SPAWN_RATE) {
        items.push(new Item());
        frameCount = 0;
    }

    // Update & draw items
    items.forEach(item => {
        item.update();
        item.draw(ctx);

        // Check collision
        if (checkCollisions(player, item)) {
            item.markedForDeletion = true;
            score += 10;
            scoreSpan.innerText = score;
        }
    });

    // Remove deleted items
    items = items.filter(item => !item.markedForDeletion);

    // Next frame
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Start button click
startBtn.addEventListener('click', () => {
    // Request fullscreen (needs user interaction to work in browsers)
    const docElm = document.documentElement;
    if (docElm.requestFullscreen) {
        docElm.requestFullscreen().catch(err => console.log("Fullscreen failed", err));
    } else if (docElm.webkitRequestFullScreen) {
        docElm.webkitRequestFullScreen();
    } else if (docElm.mozRequestFullScreen) {
        docElm.mozRequestFullScreen();
    } else if (docElm.msRequestFullscreen) {
        docElm.msRequestFullscreen();
    }

    startScreen.style.display = 'none';
    canvas.style.display = 'block';
    scoreDisplay.style.display = 'block';
    isRunning = true;
    init();
    gameLoop();
});

// Handle exiting fullscreen gracefully
function exitHandler() {
    if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
        startScreen.style.display = 'block';
        canvas.style.display = 'none';
        scoreDisplay.style.display = 'none';
    }
}

document.addEventListener('fullscreenchange', exitHandler);
document.addEventListener('webkitfullscreenchange', exitHandler);
document.addEventListener('mozfullscreenchange', exitHandler);
document.addEventListener('MSFullscreenChange', exitHandler);
