/* game.js */
(() => {
  'use strict';

  // Configurações principais. Usa as configurações do modal se definidas.
  const CONFIG = {
    FPS: 30, 
    FRICTION: 0.7,
    GAME_LIVES: 3,
    LASER_DIST: 0.6,
    LASER_EXPLODE_DUR: 0.1,
    LASER_MAX: 10,
    LASER_SPD: 500,
    ROID_JAG: 0.4,
    ROID_PTS_LGE: 20,
    ROID_PTS_MED: 50,
    ROID_PTS_SML: 100,
    ROID_NUM: 3,
    ROID_SIZE: 100,
    ROID_SPD: 50,
    ROID_VERT: 10,
    SAVE_KEY_SCORE: "highscore",
    SHIP_BLINK_DUR: 0.1,
    SHIP_EXPLODE_DUR: 0.3,
    SHIP_INV_DUR: 3,
    SHIP_SIZE: 30,
    SHIP_THRUST: 5,
    SHIP_TURN_SPD: 360,
    SHOW_BOUNDING: false,
    SHOW_CENTRE_DOT: false,
    MUSIC_ON: window.GAME_CONFIG ? window.GAME_CONFIG.MUSIC_ON : true,
    SOUND_ON: window.GAME_CONFIG ? window.GAME_CONFIG.SOUND_ON : true,
    TEXT_FADE_TIME: 2.5,
    TEXT_SIZE: 35,
    // A dificuldade pode influenciar a quantidade de asteroides
    DIFFICULTY: window.GAME_CONFIG ? window.GAME_CONFIG.DIFFICULTY : 5
  };

  // Canvas e contexto
  const canv = document.getElementById("gameCanvas");
  const ctx = canv.getContext("2d");

  // Carrega imagens dos recursos
  const shipImg = new Image();
  shipImg.src = "assets/ship.png";

  const cryptoImgs = [];
  const cryptoSrcs = [
    "assets/crypto1.png", "assets/crypto2.png", "assets/crypto3.png", "assets/crypto4.png",
    "assets/crypto5.png", "assets/crypto6.png", "assets/crypto7.png", "assets/crypto8.png"
  ];
  cryptoSrcs.forEach(src => {
    const img = new Image();
    img.src = src;
    cryptoImgs.push(img);
  });

  // Funções de efeitos neon
  const applyGlow = (color = "#00eaff") => {
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
  };
  const resetGlow = () => {
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
  };

  // Classes de áudio
  class Sound {
    constructor(src, maxStreams = 1, vol = 1.0) {
      this.streamNum = 0;
      this.streams = [];
      for (let i = 0; i < maxStreams; i++) {
        const audio = new Audio(src);
        audio.volume = vol;
        this.streams.push(audio);
      }
    }
    play() {
      if (CONFIG.SOUND_ON) {
        this.streamNum = (this.streamNum + 1) % this.streams.length;
        this.streams[this.streamNum].play();
      }
    }
    stop() {
      this.streams[this.streamNum].pause();
      this.streams[this.streamNum].currentTime = 0;
    }
  }

  class Music {
    constructor(srcLow, srcHigh) {
      this.soundLow = new Audio(srcLow);
      this.soundHigh = new Audio(srcHigh);
      this.low = true;
      this.tempo = 1.0;
      this.beatTime = 0;
    }
    play() {
      if (CONFIG.MUSIC_ON) {
        if (this.low) {
          this.soundLow.play();
        } else {
          this.soundHigh.play();
        }
        this.low = !this.low;
      }
    }
    setAsteroidRatio(ratio) {
      this.tempo = 1.0 - 0.75 * (1.0 - ratio);
    }
    tick() {
      if (this.beatTime === 0) {
        this.play();
        this.beatTime = Math.ceil(this.tempo * CONFIG.FPS);
      } else {
        this.beatTime--;
      }
    }
  }

  // Instâncias de áudio
  const fxExplode = new Sound("assets/explode.m4a");
  const fxHit = new Sound("assets/hit.m4a", 5);
  const fxLaser = new Sound("assets/laser.m4a", 5, 0.5);
  const fxThrust = new Sound("assets/thrust.m4a");
  const music = new Music("assets/music.m4a", "assets/music.m4a");

  let roidsLeft, roidsTotal;
  let level, lives, roids, score, scoreHigh, ship, text, textAlpha;

  // Inicia o jogo
  const newGame = () => {
    level = 0;
    lives = CONFIG.GAME_LIVES;
    score = 0;
    ship = newShip();
    const scoreStr = localStorage.getItem(CONFIG.SAVE_KEY_SCORE);
    scoreHigh = scoreStr ? parseInt(scoreStr) : 0;
    newLevel();
  };

  const newLevel = () => {
    music.setAsteroidRatio(1);
    text = "Level " + (level + 1);
    textAlpha = 1.0;
    createAsteroidBelt();
  };

  const newShip = () => ({
    x: canv.width / 2,
    y: canv.height / 2,
    a: 90 * Math.PI / 180,
    r: CONFIG.SHIP_SIZE,
    blinkNum: Math.ceil(CONFIG.SHIP_INV_DUR / CONFIG.SHIP_BLINK_DUR),
    blinkTime: Math.ceil(CONFIG.SHIP_BLINK_DUR * CONFIG.FPS),
    canShoot: true,
    dead: false,
    explodeTime: 0,
    lasers: [],
    rot: 0,
    thrusting: false,
    thrust: { x: 0, y: 0 }
  });

  const createAsteroidBelt = () => {
    roids = [];
    // A dificuldade pode aumentar a quantidade de asteroides
    const asteroidCount = CONFIG.ROID_NUM + level + Math.floor(CONFIG.DIFFICULTY / 5);
    roidsTotal = asteroidCount * 7;
    roidsLeft = roidsTotal;
    let x, y;
    for (let i = 0; i < asteroidCount; i++) {
      do {
        x = Math.floor(Math.random() * canv.width);
        y = Math.floor(Math.random() * canv.height);
      } while (distBetweenPoints(ship.x, ship.y, x, y) < CONFIG.ROID_SIZE * 2 + ship.r);
      roids.push(newAsteroid(x, y, Math.ceil(CONFIG.ROID_SIZE / 2)));
    }
  };

  const newAsteroid = (x, y, r) => {
    const lvlMult = 1 + 0.1 * level;
    const roid = {
      x: x,
      y: y,
      xv: (Math.random() * CONFIG.ROID_SPD * lvlMult / CONFIG.FPS) * (Math.random() < 0.5 ? 1 : -1),
      yv: (Math.random() * CONFIG.ROID_SPD * lvlMult / CONFIG.FPS) * (Math.random() < 0.5 ? 1 : -1),
      a: Math.random() * Math.PI * 2,
      r: r,
      offs: [],
      vert: Math.floor(Math.random() * (CONFIG.ROID_VERT + 1) + CONFIG.ROID_VERT / 2)
    };
    for (let i = 0; i < roid.vert; i++) {
      roid.offs.push(Math.random() * CONFIG.ROID_JAG * 2 + 1 - CONFIG.ROID_JAG);
    }
    roid.img = cryptoImgs[Math.floor(Math.random() * cryptoImgs.length)];
    return roid;
  };

  const destroyAsteroid = index => {
    const { x, y, r } = roids[index];
    if (r === Math.ceil(CONFIG.ROID_SIZE / 2)) {
      roids.push(newAsteroid(x, y, Math.ceil(CONFIG.ROID_SIZE / 4)));
      roids.push(newAsteroid(x, y, Math.ceil(CONFIG.ROID_SIZE / 4)));
      score += CONFIG.ROID_PTS_LGE;
    } else if (r === Math.ceil(CONFIG.ROID_SIZE / 4)) {
      roids.push(newAsteroid(x, y, Math.ceil(CONFIG.ROID_SIZE / 8)));
      roids.push(newAsteroid(x, y, Math.ceil(CONFIG.ROID_SIZE / 8)));
      score += CONFIG.ROID_PTS_MED;
    } else {
      score += CONFIG.ROID_PTS_SML;
    }
    if (score > scoreHigh) {
      scoreHigh = score;
      localStorage.setItem(CONFIG.SAVE_KEY_SCORE, scoreHigh);
    }
    roids.splice(index, 1);
    fxHit.play();
    roidsLeft--;
    music.setAsteroidRatio(roidsLeft / roidsTotal);
    if (roids.length === 0) {
      level++;
      newLevel();
    }
  };

  const distBetweenPoints = (x1, y1, x2, y2) =>
    Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  const drawShip = (x, y, a) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-a + Math.PI / 2);
    applyGlow("#00eaff");
    ctx.drawImage(shipImg, -CONFIG.SHIP_SIZE, -CONFIG.SHIP_SIZE, CONFIG.SHIP_SIZE * 2, CONFIG.SHIP_SIZE * 2);
    resetGlow();
    ctx.restore();
  };

  const explodeShip = () => {
    ship.explodeTime = Math.ceil(CONFIG.SHIP_EXPLODE_DUR * CONFIG.FPS);
    fxExplode.play();
  };

  const gameOver = () => {
    ship.dead = true;
    text = "Game Over";
    textAlpha = 1.0;
  };

  // Eventos de teclado utilizando event.key
  const keyDown = ev => {
    if (ship.dead) return;
    switch (ev.key) {
      case " ":
        shootLaser();
        break;
      case "ArrowLeft":
        ship.rot = CONFIG.SHIP_TURN_SPD / 180 * Math.PI / CONFIG.FPS;
        break;
      case "ArrowUp":
        ship.thrusting = true;
        break;
      case "ArrowRight":
        ship.rot = -CONFIG.SHIP_TURN_SPD / 180 * Math.PI / CONFIG.FPS;
        break;
    }
  };

  const keyUp = ev => {
    if (ship.dead) return;
    switch (ev.key) {
      case " ":
        ship.canShoot = true;
        break;
      case "ArrowLeft":
        ship.rot = 0;
        break;
      case "ArrowUp":
        ship.thrusting = false;
        break;
      case "ArrowRight":
        ship.rot = 0;
        break;
    }
  };

  const shootLaser = () => {
    if (ship.canShoot && ship.lasers.length < CONFIG.LASER_MAX) {
      ship.lasers.push({
        x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
        y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a),
        xv: CONFIG.LASER_SPD * Math.cos(ship.a) / CONFIG.FPS,
        yv: -CONFIG.LASER_SPD * Math.sin(ship.a) / CONFIG.FPS,
        dist: 0,
        explodeTime: 0
      });
      fxLaser.play();
    }
    ship.canShoot = false;
  };

  // Loop principal com requestAnimationFrame
  const update = () => {
    const blinkOn = ship.blinkNum % 2 === 0;
    const exploding = ship.explodeTime > 0;
    music.tick();

    // Limpa o canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canv.width, canv.height);

    // Desenha os asteroides
    roids.forEach(roid => {
      const { a, r, x, y } = roid;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      applyGlow("#ff00ff");
      ctx.drawImage(roid.img, -r, -r, r * 2, r * 2);
      resetGlow();
      ctx.restore();
      if (CONFIG.SHOW_BOUNDING) {
        ctx.strokeStyle = "lime";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2, false);
        ctx.stroke();
      }
    });

    // Efeito de empuxo da nave
    if (ship.thrusting && !ship.dead) {
      ship.thrust.x += CONFIG.SHIP_THRUST * Math.cos(ship.a) / CONFIG.FPS;
      ship.thrust.y -= CONFIG.SHIP_THRUST * Math.sin(ship.a) / CONFIG.FPS;
      fxThrust.play();
      if (!exploding && blinkOn) {
        ctx.save();
        applyGlow("#00ff00");
        ctx.fillStyle = "rgba(255,0,0,0.8)";
        ctx.beginPath();
        ctx.moveTo(
          ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
          ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
        );
        ctx.lineTo(
          ship.x - ship.r * (5 / 3) * Math.cos(ship.a),
          ship.y + ship.r * (5 / 3) * Math.sin(ship.a)
        );
        ctx.lineTo(
          ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
          ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
        );
        ctx.closePath();
        ctx.fill();
        resetGlow();
        ctx.restore();
      }
    } else {
      ship.thrust.x -= CONFIG.FRICTION * ship.thrust.x / CONFIG.FPS;
      ship.thrust.y -= CONFIG.FRICTION * ship.thrust.y / CONFIG.FPS;
      fxThrust.stop();
    }

    // Desenha a nave (ou a explosão, se estiver explodindo)
    if (!exploding) {
      if (blinkOn && !ship.dead) {
        drawShip(ship.x, ship.y, ship.a);
      }
      if (ship.blinkNum > 0) {
        ship.blinkTime--;
        if (ship.blinkTime === 0) {
          ship.blinkTime = Math.ceil(CONFIG.SHIP_BLINK_DUR * CONFIG.FPS);
          ship.blinkNum--;
        }
      }
    } else {
      const explosionColors = ["#ff0055", "#ff5500", "#ffaa00", "#ffff00", "#ffffff"];
      explosionColors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * (1.7 - 0.2 * i), 0, Math.PI * 2, false);
        ctx.fill();
      });
    }

    if (CONFIG.SHOW_CENTRE_DOT) {
      ctx.fillStyle = "red";
      ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);
    }

    // Desenha os lasers
    ship.lasers.forEach(laser => {
      if (laser.explodeTime === 0) {
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(laser.x, laser.y, CONFIG.SHIP_SIZE / 15, 0, Math.PI * 2, false);
        ctx.fill();
      } else {
        ctx.fillStyle = "#ff4500";
        ctx.beginPath();
        ctx.arc(laser.x, laser.y, ship.r * 0.75, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "#ff9999";
        ctx.beginPath();
        ctx.arc(laser.x, laser.y, ship.r * 0.5, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = "#ff66cc";
        ctx.beginPath();
        ctx.arc(laser.x, laser.y, ship.r * 0.25, 0, Math.PI * 2, false);
        ctx.fill();
      }
    });

    // Exibe textos (nível, game over, etc.)
    if (textAlpha >= 0) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `rgba(255,255,255,${textAlpha})`;
      ctx.font = `small-caps ${CONFIG.TEXT_SIZE}px Orbitron`;
      ctx.fillText(text, canv.width / 2, canv.height * 0.75);
      textAlpha -= (1.0 / CONFIG.TEXT_FADE_TIME / CONFIG.FPS);
    } else if (ship.dead) {
      newGame();
    }

    // Desenha as vidas (mini-naves)
    for (let i = 0; i < lives; i++) {
      drawShip(CONFIG.SHIP_SIZE + i * CONFIG.SHIP_SIZE * 1.2, CONFIG.SHIP_SIZE, 0.5 * Math.PI);
    }

    // Desenha a pontuação e o high score
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = `${CONFIG.TEXT_SIZE}px Orbitron`;
    ctx.fillText(score, canv.width - CONFIG.SHIP_SIZE / 2, CONFIG.SHIP_SIZE);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = `${CONFIG.TEXT_SIZE * 0.75}px Orbitron`;
    ctx.fillText("BEST " + scoreHigh, canv.width / 2, CONFIG.SHIP_SIZE);

    // Verifica colisões entre lasers e asteroides
    for (let i = roids.length - 1; i >= 0; i--) {
      const { x: ax, y: ay, r: ar } = roids[i];
      for (let j = ship.lasers.length - 1; j >= 0; j--) {
        const { x: lx, y: ly } = ship.lasers[j];
        if (ship.lasers[j].explodeTime === 0 && distBetweenPoints(ax, ay, lx, ly) < ar) {
          destroyAsteroid(i);
          ship.lasers[j].explodeTime = Math.ceil(CONFIG.LASER_EXPLODE_DUR * CONFIG.FPS);
          break;
        }
      }
    }

    if (!exploding) {
      if (ship.blinkNum === 0 && !ship.dead) {
        for (let i = 0; i < roids.length; i++) {
          if (distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) < ship.r + roids[i].r) {
            explodeShip();
            destroyAsteroid(i);
            break;
          }
        }
      }
      ship.a += ship.rot;
      ship.x += ship.thrust.x;
      ship.y += ship.thrust.y;
    } else {
      ship.explodeTime--;
      if (ship.explodeTime === 0) {
        lives--;
        ship = (lives === 0) ? (gameOver(), newShip()) : newShip();
      }
    }

    // Screen wrap para a nave
    if (ship.x < 0 - ship.r) ship.x = canv.width + ship.r;
    else if (ship.x > canv.width + ship.r) ship.x = 0 - ship.r;
    if (ship.y < 0 - ship.r) ship.y = canv.height + ship.r;
    else if (ship.y > canv.height + ship.r) ship.y = 0 - ship.r;

    // Atualiza os lasers
    for (let i = ship.lasers.length - 1; i >= 0; i--) {
      if (ship.lasers[i].dist > CONFIG.LASER_DIST * canv.width) {
        ship.lasers.splice(i, 1);
        continue;
      }
      if (ship.lasers[i].explodeTime > 0) {
        ship.lasers[i].explodeTime--;
        if (ship.lasers[i].explodeTime === 0) {
          ship.lasers.splice(i, 1);
          continue;
        }
      } else {
        ship.lasers[i].x += ship.lasers[i].xv;
        ship.lasers[i].y += ship.lasers[i].yv;
        ship.lasers[i].dist += Math.sqrt(ship.lasers[i].xv ** 2 + ship.lasers[i].yv ** 2);
      }
      if (ship.lasers[i].x < 0) ship.lasers[i].x = canv.width;
      else if (ship.lasers[i].x > canv.width) ship.lasers[i].x = 0;
      if (ship.lasers[i].y < 0) ship.lasers[i].y = canv.height;
      else if (ship.lasers[i].y > canv.height) ship.lasers[i].y = 0;
    }

    // Atualiza os asteroides (screen wrap)
    roids.forEach(roid => {
      roid.x += roid.xv;
      roid.y += roid.yv;
      if (roid.x < 0 - roid.r) roid.x = canv.width + roid.r;
      else if (roid.x > canv.width + roid.r) roid.x = 0 - roid.r;
      if (roid.y < 0 - roid.r) roid.y = canv.height + roid.r;
      else if (roid.y > canv.height + roid.r) roid.y = 0 - roid.r;
    });

    requestAnimationFrame(update);
  };

  // Registra os eventos de teclado
  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);

  // Inicia o jogo e o loop de animação
  newGame();
  requestAnimationFrame(update);
})();
