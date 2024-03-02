let droplets = [];
let tiltX = 0;
let tiltY = 0;
let maxCounter = 0;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
let BOUNCE_OFF_EDGES = false;
let MAX_DROPLETS = 16;
let MIN_DROPLET_SIZE = 5;
let MAX_DROPLET_SIZE = 16;
let DROPLET_CREATION_INTERVAL = 100000;
let USE_GRAVITY = false;
let DROPLETS_MAX_SPEED = 10;

class Droplet {
    constructor(x, y, size, counter = 1, splatted = false, shouldGrow = true) {
        this.x = x;
        this.y = y;
        this.size = shouldGrow ? 2 : size;
        this.finalSize = size;
        this.shouldGrow = shouldGrow;
        this.speed = speed(size);
        this.vx = tiltX * this.speed; // x velocity
        this.vy = tiltY * this.speed; // y velocity
        this.maxSpeed = size / 50 * DROPLETS_MAX_SPEED;
        this.counter = counter;
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
        this.updateVel('vy', tiltY);
        this.updateVel('vx', tiltX);

        // Update position based on velocity
        this.x += this.vx;
        this.y += this.vy;

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
        if (tilt != 0) {
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

        let repositionY = tiltY != 0 ? -this.size * 0.1 : tiltX != 0 ? this.size * 0.1 : 0;
        // Draw the ::before pseudo-element
        ctx.beginPath();
        ctx.arc(this.x - this.size / 1.7, this.y - this.size / 2.2 + repositionY, this.size / 17, 0, 2 * Math.PI);
        ctx.fillStyle = '#f4f1f49f';
        ctx.fill();


        let rotation = tiltY != 0 ? Math.PI / 4 : tiltX != 0 ? Math.PI / 2.8 : Math.PI / 3;
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
    for (let i = 0; i < droplets.length; i++) {
        for (let j = i + 1; j < droplets.length; j++) {
            let droplet1 = droplets[i];
            let droplet2 = droplets[j];

            //get the largest droplet
            let newDroplet = droplet1.size > droplet2.size ? droplet1 : droplet2;
            let secondDroplet = droplet1.size <= droplet2.size ? droplet1 : droplet2;

            let distance = Math.sqrt((droplet1.x - droplet2.x) ** 2 + (droplet1.y - droplet2.y) ** 2);
            if (distance < droplet1.size + droplet2.size) {
                newDroplet.counter += secondDroplet.counter;
                if (newDroplet.counter > maxCounter) {
                    maxCounter = newDroplet.counter;
                }
                let newSize = Math.sqrt(droplet1.size * droplet1.size + droplet2.size * droplet2.size);
                droplets.splice(i, 1);
                droplets.splice(j - 1, 1); // j - 1 because we just removed an element at position i

                // limit the size to the maximum size of a circle using the canvas width and height
                const maxSize = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 2;
                if (newSize <= maxSize) {
                    droplets.push(new Droplet(newDroplet.x, newDroplet.y, newSize, newDroplet.counter, true, false));
                }
            }
        }
    }
}
function update() {
    for (let droplet of droplets) {
        droplet.update();
    }
    removeDropletsOffScreen();
    createDroplet();
    joinDroplets();
}

function removeDropletsOffScreen() {
    //when the droplet goes off the screen, remove it from the array
    droplets = droplets.filter(function (droplet) {
        return !((droplet.x < 0 || droplet.y < 0) || (Math.ceil(droplet.x) > CANVAS_WIDTH || Math.ceil(droplet.y) > CANVAS_HEIGHT))
    });
}

function createDroplet() {
    if (droplets.length < MAX_DROPLETS) {
        droplets.push(new Droplet(rPosX(), rPosY(), rSize()));
    }

    // Call this function again after a random delay between 1 and 3 seconds
    let delay = Math.random() * 2000 + DROPLET_CREATION_INTERVAL; // Random delay between 1000 and 3000 milliseconds
    setTimeout(createDroplet, delay);
}


function r(min, max) {
    return Math.random() * (max - min) + min;
}
function rPosX() {
    return r(0, CANVAS_HEIGHT);
}
function rPosY() {
    return r(0, CANVAS_WIDTH);
}

function rSize() {
    return r(MIN_DROPLET_SIZE, MAX_DROPLET_SIZE);
}

function speed(size) {
    return size / 100;
}


function drawCounter() {
    let canvas = document.getElementById('gameCanvas');
    let ctx = canvas.getContext('2d');
    ctx.font = "14px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(`TOP SCORE: ${maxCounter} droplets joined`, 10, 30);
    ctx.fillText(`Droplets: ${droplets.length}`, 10, 50);
    ctx.fillText(`Tilt: : ${tiltX}x - ${tiltY}y`, 10, 70);
}

function draw() {
    let canvas = document.getElementById('gameCanvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    let ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let droplet of droplets) {
        droplet.draw(ctx);
    }
    drawCounter();
}

window.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') {
        tiltX += -1;
    } else if (event.key === 'ArrowRight') {
        tiltX += 1;
    } else if (event.key === 'ArrowUp') {
        tiltY += -1;
    } else if (event.key === 'ArrowDown') {
        tiltY += 1;
    }
    if (event.key === ' ') {
        droplets.push(new Droplet(rPosX(), rPosY(), rSize()));
    }
});

document.getElementById('restartButton').addEventListener('click', function () {
    // Reset game state
    droplets = [];
    tiltX = 0;
    tiltY = 0;
    maxCounter = 0;
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
});
window.addEventListener('keyup', function (event) {
    if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        tiltX = 0;
    }
    if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
        tiltY = 0;
    }
});

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();