/* ==========================================================================
   Global State & Canvas Setup
   ========================================================================== */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let stars = [];
let hearts = [];
let confetti = [];
let animationFrameId = null;

// Adjust Canvas Dimensions
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* ==========================================================================
   Sound Synthesizer (Web Audio API)
   ========================================================================== */
let audioCtx = null;
let musicInterval = null;
let isMuted = false;
let currentChordIndex = 0;
let synthBeat = 0;

// Romantic chord progressions (frequencies in Hz)
const chords = [
    { name: 'Cmaj7', bass: [130.81, 196.00], treble: [261.63, 329.63, 392.00, 493.88] }, // C3, G3, C4, E4, G4, B4
    { name: 'Am9',   bass: [110.00, 164.81], treble: [220.00, 261.63, 329.63, 392.00] }, // A2, E3, A3, C4, E4, G4
    { name: 'Fmaj7', bass: [87.31, 130.81],  treble: [174.61, 220.00, 261.63, 329.63] }, // F2, C3, F3, A3, C4, E4
    { name: 'G6',    bass: [98.00, 146.83],  treble: [196.00, 246.94, 293.66, 392.00] }  // G2, D3, G3, B3, D4, G4
];

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    startAmbientMusic();
}

function playTone(freq, type, volume, duration, startTime = 0) {
    if (!audioCtx || isMuted) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'sine' ? 2000 : 900, audioCtx.currentTime + startTime);
    
    gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime + startTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + startTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration);
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(audioCtx.currentTime + startTime);
    osc.stop(audioCtx.currentTime + startTime + duration);
}

// Background Music Sequencer
function startAmbientMusic() {
    const noteLength = 0.55;
    
    musicInterval = setInterval(() => {
        if (isMuted) return;
        
        const chord = chords[currentChordIndex];
        
        // Bass Pad plays every 8 beats
        if (synthBeat % 8 === 0) {
            playTone(chord.bass[0], 'sine', 0.12, 4.2);
            playTone(chord.bass[1], 'sine', 0.08, 4.2);
        }
        
        // Arpeggiate treble notes
        const noteIndex = synthBeat % chord.treble.length;
        const noteFreq = chord.treble[noteIndex];
        
        playTone(noteFreq, 'triangle', 0.07, noteLength);
        
        synthBeat++;
        if (synthBeat % 8 === 0) {
            currentChordIndex = (currentChordIndex + 1) % chords.length;
        }
    }, 550);
}

// Chime on Candle Blow out
function playBlowChime() {
    if (!audioCtx) return;
    const baseFreq = 880 + Math.random() * 220;
    playTone(baseFreq, 'sine', 0.14, 0.35);
    playTone(baseFreq * 1.5, 'sine', 0.07, 0.45, 0.03);
}

// Balloon Pop Sound Synthesizer
function playPopSound() {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, audioCtx.currentTime + 0.10);
    
    gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.10);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.10);
}

// Celebration harp arpeggio sweep
function playCelebrationHarp() {
    if (!audioCtx) return;
    const sweep = [
        261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 
        1318.51, 1567.98, 2093.00, 2637.02, 3135.96
    ];
    
    sweep.forEach((freq, idx) => {
        playTone(freq, 'sine', 0.07, 0.8, idx * 0.06);
    });
}

/* ==========================================================================
   Visual Particles Engine
   ========================================================================== */

// Twinkling Stars
function createStars() {
    stars = [];
    const starCount = Math.floor((canvas.width * canvas.height) / 12000);
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.5,
            twinkleSpeed: 0.01 + Math.random() * 0.02,
            phase: Math.random() * Math.PI * 2,
            color: `rgba(${210 + Math.random() * 45}, ${225 + Math.random() * 30}, 255, `
        });
    }
}

// Floating Hearts
function spawnHeart(forceBottom = false) {
    hearts.push({
        x: Math.random() * canvas.width,
        y: forceBottom ? canvas.height + 20 : Math.random() * canvas.height,
        size: Math.random() * 10 + 5,
        speedY: 0.4 + Math.random() * 1.0,
        swingRange: 20 + Math.random() * 35,
        swingSpeed: 0.01 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.1 + Math.random() * 0.4,
        color: `hsl(${340 + Math.random() * 25}, 100%, 78%)`
    });
}

function createInitialHearts() {
    hearts = [];
    const heartCount = Math.floor(canvas.width / 95);
    for (let i = 0; i < heartCount; i++) {
        spawnHeart(false);
    }
}

function drawHeartShape(x, y, size, opacity, color) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y - size / 2, x - size, y - size / 2, x - size, y + size / 4);
    ctx.bezierCurveTo(x - size, y + size * 0.8, x, y + size * 1.2, x, y + size * 1.2);
    ctx.bezierCurveTo(x, y + size * 1.2, x + size, y + size * 0.8, x + size, y + size / 4);
    ctx.bezierCurveTo(x + size, y - size / 2, x, y - size / 2, x, y + size / 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// Confetti Blast
function triggerConfettiBurst() {
    const colors = ['#ff7597', '#8a2be2', '#ffd700', '#22beaa', '#ffb7c5', '#ff9900', '#ffffff'];
    const count = 120;
    for (let i = 0; i < count; i++) {
        const isLeft = Math.random() > 0.5;
        const spawnX = isLeft ? 40 : canvas.width - 40;
        const targetAngle = isLeft ? -Math.PI/6 - Math.random()*Math.PI/4 : -Math.PI*5/6 + Math.random()*Math.PI/4;
        const speed = 9 + Math.random() * 14;
        
        confetti.push({
            x: spawnX,
            y: canvas.height - 20,
            vx: Math.cos(targetAngle) * speed,
            vy: Math.sin(targetAngle) * speed,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 12,
            width: 7 + Math.random() * 7,
            height: 10 + Math.random() * 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            gravity: 0.32,
            drag: 0.965,
            opacity: 1
        });
    }
}

// Animation Loop
function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Stars
    stars.forEach(star => {
        star.phase += star.twinkleSpeed;
        const opacity = 0.2 + (Math.sin(star.phase) + 1) * 0.4;
        ctx.fillStyle = star.color + opacity + ')';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw Hearts
    for (let i = hearts.length - 1; i >= 0; i--) {
        const heart = hearts[i];
        heart.phase += heart.swingSpeed;
        heart.x += Math.sin(heart.phase) * 0.3;
        heart.y -= heart.speedY;
        
        drawHeartShape(heart.x, heart.y, heart.size, heart.opacity, heart.color);
        
        if (heart.y < -30) {
            hearts.splice(i, 1);
            spawnHeart(true);
        }
    }
    
    // Draw Confetti
    for (let i = confetti.length - 1; i >= 0; i--) {
        const p = confetti[i];
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        
        if (p.y > canvas.height - 80) {
            p.opacity -= 0.025;
        }
        
        if (p.opacity <= 0 || p.y > canvas.height) {
            confetti.splice(i, 1);
            continue;
        }
        
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
        ctx.restore();
    }
    
    animationFrameId = requestAnimationFrame(drawFrame);
}

function startVisuals() {
    createStars();
    createInitialHearts();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    drawFrame();
}

/* ==========================================================================
   Navigation Stages (5-Stage System)
   ========================================================================== */
const stageLanding = document.getElementById('stage-landing');
const stageCake = document.getElementById('stage-cake');
const stageQuote = document.getElementById('stage-quote');
const stageBalloons = document.getElementById('stage-balloons');
const stageNicknames = document.getElementById('stage-nicknames');

const startWishBtn = document.getElementById('start-wish-btn');
const audioController = document.getElementById('audio-controller');

const goToBalloonsBtn = document.getElementById('go-to-balloons-btn');
const goToNicknamesBtn = document.getElementById('go-to-nicknames-btn');

// Stage Transitions
startWishBtn.addEventListener('click', () => {
    initAudio();
    stageLanding.classList.add('hidden');
    stageCake.classList.remove('hidden');
    audioController.classList.remove('hidden');
    document.getElementById('music-toggle').querySelector('.disc-wrapper').classList.add('disc-playing');
});

// Quote -> Balloons
goToBalloonsBtn.addEventListener('click', () => {
    stageQuote.classList.add('hidden');
    stageBalloons.classList.remove('hidden');
    triggerConfettiBurst();
});

// Balloons -> Nicknames (Final Page)
goToNicknamesBtn.addEventListener('click', () => {
    stageBalloons.classList.add('hidden');
    stageNicknames.classList.remove('hidden');
    
    // Grand Finale Confetti & Harp
    playCelebrationHarp();
    triggerConfettiBurst();
    const finalBurst = setInterval(() => {
        triggerConfettiBurst();
    }, 850);
    setTimeout(() => clearInterval(finalBurst), 6000);
});

/* ==========================================================================
   Audio Player Settings
   ========================================================================== */
const musicToggle = document.getElementById('music-toggle');
const discWrapper = musicToggle.querySelector('.disc-wrapper');

musicToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    isMuted = !isMuted;
    
    if (isMuted) {
        discWrapper.classList.remove('disc-playing');
    } else {
        discWrapper.classList.add('disc-playing');
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }
});

/* ==========================================================================
   Candles Extinguishing & Floating Wishes
   ========================================================================== */
const candles = document.querySelectorAll('.candle');
const messageDisplay = document.getElementById('candle-message-display');
const wishModal = document.getElementById('wish-modal');

let blownCount = 0;

// Floating wishes corresponding to candles blown
const candleWishes = [
    "Happiness ✨",
    "Good Health 🍀",
    "Sweet Love ❤️",
    "Infinite Smiles 😊",
    "Success & Joy 🌟"
];

// Blessing messages triggered one-by-one
const blessings = [
    "💖 Message 1: May you be happy, peaceful, and joyful always!",
    "🌸 Message 2: May your beautiful and gorgeous smile never fade!",
    "💫 Message 3: May your path be bright and lead to your greatest dreams!",
    "🌟 Message 4: May you stay strong, healthy, and filled with deep peace!",
    "🌹 Message 5: May your life be surrounded by pure love and prosperity!"
];

function extinguishCandle(candle, index) {
    if (candle.classList.contains('extinguished')) return;
    
    candle.classList.add('extinguished');
    blownCount++;
    
    // Play soft blow sound
    playBlowChime();
    
    // Create smoke puff animation
    createSmoke(candle);
    
    // Create floating wish text rising from the candle
    spawnFloatingWish(candle, index);
    
    // Display sweet message corresponding to the count
    const blessingIndex = Math.min(blownCount - 1, blessings.length - 1);
    messageDisplay.textContent = blessings[blessingIndex];
    messageDisplay.style.animation = 'none';
    void messageDisplay.offsetWidth; // Trigger reflow to restart animation
    messageDisplay.style.animation = 'messageReveal 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    // Check if all candles are blown
    if (blownCount === candles.length) {
        triggerCelebration();
    }
}

function spawnFloatingWish(candle, index) {
    const wish = document.createElement('div');
    wish.className = 'floating-wish-text';
    wish.innerText = candleWishes[index] || "Wish ✨";
    
    // Calculate global positioning to avoid clipping
    const rect = candle.getBoundingClientRect();
    wish.style.left = `${rect.left + rect.width / 2 - 50}px`;
    wish.style.top = `${rect.top - 20}px`;
    
    document.body.appendChild(wish);
    setTimeout(() => wish.remove(), 1800);
}

// Clicking candles individually
candles.forEach((candle, idx) => {
    candle.addEventListener('click', (e) => {
        e.stopPropagation();
        extinguishCandle(candle, idx);
    });
});

function createSmoke(candleElement) {
    const stick = candleElement.querySelector('.candle-stick');
    for (let i = 0; i < 4; i++) {
        const smoke = document.createElement('div');
        smoke.className = 'smoke-particle';
        
        const drift = (Math.random() - 0.5) * 24;
        smoke.style.setProperty('--x-offset', `${drift}px`);
        
        const scale = 5 + Math.random() * 6;
        smoke.style.width = `${scale}px`;
        smoke.style.height = `${scale}px`;
        
        smoke.style.left = '3px';
        smoke.style.top = '-10px';
        
        candleElement.appendChild(smoke);
        setTimeout(() => smoke.remove(), 1400);
    }
}

function triggerCelebration() {
    setTimeout(() => {
        // Play magical celebration audio run
        playCelebrationHarp();
        
        // Burst confetti
        triggerConfettiBurst();
        
        // Loop minor confetti blasts
        const burstInterval = setInterval(() => {
            if (Math.random() > 0.4) triggerConfettiBurst();
        }, 1500);
        setTimeout(() => clearInterval(burstInterval), 4000);
        
        // Open the birthday wish modal popup after 1.2 seconds
        setTimeout(() => {
            wishModal.classList.remove('hidden');
        }, 1200);
        
    }, 600);
}

/* ==========================================================================
   Wish Modal & Quote Page Transition
   ========================================================================== */
const modalNextBtn = document.getElementById('modal-next-btn');

modalNextBtn.addEventListener('click', () => {
    wishModal.classList.add('hidden');
    stageCake.classList.add('hidden');
    stageQuote.classList.remove('hidden');
    
    triggerConfettiBurst();
    setTimeout(triggerConfettiBurst, 500);
});

/* ==========================================================================
   STAGE 4: Balloon Memory Popping Code
   ========================================================================== */
const balloonItems = document.querySelectorAll('.balloon-item');
const memoryModal = document.getElementById('memory-modal');
const memoryPhoto = document.getElementById('memory-photo');
const memoryCaption = document.getElementById('memory-caption');
const memoryDescription = document.getElementById('memory-description');
const closeMemoryBtn = document.getElementById('close-memory-btn');
const balloonsDoneNav = document.getElementById('balloons-done-nav');

const poppedBalloons = new Set();

const memories = [
    {
        title: "Your Childhood Beauty 🌸",
        image: "assets/child.jpeg",
        description: "From the very beginning, your sweet innocence and beautiful spirit were destined to light up the world. You have always been an absolute treasure."
    },
    {
        title: "Your Sweet Kindness 💖",
        image: "assets/kind.jpeg",
        description: "Your heart is the kindest place I know. The way you care for everyone, bring warmth, and spread happiness makes me love you more every single day."
    },
    {
        title: "How I Feel With You 🤗",
        image: "assets/together.jpeg",
        description: "When you are by my side, all the chaos in the world fades away. You make me feel safe, incredibly happy, and completely whole."
    },
    {
        title: "Your Captivating Eyes 👀",
        image: "assets/eyes.jpeg",
        description: "One look into your beautiful, sparkling eyes, and I was completely lost. They hold a whole universe of love that I never want to leave."
    },
    {
        title: "Our First Memory 📸",
        image: "assets/first_pic.jpeg",
        description: "The first picture of us together—the start of our beautiful forever. Truly the most memorable, happy, and treasured day of my life."
    }
];

balloonItems.forEach((balloon) => {
    balloon.addEventListener('click', (e) => {
        const idx = parseInt(balloon.getAttribute('data-index')) - 1;
        if (poppedBalloons.has(idx)) return;
        
        poppedBalloons.add(idx);
        balloon.classList.add('popped');
        
        // Play pop audio sound synthesis
        playPopSound();
        
        // Confetti burst on pop
        triggerConfettiBurst();
        
        // Show memory modal after pop animation
        setTimeout(() => {
            const memory = memories[idx];
            memoryPhoto.src = memory.image;
            memoryCaption.textContent = memory.title;
            memoryDescription.textContent = memory.description;
            memoryModal.classList.remove('hidden');
        }, 300);
    });
});

closeMemoryBtn.addEventListener('click', () => {
    memoryModal.classList.add('hidden');
    
    // Check if all balloons are popped
    if (poppedBalloons.size === 5) {
        setTimeout(() => {
            balloonsDoneNav.classList.remove('hidden');
            triggerConfettiBurst();
        }, 400);
    }
});

/* ==========================================================================
   Page Initialize
   ========================================================================== */
window.onload = () => {
    startVisuals();
};
