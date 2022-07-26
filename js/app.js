//get canvas
const cnv = document.getElementById("game");
const ctx = cnv.getContext("2d");

//game vars and consts
let frame = 0;
const DEGREE = Math.PI / 180;

// load image
const sprite = new Image();
sprite.src = "img/sprite.png";

//load audio
const sound = {
  die: new Audio("./sound/sfx_die.wav"),
  flap: new Audio("./sound/sfx_flap.wav"),
  hit: new Audio("./sound/sfx_hit.wav"),
  point: new Audio("./sound/sfx_point.wav"),
  swooshing: new Audio("./sound/sfx_swooshing.wav"),
};

//background
const bg = {
  sX: 0,
  sY: 0,
  w: 275,
  h: 226,
  x: 0,
  y: cnv.clientHeight - 226,

  draw() {
    ctx.drawImage(
      sprite,
      this.sX,
      this.sY,
      this.w,
      this.h,
      this.x,
      this.y,
      this.w,
      this.h
    );
    ctx.drawImage(
      sprite,
      this.sX,
      this.sY,
      this.w,
      this.h,
      this.x + this.w,
      this.y,
      this.w,
      this.h
    );
  },
};

//foreground
const fg = {
  sX: 276,
  sY: 0,
  w: 224,
  h: 112,
  x: 0,
  y: cnv.clientHeight - 112,
  dx: 2,
  draw() {
    ctx.drawImage(
      sprite,
      this.sX,
      this.sY,
      this.w,
      this.h,
      this.x,
      this.y,
      this.w,
      this.h
    );
    ctx.drawImage(
      sprite,
      this.sX,
      this.sY,
      this.w,
      this.h,
      this.x + this.w,
      this.y,
      this.w,
      this.h
    );
  },
  update() {
    if (state.current == state.game) {
      this.x = (this.x - this.dx) % (this.w / 2);
    }
  },
};

//bird
const bird = {
  animation: [
    { sX: 276, sY: 112 },
    { sX: 276, sY: 139 },
    { sX: 276, sY: 164 },
    { sX: 276, sY: 139 },
  ],
  x: 50,
  y: 150,
  w: 34,
  h: 26,
  speed: 0,
  gravity: 0.25,
  jump: 4.6,
  rotation: 0,
  radius: 12,

  frame: 0,

  draw() {
    let bird = this.animation[this.frame];
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.drawImage(
      sprite,
      bird.sX,
      bird.sY,
      this.w,
      this.h,
      -this.w / 2,
      -this.h / 2,
      this.w,
      this.h
    );

    ctx.restore();
  },
  flap() {
    this.speed = -this.jump;
  },
  update() {
    const period = state.current == state.getReady ? 10 : 5;
    this.frame += frame % period == 0 ? 1 : 0;
    this.frame %= this.animation.length;

    if (state.current == state.getReady) {
      this.y = 150;
      this.rotation = 0;
    } else {
      this.speed += this.gravity;
      this.y += this.speed;

      if (this.y + this.h / 2 >= cnv.clientHeight - fg.h) {
        this.y = cnv.clientHeight - fg.h - this.h / 2;
        if (state.current == state.game) {
          sound.die.play();
          state.current = state.gameOver;
        }
      }

      if (this.speed >= this.jump) {
        this.rotation = 90 * DEGREE;
        this.frame = 1;
      } else {
        this.rotation = -25 * DEGREE;
      }
    }
  },
  resetSpeed() {
    this.speed = 0;
  },
};

//get ready messege
const readyMessege = {
  sX: 0,
  sY: 228,
  w: 173,
  h: 152,
  x: cnv.clientWidth / 2 - 173 / 2,
  y: 80,

  draw() {
    if (state.current == state.getReady) {
      ctx.drawImage(
        sprite,
        this.sX,
        this.sY,
        this.w,
        this.h,
        this.x,
        this.y,
        this.w,
        this.h
      );
    }
  },
};

//pipe
const pipes = {
  posittion: [],
  top: {
    sX: 553,
    sY: 0,
  },
  bottom: {
    sX: 502,
    sY: 0,
  },
  w: 53,
  h: 400,
  gap: 85,
  maxYPos: -150,
  dx: 2,

  draw() {
    for (let i = 0; i < this.posittion.length; i++) {
      const p = this.posittion[i];
      let topYPos = p.y;
      let bottomYPos = p.y + this.h + this.gap;
      ctx.drawImage(
        sprite,
        this.top.sX,
        this.top.sY,
        this.w,
        this.h,
        p.x,
        topYPos,
        this.w,
        this.h
      );
      ctx.drawImage(
        sprite,
        this.bottom.sX,
        this.bottom.sY,
        this.w,
        this.h,
        p.x,
        bottomYPos,
        this.w,
        this.h
      );
    }
  },
  update() {
    if (state.current != state.game) return;
    if (frame % 100 == 0) {
      this.posittion.push({
        x: cnv.clientWidth,
        y: this.maxYPos * (Math.random() + 1),
      });
    }
    for (let i = 0; i < this.posittion.length; i++) {
      const p = this.posittion[i];
      //check collision top
      if (
        bird.x + bird.radius >= p.x &&
        bird.x - bird.radius <= p.x + this.w &&
        bird.y - bird.radius <= p.y + this.h
      ) {
        sound.hit.play();
        state.current = state.gameOver;
      }
      //check collision bottom
      if (
        bird.x + bird.radius >= p.x &&
        bird.x - bird.radius <= p.x + this.w &&
        bird.y + bird.radius >= p.y + this.h + this.gap
      ) {
        sound.hit.play();
        state.current = state.gameOver;
      }
      p.x -= this.dx;

      if (p.x + this.w <= 0) {
        this.posittion.shift();
        score.value++;
        score.best = Math.max(score.value, score.best);
        localStorage.setItem("best", score.best);
        sound.point.play();
      }
    }
  },
  reset() {
    this.posittion.splice(0, this.posittion.length);
  },
};
//button start
const startBtn = {
  x: 120,
  y: 263,
  w: 83,
  h: 29,
};

//score
const score = {
  best: parseInt(localStorage.getItem("best")) || 0,
  value: 0,

  draw() {
    ctx.fillStyle = "#fff";
    ctx.fillStroke = "#000";
    if (state.current == state.game) {
      ctx.lineWidth = 2;
      ctx.font = "35px Teko";
      ctx.fillText(this.value, cnv.clientWidth / 2, 50);
      ctx.strokeText(this.value, cnv.clientWidth / 2, 50);
    } else if (state.current == state.gameOver) {
      ctx.lineWidth = 1;
      ctx.font = "25px Teko";
      ctx.fillText(this.value, 225, 186);
      ctx.strokeText(this.value, 225, 186);
      ctx.fillText(this.best, 225, 228);
      ctx.strokeText(this.best, 225, 228);
    }
  },
  reset() {
    this.value = 0;
  },
};
//control game
cnv.addEventListener("click", (e) => {
  switch (state.current) {
    case state.getReady:
      state.current = state.game;
      sound.swooshing.play();
      break;
    case state.game:
      bird.flap();
      sound.flap.play();
      break;
    case state.gameOver:
      if (
        e.offsetX >= startBtn.x &&
        e.offsetX <= startBtn.x + startBtn.w &&
        e.offsetY >= startBtn.y &&
        e.offsetX <= startBtn.y + startBtn.h
      ) {
        bird.resetSpeed();
        pipes.reset();
        score.reset();
        state.current = state.getReady;
      }
      break;
  }
});

// game state
const state = {
  current: 0,
  getReady: 0,
  game: 1,
  gameOver: 2,
};

//gameover messege
const gameOver = {
  sX: 175,
  sY: 228,
  w: 225,
  h: 202,
  x: cnv.clientWidth / 2 - 225 / 2,
  y: 90,

  draw() {
    if (state.current == state.gameOver) {
      ctx.drawImage(
        sprite,
        this.sX,
        this.sY,
        this.w,
        this.h,
        this.x,
        this.y,
        this.w,
        this.h
      );
    }
  },
};

//draw
function draw() {
  ctx.fillStyle = "#70c5ce";
  ctx.fillRect(0, 0, cnv.clientWidth, cnv.clientHeight);

  bg.draw();
  pipes.draw();
  fg.draw();
  bird.draw();
  readyMessege.draw();
  gameOver.draw();
  score.draw();
}

//update
function update() {
  bird.update();
  fg.update();
  pipes.update();
}

//Loop
function loop() {
  update();
  draw();
  frame++;

  requestAnimationFrame(loop);
}
loop();
