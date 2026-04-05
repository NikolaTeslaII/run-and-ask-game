/**
 * ================================================================
 * GAME.JS - Core Engine "Hành Trình Tri Thức" - Professional Edition
 *
 * Tối ưu hoá:
 * - Procedural 3D character (không phải 1 cube đơn giản)
 * - Object Pooling cho obstacles, particles, coins
 * - Frustum Culling tự triển khai cho obstacles
 * - Frame-accurate input queue (không mất key press)
 * - DT clamped + adaptive quality
 * - Không Shadow Maps
 * - Track scrolling Pool (5 đoạn đường tái sử dụng)
 * - Particle system (dust trail, impact)
 * - Coin collect system
 * - Pause Menu
 * - Background particle canvas trên Start screen
 * ================================================================
 */

// ═══════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════
const C = {
    // Làn đường sát nhau — khoảng cách 2.2 units
    LANES: [-2.4, 0, 2.4],
    TRACK_W: 7.2,
    // Tốc độ chuyển làn cao → nhạy, không bị delay
    // Dùng snap khi đủ gần để loại bỏ cảm giác trễ
    LANE_LERP: 28,
    LANE_SNAP: 0.04,   // Snap threshold (units)

    // Spawn / Despawn
    SPAWN_Z: -65,
    DESPAWN_Z: 10,
    COIN_SPAWN_Z: -55,

    // Speed
    SPEED_START: 15,
    SPEED_ACCEL: 0.35,  // Increased from 0.25 (Faster ramp up)
    SPEED_MAX: 65,     // Increased from 55 (Higher skill ceiling)

    // Physics — nhảy nhạy hơn
    JUMP_FORCE: 13.5,
    GRAVITY: -32,
    PLAYER_Y: 1.05,
    SLIDE_DUR: 0.55,
    PLAYER_STAND_H: 2.1,   // Chiều cao player đứng (top)
    PLAYER_SLIDE_H: 0.85,  // Chiều cao player trượt (top)

    // Timings
    DT_MAX: 0.05,
    INVINCIBLE_DUR: 2.5,
    QUIZ_TIMEOUT: 12,

    // Track Pool
    SEG_LEN: 40,
    SEG_COUNT: 6,

    // Particle Pool size
    PARTICLE_POOL: 50,

    // Sky System (Urban/Sunny Style)
    SKY_MODES: [
        { name: 'Morning', bg: 0x87CEEB, fog: 0x87CEEB, ambient: 0.8, sun: 0.95 },
        { name: 'Daylight', bg: 0x4fc3f7, fog: 0x4fc3f7, ambient: 0.85, sun: 1.0 },
        { name: 'Afternoon', bg: 0xffb74d, fog: 0xffb74d, ambient: 0.7, sun: 0.85 },
        { name: 'Sunset', bg: 0xe67e22, fog: 0xe67e22, ambient: 0.6, sun: 0.75 },
    ],
    SKY_CYCLE_DUR: 25, // seconds per phase
};

// ═══════════════════════════════════════════
// 2. GAME STATE (single truth object)
// ═══════════════════════════════════════════
let G = {
    running: false,
    paused: false,
    quizActive: false,
    invincible: false,
    lastTime: 0,
    speed: C.SPEED_START,
    playerName: localStorage.getItem('httt_player_name') || ''
};
const DOM = {}; // Cached elements

function resetGameState(keepMeta = false) {
    const prevName = G.playerName;
    const prevMode = G.mode || 1;

    G = {
        // Core
        running: false,
        paused: false,
        quizActive: false,
        invincible: false,
        invTimer: 0,
        // Player
        laneIdx: 1,
        targetX: C.LANES[1],
        velY: 0,
        jumping: false,
        sliding: false,
        slideTimer: 0,
        // Input queue for frame-accurate requests
        inputQueue: [],
        // Score / Stats
        speed: C.SPEED_START,
        dist: 0,
        score: 0,
        coins: 0,
        correctAnswers: 0,
        maxSpeed: 0,
        // Quiz streak
        reviveStreak: 0,
        // Time
        lastTime: 0,
        spawnCooldown: 1.0,
        coinSpawnCd: 0.8,
        // Sky
        skyTime: 0,
        skyIdx: 0,
        stars: null,
        // Meta
        playerName: keepMeta ? prevName : (localStorage.getItem('httt_player_name') || ''),
        mode: keepMeta ? prevMode : 1,
        // Lane management to prevent clipping
        laneCooldown: [0, 0, 0],
        // Cached refs
        pc: {},
    };

    if (camera) {
        camera.position.set(0, 5, 10);
        camera.lookAt(0, 2, -5);
    }
    if (playerGroup) {
        playerGroup.position.set(C.LANES[1], C.PLAYER_Y, 0);
        playerGroup.rotation.set(0, 0, 0);
    }
}


// ═══════════════════════════════════════════
// 3. THREE.JS OBJECTS
// ═══════════════════════════════════════════
let scene, camera, renderer, clock;
let playerGroup, playerMat, playerAccentMat;
let trackSegs = [];
let envGroup;
const _tmpColA = new THREE.Color();
const _tmpColB = new THREE.Color();

// Object pools
let obstaclePool = [];
let coinPool = [];
let particlePool = [];

let activeObstacles = [];
let activeCoins = [];
let activeParticles = [];

let collisionObs = null;
let quizTimer = null;
let quizCountdown = null;

// ─── Shared Geometries ───────────────────────────────────────────
const GEO = {
    // Basic reusable
    coin: new THREE.CylinderGeometry(0.35, 0.35, 0.12, 12),
    particle: new THREE.SphereGeometry(0.12, 4, 3),
    // Building blocks
    box_s: new THREE.BoxGeometry(0.3, 0.3, 0.5),     // small detail
    cyl_pole: new THREE.CylinderGeometry(0.1, 0.1, 3, 6),
};

// ─── Shared Materials (Urban PBR Upgrade) ───────────────────────
const MAT = {
    coin: new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2, emissive: 0xffa500, emissiveIntensity: 0.3 }),
    particle: new THREE.MeshBasicMaterial({ color: 0xffd28f, transparent: true }),
    track: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 }),
    lane: new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 }),
    border: new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.3, roughness: 0.4 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 }),
    building: [
        new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.1, roughness: 0.8 }),
        new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.1, roughness: 0.7 }),
    ],
    window: new THREE.MeshStandardMaterial({ color: 0xaaddff, metalness: 0.5, roughness: 0.1 }),
    // Obstacle Materials
    red: new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.5 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xf57c00, roughness: 0.4 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.3 }),
    white: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 0.8, roughness: 0.2 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x2980b9, roughness: 0.4 }),
};

/**
 * OBS_TYPES — Định nghĩa các kiểu chướng ngại vật
 * Mỗi type là một hàm builder trả về THREE.Group
 * và metadata cho collision detection:
 *   slideBottom: y-position của cạnh dưới cùng của obstacle
 *                Nếu player đang slide (top ~0.95), slideBottom > 0.95 → có thể chui qua
 *   jumpTop: chiều cao tối thiểu player cần nhảy TỚI để né
 *   fullBlock: không thể né bằng bất kỳ cách nào (chỉ đổi làn)
 */
const OBS_BUILDERS = [
    // 0: STATIC TRAIN (Subway classic) - Long, can jump on roof
    {
        lbl: 'Static Train',
        hitbox: { dx: 1.0, dy: 2.2, dz: 6.0, yOff: 1.1 },
        isPlatform: true,
        roofHeight: 2.3,
        length: 12.0,
        moveSpeed: 0,
        laneBlock: 4.5, // Stop spawning in this lane for 4.5s
        build() {
            const g = new THREE.Group();
            // Main body
            const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.3, 11.5), MAT.dark);
            body.position.y = 1.25; g.add(body);
            // Front window (Cyber blue)
            const win = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.0, 0.1), MAT.window);
            win.position.set(0, 1.5, -5.76); g.add(win);
            // Side detailing (Iron Panels)
            for(let i=-4.5; i<=4.5; i+=2.25) {
                const s = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.4, 0.9), MAT.metal);
                s.position.set(0, 1.2, i); g.add(s);
            }
            // Roof lights (Now standard bright lights)
            for(let i=-5; i<=5; i+=2.5) {
                const l = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), MAT.yellow);
                l.position.set(0, 2.41, i); g.add(l);
            }
            // Wheels
            const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 12);
            for(let x of [-0.9, 0.9]) {
                for(let z of [-4, 4]) {
                    const w = new THREE.Mesh(wheelGeo, MAT.dark);
                    w.rotation.z = Math.PI/2;
                    w.position.set(x, 0.35, z); g.add(w);
                }
            }
            return g;
        }
    },
    // 1: BARRICADE (Subway classic) - Stripe patterns
    {
        lbl: 'Barricade',
        hitbox: { dx: 1.0, dy: 1.3, dz: 0.3, yOff: 0.65 },
        jumpTop: 1.4,
        build() {
            const g = new THREE.Group();
            // Horizontal rails
            const rail1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 0.25), MAT.orange);
            rail1.position.y = 0.6; g.add(rail1);
            const rail2 = rail1.clone();
            rail2.position.y = 1.2; g.add(rail2);
            // Stripe decals
            for(let x=-0.8; x<=0.8; x+=0.4) {
                const s = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.85, 0.28), MAT.white);
                s.position.set(x, 0.9, 0); g.add(s);
            }
            // Vertical legs
            [-0.9, 0.9].forEach(x => {
                const p = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.4, 0.3), MAT.metal);
                p.position.set(x, 0.7, 0); g.add(p);
                // Footer
                const f = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.5), MAT.dark);
                f.position.set(x, 0.08, 0); g.add(f);
            });
            return g;
        }
    },
    // 2: ARCHWAY (Subway classic) - Neon signage
    {
        lbl: 'Archway',
        hitbox: { dx: 1.1, dy: 0.6, dz: 0.3, yOff: 2.1 },
        slideBottom: 1.8,
        build() {
            const g = new THREE.Group();
            // Pillars
            const pill = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.8, 0.4), MAT.metal);
            pill.position.set(-1.6, 1.4, 0); g.add(pill);
            const pillR = pill.clone();
            pillR.position.set(1.6, 1.4, 0); g.add(pillR);
            // Top Arch
            const arch = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 0.6), MAT.red);
            arch.position.y = 2.4; g.add(arch);
            // Sign "DANGER" (Now bright orange/safe look)
            const sign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.1), MAT.orange);
            sign.position.set(0, 2.4, 0.31); g.add(sign);
            return g;
        }
    },
    // 3: MAINTENANCE TRUCK (Complex geometry)
    {
        lbl: 'Work Truck',
        hitbox: { dx: 1.0, dy: 1.8, dz: 3.0, yOff: 0.9 },
        isPlatform: true,
        roofHeight: 1.9,
        length: 6.5,
        laneBlock: 3.5,
        build() {
            const g = new THREE.Group();
            // Cabin
            const cab = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.4, 2.0), MAT.yellow);
            cab.position.y = 1.2; g.add(cab);
            // Windows
            const w = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 0.1), MAT.window);
            w.position.set(0, 1.4, -1.01); g.add(w);
            // Flatbed
            const bed = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 4.5), MAT.metal);
            bed.position.set(0, 0.4, 3.0); g.add(bed);
            // Safety lights
            const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), MAT.neonBlue);
            l.position.set(0, 1.95, 0); g.add(l);
            return g;
        }
    }
];

// ═══════════════════════════════════════════
// 4. INIT THREE.JS SCENE
// ═══════════════════════════════════════════
function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky Blue
    // Linear fog for a natural bright look
    scene.fog = new THREE.Fog(0x87CEEB, 20, 120);

    camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 130);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 2, -5);

    // Renderer: antialiase OFF (perf), pixelRatio capped at 2
    renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    renderer.sortObjects = false;
    renderer.autoClearColor = true;

    const root = document.getElementById('game-root');
    root.insertBefore(renderer.domElement, root.firstChild);
    renderer.domElement.style.cssText = 'position:absolute;inset:0;z-index:0;width:100% !important;height:100% !important;';

    // Lighting (Brighter for Daylight)
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.0);
    sun.position.set(8, 20, 5);
    scene.add(sun);
    // Warm fill light
    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-6, 4, -15);
    scene.add(fill);

    setupInput();

    // ── Stars (Particles) ──
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 2000; i++) {
        starPos.push((Math.random() - 0.5) * 600, (Math.random() - 0.5) * 400, (Math.random() - 0.5) * 800);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, transparent: true, opacity: 0.5 });
    G.stars = new THREE.Points(starGeo, starMat);
    scene.add(G.stars);

    window.addEventListener('resize', onResize);
    onResize();

    // Start async world building
    buildWorldAsync().then(() => {
        G.worldReady = true;
    }).catch(e => {
        console.error("Lỗi khởi tạo màn chơi:", e);
        G.worldReady = true; // ép chạy qua loading nếu có lỗi môi trường nhỏ
    });

    requestAnimationFrame(gameLoop);
}

async function buildWorldAsync() {
    buildPlayer();
    buildTrackPool();
    await buildEnvironmentAsync();
    await buildObjectPoolsAsync();
}

// ═══════════════════════════════════════════
// 5. PLAYER - Multi-part procedural character
// ═══════════════════════════════════════════
function buildPlayer() {
    playerGroup = new THREE.Group();
    // Use PBR materials for the player too
    playerMat = new THREE.MeshStandardMaterial({ color: 0x3498db, metalness: 0.2, roughness: 0.5 });
    playerAccentMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.4, roughness: 0.3 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4e342e });

    // 1. Torso (Hoodie style)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.6), playerMat);
    torso.position.y = 0.65; torso.name = 'torso'; playerGroup.add(torso);
    
    // Hoodie front pocket
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.1), playerMat);
    pocket.position.set(0, 0.45, -0.31); playerGroup.add(pocket);

    // 2. Head & Hair
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 0.6), skinMat);
    head.position.y = 1.5; head.name = 'head'; playerGroup.add(head);

    // Tóc / Hair (Subway style messy hair)
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.3, 0.62), hairMat);
    hair.position.y = 1.85; playerGroup.add(hair);

    // Mũ Lưỡi Trai (Cap) - Vibrant yellow
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.25, 0.64), playerAccentMat);
    cap.position.set(0, 1.95, 0); playerGroup.add(cap);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.45), playerAccentMat);
    brim.position.set(0, 1.85, -0.25); playerGroup.add(brim);

    // 3. Eyes (Anime/Expressive style)
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x212121 });
    [-0.18, 0.18].forEach(x => {
        const ew = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.05), eyeWhiteMat);
        ew.position.set(x, 1.52, -0.31); playerGroup.add(ew);
        const ep = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.06), eyePupilMat);
        ep.position.set(x, 1.52, -0.34); playerGroup.add(ep);
    });

    // 4. Arms (With sleeves and hands)
    const armGeo = new THREE.BoxGeometry(0.3, 0.85, 0.3);
    const handGeo = new THREE.SphereGeometry(0.18, 8, 8);
    [-0.6, 0.6].forEach((x, i) => {
        const arm = new THREE.Mesh(armGeo, playerMat);
        arm.position.set(x, 0.65, 0);
        arm.name = `arm${i}`; playerGroup.add(arm);
        const hand = new THREE.Mesh(handGeo, skinMat);
        hand.position.set(x, 0.2, 0); playerGroup.add(hand);
    });

    // 5. Legs (Jeans/Streetwear style)
    const legGeo = new THREE.BoxGeometry(0.38, 0.9, 0.38);
    [[-0.24, 'legL'], [0.24, 'legR']].forEach(([x, nm]) => {
        const leg = new THREE.Mesh(legGeo, darkMat);
        leg.position.set(x, -0.25, 0);
        leg.name = nm; playerGroup.add(leg);
    });

    // Shoes (Sneakers)
    const shoeGeo = new THREE.BoxGeometry(0.42, 0.25, 0.6);
    [[-0.24, 'shoeL'], [0.24, 'shoeR']].forEach(([x, nm]) => {
        const shoe = new THREE.Mesh(shoeGeo, playerAccentMat);
        shoe.position.set(x, -0.75, -0.1); playerGroup.add(shoe);
    });

    // 6. Backpack (Subway Surfers essential)
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.8, 0.3), playerAccentMat);
    pack.position.set(0, 0.65, 0.41); playerGroup.add(pack);
    const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.32), darkMat);
    zipper.position.set(0, 0.8, 0.42); playerGroup.add(zipper);

    playerGroup.position.set(C.LANES[1], C.PLAYER_Y, 0);

    // Cache references for performance
    G.pc = {
        legL: playerGroup.children.find(c => c.name === 'legL'),
        legR: playerGroup.children.find(c => c.name === 'legR'),
        arm0: playerGroup.children.find(c => c.name === 'arm0'),
        arm1: playerGroup.children.find(c => c.name === 'arm1'),
        body: torso, head: head
    };

    scene.add(playerGroup);
}

// Get named child of playerGroup
function pc(name) { return playerGroup.children.find(c => c.name === name); }

// ═══════════════════════════════════════════
// 6. TRACK POOL
// ═══════════════════════════════════════════
function buildTrackPool() {
    const lineGeo = new THREE.PlaneGeometry(0.1, C.SEG_LEN);
    const borderGeo = new THREE.PlaneGeometry(0.2, C.SEG_LEN);
    const roadGeo = new THREE.PlaneGeometry(C.TRACK_W, C.SEG_LEN);

    for (let i = 0; i < C.SEG_COUNT; i++) {
        const seg = new THREE.Group();

        const road = new THREE.Mesh(roadGeo, MAT.track);
        road.rotation.x = -Math.PI / 2; seg.add(road);

        // Lane dividers
        const divX = C.TRACK_W / 6; // 1.2
        [-divX, divX].forEach(lx => {
            const line = new THREE.Mesh(lineGeo, MAT.lane);
            line.rotation.x = -Math.PI / 2;
            line.position.set(lx, 0.005, 0); seg.add(line);
        });

        // Borders (gold strips)
        [-C.TRACK_W / 2, C.TRACK_W / 2].forEach(bx => {
            const brd = new THREE.Mesh(borderGeo, MAT.border);
            brd.rotation.x = -Math.PI / 2;
            brd.position.set(bx, 0.008, 0); seg.add(brd);
        });

        seg.position.z = -i * C.SEG_LEN + C.SEG_LEN / 2;
        scene.add(seg);
        trackSegs.push(seg);
    }
}

// ═══════════════════════════════════════════
// 7. ENVIRONMENT - Optimized with InstancedMesh & Async
// ═══════════════════════════════════════════
async function buildEnvironmentAsync() {
    envGroup = new THREE.Group();

    // Sidewalks
    const swGeo = new THREE.PlaneGeometry(4.5, 400);
    [-6.5, 6.5].forEach(sx => {
        const sw = new THREE.Mesh(swGeo, MAT.sidewalk);
        sw.rotation.x = -Math.PI / 2;
        sw.position.set(sx, 0.002, -180);
        envGroup.add(sw);
    });

    // City buildings - Build in chunks to avoid freeze
    const rng = mulberry32(42);
    const windowGeo = new THREE.PlaneGeometry(0.4, 0.4);

    // Calculate total windows first for InstancedMesh
    let totalWinCount = 0;
    const buildings = [];
    for (let i = 0; i < 24; i++) {
        for (let side of [-1, 1]) {
            const w = 2.5 + rng() * 3;
            const h = 4 + rng() * 18;
            const d = 2.5 + rng() * 3;
            const wRows = Math.floor(h / 1.5);
            const wCols = Math.floor(w / 1.1);
            buildings.push({ i, side, w, h, d, wRows, wCols });
            for (let wr = 0; wr < wRows; wr++) {
                for (let wc = 0; wc < wCols; wc++) {
                    if (rng() < 0.45) totalWinCount++;
                }
            }
        }
    }

    const instWins = new THREE.InstancedMesh(windowGeo, MAT.window, totalWinCount);
    let winIdx = 0;
    const dummy = new THREE.Object3D();

    // Reset RNG for second pass
    const rng2 = mulberry32(42);
    for (let b of buildings) {
        const mat = MAT.building[Math.floor(rng2() * MAT.building.length)];
        const bGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
        const bld = new THREE.Mesh(bGeo, mat);
        bld.position.set(
            b.side * (6 + b.w / 2 + rng2() * 3),
            b.h / 2,
            -20 - b.i * 16 + rng2() * 6
        );
        envGroup.add(bld);

        // Windows
        for (let wr = 0; wr < b.wRows; wr++) {
            for (let wc = 0; wc < b.wCols; wc++) {
                if (rng2() < 0.45) {
                    dummy.position.set(
                        bld.position.x + (wc - b.wCols / 2) * 1.1,
                        1.5 + wr * 1.5,
                        bld.position.z + (b.side > 0 ? -b.d / 2 - 0.02 : b.d / 2 + 0.02)
                    );
                    dummy.rotation.y = b.side > 0 ? 0 : Math.PI;
                    dummy.updateMatrix();
                    instWins.setMatrixAt(winIdx++, dummy.matrix);
                }
            }
        }

        // Roadside Props (Poles/Boxes)
        if (rng2() < 0.35) {
            const prop = rng2() < 0.5 
                ? new THREE.Mesh(GEO.cyl_pole, MAT.metal)
                : new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), MAT.grey);
            prop.position.set(b.side * (4.2 + rng2() * 0.5), prop.geometry.parameters.height / 2 || 0.3, bld.position.z + rng2() * 4);
            envGroup.add(prop);
        }

        // Yield every 4 buildings
        if (b.i % 4 === 0) await new Promise(r => requestAnimationFrame(r));
    }
    envGroup.add(instWins);

    // Street lamps
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x5a6470 });
    const lampMat = new THREE.MeshLambertMaterial({ color: 0xfffae0, emissive: 0xfff0a0, emissiveIntensity: 0.8 });
    for (let i = 0; i < 16; i++) {
        for (let side of [-5.2, 5.2]) {
            const g = new THREE.Group();
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 5.5, 6), poleMat);
            pole.position.y = 2.75; g.add(pole);
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 4), poleMat);
            arm.rotation.z = Math.PI / 2;
            arm.position.set(side < 0 ? 0.7 : -0.7, 5.6, 0); g.add(arm);
            const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.35), lampMat);
            bulb.position.set(side < 0 ? 1.4 : -1.4, 5.45, 0); g.add(bulb);
            g.position.set(side, 0, -8 - i * 14);
            envGroup.add(g);
        }
    }

    scene.add(envGroup);
}

// Seeded PRNG (for consistent env generation)
function mulberry32(seed) {
    return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let z = Math.imul(seed ^ seed >>> 15, 1 | seed);
        z = z + Math.imul(z ^ z >>> 7, 61 | z) ^ z;
        return ((z ^ z >>> 14) >>> 0) / 4294967296;
    };
}

// ═══════════════════════════════════════════
// 8. OBJECT POOLS - Async
// ═══════════════════════════════════════════
async function buildObjectPoolsAsync() {
    for (let bi = 0; bi < OBS_BUILDERS.length; bi++) {
        // Increase copy count to 6 to ensure variety isn't throttled
        for (let copy = 0; copy < 6; copy++) {
            const g = OBS_BUILDERS[bi].build();
            g.userData = {
                active: false,
                builderIdx: bi,
                typeData: OBS_BUILDERS[bi],
            };
            g.visible = false;
            scene.add(g);
            obstaclePool.push(g);
        }
        if (bi % 3 === 0) await new Promise(r => requestAnimationFrame(r));
    }

    // Coin pool
    for (let i = 0; i < 20; i++) {
        const c = new THREE.Mesh(GEO.coin, MAT.coin);
        c.userData = { active: false };
        c.visible = false;
        scene.add(c);
        coinPool.push(c);
    }

    // Particle pool
    for (let i = 0; i < C.PARTICLE_POOL; i++) {
        const p = new THREE.Mesh(GEO.particle, MAT.particle.clone());
        p.userData = { active: false, vel: new THREE.Vector3(), life: 0, maxLife: 0 };
        p.visible = false;
        scene.add(p);
        particlePool.push(p);
    }
}

function getPooled(pool) {
    return pool.find(m => !m.userData.active) || null;
}

// ═══════════════════════════════════════════
// 9. SPAWN LOGIC
// ═══════════════════════════════════════════
function spawnObstacle() {
    // 1. Choose a lane that isn't on cooldown
    const availableLanes = [0, 1, 2].filter(l => G.laneCooldown[l] <= 0);
    if (availableLanes.length === 0) return;
    const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];

    // 2. Choose a builder
    const bIdx = Math.floor(Math.random() * OBS_BUILDERS.length);
    const data = OBS_BUILDERS[bIdx];
    
    // 3. Get from pool
    const mesh = obstaclePool.find(m => !m.userData.active && m.userData.builderIdx === bIdx);
    if (!mesh) return;

    // 4. Setup
    mesh.userData.active = true;
    mesh.userData.laneIdx = lane;
    mesh.userData.typeData = data; // Ensure fresh ref
    mesh.position.set(C.LANES[lane], 0, C.SPAWN_Z);
    mesh.rotation.y = 0;
    mesh.visible = true;
    activeObstacles.push(mesh);

    // 5. Apply lane block if specified (prevents clipping behind long objects)
    if (data.laneBlock) {
        G.laneCooldown[lane] = data.laneBlock;
    }

    // ── Chance of dual obstacles if no lane is on high cooldown ──
    const diff = (G.speed - C.SPEED_START) / (C.SPEED_MAX - C.SPEED_START);
    if (Math.random() < 0.15 + diff * 0.3) {
        const remainingLanes = availableLanes.filter(l => l !== lane);
        if (remainingLanes.length > 0) {
            const lane2 = remainingLanes[Math.floor(Math.random() * remainingLanes.length)];
            const bIdx2 = Math.floor(Math.random() * OBS_BUILDERS.length);
            const m2 = obstaclePool.find(m => !m.userData.active && m.userData.builderIdx === bIdx2);
            if (m2) {
                m2.userData.active = true;
                m2.userData.laneIdx = lane2;
                m2.userData.typeData = OBS_BUILDERS[bIdx2];
                m2.position.set(C.LANES[lane2], 0, C.SPAWN_Z);
                m2.visible = true;
                activeObstacles.push(m2);
                if (OBS_BUILDERS[bIdx2].laneBlock) G.laneCooldown[lane2] = OBS_BUILDERS[bIdx2].laneBlock;
            }
        }
    }
}

function spawnCoin() {
    // Spawn a row of 3 coins in same lane
    const laneIdx = Math.floor(Math.random() * 3);
    const zStart = C.COIN_SPAWN_Z;
    for (let ci = 0; ci < 3; ci++) {
        const c = getPooled(coinPool);
        if (!c) return;
        c.userData.active = true;
        c.position.set(C.LANES[laneIdx], 1.4, zStart - ci * 2);
        c.rotation.x = 0;
        c.visible = true;
        activeCoins.push(c);
    }
}

function spawnParticles(pos, count = 8, color = 0xffd28f) {
    for (let i = 0; i < count; i++) {
        const p = getPooled(particlePool);
        if (!p) return;
        p.userData.active = true;
        p.userData.life = 0;
        p.userData.maxLife = 0.3 + Math.random() * 0.3;
        p.userData.vel.set(
            (Math.random() - 0.5) * 4,
            Math.random() * 3 + 1,
            (Math.random() - 0.5) * 2
        );
        p.material.color.setHex(color);
        p.material.opacity = 1;
        p.position.copy(pos);
        p.visible = true;
        activeParticles.push(p);
    }
}

// ─── Sky System ────────────────────────────────────────────────
function updateSky(dt) {
    if (!G.running || G.paused || G.quizActive) return;

    G.skyTime += dt;
    const modeA = C.SKY_MODES[G.skyIdx];
    const modeB = C.SKY_MODES[(G.skyIdx + 1) % C.SKY_MODES.length];
    const t = Math.min(1, G.skyTime / C.SKY_CYCLE_DUR);

    // Lerp colors (Optimized: avoid new Color per frame)
    _tmpColA.set(modeA.bg);
    _tmpColB.set(modeB.bg);
    _tmpColA.lerp(_tmpColB, t);
    
    scene.background = _tmpColA;
    if (scene.fog) scene.fog.color = _tmpColA;

    // Lerp lights
    const ambient = modeA.ambient + (modeB.ambient - modeA.ambient) * t;
    const sunIntensity = modeA.sun + (modeB.sun - modeA.sun) * t;

    scene.children.forEach(c => {
        if (c instanceof THREE.AmbientLight) c.intensity = ambient;
        if (c instanceof THREE.DirectionalLight) c.intensity = sunIntensity;
    });

    if (t >= 1) {
        G.skyTime = 0;
        G.skyIdx = (G.skyIdx + 1) % C.SKY_MODES.length;
    }

    // Update Stars visibility
    if (G.stars) {
        const isDark = (G.skyIdx === 0 || G.skyIdx === 4); // Midnight/Cyber
        const targetOp = isDark ? 0.6 : 0.0;
        G.stars.material.opacity += (targetOp - G.stars.material.opacity) * 0.05;
        G.stars.position.z = (camera.position.z % 100); 
    }
}

// ═══════════════════════════════════════════
// 10. GAME LOOP (Physics + Animation + Render)
// ═══════════════════════════════════════════
function gameLoop(nowMs) {
    requestAnimationFrame(gameLoop);

    const now = nowMs / 1000;
    let dt = now - G.lastTime;
    G.lastTime = now;
    if (dt > C.DT_MAX) dt = C.DT_MAX;
    if (dt <= 0) { renderer.render(scene, camera); return; }

    if (G.running && !G.paused && !G.quizActive) {
        updateSky(dt);
        updateGame(dt, now);
    } else if (!G.running) {
        // Idle: rotate player slowly for start screen (if visible)
        playerGroup && (playerGroup.rotation.y = Math.sin(now * 0.5) * 0.15);
    }

    renderer.render(scene, camera);
}

function updateGame(dt, now) {
    // ── Lane Cooldowns ──
    for(let i=0; i<3; i++) {
        if (G.laneCooldown[i] > 0) G.laneCooldown[i] -= dt;
    }

    // ── Speed & Score ──
    G.speed = Math.min(G.speed + C.SPEED_ACCEL * dt, C.SPEED_MAX);
    G.dist += G.speed * dt;
    // Gộp điểm: Xu + Quãng đường
    G.score = Math.floor(G.dist + G.coins * 100);
    G.maxSpeed = Math.max(G.maxSpeed, G.speed);

    // ── Process input queue (frame-accurate) ──
    while (G.inputQueue.length > 0) {
        const cmd = G.inputQueue.shift();
        if (cmd === 'left') processLeft();
        else if (cmd === 'right') processRight();
        else if (cmd === 'jump') processJump();
        else if (cmd === 'slide') processSlide();
    }

    // ── HUD ──
    updateHUD();

    // ── Determine target Y (Platforming) ──
    let groundY = C.PLAYER_Y;
    let onPlatform = false;
    for (const obs of activeObstacles) {
        const t = obs.userData.typeData;
        if (t.isPlatform) {
            const dz = obs.position.z - playerGroup.position.z;
            const hLen = (t.length || 0) / 2;
            const dx = Math.abs(obs.position.x - playerGroup.position.x);
            if (dx < 1.1 && dz > -hLen - 0.3 && dz < hLen + 0.3) {
                groundY = Math.max(groundY, C.PLAYER_Y + t.roofHeight);
                onPlatform = true;
            }
        }
    }

    // ── Player X (Lerp to target lane) ──
    const px = playerGroup.position.x;
    playerGroup.position.x += (G.targetX - px) * C.LANE_LERP * dt;

    // ── Player Vertical Physics (Gravity) ──
    if (playerGroup.position.y > groundY || G.jumping) {
        G.velY += C.GRAVITY * dt;
        playerGroup.position.y += G.velY * dt;
        
        if (playerGroup.position.y <= groundY && G.velY <= 0) {
            playerGroup.position.y = groundY;
            G.jumping = false; 
            G.velY = 0;
            if (!G.sliding) playerGroup.scale.y = 1;
        }
    } else if (playerGroup.position.y < groundY && !G.jumping && !G.invincible) {
        // Player slid into or ran into the front of a platform. Handled by collision below.
    }

    // ── Player Slide ──
    if (G.sliding) {
        G.slideTimer -= dt;
        if (G.slideTimer <= 0) {
            G.sliding = false;
            playerGroup.scale.y = 1;
            playerGroup.position.y = groundY; // Stand back up
        }
    }

    // ── Invincibility ──
    if (G.invincible) {
        G.invTimer -= dt;
        // Flash: toggle emissive
        playerMat.emissiveIntensity = Math.sin(now * 20) * 0.4 + 0.4;
        playerMat.emissive.set(0xf0a500);
        DOM['inv-timer'].textContent = G.invTimer.toFixed(1);
        if (G.invTimer <= 0) {
            G.invincible = false;
            playerMat.emissiveIntensity = 0;
            playerMat.emissive.set(0x000000);
            DOM['invincible-badge'].classList.add('hidden');
        }
    }

    // ── Run Animation ──
    const runF = Math.sin(now * (G.speed / C.SPEED_START) * 8);
    if (G.pc.legL) G.pc.legL.rotation.x = runF * 0.4;
    if (G.pc.legR) G.pc.legR.rotation.x = -runF * 0.4;
    if (G.pc.arm0) G.pc.arm0.rotation.x = -runF * 0.3;
    if (G.pc.arm1) G.pc.arm1.rotation.x = runF * 0.3;
    playerGroup.position.y = G.jumping ? playerGroup.position.y
        : C.PLAYER_Y + Math.abs(Math.sin(now * G.speed * 0.5)) * 0.05;

    // ── Track Scroll ──
    const moveZ = G.speed * dt;
    for (const seg of trackSegs) {
        seg.position.z += moveZ;
        if (seg.position.z > camera.position.z + C.SEG_LEN * 0.6) {
            seg.position.z -= C.SEG_COUNT * C.SEG_LEN;
        }
    }

    // ── Camera follow (lag behind X slightly) ──
    camera.position.x += (playerGroup.position.x * 0.12 - camera.position.x) * 3.5 * dt;
    // Lean forward slightly with speed
    const camZ = 10 - (G.speed - C.SPEED_START) * 0.06;
    camera.position.z += (camZ - camera.position.z) * 2 * dt;

    // ── Spawn Timers ──
    G.spawnCooldown -= dt;
    if (G.spawnCooldown <= 0) {
        spawnObstacle();
        G.spawnCooldown = Math.max(0.3, 1.2 - G.speed * 0.015);
    }
    G.coinSpawnCd -= dt;
    if (G.coinSpawnCd <= 0) {
        spawnCoin();
        G.coinSpawnCd = Math.max(1.2, 3.0 - G.speed * 0.02);
    }

    // ── Update Obstacles ──
    for (let i = activeObstacles.length - 1; i >= 0; i--) {
        const obs = activeObstacles[i];
        
        let obsMoveZ = moveZ;
        if (obs.userData.typeData.moveSpeed) {
            obsMoveZ += obs.userData.typeData.moveSpeed * dt;
        }
        obs.position.z += obsMoveZ;

        // Frustum cull: skip collision check if not in view band
        const despawnZBound = C.DESPAWN_Z + (obs.userData.typeData.length || 0) / 2;
        if (obs.position.z > despawnZBound) {
            obs.visible = false; obs.userData.active = false;
            activeObstacles.splice(i, 1);
            continue;
        }

        // ── COLLISION (Precision AABB) ──
        if (!G.invincible) {
            const t = obs.userData.typeData;
            
            // 1. Safe on platform check
            if (t.isPlatform && playerGroup.position.y >= C.PLAYER_Y + t.roofHeight - 0.2) {
                continue;
            }

            // 2. AABB Box Overlap
            const box = t.hitbox || { dx: 1.1, dy: 1.2, dz: 1.0, yOff: 0.6 };
            const pX = playerGroup.position.x;
            const pY = playerGroup.position.y;
            const pZ = playerGroup.position.z;

            // X Dist
            const dx = Math.abs(obs.position.x - pX);
            // Z Dist (offset by length)
            const dz = Math.abs(obs.position.z - pZ);

            if (dx < (box.dx + 0.35) && dz < (box.dz + 0.3)) {
                // Potential vertical collision
                const obsTop = box.yOff + (box.dy/2);
                const obsBot = box.yOff - (box.dy/2);
                const pTop = pY + (G.sliding ? 0.7 : 1.9);
                const pBot = pY;

                if (pTop > obsBot && pBot < obsTop) {
                    // Specific Dodge Logic
                    const dodgedJump = G.jumping && t.jumpTop && (pBot > t.jumpTop);
                    const dodgedSlide = G.sliding && t.slideBottom && (t.slideBottom > 1.0);
                    
                    if (!dodgedJump && !dodgedSlide) {
                        AudioSystem.collide();
                        spawnParticles(obs.position, 10, 0xff4444);
                        triggerCollision(i);
                        return;
                    }
                }
            }
        }
    }

    // ── Update Coins ──
    for (let i = activeCoins.length - 1; i >= 0; i--) {
        const coin = activeCoins[i];
        coin.position.z += moveZ;
        coin.rotation.y += dt * 3;
        coin.position.y = 1.4 + Math.sin(now * 5 + i) * 0.12;

        if (coin.position.z > C.DESPAWN_Z) {
            coin.visible = false; coin.userData.active = false;
            activeCoins.splice(i, 1); continue;
        }

        // Collect coin
        const cdz = Math.abs(coin.position.z - playerGroup.position.z);
        const cdx = Math.abs(coin.position.x - playerGroup.position.x);
        if (cdz < 1.0 && cdx < 1.3 && Math.abs(coin.position.y - playerGroup.position.y - 0.5) < 1.2) {
            G.coins++;
            G.score += 100; // Coins directly increase score
            AudioSystem.coin();
            spawnParticles(coin.position, 5, 0xffd700);
            coin.visible = false; coin.userData.active = false;
            activeCoins.splice(i, 1);
        }
    }

    // ── Update Particles ──
    for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        p.userData.life += dt;
        const t = p.userData.life / p.userData.maxLife;
        if (t >= 1) {
            p.visible = false; p.userData.active = false;
            activeParticles.splice(i, 1); continue;
        }
        p.position.x += p.userData.vel.x * dt;
        p.position.y += p.userData.vel.y * dt;
        p.position.z += p.userData.vel.z * dt + moveZ;
        p.userData.vel.y += C.GRAVITY * 0.4 * dt;
        p.material.opacity = 1 - t;
        p.scale.setScalar(1 - t * 0.6);
    }
}

// ═══════════════════════════════════════════
// 11. HUD UPDATE
// ═══════════════════════════════════════════
let lastHudUpdate = 0;
function updateHUD() {
    const now = Date.now();
    if (now - lastHudUpdate < 30) return; // Cap HUD updates to ~30fps
    lastHudUpdate = now;

    if (!DOM['current-score']) return;
    DOM['current-score'].textContent = G.score;
    DOM['hud-distance'].textContent = Math.floor(G.dist) + 'm';

    const pct = ((G.speed - C.SPEED_START) / (C.SPEED_MAX - C.SPEED_START)) * 100;
    DOM['speed-fill'].style.width = Math.min(100, pct) + '%';
}

// ═══════════════════════════════════════════
// 12. INPUT SYSTEM (Frame-Accurate Queue)
// ═══════════════════════════════════════════
function setupInput() {
    // Keyboard
    document.addEventListener('keydown', e => {
        if (!G.running || G.quizActive) return;

        if (e.key === 'Escape' || e.key === 'p') { togglePause(); return; }
        if (G.paused || G.quizActive) return;

        switch (e.key) {
            case 'ArrowLeft': case 'a': G.inputQueue.push('left'); e.preventDefault(); break;
            case 'ArrowRight': case 'd': G.inputQueue.push('right'); e.preventDefault(); break;
            case 'ArrowUp': case 'w': G.inputQueue.push('jump'); e.preventDefault(); break;
            case 'ArrowDown': case 's': G.inputQueue.push('slide'); e.preventDefault(); break;
        }
    });

    // Touch swipe (highly responsive)
    let tx0 = 0, ty0 = 0, tTime = 0;
    const SWIPE_MIN = 20;
    const SWIPE_TIME = 250; // ms

    document.addEventListener('touchstart', e => {
        if (e.target.closest('.audio-controls, .quiz-card, .gameover-card, .start-panel, .form-section, .form-card, .brand-section, .pause-card')) return;
        tx0 = e.touches[0].clientX;
        ty0 = e.touches[0].clientY;
        tTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', e => {
        if (!G.running || G.quizActive || G.paused) return;
        if (Date.now() - tTime > SWIPE_TIME) return; // Too slow
        const dx = e.changedTouches[0].clientX - tx0;
        const dy = e.changedTouches[0].clientY - ty0;
        const adx = Math.abs(dx), ady = Math.abs(dy);

        if (adx < SWIPE_MIN && ady < SWIPE_MIN) return; // Too short

        if (adx > ady) {
            G.inputQueue.push(dx > 0 ? 'right' : 'left');
        } else {
            G.inputQueue.push(dy < 0 ? 'jump' : 'slide');
        }
    }, { passive: true });
}

function processLeft() {
    if (G.laneIdx > 0) {
        G.laneIdx--;
        G.targetX = C.LANES[G.laneIdx];
        AudioSystem.lane();
    }
}
function processRight() {
    if (G.laneIdx < 2) {
        G.laneIdx++;
        G.targetX = C.LANES[G.laneIdx];
        AudioSystem.lane();
    }
}
function processJump() {
    if (!G.jumping) {
        if (G.sliding) cancelSlide();
        G.jumping = true;
        G.velY = C.JUMP_FORCE;
        AudioSystem.jump();
    }
}
function processSlide() {
    if (!G.jumping && !G.sliding) {
        G.sliding = true;
        G.slideTimer = C.SLIDE_DUR;
        playerGroup.scale.y = 0.52;
        playerGroup.position.y = C.PLAYER_Y * 0.52;
        AudioSystem.slide();
    }
}

// ── Fish-Yates Shuffle ──
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
function cancelSlide() {
    G.sliding = false; G.slideTimer = 0;
    playerGroup.scale.y = 1;
    playerGroup.position.y = C.PLAYER_Y;
}

// ── Math Symbol Formatter ──
function formatQuizText(text) {
    if (!text) return "";
    return text
        .replace(/\^2/g, '²')
        .replace(/\^3/g, '³')
        .replace(/\^n/g, 'ⁿ')
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
        .replace(/sqrt\((.*?)\)/g, '√$1')
        .replace(/\\cos/g, 'cos')
        .replace(/\\sin/g, 'sin')
        .replace(/\\tan/g, 'tan')
        .replace(/\\pi/g, 'π')
        .replace(/\\Delta/g, 'Δ')
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/<=/g, '≤')
        .replace(/>=/g, '≥');
}

// ═══════════════════════════════════════════
// 13. GAME LIFECYCLE
// ═══════════════════════════════════════════
function startGame() {
    const nameInput = document.getElementById('player-name').value.trim();
    const finalName = nameInput || localStorage.getItem('httt_player_name') || 'Người hùng';
    
    // Ensure persistence
    localStorage.setItem('httt_player_name', finalName);

    resetGameState(true);
    G.playerName = finalName;
    G.running = true;
    G.lastTime = performance.now() / 1000;

    // Reset player
    playerGroup.position.set(C.LANES[1], C.PLAYER_Y, 0);
    playerGroup.rotation.set(0, 0, 0);
    playerGroup.scale.set(1, 1, 1);
    playerMat.emissiveIntensity = 0;
    playerMat.emissive.set(0x000000);

    // Clear all pools
    [...activeObstacles, ...activeCoins, ...activeParticles].forEach(m => {
        m.visible = false; m.userData.active = false;
    });
    activeObstacles.length = 0;
    activeCoins.length = 0;
    activeParticles.length = 0;
    collisionObs = null;

    // UI
    document.getElementById('loading-screen').classList.remove('active');
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('game-over-screen').classList.remove('active');
    document.getElementById('pause-screen').classList.remove('active');
    document.getElementById('hud').classList.add('active');
    document.getElementById('invincible-badge').classList.add('hidden');

    // Play first music track (random start)
    AudioSystem.resume();
    const trackIdx = Math.floor(Math.random() * AudioSystem.getTracksCount());
    AudioSystem.playTrack(trackIdx);
}

function togglePause() {
    if (!G.running || G.quizActive) return;
    G.paused = !G.paused;
    const ps = document.getElementById('pause-screen');
    if (G.paused) {
        ps.classList.add('active');
        document.getElementById('pause-score-val').textContent = G.score;
    } else {
        ps.classList.remove('active');
        G.lastTime = performance.now() / 1000; // reset dt to prevent spike
    }
}

function goToMenu() {
    G.running = false;
    document.getElementById('game-over-screen').classList.remove('active');
    document.getElementById('pause-screen').classList.remove('active');
    document.getElementById('hud').classList.remove('active');
    document.getElementById('start-screen').classList.add('active');
    updateStartScreenStats();
}

// ═══════════════════════════════════════════
// 14. COLLISION → QUIZ REVIVE
// ═══════════════════════════════════════════
function triggerCollision(obsIdx) {
    G.quizActive = true;
    collisionObs = activeObstacles[obsIdx];

    const modal = document.getElementById('quiz-modal');
    modal.classList.add('active');

    const qData = getRandomQuestion();
    document.getElementById('question-text').innerHTML = formatQuizText(qData.q);
    document.getElementById('quiz-category').textContent = qData.cat || 'Câu hỏi';
    document.getElementById('quiz-streak').textContent = `🔥 ${G.reviveStreak} liên tiếp`;

    // Shuffle answers while keeping track of correct one
    const answers = qData.a.map((text, i) => ({ text, isCorrect: i === qData.correct }));
    shuffleArray(answers);

    const correctIdx = answers.findIndex(a => a.isCorrect);

    const cont = document.getElementById('answers-container');
    cont.innerHTML = '';
    answers.forEach((ans, i) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.innerHTML = formatQuizText(ans.text);
        btn.onclick = () => handleAnswer(i, correctIdx, btn);
        cont.appendChild(btn);
    });

    // Timer bar countdown
    let timeLeft = C.QUIZ_TIMEOUT;
    const bar = document.getElementById('quiz-timer-bar');
    const numEl = document.getElementById('quiz-timer-num');
    bar.style.transition = 'none'; bar.style.width = '100%';
    bar.style.background = 'var(--c-accent)';

    requestAnimationFrame(() => {
        bar.style.transition = `width ${C.QUIZ_TIMEOUT}s linear`;
        bar.style.width = '0%';
    });

    quizCountdown = setInterval(() => {
        timeLeft--;
        numEl.textContent = timeLeft;
        if (timeLeft <= 3) bar.style.background = 'var(--c-danger)';
    }, 1000);

    quizTimer = setTimeout(() => triggerGameOver(), C.QUIZ_TIMEOUT * 1000);
}

function handleAnswer(selected, correct, btnEl) {
    clearTimeout(quizTimer);
    clearInterval(quizCountdown);
    document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);

    if (selected === correct) {
        btnEl.classList.add('correct');
        G.correctAnswers++;
        G.reviveStreak++;
        AudioSystem.correct();
        setTimeout(() => doRevive(), 800);
    } else {
        btnEl.classList.add('wrong');
        document.querySelectorAll('.answer-btn')[correct].classList.add('correct');
        G.reviveStreak = 0;
        AudioSystem.wrong();
        setTimeout(() => triggerGameOver(), 1400);
    }
}

function doRevive() {
    document.getElementById('quiz-modal').classList.remove('active');
    G.quizActive = false;
    G.lastTime = performance.now() / 1000; // reset dt after pause

    // Remove the obstacle we collided with
    if (collisionObs) {
        collisionObs.visible = false;
        collisionObs.userData.active = false;
        const idx = activeObstacles.indexOf(collisionObs);
        if (idx > -1) activeObstacles.splice(idx, 1);
        collisionObs = null;
    }

    G.invincible = true;
    G.invTimer = C.INVINCIBLE_DUR;
    document.getElementById('invincible-badge').classList.remove('hidden');
    document.getElementById('inv-timer').textContent = C.INVINCIBLE_DUR.toFixed(1);
}

// ═══════════════════════════════════════════
// 15. GAME OVER
// ═══════════════════════════════════════════
function triggerGameOver() {
    clearTimeout(quizTimer);
    clearInterval(quizCountdown);

    G.running = false;
    G.quizActive = false;

    document.getElementById('quiz-modal').classList.remove('active');
    document.getElementById('hud').classList.remove('active');
    document.getElementById('pause-screen').classList.remove('active');

    // Populate game-over UI
    document.getElementById('go-player-name').textContent = G.playerName || 'Người hùng';
    document.getElementById('final-score').textContent = G.score;
    document.getElementById('go-distance').textContent = Math.floor(G.dist) + 'm';
    document.getElementById('go-coins').textContent = G.coins;
    document.getElementById('go-correct').textContent = G.correctAnswers;
    document.getElementById('go-max-speed').textContent = Math.floor(G.maxSpeed);

    // Reset rank badge
    const rankBadge = document.getElementById('go-rank-badge');
    if (rankBadge) rankBadge.style.display = 'none';
    const lbLoad = document.getElementById('lb-loading');
    if (lbLoad) lbLoad.textContent = 'Đang tải...';

    document.getElementById('game-over-screen').classList.add('active');

    // Gửi điểm lên server, sau đó lấy và render leaderboard
    const statsPayload = {
        dist: Math.floor(G.dist),
        coins: G.coins,
        correct: G.correctAnswers,
        maxSpeed: Math.floor(G.maxSpeed),
    };

    saveScoreAPI(G.playerName, G.score, statsPayload).then(result => {
        // Hiện rank toàn cầu nếu có
        if (result && result.rank) {
            if (rankBadge) {
                document.getElementById('go-rank-text').textContent = 'Hạng #' + result.rank;
                rankBadge.style.display = '';
            }
        }
        // Load và render top leaderboard
        fetchGlobalScores().then(scores => {
            renderLeaderboard(scores, G.playerName, G.score);
        });
    });
}

// ═══════════════════════════════════════════
// 16. LEADERBOARD - API Backend (toàn cầu)
// ═══════════════════════════════════════════
const SCORE_KEY = 'httt_v2_scores'; // fallback localStorage

function getLocalScores() {
    try { return JSON.parse(localStorage.getItem(SCORE_KEY) || '[]'); }
    catch { return []; }
}

async function saveScoreAPI(name, score, stats = {}) {
    if (!name) name = localStorage.getItem('httt_player_name') || 'Người hùng';
    const payload = {
        name: String(name).substring(0, 15),
        score: Number(score) || 0,
        stats,
    };

    // Luôn lưu local trước
    const local = getLocalScores();
    local.push({ ...payload, date: new Date().toLocaleDateString('vi-VN') });
    local.sort((a, b) => b.score - a.score);
    localStorage.setItem(SCORE_KEY, JSON.stringify(local.slice(0, 30)));
    localStorage.setItem('httt_total_plays', parseInt(localStorage.getItem('httt_total_plays') || '0') + 1);

    // Gửi lên API
    try {
        const res = await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            const data = await res.json();
            return data; // { ok, rank, total }
        }
    } catch (e) {
        console.warn('[rank] API không khả dụng, dùng localStorage fallback', e.message);
    }
    return null;
}

async function fetchGlobalScores() {
    try {
        const res = await fetch('/api/scores');
        if (res.ok) return await res.json();
    } catch (e) {
        console.warn('[rank] Không lấy được scores từ API', e.message);
    }
    return getLocalScores(); // fallback
}

function renderLeaderboard(scores, playerName, playerScore) {
    const ul = document.getElementById('leaderboard-list');
    const loadingEl = document.getElementById('lb-loading');
    ul.innerHTML = '';
    if (loadingEl) loadingEl.textContent = '';

    if (!scores || scores.length === 0) {
        ul.innerHTML = '<li style="text-align:center;color:var(--c-muted);padding:12px 0">Chưa có điểm nào!</li>';
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    scores.slice(0, 10).forEach((s, i) => {
        const li = document.createElement('li');
        const isCurrent = s.name === playerName && s.score === playerScore;
        if (isCurrent) li.classList.add('is-current');
        li.innerHTML = `
            <span class="lb-rank">${medals[i] || (i + 1) + '.'}</span>
            <span class="lb-name">${escHtml(s.name || 'Người hùng')}</span>
            <span class="lb-score">${s.score}</span>
        `;
        ul.appendChild(li);
    });
}

function renderGlobalRank(scores) {
    const list = document.getElementById('global-rank-list');
    const loadingEl = document.getElementById('global-rank-loading');
    if (!list) return;
    if (loadingEl) loadingEl.style.display = 'none';
    list.innerHTML = '';
    if (!scores || scores.length === 0) {
        list.innerHTML = '<li style="text-align:center;color:var(--c-muted);padding:12px 0">Chưa có người nào chơi!</li>';
        return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    scores.forEach((s, i) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="lb-rank">${medals[i] || (i + 1) + '.'}</span>
            <span class="lb-name">${escHtml(s.name || 'Người hùng')}<small style="margin-left:6px;color:var(--c-muted);font-size:0.7em;">${s.date || ''}</small></span>
            <span class="lb-score">${s.score}</span>
        `;
        list.appendChild(li);
    });
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function updateStartScreenStats() {
    fetchGlobalScores().then(scores => {
        const total = localStorage.getItem('httt_total_plays') || '0';
        document.getElementById('stat-total-players').textContent = scores.length || parseInt(total);
        document.getElementById('stat-top-score').textContent = scores[0]?.score ?? '—';
    });
}

// ═══════════════════════════════════════════
// 17. START SCREEN BACKGROUND ANIMATION
// ═══════════════════════════════════════════
function initBgCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const dots = Array.from({ length: 45 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        a: Math.random(),
    }));

    function drawBg() {
        const isActive = document.getElementById('start-screen').classList.contains('active');
        ctx2d.clearRect(0, 0, canvas.width, canvas.height);

        ctx2d.beginPath();
        dots.forEach(d => {
            d.x = (d.x + d.vx + canvas.width) % canvas.width;
            d.y = (d.y + d.vy + canvas.height) % canvas.height;
            d.a = (Math.sin(Date.now() * 0.001 + d.r) + 1) / 2 * 0.5 + 0.1;
            ctx2d.moveTo(d.x, d.y);
            ctx2d.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        });
        ctx2d.fillStyle = isActive ? `rgba(240,165,0,0.45)` : `rgba(240,165,0,0.15)`;
        ctx2d.fill();

        // Optimized connectors: Single path for all segments
        ctx2d.beginPath();
        ctx2d.strokeStyle = isActive ? 'rgba(240,165,0,0.12)' : 'rgba(240,165,0,0.05)';
        ctx2d.lineWidth = 0.5;
        for (let i = 0; i < dots.length; i++) {
            const a = dots[i];
            for (let j = i + 1; j < dots.length; j++) {
                const b = dots[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                if (Math.abs(dx) < 90 && Math.abs(dy) < 90) {
                    const dist = dx * dx + dy * dy;
                    if (dist < 8100) { // 90^2
                        ctx2d.moveTo(a.x, a.y);
                        ctx2d.lineTo(b.x, b.y);
                    }
                }
            }
        }
        ctx2d.stroke();
        requestAnimationFrame(drawBg);
    }
    drawBg();

    window.addEventListener('resize', () => {
        if(canvas) {
            canvas.width = window.innerWidth; 
            canvas.height = window.innerHeight;
        }
    });
}

// ═══════════════════════════════════════════
// 18. UI EVENT BINDINGS
// ═══════════════════════════════════════════
function bindUI() {
    // Mode selector
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            G.mode = Number(card.dataset.mode);
        });
    });

    // Start Button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            AudioSystem.resume();
            const nameEl = document.getElementById('player-name');
            const name = nameEl.value.trim();
            if (!name) {
                nameEl.focus();
                nameEl.classList.add('shake');
                nameEl.style.border = '1.5px solid var(--c-danger)';
                setTimeout(() => {
                    nameEl.classList.remove('shake');
                    nameEl.style.border = '';
                }, 1000);
                return;
            }
            // Logic moved to startGame to avoid duplication
            startGame();
        });
    }

    // Custom Room Logic
    const btnCreateRoom = document.getElementById('btn-create-room');
    if (btnCreateRoom) {
        btnCreateRoom.addEventListener('click', () => {
            document.getElementById('custom-room-screen').classList.add('active');
            const existing = localStorage.getItem('httt_custom_q');
            if (existing) {
                document.getElementById('custom-q-input').value = existing;
            } else {
                document.getElementById('custom-q-input').value = '';
            }
            document.getElementById('room-status').textContent = '';
        });
    }

    const btnCloseRoom = document.getElementById('btn-close-room');
    if (btnCloseRoom) {
        btnCloseRoom.addEventListener('click', () => {
            document.getElementById('custom-room-screen').classList.remove('active');
        });
    }

    const btnSaveRoom = document.getElementById('btn-save-room');
    if (btnSaveRoom) {
        btnSaveRoom.addEventListener('click', () => {
            const val = document.getElementById('custom-q-input').value.trim();
            const status = document.getElementById('room-status');
            if (!val) {
                 localStorage.removeItem('httt_custom_q');
                 status.style.color = 'var(--c-success)';
                 status.textContent = 'Đã hủy Custom Room. Trở về bộ câu hỏi gốc.';
                 if (typeof loadCustomQuestions === 'function') loadCustomQuestions();
                 setTimeout(() => document.getElementById('custom-room-screen').classList.remove('active'), 1500);
                 return;
            }
            try {
                const parsed = JSON.parse(val);
                if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].q || !parsed[0].a) throw new Error('Format không đúng');
                localStorage.setItem('httt_custom_q', val);
                status.style.color = 'var(--c-success)';
                status.textContent = 'Lưu thành công ' + parsed.length + ' câu hỏi!';
                if (typeof loadCustomQuestions === 'function') loadCustomQuestions();
                setTimeout(() => document.getElementById('custom-room-screen').classList.remove('active'), 1500);
            } catch(e) {
                status.style.color = 'var(--c-danger)';
                status.textContent = 'Lưu thất bại: JSON không hợp lệ!';
            }
        });
    }

    // Restart
    document.getElementById('restart-btn').addEventListener('click', () => {
        AudioSystem.resume();
        startGame();
    });

    // Menu button
    document.getElementById('btn-menu').addEventListener('click', goToMenu);

    // Pause buttons
    document.getElementById('btn-resume').addEventListener('click', togglePause);
    document.getElementById('btn-quit').addEventListener('click', () => {
        G.paused = false;
        document.getElementById('pause-screen').classList.remove('active');
        triggerGameOver();
    });

    // Global Rank Overlay
    function openGlobalRank() {
        const overlay = document.getElementById('global-rank-screen');
        const loadingEl = document.getElementById('global-rank-loading');
        const list = document.getElementById('global-rank-list');
        overlay.classList.add('active');
        if (loadingEl) loadingEl.style.display = '';
        if (list) list.innerHTML = '';
        fetchGlobalScores().then(scores => renderGlobalRank(scores));
    }

    const btnGlobalRank = document.getElementById('btn-global-rank');
    if (btnGlobalRank) btnGlobalRank.addEventListener('click', openGlobalRank);

    const btnViewAllRank = document.getElementById('btn-view-all-rank');
    if (btnViewAllRank) btnViewAllRank.addEventListener('click', openGlobalRank);

    const btnCloseGlobalRank = document.getElementById('btn-close-global-rank');
    if (btnCloseGlobalRank) {
        btnCloseGlobalRank.addEventListener('click', () => {
            document.getElementById('global-rank-screen').classList.remove('active');
        });
    }

    // Audio controls
    const btnMute = document.getElementById('btn-mute');
    if (btnMute) {
        btnMute.addEventListener('click', () => {
            AudioSystem.resume();
            AudioSystem.mute();
        });
    }

    const btnNext = document.getElementById('btn-next-track');
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            AudioSystem.resume();
            AudioSystem.nextTrack();
        });
    }
}

// ═══════════════════════════════════════════
// 19. RESIZE
// ═══════════════════════════════════════════
function onResize() {
    if (!camera || !renderer) return;
    const root = document.getElementById('game-root');
    if (!root) return;
    const w = root.clientWidth || window.innerWidth;
    const h = root.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false); // false to avoid overriding inline styles heavily
}

// ═══════════════════════════════════════════
// 20. BOOT SEQUENCE
// ═══════════════════════════════════════════
(function boot() {
    // 1. Show loading screen
    document.getElementById('loading-screen').classList.add('active');

    // 2. Init audio
    AudioSystem.init();

    // 3. Init UI bindings
    bindUI();

    // 4. Init Three.js (may take a frame or two)
    initThree();

    // 5. Animated loader
    const bar = document.getElementById('loader-bar');
    const txt = document.getElementById('loader-text');
    const tips = [
        'Đang tải WebGL...', 'Đang xây dựng môi trường 3D...',
        'Đang thiết lập logic...', 'Đang nạp ngân hàng câu hỏi...',
        'Gần xong rồi...', 'Sẵn sàng chinh phục!'
    ];
    let step = 0;
    
    // Tách phần cache HUD ra ngoài interval (tránh chạy lặp)
    ['current-score', 'hud-distance', 'speed-fill', 'invincible-badge', 'inv-timer'].forEach(id => {
        DOM[id] = document.getElementById(id);
    });

    const interval = setInterval(() => {
        try {
            if (step < tips.length - 1) {
                step++;
                bar.style.width = (step / tips.length * 100) + '%';
                txt.textContent = tips[step - 1] || 'Vui lòng chờ...';
            } else if (G.worldReady) {
                bar.style.width = '100%';
                txt.textContent = 'Sẵn sàng!';
                clearInterval(interval);
                setTimeout(() => {
                    document.getElementById('loading-screen').classList.remove('active');
                    document.getElementById('start-screen').classList.add('active');
                    initBgCanvas();
                    const savedName = localStorage.getItem('httt_player_name');
                    if (savedName) document.getElementById('player-name').value = savedName;
                    updateStartScreenStats();
                    // Setup resize once again to be sure after loaded UI
                    onResize();
                }, 300);
            }
        } catch(e) {
            console.error("Boot loop error:", e);
            clearInterval(interval); // Kẹt thì huỷ luôn
        }
    }, 150);
})();

