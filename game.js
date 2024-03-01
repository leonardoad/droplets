let droplets = [];
let tiltX = 0;
let tiltY = 0;
let maxCounter = 0;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MAX_TILT = 5;
const BOUNCE_OFF_EDGES = false;
const MAX_DROPLETS = 100;
const DROPLET_CREATION_INTERVAL = 100000;
const USE_GRAVITY = false;
const DROPLETS_MAX_SPEED = 10;

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
        this.maxSpeed = size / DROPLETS_MAX_SPEED;
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
    moveDroplet() {
        // Update velocity based on tilt
        this.updateVel('vy', tiltY);
        this.updateVel('vx', tiltX);

        if (USE_GRAVITY) {
            this.vy += this.speed; // Y velocity
        }

        // Update position based on velocity
        this.x += this.vx;
        this.y += this.vy;

        if (BOUNCE_OFF_EDGES) {
            // Bounce off the edges of the screen
            if (this.x < 0 || this.x > CANVAS_WIDTH) {
                this.vx = -this.vx;
            }
            if (this.y < 0 || this.y > CANVAS_HEIGHT) {
                this.vy = -this.vy;
            }
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
        this[prop] += tilt * (this.speed);
        if (tilt === 0) {
            this[prop] = tilt * this.speed + (Math.random() * 0.3 - 0.1);
        }
        if (this[prop] > this.maxSpeed) {
            this[prop] = this.maxSpeed;
        }
        if (this[prop] < -this.maxSpeed) {
            this[prop] = -this.maxSpeed;
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
        gradient.addColorStop(0.1, '#efea63');
        gradient.addColorStop(0.2, '#8ad000');
        gradient.addColorStop(0.4, '#83c100');

        // Draw the main droplet
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();

    }
    drawShadow(ctx) {
        // let shadow = ctx.createRadialGradient(this.x * 0.9 , this.y * 0.85, this.size * 0.3, this.x  * 0.9, this.y * 1.3, this.size * 6.6);
        let shadow = ctx.createRadialGradient(this.x, this.y, this.size * 0.3, this.x + this.size * 0.1, this.y - this.size * 0.9, this.size * 6.6);
        shadow.addColorStop(0.1, '#8ad000');
        shadow.addColorStop(0.223, '#cade01');

        //Draw the shadow
        ctx.beginPath();
        ctx.arc(this.x + this.size * 0.1, this.y + this.size * 0.1, this.size, 0, 2 * Math.PI);
        ctx.fillStyle = shadow;
        ctx.fill();

    }
    drawReflection(ctx) {
        // Draw the ::before pseudo-element
        ctx.beginPath();
        ctx.arc(this.x - this.size / 1.7, this.y - this.size / 2.2, this.size / 17, 0, 2 * Math.PI);
        ctx.fillStyle = '#f4f1f49f';
        ctx.fill();

        // Draw the ::after pseudo-element
        ctx.beginPath();
        ctx.ellipse(this.x - this.size / 3.9, this.y - this.size / 1.4, this.size / 10, this.size / 4, Math.PI / 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#f4f1f49f';
        ctx.fill();
    }

    drawCounter(ctx) {
        ctx.font = (this.size * 0.5) + "px Arial";
        ctx.fillStyle = '#8ad000';
        ctx.fillText(this.counter, this.x - (this.size * 0.2), this.y + (this.size * 0.2));
    }

    drawSplatters(ctx) {
        // Draw the splatters
        for (let splatter of this.splatters) {
            let gradient = ctx.createRadialGradient(splatter.x + splatter.size * 0.5, splatter.y + splatter.size * 0.5, splatter.size * 0.3, splatter.x - splatter.size * 0.4, splatter.y + splatter.size * 0.9, splatter.size * 6.6);
            gradient.addColorStop(0.1, '#efea63');
            gradient.addColorStop(0.2, '#8ad000');
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
    if (!BOUNCE_OFF_EDGES) {
        droplets.filter(function (droplet) {
            return droplet.y + droplet.size >= CANVAS_HEIGHT
                || droplet.x + droplet.size >= CANVAS_WIDTH
                || droplet.y - droplet.size <= 0 || droplet.x - droplet.size <= 0;
        }).forEach(element => {
            if (element && element.counter > maxCounter) {
                maxCounter = element.counter;
            }
        });

        //when the droplet goes off the screen, remove it from the array
        droplets = droplets.filter(function (droplet) {
            return droplet.y + droplet.size < CANVAS_HEIGHT && droplet.x + droplet.size < CANVAS_WIDTH && droplet.y - droplet.size > 0 && droplet.x - droplet.size > 0;
        });
    }
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
    return r(1, 15);
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
        if (tiltX < -MAX_TILT) {
            tiltX = -MAX_TILT;
        }
    } else if (event.key === 'ArrowRight') {
        tiltX += 1;
        if (tiltX > MAX_TILT) {
            tiltX = MAX_TILT;
        }
    } else if (event.key === 'ArrowUp') {
        tiltY += -1;
        if (tiltY < -MAX_TILT) {
            tiltY = -MAX_TILT;
        }
    } else if (event.key === 'ArrowDown') {
        tiltY += 1;
        if (tiltY > MAX_TILT) {
            tiltY = MAX_TILT;
        }
    }
    if (event.key === ' ') {
        droplets.push(new Droplet(rPosX(), rPosY(), rSize()));
    }
});

window.addEventListener('keyup', function (event) {
    // if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    //     tiltX = 0;
    // }
    // if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
    //     tiltY = 0;
    // }
});

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();