// Impostazioni di base
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const baseWidth = 1280;
const baseHeight = 720; 

canvas.width = baseWidth;
canvas.height = baseHeight;

function resizeCanvas() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (windowWidth >= baseWidth && windowHeight >= baseHeight) {
        canvas.style.width = `${baseWidth}px`;
        canvas.style.height = `${baseHeight}px`;
    } else {
        const scaleX = windowWidth / baseWidth;
        const scaleY = windowHeight / baseHeight;
        const scale = Math.min(scaleX, scaleY);

        canvas.style.width = `${baseWidth * scale}px`;
        canvas.style.height = `${baseHeight * scale}px`;
    }
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

resizeCanvas();

// Variabili di gioco
const baseGravity = 0.5;
let gravity = baseGravity;
let isJumping = false;
let jumpHeight = 20;
let visibleHp = 100;
let speed = 10;
let nextSpeedIncrement = 10;
let speedIncrementAmount = 0.25;
let distance = 0;  
let obstacleCount = 0;  
let passedObstacles = 0;  
let gameOverState = false;
let gameStarted = false; 

// Carica le immagini di sfondo
const layers = [
    {
        speed: 0.5,
        src: 'assets/images/sky.webp',     
        x: 0,
        width: 0,
        image: null,
    },
    {
        speed: 1.5,
        src: 'assets/images/trees-earth.webp',
        x: 0,
        width: 0,
        image: null,
    }
];

// Funzione per caricare le immagini di sfondo
let imagesLoaded = 0;
const totalImages = layers.length;

layers.forEach(layer => {
    const img = new Image();
    img.src = layer.src;
    img.onload = () => {
        imagesLoaded++;
        layer.image = img;
        layer.width = img.width;
        if (imagesLoaded === totalImages) {
            console.log("Tutti i livelli dello sfondo sono stati caricati");
        }
    };
    img.onerror = () => {
        console.error(`Errore nel caricamento dell'immagine: ${layer.src}`);
    };
});

// Carica la traccia audio
const gameAudio = new Audio('assets/audio/soundtrack.mp3');
gameAudio.loop = true;
gameAudio.volume = 0.25;

// Funzione per gestire l'inizio del gioco e il salto
function handleStartAndJump() {
    if (gameOverState) {
        restartGame();
    } else {
        if (!gameStarted) {
            startGame(); 
        } else {
            pg.jump(); 
        }
    }
}

// Aggiunge l'evento per far partire il gioco o far saltare il personaggio
document.addEventListener("keydown", function (e) {
    if (e.key === " " || e.key === "ArrowUp") {
        handleStartAndJump();
    }
});

document.addEventListener("click", handleStartAndJump);
document.addEventListener("touchstart", handleStartAndJump);

// Funzione per iniziare il gioco
function startGame() {
    gameAudio.currentTime = 0;
    gameAudio.play();
    gameStarted = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
}

// Carica le immagini/sprite del pg
const pgSprite = new Image();
pgSprite.src = 'assets/images/pg-sprite.png';

const jumpImage = new Image();
jumpImage.src = 'assets/images/jumping-pg.png';

const spriteWidth = 150;
const spriteHeight = 75;

let spriteFrameX = 0;
let spriteFrameY = 0;
let frameSpeed = 10;
let frameCounter = 0;

const pg = {
    x: 50,
    y: canvas.height - 75,
    width: 150,
    height: 75,
    dx: 0,
    dy: 0,
    hp: 100,
    hitbox: { 
        radius: 35,
        offsetX: 75, 
        offsetY: 37.5 
    },
    jump() {
        if (!isJumping) {
            this.dy = -jumpHeight;
            isJumping = true;
        }
    },
    update() {
        this.y += this.dy;

        if (this.y < canvas.height - 75) {
            this.dy += gravity;
        } else {
            this.y = canvas.height - 75;
            this.dy = 0;
            isJumping = false;
        }
    },
    draw() {
        frameCounter++;

        if (frameCounter >= Math.max(1, frameSpeed - Math.floor(speed / 3))) {
            if (!isJumping) {
                spriteFrameX = (spriteFrameX + 1) % 4;
            }
            frameCounter = 0;
        }

        if (isJumping) {
            ctx.drawImage(jumpImage, this.x, this.y, this.width, this.height);
        } else {
            ctx.drawImage(pgSprite, spriteFrameX * spriteWidth, spriteFrameY * spriteHeight, spriteWidth, spriteHeight, this.x, this.y, this.width, this.height);
        }

        // (DEBUG) Disegna l'hitbox del pg
        /* ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            this.x + this.hitbox.offsetX,
            this.y + this.hitbox.offsetY,
            this.hitbox.radius,
            0,
            Math.PI * 2
        );
        ctx.stroke(); */

        // Barra degli HP
        if (!gameOverState) {
            const barWidth = 300;
            const barHeight = 25;
            const xPos = canvas.width - 1260;
            const yPos = 20;

            const transitionSpeed = Math.min(1.0 + speed / 10, 2.0);
            
            if (visibleHp > this.hp) {
                visibleHp = Math.max(this.hp, visibleHp - transitionSpeed);
            } else if (visibleHp < this.hp) {
                visibleHp = Math.min(this.hp, visibleHp + transitionSpeed);
            }

            const currentWidth = (visibleHp / 100) * barWidth;
            let barColor;
            if (visibleHp > 70) barColor = "green";
            else if (visibleHp > 50) barColor = "yellow";
            else if (visibleHp > 30) barColor = "orange";
            else barColor = "red";

            ctx.fillStyle = barColor;
            ctx.fillRect(xPos, yPos, currentWidth, barHeight);

            ctx.strokeStyle = barColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(xPos, yPos, barWidth, barHeight);
        }
    }
};

// Tipologie di ostacoli
const obstacleTypes = [
    {
        width: 160,
        height: 80,
        color: 'blue',
        type: 'ground'
    },
    {
        width: 130,
        height: 100,
        color: 'yellow',
        type: 'air'
    }
];

// Carica lo sprite per l'ostacolo volante
const flyingObstaclesSprite = new Image();
flyingObstaclesSprite.src = 'assets/images/flying-obstacles-sprite.png';

const flyingObstaclesWidth = 130;
const flyingObstaclesHeight = 100;

let flyingObstaclesFrameX = 0; 
let flyingObstaclesFrameY = 0;  
let flyingObstaclesFrameSpeed = 10;  
let flyingObstaclesFrameCounter = 0;  

// Carica lo sprite per l'ostacolo terrestre
const runningObstaclesSprite = new Image();
runningObstaclesSprite.src = 'assets/images/running-obstacles-sprite.png';

const runningObstaclesSpriteWidth = 160;
const runningObstaclesSpriteHeight = 80;

let runningObstaclesFrameX = 0;
let runningObstaclesFrameCounter = 0;
const runningObstaclesFrameSpeed = 10;

// Velocità globale per tutti gli ostacoli
const obstacleSpeed = 5;

// Ostacoli
let obstacles = [];
let lastObstacleX = 0;

// Funzione per creare gli ostacoli
function createObstacle() {
    const randomObstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

    const minDistance = 550;
    let xPos = Math.max(lastObstacleX + minDistance, canvas.width + Math.floor(Math.random() * 300) + 150);

    lastObstacleX = xPos;

    let obstacle = {
        x: xPos,
        y: canvas.height - randomObstacleType.height,
        width: randomObstacleType.width,
        height: randomObstacleType.height,
        color: randomObstacleType.color,
        type: randomObstacleType.type || 'static',
        passed: false,
        speed: obstacleSpeed,
        damaged: false,
        hitbox: {
            radius: Math.min(randomObstacleType.width, randomObstacleType.height) / 2,
            offsetX: randomObstacleType.width / 2,
            offsetY: randomObstacleType.height / 2
        }
    };    

    if (obstacle.type === 'air') {
        obstacle.y = Math.random() > 0.5 ? canvas.height - randomObstacleType.height : canvas.height - randomObstacleType.height - 80;
        obstacle.frameCounter = 0;
        obstacle.frameX = 0;
    } else {
        obstacle.y = canvas.height - randomObstacleType.height;
    }

    obstacles.push(obstacle);
    obstacleCount++;
}

// Funzione per l'animazione dell'ostacolo volante
function drawflyingObstacles(obs) {
    obs.frameCounter++;
    const adjustedFrameSpeed = Math.max(1, flyingObstaclesFrameSpeed - Math.floor(obs.speed / 3));
    if (obs.frameCounter >= adjustedFrameSpeed) {
        obs.frameX = (obs.frameX + 1) % 9;
        obs.frameCounter = 0;
    }

    ctx.drawImage(
        flyingObstaclesSprite,
        obs.frameX * flyingObstaclesWidth,
        0,
        flyingObstaclesWidth,
        flyingObstaclesHeight,
        obs.x,
        obs.y,
        obs.width,
        obs.height
    );
}

// Funzione per l'animazione dell'ostacolo terrestre
function drawRunningObstacles(obs) {
    if (!obs.frameX) obs.frameX = 0;
    if (!obs.frameCounter) obs.frameCounter = 0;

    const adjustedFrameSpeed = Math.max(1, runningObstaclesFrameSpeed - Math.floor(obs.speed / 3));
    obs.frameCounter++;
    if (obs.frameCounter >= adjustedFrameSpeed) {
        obs.frameX = (obs.frameX + 1) % 12;
        obs.frameCounter = 0;
    }

    ctx.drawImage(
        runningObstaclesSprite,
        obs.frameX * (runningObstaclesSprite.naturalWidth / 12),
        0,
        runningObstaclesSprite.naturalWidth / 12,
        runningObstaclesSprite.naturalHeight,
        obs.x,
        obs.y,
        obs.width,
        obs.height
    );
}

// Funzione per disegnare il parallax
function drawParallax() {
    layers.forEach(layer => {
        const scaledHeight = (canvas.width / layer.image.naturalWidth) * layer.image.naturalHeight;
        const yPos = (canvas.height - scaledHeight) / 2;

        const parallaxSpeed = layer.speed * (speed / 6);
        layer.x = (layer.x - parallaxSpeed) % canvas.width;

        ctx.drawImage(layer.image, layer.x, yPos, canvas.width, scaledHeight);
        ctx.drawImage(layer.image, layer.x + canvas.width, yPos, canvas.width, scaledHeight);
    });
}

// Funzione per disegnare tutti gli ostacoli
function drawObstacles() {
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];

        if (obs.type === 'ground') {
            drawRunningObstacles(obs);
        } else if (obs.type === 'air') {
            drawflyingObstacles(obs);
        } else {
            ctx.fillStyle = obs.color;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }

        // (DEBUG) Disegna l'hitbox degli ostacoli
        /* ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            obs.x + obs.hitbox.offsetX,
            obs.y + obs.hitbox.offsetY,
            obs.hitbox.radius,
            0,
            Math.PI * 2
        );
        ctx.stroke(); */
    }
}

// Funzione per l'aggiornamento degli ostacoli
function updateObstacles() {
    obstacles = obstacles.filter(obs => {
        obs.x -= obs.speed * 0.6;
         obs.animationFrame = (obs.animationFrame + obs.speed * 0.1) % obs.totalFrames;
        return obs.x + obs.width > 0;
    });
}

// Gestione delle collisioni con gli ostacoli
function handleCollisions() {
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];

        const pgCenterX = pg.x + pg.hitbox.offsetX;
        const pgCenterY = pg.y + pg.hitbox.offsetY;
        const obsCenterX = obs.x + obs.hitbox.offsetX;
        const obsCenterY = obs.y + obs.hitbox.offsetY;

        const dx = pgCenterX - obsCenterX;
        const dy = pgCenterY - obsCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < pg.hitbox.radius + obs.hitbox.radius) {
            if (!obs.damaged) {
                pg.hp -= 20;
                obs.damaged = true;
            }

            if (pg.hp <= 0) {
                pg.hp = 0;
                gameOver();
            }
        }
    }
}

// Funzione di aggiornamento del gioco
function update() {
    if (gameOverState) return;

    if (!gameOverState) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }    

    drawParallax();

    pg.update();
    pg.draw();

    if (Math.random() < Math.min(0.005 + (distance / 250), 0.5)) {
        createObstacle();
    }

    updateObstacles();
    drawObstacles();
    handleCollisions();

    distance += speed / 100;

    if (distance >= nextSpeedIncrement) {
        speed = Math.min(speed + speedIncrementAmount, 20);
        nextSpeedIncrement += 10;

        obstacles.forEach(obs => {
        obs.speed = speed;
            if (obs.type === 'flying') {
                obs.frameSpeed = Math.max(1, flyingObstaclesFrameSpeed - Math.floor(speed / 3));
            } else if (obs.type === 'ground') {
                obs.frameSpeed = Math.max(1, runningObstaclesFrameSpeed - Math.floor(speed / 3));
            }
        });
    }

    gravity = baseGravity + (speed / 35);

    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        if (obs.x + obs.width < pg.x && !obs.passed) {
            passedObstacles++;
            obs.passed = true;
        }
    }

    ctx.shadowColor = "black";
    ctx.shadowOffsetX = 2; 
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 2;
    ctx.fillStyle = "white";
    ctx.font = "bold 25px sans-serif";
    ctx.fillText("Distanza Percorsa: " + Math.floor(distance) + "m", canvas.width - 1260, 80);
    ctx.fillText("Ostacoli Superati: " + passedObstacles, canvas.width - 1260, 120);
    ctx.shadowColor = "transparent";
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;

    requestAnimationFrame(update);
}

// Funzione di game over
function gameOver() {
    gameOverState = true;

    gameAudio.pause();

    pg.hp = 0; 

    ctx.fillStyle = "white";  
    ctx.font = "bold 50px sans-serif";

    const text = "GAME OVER";
    const textWidth = ctx.measureText(text).width;

    const xPos = (canvas.width - textWidth) / 2;
    const yPos = canvas.height / 2;

    ctx.fillText(text, xPos, yPos);

    playAgain.style.display = 'block';
}

// Funzione di reset per il riavvio
function restartGame() {
    distance = 0;
    passedObstacles = 0;
    speed = 10;
    nextSpeedIncrement = 10;
    pg.hp = 100;
    gameOverState = false;
    gameAudio.currentTime = 0; 
    gameAudio.play();
    obstacles = [];
    pg.y = canvas.height - 75;
    pg.dy = 0;
    pg.x = 50;
    lastObstacleX = 0;

    layers.forEach(layer => {
        layer.x = 0;
    });

    playAgain.style.display = 'none';

    update();
}

playAgain.addEventListener("click", restartGame);

// Funzione per mostrare il messaggio all'inizio del gioco
function showWelcomeMessage() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 50px sans-serif";
    const welcomeText = "Clicca o Premi ''Freccia Su''-''Spazio'' per iniziare";
    const textWidth = ctx.measureText(welcomeText).width;
    ctx.fillText(welcomeText, (canvas.width - textWidth) / 2, canvas.height / 2);
}

if (!gameStarted) {
    showWelcomeMessage();
}
