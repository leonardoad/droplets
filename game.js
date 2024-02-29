let droplets = [];
let tiltX = 0;
let tiltY = 0;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MAX_TILT = 5;
const BOUNCE_OFF_EDGES = false;

class Droplet {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed(size);
        this.vx = tiltX * this.speed; // x velocity
        this.vy = tiltY * this.speed; // y velocity
        this.maxSpeed = size / 10;
    }

    update() {
        // Update velocity based on tilt
        this.updateVel('vy', tiltY);
        this.updateVel('vx', tiltX);

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
    updateVel(prop, tilt) {
        this[prop] += tilt * (this.speed);
        if (tilt === 0) {
            this[prop] = tilt * this.speed;
        }
        if (this[prop] > this.maxSpeed) {
            this[prop] = this.maxSpeed;
        }
        if (this[prop] < -this.maxSpeed) {
            this[prop] = -this.maxSpeed;
        }
    }
    draw(ctx) {

        this.drawShadow(ctx);
        this.drawDroplet(ctx);
        this.drawReflection(ctx);

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
        ctx.fillStyle = '#f4f1f4';
        ctx.fill();

        // Draw the ::after pseudo-element
        ctx.beginPath();
        ctx.ellipse(this.x - this.size / 3.9, this.y - this.size / 1.4, this.size / 10, this.size / 4, Math.PI / 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#f4f1f4';
        ctx.fill();
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


            let distance = Math.sqrt((droplet1.x - droplet2.x) ** 2 + (droplet1.y - droplet2.y) ** 2);
            if (distance < droplet1.size + droplet2.size) {
                let newSize = Math.sqrt(droplet1.size * droplet1.size + droplet2.size * droplet2.size);
                droplets.splice(i, 1);
                droplets.splice(j - 1, 1); // j - 1 because we just removed an element at position i

                // limit the size to the maximum size of a circle using the canvas width and height
                const maxSize = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 2;
                if (newSize <= maxSize) {
                    droplets.push(new Droplet(newDroplet.x, newDroplet.y, newSize));
                }
            }
        }
    }
}
function update() {
    for (let droplet of droplets) {
        droplet.update();
    }

    if (!BOUNCE_OFF_EDGES) {
        //when the droplet goes off the screen, remove it from the array
        droplets = droplets.filter(function (droplet) {
            return droplet.y < CANVAS_HEIGHT && droplet.x < CANVAS_WIDTH && droplet.y > 0 && droplet.x > 0;
        });
    }

    //if there are less than 100 droplets, add a new one
    if (droplets.length < 2) {
        // droplets.push(new Droplet(rPosX(), rPosY(), rSize()));
    }
    joinDroplets();
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
    return r(1, 20);
}
function rSize() {
    return r(1, 20);
}

function speed(size) {
    return size / 100;
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