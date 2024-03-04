let DROPLETS = [];
let TILT_X = 0;
let TILT_Y = 0;
let MAX_COUNTER = 0;
let CANVAS_WIDTH = 800;
let CANVAS_HEIGHT = 600;
let MAX_DROPLETS = 20;
let MIN_DROPLET_SIZE = 5;
let MAX_DROPLET_SIZE = 16;
let DROPLET_CREATION_INTERVAL = 100000;
let DROPLETS_MAX_SPEED = 12;
let USE_GRAVITY = false;
let BOUNCE_OFF_EDGES = false;
let TIME = 30;
let GOAL = 10;
let CURRENT_LEVEL = 1;
let MIN_SIZE_TO_JOIN = 5;
let MIN_SIZE_TO_MOVE = 15;
let LIMIT_TILT = 5;


const levels = {
    1: {
        maxDroplets: 20,
        minDropletSize: 5,
        maxDropletSize: 16,
        dropletCreationInterval: 100000,
        useGravity: false,
        bounceOffEdges: true,
        dropletsMaxSpeed: 12,
        time: 30,
        goal: 10,
    },
    2: {
        maxDroplets: 20,
        minDropletSize: 10,
        maxDropletSize: 35,
        dropletCreationInterval: 500,
        useGravity: false,
        bounceOffEdges: false,
        dropletsMaxSpeed: 12,
        time: 20,
        goal: 20,
    },
    3: {
        maxDroplets: 30,
        maxDropletSize: 20,
        minDropletSize: 5,
        dropletCreationInterval: 250,
        useGravity: true,
        bounceOffEdges: false,
        dropletsMaxSpeed: 20,
        time: 10,
        goal: 30,
    }
};

class Droplet {
    constructor(x, y, size, counter = 1, splatted = false, shouldGrow = true) {
        this.x = x;
        this.y = y;
        this.size = shouldGrow ? 2 : size;
        this.finalSize = size;
        this.shouldGrow = shouldGrow;
        this.speed = speed(size);
        this.vx = TILT_X * this.speed; // x velocity
        this.vy = TILT_Y * this.speed; // y velocity
        this.maxSpeed = size / 50 * DROPLETS_MAX_SPEED;
        this.counter = counter;
        this.timeMoving = 0;
        this.splatters = [];
        this.splatted = splatted;
    }
    createSplatter() {
        // Create 10 smaller droplets in random directions
        for (let i = 0; i < Math.ceil(this.size * 0.5); i++) {
            let speed = Math.random() * 2 + 1; // Random speed between 1 and 3
            let angle = Math.random() * Math.PI * 2; // Random direction
            let splatter = {
                x: this.x,
                y: this.y,
                size: this.size / 4, // Smaller size
                vx: Math.cos(angle) * speed, // Velocity in x direction
                vy: Math.sin(angle) * speed, // Velocity in y direction
            };
            this.splatters.push(splatter);
        }
        this.splatted = true;
    }
    update() {

        this.growDroplet();

        this.moveDroplet();

        this.splashDroplet();
    }
    splashDroplet() {
        // Update the main droplet
        if (!this.splatted) {
            this.createSplatter();
        }
        // Update the splatters
        for (let splatter of this.splatters) {
            splatter.x += splatter.vx;
            splatter.y += splatter.vy;
            splatter.size *= 0.99; // Gradually shrink
        }
        // Remove the splatters that are too small
        this.splatters = this.splatters.filter(function (splatter) {
            return splatter.size > 0.5;
        });
    }
    getLabel() {
        return `${this.counter}`;
    }
    moveDroplet() {

        // Update velocity based on tilt
        this.updateVel('vy', TILT_Y);
        this.updateVel('vx', TILT_X);

        // Update position based on velocity
        this.x += this.vx;
        this.y += this.vy;

        this.createTrail();

    }
    createTrail() {
        if (this.finalSize * 0.85 < MIN_SIZE_TO_MOVE) {
            return;
        }

        if (this.vx != 0 || this.vy != 0) {
            const timeDiff = this.vx != 0 ? Math.abs(this.vx) : this.vy != 0 ? Math.abs(this.vy) : 0;
            this.timeMoving += timeDiff / 200;
        } else {
            this.timeMoving = 0;
        }

        // moving the droplet should leave a trail of new smaller droplets behind
        if (this.timeMoving >= 1) {
            const sizeDiff = this.finalSize * 0.15;
            this.timeMoving = 0;
            this.finalSize *= 0.85;
            this.speed = speed(this.finalSize);

            let newX = this.x;
            let newY = this.y;
            if (this.vx > 0) {
                newX = this.x - sizeDiff;
                newY = this.y - sizeDiff / 4;
            } else if (this.vx < 0) {
                newX = this.x + sizeDiff;
                newY = this.y + sizeDiff / 4;
            } else if (this.vy > 0) {
                newX = this.x - sizeDiff / 4;
                newY = this.y - sizeDiff;
            } else if (this.vy < 0) {
                newX = this.x + sizeDiff / 4;
                newY = this.y + sizeDiff;
            }


            let newDroplet = new Droplet(newX, newY, sizeDiff, 1, false, true);
            DROPLETS.push(newDroplet);
        }
    }
    growDroplet() {
        // If the droplet is still growing and hasn't reached its final size
        if (this.size < this.finalSize && this.shouldGrow) {
            // Increase the size of the droplet
            this.size++;
        } else {
            // If the droplet has reached its final size, stop it from growing
            this.size = this.finalSize;
            this.shouldGrow = false;
        }
    }
    updateVel(prop, tilt) {
        if ((tilt != 0) && this.speed != 0) {
            let r = Math.random() * 1.9 - 0.1;
            this[prop] += tilt * (this.speed + r);
        } else if (USE_GRAVITY && prop === 'vy') {
            this.vy += Math.abs(this.vy) + this.speed + (Math.random() * 0.9 - 0.2); // Y velocity
        } else {
            this[prop] = 0;
        }

        if (this[prop] > this.maxSpeed) {
            this[prop] = this.maxSpeed;
        }
        if (this[prop] < -this.maxSpeed) {
            this[prop] = -this.maxSpeed;
        }
        if (BOUNCE_OFF_EDGES) {
            const pos = prop === 'vx' ? 'x' : 'y';
            const canvas = prop === 'vx' ? CANVAS_WIDTH : CANVAS_HEIGHT;
            // Bounce off the edges of the screen
            if (this[pos] - this.size < 0 || this[pos] + this.size > canvas) {
                this[prop] = -this[prop];
            }
        }
    }
    draw(ctx) {
        this.drawSplatters(ctx)
        this.drawShadow(ctx);
        this.drawDroplet(ctx);
        this.drawReflection(ctx);
        this.drawCounter(ctx)
    }

    drawDroplet(ctx) {
        let gradient = ctx.createRadialGradient(this.x + this.size * 0.5, this.y + this.size * 0.5, this.size * 0.3, this.x - this.size * 0.4, this.y + this.size * 0.9, this.size * 6.6);
        gradient.addColorStop(0.1, '#87ceeb');
        gradient.addColorStop(0.2, '#69b0cd');
        gradient.addColorStop(0.4, '#87ceeb');

        // Draw the main droplet
        ctx.beginPath();
        this.getEllipse(ctx);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    getEllipse(ctx, shadow = false) {
        // Modify the shape of the droplet based on its speed
        // Depending on the direction of the tilt, modify only one side of the droplet
        let elongationX = 0;
        let elongationY = 0;
        if (this.vx != 0) {
            elongationX = Math.abs(this.vx);
            elongationY = -Math.abs(this.vx);
        } else if (this.vy != 0) {
            elongationY = Math.abs(this.vy);
            elongationX = -Math.abs(this.vy);
        }
        let reposition = shadow ? this.size * 0.1 : 0;

        ctx.ellipse(this.x + reposition, this.y + reposition, Math.abs(this.size + elongationX), Math.abs(this.size + elongationY), 0, 0, 2 * Math.PI);
    }
    drawShadow(ctx) {
        // Create radial gradient for shadow
        let shadow = ctx.createRadialGradient(this.x, this.y, this.size * 0.3, this.x + this.size * 0.1, this.y - this.size * 0.9, this.size * 6.6);
        shadow.addColorStop(0.1, '#69b0cd');
        shadow.addColorStop(0.223, '#87ceeb');
        shadow.addColorStop(1, 'rgba(135, 206, 235, 0)'); // Add this line to create a blur effect

        // Draw the shadow
        ctx.beginPath();
        // ctx.arc(this.x + this.size * 0.1, this.y + this.size * 0.1, this.size, 0, 2 * Math.PI);
        this.getEllipse(ctx, true);
        ctx.fillStyle = shadow;
        ctx.fill();

    }
    drawReflection(ctx) {

        let repositionY = TILT_Y != 0 ? -this.size * 0.1 : TILT_X != 0 ? this.size * 0.1 : 0;
        // Draw the ::before pseudo-element
        ctx.beginPath();
        ctx.arc(this.x - this.size / 1.7, this.y - this.size / 2.2 + repositionY, this.size / 17, 0, 2 * Math.PI);
        ctx.fillStyle = '#f4f1f49f';
        ctx.fill();


        let rotation = TILT_Y != 0 ? Math.PI / 4 : TILT_X != 0 ? Math.PI / 2.8 : Math.PI / 3;
        // Draw the ::after pseudo-element
        ctx.beginPath();
        ctx.ellipse(this.x - this.size / 3.9, this.y - this.size / 1.4 + repositionY, this.size / 10, this.size / 4, rotation, 0, 2 * Math.PI);
        ctx.fillStyle = '#f4f1f49f';
        ctx.fill();
    }

    drawCounter(ctx) {
        ctx.font = (this.size * 0.5) + "px Arial";
        ctx.fillStyle = '#69b0cd';
        ctx.fillText(this.getLabel(), this.x - (this.size * 0.2), this.y + (this.size * 0.2));
    }

    drawSplatters(ctx) {
        // Draw the splatters
        for (let splatter of this.splatters) {
            let gradient = ctx.createRadialGradient(splatter.x + splatter.size * 0.5, splatter.y + splatter.size * 0.5, splatter.size * 0.3, splatter.x - splatter.size * 0.4, splatter.y + splatter.size * 0.9, splatter.size * 6.6);
            gradient.addColorStop(0.1, '#87ceeb');
            gradient.addColorStop(0.2, '#69b0cd');
            gradient.addColorStop(0.4, '#83c100');


            ctx.beginPath();
            ctx.arc(splatter.x, splatter.y, splatter.size, 0, 2 * Math.PI);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }

}


function joinDroplets() {
    //when droplets touch each other, remove them from the array and add a new one in the same position, but adding their sizes
    for (let i = 0; i < DROPLETS.length; i++) {
        for (let j = i + 1; j < DROPLETS.length; j++) {
            let droplet1 = DROPLETS[i];
            let droplet2 = DROPLETS[j];

            //get the largest droplet
            let newDroplet = droplet1.size > droplet2.size ? droplet1 : droplet2;
            let secondDroplet = droplet1.size <= droplet2.size ? droplet1 : droplet2;
            if (secondDroplet.size < MIN_SIZE_TO_JOIN) {
                continue;
            }

            let distance = Math.sqrt((droplet1.x - droplet2.x) ** 2 + (droplet1.y - droplet2.y) ** 2);
            if (distance < droplet1.size + droplet2.size) {
                newDroplet.counter += secondDroplet.counter;
                if (newDroplet.counter > MAX_COUNTER) {
                    MAX_COUNTER = newDroplet.counter;
                }
                let newSize = Math.sqrt(droplet1.size * droplet1.size + droplet2.size * droplet2.size);
                DROPLETS.splice(i, 1);
                DROPLETS.splice(j - 1, 1); // j - 1 because we just removed an element at position i

                // limit the size to the maximum size of a circle using the canvas width and height
                const maxSize = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 2;
                if (newSize <= maxSize) {
                    DROPLETS.push(new Droplet(newDroplet.x, newDroplet.y, newSize, newDroplet.counter, true, false));
                }
            }
        }
    }
}

function removeDropletsOffScreen() {
    //when the droplet goes off the screen, remove it from the array
    DROPLETS = DROPLETS.filter(function (droplet) {
        return !((droplet.x < 0 || droplet.y < 0) || (Math.ceil(droplet.x) > CANVAS_WIDTH || Math.ceil(droplet.y) > CANVAS_HEIGHT))
    });
}

function createDroplet() {
    if (DROPLETS.length === 0) {
        const size = levels[CURRENT_LEVEL].minDropletSize > MIN_SIZE_TO_MOVE ? levels[CURRENT_LEVEL].minDropletSize : MIN_SIZE_TO_MOVE;
        DROPLETS.push(new Droplet(rPosX(), rPosY(), size, 1, false, true));
    } else if (DROPLETS.length < MAX_DROPLETS) {
        DROPLETS.push(new Droplet(rPosX(), rPosY(), rSize(), 1, false, true));
    }

    // Call this function again after a random delay between 1 and 3 seconds
    let delay = Math.random() * 2000 + DROPLET_CREATION_INTERVAL; // Random delay between 1000 and 3000 milliseconds
    setTimeout(createDroplet, delay);
}


function r(min, max) {
    return Math.random() * (max - min) + min;
}
function rPosX() {
    return r(0, CANVAS_WIDTH);
}
function rPosY() {
    return r(0, CANVAS_HEIGHT);
}

function rSize() {
    return r(MIN_DROPLET_SIZE, MAX_DROPLET_SIZE);
}

function speed(size) {
    if (size < MIN_SIZE_TO_MOVE) {
        return 0;
    }
    return size / 100;
}

function win() {
    return MAX_COUNTER >= GOAL;
}

function gameOver() {
    const movables = DROPLETS.filter(d => d.size >= MIN_SIZE_TO_MOVE);
    return TIME <= 0 || win() || movables.length === 0;
}

function drawCounter() {
    let canvas = document.getElementById('gameCanvas');
    let ctx = canvas.getContext('2d');
    ctx.font = "14px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(`TOP SCORE: ${MAX_COUNTER} droplets joined`, 10, 30);
    ctx.fillText(`Droplets: ${DROPLETS.length}`, 10, 50);
    ctx.fillText(`Tilt: : ${TILT_X}x - ${TILT_Y}y`, 10, 70);
    ctx.fillText(`Gravity: ${USE_GRAVITY ? 'ON' : 'OFF'}`, 10, 90);
    ctx.fillText(`Bounce: ${BOUNCE_OFF_EDGES ? 'ON' : 'OFF'}`, 10, 110);
    ctx.fillText(`Max Speed: ${DROPLETS_MAX_SPEED}`, 10, 130);
    ctx.fillText(`Time: ${TIME}`, 10, 150);
    ctx.fillText(`Goal: ${GOAL}`, 10, 170);
    ctx.fillText(`Level: ${CURRENT_LEVEL}`, 10, 190);

    if (gameOver()) {
        ctx.font = "30px Arial";

        ctx.fillStyle = win() ? "green" : "red";
        ctx.fillText(`GAME OVER`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        if (win()) {
            ctx.fillStyle = "green";
            ctx.fillText(`You win!`, CANVAS_WIDTH / 2 + 40, CANVAS_HEIGHT / 2 + 30);
        }

        if (MAX_COUNTER > 0) {
            ctx.font = "20px Arial";
            ctx.fillStyle = "black";
            ctx.fillText(`You joined ${MAX_COUNTER} droplets`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
        }

        addRestartButton(ctx);
        addNextButton(ctx);
    }
}

function addRestartButton(ctx) {
    ctx.beginPath();
    ctx.rect(CANVAS_WIDTH / 2 - 50, CANVAS_HEIGHT / 2 + 80, 100, 50);
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.font = "14px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("RESTART", CANVAS_WIDTH / 2 - 30, CANVAS_HEIGHT / 2 + 110);
    ctx.closePath();


}
function addNextButton(ctx) {
    ctx.beginPath();
    ctx.rect(CANVAS_WIDTH / 2 + 150, CANVAS_HEIGHT / 2 + 80, 100, 50);
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.font = "14px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("NEXT LEVEL", CANVAS_WIDTH / 2 + 160, CANVAS_HEIGHT / 2 + 110);
    ctx.closePath();

}


setInterval(function () {
    if (TIME > 0) {
        TIME--;
    }
}, 1000);

window.addEventListener('keydown', function (event) {
    if (gameOver()) {
        return;
    }
    if (['ArrowLeft', 'a'].includes(event.key)) {
        if (TILT_X > -LIMIT_TILT)
            TILT_X += -1;
    } else if (['d', 'ArrowRight'].includes(event.key)) {
        if (TILT_X < LIMIT_TILT)
            TILT_X += 1;
    } else if (['ArrowUp', 'w'].includes(event.key)) {
        if (TILT_Y > -LIMIT_TILT)
            TILT_Y += -1;
    } else if (['s', 'ArrowDown'].includes(event.key)) {
        if (TILT_Y < LIMIT_TILT)
            TILT_Y += 1;
    }
    if (event.key === ' ') {
        DROPLETS.push(new Droplet(rPosX(), rPosY(), rSize()));
    }
});

window.addEventListener('keyup', function (event) {
    if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(event.key)) {
        // Decrease TILT_X gradually
        let decreaseInterval = setInterval(function () {
            if (TILT_X > 0) {
                TILT_X -= 1;
            } else if (TILT_X < 0) {
                TILT_X += 1;
            } else {
                clearInterval(decreaseInterval);
            }
        }, 100); // Decrease every 100ms
    }
    if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(event.key)) {
        // Decrease TILT_Y gradually
        let decreaseInterval = setInterval(function () {
            if (TILT_Y > 0) {
                TILT_Y -= 1;
            } else if (TILT_Y < 0) {
                TILT_Y += 1;
            } else {
                clearInterval(decreaseInterval);
            }
        }, 100); // Decrease every 100ms
    }
});

document.getElementById('restartButton').addEventListener('click', function () {
    // Reset game state
    resetGame();
});

document.getElementById('submitParams').addEventListener('click', function () {
    // Get game parameters from input fields
    let inputMaxDroplets = document.getElementById('maxDroplets');
    let inputMaxDropletSize = document.getElementById('maxDropletSize');
    let inputMinDropletSize = document.getElementById('minDropletSize');
    let inputDropletCreationInterval = document.getElementById('dropletCreationInterval');
    let inputUseGravity = document.getElementById('useGravity');
    let inputBounceOffEdges = document.getElementById('bounceOffEdges');
    let inputDropletsMaxSpeed = document.getElementById('dropletsMaxSpeed');

    // Set game parameters
    if (inputMaxDroplets.value) MAX_DROPLETS = parseInt(inputMaxDroplets.value);
    if (inputMaxDropletSize.value) MAX_DROPLET_SIZE = parseInt(inputMaxDropletSize.value);
    if (inputMinDropletSize.value) MIN_DROPLET_SIZE = parseInt(inputMinDropletSize.value);
    if (inputDropletCreationInterval.value) DROPLET_CREATION_INTERVAL = parseInt(inputDropletCreationInterval.value);
    if (inputUseGravity.value) USE_GRAVITY = inputUseGravity.checked;
    if (inputBounceOffEdges.value) BOUNCE_OFF_EDGES = inputBounceOffEdges.checked;
    if (inputDropletsMaxSpeed.value) DROPLETS_MAX_SPEED = parseInt(inputDropletsMaxSpeed.value);

    resetGame();
});

document.querySelectorAll('[data-slider-target]').forEach(function (slider) {
    slider.addEventListener('input', function () {
        let targetId = this.getAttribute('data-slider-target');
        let targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.textContent = this.value;
        }
    });
});

window.addEventListener('load', function (event) {
    CANVAS_WIDTH = window.innerWidth * 0.9;
    CANVAS_HEIGHT = window.innerHeight;

    // Set initial input values
    document.getElementById('maxDroplets').value = MAX_DROPLETS;
    document.getElementById('maxDropletSize').value = MAX_DROPLET_SIZE;
    document.getElementById('minDropletSize').value = MIN_DROPLET_SIZE;
    document.getElementById('dropletCreationInterval').value = DROPLET_CREATION_INTERVAL;
    document.getElementById('useGravity').checked = USE_GRAVITY;
    document.getElementById('bounceOffEdges').checked = BOUNCE_OFF_EDGES;
    document.getElementById('dropletsMaxSpeed').value = DROPLETS_MAX_SPEED;

    // Set initial slider values
    document.querySelectorAll('[data-slider-target]').forEach(function (slider) {
        let targetId = slider.getAttribute('data-slider-target');
        let targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.textContent = slider.value;
        }
    });
    document.querySelectorAll('[data-toggle]').forEach(function (element) {
        element.addEventListener('click', function () {
            let targetId = this.getAttribute('data-toggle');
            let targetElement = document.getElementById(targetId);
            if (targetElement.style.display === "none") {
                targetElement.style.display = "block";
            } else {
                targetElement.style.display = "none";
            }
        });
    });
    document.querySelectorAll('[data-level]').forEach(function (element) {
        element.addEventListener('click', function () {
            let targetLevel = this.getAttribute('data-level');
            CURRENT_LEVEL = targetLevel;
            setLevel(levels[targetLevel]);
            resetGame();
        });
    });

    let canvas = document.getElementById('gameCanvas');

    canvas.addEventListener('click', function (event) {
        let rect = canvas.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;

        // Check if the click is within the bounds of the element
        // Replace these with the actual bounds of your element
        let elementX = CANVAS_WIDTH / 2 - 50;
        let elementY = CANVAS_HEIGHT / 2 + 80;
        let elementWidth = 100;
        let elementHeight = 50;

        if (x >= elementX && x <= elementX + elementWidth && y >= elementY && y <= elementY + elementHeight) {
            // The click was inside the element, perform the action
            setLevel(levels[CURRENT_LEVEL]);
        }
        // Check if the click is within the bounds of the element
        // Replace these with the actual bounds of your element
        let elementX2 = CANVAS_WIDTH / 2 + 150;
        let elementY2 = CANVAS_HEIGHT / 2 + 80;

        if (x >= elementX2 && x <= elementX2 + elementWidth && y >= elementY2 && y <= elementY2 + elementHeight) {
            // The click was inside the element, perform the action
            nextLevel();
        }
    }, false);
});

function nextLevel() {
    CURRENT_LEVEL++;
    if (CURRENT_LEVEL > Object.keys(levels).length) {
        CURRENT_LEVEL = 1;
    }
    setLevel(levels[CURRENT_LEVEL]);
    resetGame();
}

function setLevel(level) {
    MAX_DROPLETS = level.maxDroplets;
    MAX_DROPLET_SIZE = level.maxDropletSize;
    MIN_DROPLET_SIZE = level.minDropletSize;
    DROPLET_CREATION_INTERVAL = level.dropletCreationInterval;
    USE_GRAVITY = level.useGravity;
    BOUNCE_OFF_EDGES = level.bounceOffEdges;
    DROPLETS_MAX_SPEED = level.dropletsMaxSpeed;
    TIME = level.time;
    GOAL = level.goal;
    resetGame();
}



function resetGame() {
    DROPLETS = [];
    TILT_X = 0;
    TILT_Y = 0;
    MAX_COUNTER = 0;
    TIME = levels[CURRENT_LEVEL].time;
    GOAL = levels[CURRENT_LEVEL].goal;
}


function draw() {
    let canvas = document.getElementById('gameCanvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    let ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let droplet of DROPLETS) {
        droplet.draw(ctx);
    }

    drawCounter();
}

function update() {
    for (let droplet of DROPLETS) {
        droplet.update();
    }
    removeDropletsOffScreen();
    createDroplet();
    joinDroplets();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();