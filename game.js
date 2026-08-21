'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
class EstrellaFugaz {
  constructor(x, y, size = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;
    this.life = 6;
    this.ttl = this.life;

    // El doble de rápida que un asteroide normal
    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] * 2 + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.5, 1.5);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new EstrellaFugazFragment(this.x, this.y, this.size - 1),
      new EstrellaFugazFragment(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    // Parpadeo antes de expirar
    if (this.ttl < 2 && Math.floor(this.ttl * 6) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Estela azul
    ctx.strokeStyle = 'rgba(68, 221, 255, 0.35)';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(-this.vx * 0.06, -this.vy * 0.06);
    ctx.lineTo(0, 0);
    ctx.stroke();

    ctx.rotate(this.rot);
    ctx.strokeStyle = '#4df';
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Fragmento de estrella fugaz ───────────────────────────────────────────────
class EstrellaFugazFragment {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;
    this.life = 4;
    this.ttl = this.life;

    // Rápidos como su estrella madre
    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] * 2 + rand(-20, 20);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-2, 2);
    this.rot = rand(0, Math.PI * 2);

    const n = randInt(6, 10);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  split() {
    return [];   // Los fragmentos ya no se dividen
  }

  draw() {
    // Parpadeo antes de expirar
    if (this.ttl < 1.5 && Math.floor(this.ttl * 6) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Estela
    ctx.strokeStyle = 'rgba(68, 187, 255, 0.3)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(-this.vx * 0.05, -this.vy * 0.05);
    ctx.lineTo(0, 0);
    ctx.stroke();

    ctx.rotate(this.rot);
    ctx.strokeStyle = '#4df';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Skins de la nave ──────────────────────────────────────────────────────────
const SKINS = [
  { name: 'CLÁSICA',      color: '#fff', thrustColor: 'rgba(255, 130, 0, 0.85)',   flameX: -8,
    verts: [[20, 0], [-12, -9], [-7, 0], [-12, 9]] },
  { name: 'INTERCEPTOR',  color: '#5f8', thrustColor: 'rgba(95, 255, 160, 0.85)',  flameX: -5,
    verts: [[22, 0], [2, -4], [-8, -8], [-4, 0], [-8, 8], [2, 4]] },
  { name: 'CAZA PESADO',  color: '#f84', thrustColor: 'rgba(255, 90, 40, 0.85)',   flameX: -9,
    verts: [[16, 0], [-4, -4], [-14, -11], [-9, 0], [-14, 11], [-4, 4]] },
  { name: 'FANTASMA',     color: 'rgba(210, 230, 255, 0.55)', thrustColor: 'rgba(210, 230, 255, 0.5)', flameX: -8,
    dash: [4, 3], lw: 1.2, hudColor: '#bdf',
    verts: [[20, 0], [-12, -9], [-7, 0], [-12, 9]] },
  { name: 'RAYO',         color: '#ff4', thrustColor: 'rgba(255, 240, 100, 0.85)', flameX: -6,
    verts: [[18, 0], [-2, -3], [-13, -10], [-5, 0], [-13, 10], [-2, 3]] },
  { name: 'ULTRAVIOLETA', color: '#c4f', thrustColor: 'rgba(196, 68, 255, 0.85)',  flameX: -6,
    verts: [[21, 0], [-10, -5], [-5, 0], [-10, 5]] },
];

const SKIN_KEY = 'asteroids_skin';

function loadSkinIndex() {
  try {
    const i = parseInt(localStorage.getItem(SKIN_KEY), 10);
    if (Number.isInteger(i) && i >= 0 && i < SKINS.length) return i;
  } catch (e) {}
  return 0;
}

let currentSkinIndex = loadSkinIndex();

function cycleSkin() {
  currentSkinIndex = (currentSkinIndex + 1) % SKINS.length;
  try { localStorage.setItem(SKIN_KEY, String(currentSkinIndex)); } catch (e) {}
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoostTimer = 0;   // power-up de velocidad activo
    this.tripleShotTimer = 0;   // power-up de triple disparo activo
    this.shieldTimer     = 0;   // power-up de escudo activo
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible      > 0) this.invincible      -= dt;
    if (this.shootCooldown   > 0) this.shootCooldown   -= dt;
    if (this.speedBoostTimer > 0) this.speedBoostTimer -= dt;
    if (this.tripleShotTimer > 0) this.tripleShotTimer -= dt;
    if (this.shieldTimer     > 0) this.shieldTimer     -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      const boost = this.speedBoostTimer > 0 ? 2 : 1;
      this.vx += Math.cos(this.angle) * THRUST * boost * dt;
      this.vy += Math.sin(this.angle) * THRUST * boost * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    // Triple disparo: abanico de 3 balas
    if (this.tripleShotTimer > 0) {
      const SPREAD = 0.16;
      return [
        new Bullet(ox, oy, this.angle - SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[currentSkinIndex];

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = this.speedBoostTimer > 0 ? '#4df'
                    : this.tripleShotTimer > 0 ? '#fa0' : skin.color;
    ctx.lineWidth   = skin.lw || 1.5;
    ctx.lineJoin    = 'round';
    if (skin.dash) ctx.setLineDash(skin.dash);

    // Silueta según la skin activa
    ctx.beginPath();
    ctx.moveTo(skin.verts[0][0], skin.verts[0][1]);
    for (let i = 1; i < skin.verts.length; i++)
      ctx.lineTo(skin.verts[i][0], skin.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(skin.flameX, -4);
      ctx.lineTo(skin.flameX - rand(6, 14), 0);
      ctx.lineTo(skin.flameX,  4);
      ctx.strokeStyle = skin.thrustColor;
      ctx.stroke();
    }

    // Burbuja de escudo (parpadea antes de expirar)
    if (this.shieldTimer > 0 &&
        !(this.shieldTimer < 2 && Math.floor(this.shieldTimer * 6) % 2 === 0)) {
      const pulse = 0.35 + 0.2 * Math.sin(Date.now() * 0.012);
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(80, 255, 160, ${pulse.toFixed(2)})`;
      ctx.lineWidth   = 2;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── PowerUp ───────────────────────────────────────────────────────────────────
class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x = x;
    this.y = y;
    this.type = type;   // 'speed' | 'triple' | 'shield'
    const angle = rand(0, Math.PI * 2);
    const speed = 40;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 12;
    this.ttl  = 8;   // segundos antes de desaparecer
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo antes de expirar
    if (this.ttl < 2 && Math.floor(this.ttl * 6) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = this.type === 'triple' ? '#fa0'
                    : this.type === 'shield' ? '#5fa' : '#4df';
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';

    if (this.type === 'triple') {
      // Tres líneas en abanico
      for (const a of [-0.5, 0, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(0, 7);
        ctx.lineTo(Math.sin(a) * -9, 7 - Math.cos(a) * 14);
        ctx.stroke();
      }
    } else if (this.type === 'shield') {
      // Escudo clásico
      ctx.beginPath();
      ctx.moveTo( 0, -8);
      ctx.lineTo( 7, -5);
      ctx.lineTo( 7,  1);
      ctx.lineTo( 0,  8);
      ctx.lineTo(-7,  1);
      ctx.lineTo(-7, -5);
      ctx.closePath();
      ctx.stroke();
    } else {
      // Rayo (símbolo de velocidad)
      ctx.beginPath();
      ctx.moveTo( 3, -8);
      ctx.lineTo(-4,  1);
      ctx.lineTo( 0,  1);
      ctx.lineTo(-3,  8);
      ctx.lineTo( 5, -2);
      ctx.lineTo( 1, -2);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps, estrellas;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let estrellaSpawnTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps  = [];
  estrellas = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  estrellaSpawnTimer = rand(8, 12);
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUps  = [];
  estrellas = [];
  ship.reset();
  estrellaSpawnTimer = rand(8, 12);
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function spawnEstrellaFugaz() {
  const SAFE_DIST = 130;
  const side = randInt(0, 3);
  let x, y;
  if (side === 0)      { x = rand(0, W); y = 0; }
  else if (side === 1) { x = W; y = rand(0, H); }
  else if (side === 2) { x = rand(0, W); y = H; }
  else                 { x = 0; y = rand(0, H); }
  // Nunca sobre el centro, donde reaparece la nave
  if (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST) return;
  estrellas.push(new EstrellaFugaz(x, y, randInt(2, 3)));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Cambiar de skin en cualquier momento
  if (pressed('KeyS')) cycleSkin();

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    estrellas.forEach(e => e.update(dt));
    estrellas = estrellas.filter(e => !e.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerUps.forEach(p => p.update(dt));
  estrellas.forEach(e => e.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerUps  = powerUps.filter(p => !p.dead);
  estrellas = estrellas.filter(e => !e.dead);

  // Aparición aleatoria de la estrella fugaz
  estrellaSpawnTimer -= dt;
  if (estrellaSpawnTimer <= 0) {
    estrellaSpawnTimer = rand(8, 12);
    if (Math.random() < 0.15) spawnEstrellaFugaz();
  }

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        // Probabilidad de soltar un power-up (velocidad, triple disparo o escudo: 33% cada uno)
        const drop = Math.random();
        if (drop < 1 / 3)       powerUps.push(new PowerUp(a.x, a.y, 'speed'));
        else if (drop < 2 / 3)  powerUps.push(new PowerUp(a.x, a.y, 'triple'));
        else                    powerUps.push(new PowerUp(a.x, a.y, 'shield'));
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bala vs estrella fugaz (da el doble de puntos)
  const newEstrellas = [];
  for (const b of bullets) {
    for (const e of estrellas) {
      if (!e.dead && !b.dead && dist(b, e) < e.radius) {
        b.dead = true;
        e.dead = true;
        score += POINTS[e.size] * 2;
        explode(e.x, e.y, e.size * 5);
        newEstrellas.push(...e.split());
      }
    }
  }
  estrellas = estrellas.filter(e => !e.dead).concat(newEstrellas);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs power-up
  for (const pu of powerUps) {
    if (!pu.dead && dist(ship, pu) < ship.radius + pu.radius) {
      pu.dead = true;
      if (pu.type === 'triple')      ship.tripleShotTimer = 5;
      else if (pu.type === 'shield') ship.shieldTimer     = 5;
      else                           ship.speedBoostTimer = 5;
    }
  }

  // Nave vs asteroide / estrella fugaz (ambas matan; el escudo absorbe el golpe)
  if (ship.invincible <= 0 && ship.shieldTimer <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
    for (const e of estrellas) {
      if (!e.dead && dist(ship, e) < ship.radius + e.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS[currentSkinIndex];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.hudColor || skin.color;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  let hudY = 46;
  if (ship.speedBoostTimer > 0) {
    ctx.fillStyle = '#4df';
    ctx.fillText(`VELOCIDAD ${ship.speedBoostTimer.toFixed(1)}s`, W / 2, hudY);
    ctx.fillStyle = '#fff';
    hudY += 20;
  }

  if (ship.tripleShotTimer > 0) {
    ctx.fillStyle = '#fa0';
    ctx.fillText(`TRIPLE DISPARO ${ship.tripleShotTimer.toFixed(1)}s`, W / 2, hudY);
    ctx.fillStyle = '#fff';
    hudY += 20;
  }

  if (ship.shieldTimer > 0) {
    ctx.fillStyle = '#5fa';
    ctx.fillText(`ESCUDO ${ship.shieldTimer.toFixed(1)}s`, W / 2, hudY);
    ctx.fillStyle = '#fff';
    hudY += 20;
  }

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`NAVE: ${SKINS[currentSkinIndex].name}  [S]`, 14, H - 14);
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  estrellas.forEach(e => e.draw());
  bullets.forEach(b => b.draw());
  powerUps.forEach(p => p.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
