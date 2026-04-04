/**
 * ================================================================
 * AUDIO.JS - Web Audio API Synthesizer Engine
 * 10 procedural music tracks + Sound Effects
 * Không cần file nhạc bên ngoài - tự tổng hợp hoàn toàn
 * ================================================================
 */
const AudioSystem = (() => {
    let ctx = null;
    let masterGain, musicGain, sfxGain;
    let currentTrackIdx = 0;
    let isMuted = false;
    let trackScheduler = null;
    let isInitialized = false;
    let currentSources = [];

    // ─── Scale Definitions ───────────────────────────────────────
    const SCALES = {
        major:       [0, 2, 4, 5, 7, 9, 11],
        minor:       [0, 2, 3, 5, 7, 8, 10],
        pentatonic:  [0, 2, 4, 7, 9],
        blues:       [0, 3, 5, 6, 7, 10],
        dorian:      [0, 2, 3, 5, 7, 9, 10],
        mixolydian:  [0, 2, 4, 5, 7, 9, 10],
    };

    // ─── 10 Track Definitions ────────────────────────────────────
    const TRACKS = [
        {
            name: 'City Sprint',
            bpm: 128, root: 60, scale: 'major',
            bassPattern: [1, 0, 0, 1, 0, 1, 0, 0],
            melodyNotes: [4, 4, 7, 4, 9, 7, 4, 2],
            waveform: 'sawtooth', pad: 'triangle',
            filterFreq: 1200, reverbMix: 0.2,
        },
        {
            name: 'Midnight Race',
            bpm: 110, root: 57, scale: 'minor',
            bassPattern: [1, 0, 1, 0, 0, 1, 0, 1],
            melodyNotes: [0, 3, 5, 3, 7, 5, 3, 0],
            waveform: 'square', pad: 'sine',
            filterFreq: 900, reverbMix: 0.4,
        },
        {
            name: 'Electric Dash',
            bpm: 140, root: 62, scale: 'dorian',
            bassPattern: [1, 1, 0, 1, 0, 1, 1, 0],
            melodyNotes: [2, 5, 7, 9, 7, 5, 2, 0],
            waveform: 'sawtooth', pad: 'sawtooth',
            filterFreq: 1800, reverbMix: 0.15,
        },
        {
            name: 'Horizon Run',
            bpm: 120, root: 55, scale: 'pentatonic',
            bassPattern: [1, 0, 0, 1, 1, 0, 0, 1],
            melodyNotes: [4, 7, 9, 7, 4, 2, 0, 2],
            waveform: 'triangle', pad: 'triangle',
            filterFreq: 1500, reverbMix: 0.3,
        },
        {
            name: 'Pulse Drive',
            bpm: 132, root: 64, scale: 'mixolydian',
            bassPattern: [1, 0, 1, 0, 1, 0, 1, 0],
            melodyNotes: [0, 4, 7, 10, 7, 4, 2, 0],
            waveform: 'square', pad: 'sine',
            filterFreq: 1000, reverbMix: 0.2,
        },
        {
            name: 'Neon Boulevard',
            bpm: 116, root: 59, scale: 'minor',
            bassPattern: [1, 0, 0, 0, 1, 0, 1, 0],
            melodyNotes: [3, 5, 7, 5, 3, 5, 7, 10],
            waveform: 'sawtooth', pad: 'triangle',
            filterFreq: 800, reverbMix: 0.5,
        },
        {
            name: 'Turbo Storm',
            bpm: 148, root: 61, scale: 'blues',
            bassPattern: [1, 1, 0, 0, 1, 0, 1, 1],
            melodyNotes: [0, 3, 6, 7, 6, 3, 0, 10],
            waveform: 'sawtooth', pad: 'square',
            filterFreq: 2000, reverbMix: 0.1,
        },
        {
            name: 'Dawn Runner',
            bpm: 108, root: 65, scale: 'major',
            bassPattern: [1, 0, 0, 1, 0, 0, 1, 0],
            melodyNotes: [7, 9, 11, 12, 11, 9, 7, 4],
            waveform: 'triangle', pad: 'sine',
            filterFreq: 1400, reverbMix: 0.35,
        },
        {
            name: 'Street Legend',
            bpm: 124, root: 58, scale: 'dorian',
            bassPattern: [1, 0, 1, 1, 0, 1, 0, 0],
            melodyNotes: [2, 3, 5, 7, 9, 7, 5, 3],
            waveform: 'square', pad: 'triangle',
            filterFreq: 1100, reverbMix: 0.25,
        },
        {
            name: 'Final Lap',
            bpm: 156, root: 63, scale: 'minor',
            bassPattern: [1, 1, 1, 0, 1, 1, 0, 1],
            melodyNotes: [0, 3, 7, 10, 12, 10, 7, 3],
            waveform: 'sawtooth', pad: 'sawtooth',
            filterFreq: 2200, reverbMix: 0.1,
        },
    ];

    // ─── helpers ─────────────────────────────────────────────────
    function midiToHz(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    function scaleNote(root, scaleKey, degree) {
        const s = SCALES[scaleKey];
        const oct = Math.floor(degree / s.length);
        const idx = ((degree % s.length) + s.length) % s.length;
        return root + s[idx] + oct * 12;
    }

    // ─── Reverb Convolver ─────────────────────────────────────────
    function buildReverb(decay = 1.5) {
        const rate   = ctx.sampleRate;
        const len    = rate * decay;
        const buf    = ctx.createBuffer(2, len, rate);
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch);
            for (let i = 0; i < len; i++)
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
        }
        const conv = ctx.createConvolver();
        conv.buffer = buf;
        return conv;
    }

    // ─── Play a note burst ────────────────────────────────────────
    function playNote(freq, time, dur, type = 'sawtooth', gainVal = 0.3, dest) {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type      = type;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(gainVal, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(gain);
        gain.connect(dest || musicGain);
        osc.start(time);
        osc.stop(time + dur + 0.05);
        currentSources.push(osc);
    }

    // Kick drum using sine wave
    function playKick(time) {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, time);
        osc.frequency.exponentialRampToValueAtTime(50, time + 0.12);
        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
        osc.connect(gain);
        gain.connect(musicGain);
        osc.start(time); osc.stop(time + 0.2);
        currentSources.push(osc);
    }

    // Hihat via filtered noise
    function playHat(time, open = false) {
        const buf    = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
        const data   = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src    = ctx.createBufferSource();
        src.buffer   = buf;
        const filt   = ctx.createBiquadFilter();
        filt.type    = 'highpass';
        filt.frequency.value = 8000;
        const gain   = ctx.createGain();
        const dur    = open ? 0.08 : 0.03;
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        src.connect(filt);
        filt.connect(gain);
        gain.connect(musicGain);
        src.start(time); src.stop(time + dur + 0.01);
        currentSources.push(src);
    }

    // ─── Schedule One Bar of a Track ─────────────────────────────
    function scheduleBar(track, startTime) {
        const bps      = track.bpm / 60;
        const beatDur  = 1 / bps;
        const stepDur  = beatDur / 2;  // 8th notes
        const steps    = 8;
        const rev      = buildReverb(1.2);
        rev.connect(musicGain);

        // Filter for warmth
        const filt = ctx.createBiquadFilter();
        filt.type  = 'lowpass';
        filt.frequency.value = track.filterFreq;
        filt.connect(musicGain);

        for (let s = 0; s < steps; s++) {
            const t = startTime + s * stepDur;

            // Kick on beats 1 and 3 (steps 0 and 4)
            if (s === 0 || s === 4) playKick(t);

            // Hihat every step, open on every other
            playHat(t, s % 2 === 1);

            // Bass line
            if (track.bassPattern[s]) {
                const bassFreq = midiToHz(scaleNote(track.root - 12, track.scale, 0));
                playNote(bassFreq, t, stepDur * 0.8, 'sine', 0.5, filt);
            }

            // Melody
            const midiNote = scaleNote(track.root, track.scale, track.melodyNotes[s]);
            const freq     = midiToHz(midiNote);
            playNote(freq, t, stepDur * 0.7, track.waveform, 0.18, filt);

            // Pad (quieter, with reverb)
            if (s % 4 === 0) {
                const padNote = scaleNote(track.root, track.scale, track.melodyNotes[s] + 4);
                playNote(midiToHz(padNote), t, stepDur * 2.5, track.pad, 0.08, rev);
            }
        }
    }

    // ─── Continuous Scheduler Loop ────────────────────────────────
    function startScheduler(track) {
        if (!ctx) return;
        stopAllSources();
        const bps      = track.bpm / 60;
        const barDur   = (4 / bps);

        let nextBar = ctx.currentTime + 0.05;

        function loop() {
            if (!isInitialized) return;
            scheduleBar(track, nextBar);
            nextBar += barDur;
            trackScheduler = setTimeout(loop, (barDur - 0.1) * 1000);
        }
        loop();
    }

    function stopAllSources() {
        clearTimeout(trackScheduler);
        currentSources.forEach(s => { try { s.stop(); } catch (e) {} });
        currentSources = [];
    }

    // ─── SFX ─────────────────────────────────────────────────────
    function sfxJump() {
        if (!ctx || isMuted) return;
        playNote(440, ctx.currentTime, 0.12, 'square', 0.25, sfxGain);
        playNote(660, ctx.currentTime + 0.07, 0.1, 'square', 0.2, sfxGain);
    }

    function sfxSlide() {
        if (!ctx || isMuted) return;
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.type  = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
        g.gain.setValueAtTime(0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(g); g.connect(sfxGain);
        osc.start(); osc.stop(ctx.currentTime + 0.22);
        currentSources.push(osc);
    }

    function sfxCoin() {
        if (!ctx || isMuted) return;
        [880, 1100, 1320].forEach((f, i) => {
            playNote(f, ctx.currentTime + i * 0.05, 0.12, 'sine', 0.25, sfxGain);
        });
    }

    function sfxCollide() {
        if (!ctx || isMuted) return;
        const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++)
            data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g   = ctx.createGain();
        g.gain.setValueAtTime(0.6, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        src.connect(g); g.connect(sfxGain);
        src.start(); src.stop(ctx.currentTime + 0.17);
        currentSources.push(src);
    }

    function sfxCorrect() {
        if (!ctx || isMuted) return;
        [523, 659, 784, 1047].forEach((f, i) => {
            playNote(f, ctx.currentTime + i * 0.08, 0.2, 'sine', 0.3, sfxGain);
        });
    }

    function sfxWrong() {
        if (!ctx || isMuted) return;
        [440, 370].forEach((f, i) => {
            playNote(f, ctx.currentTime + i * 0.12, 0.25, 'square', 0.3, sfxGain);
        });
    }

    function sfxLaneChange() {
        if (!ctx || isMuted) return;
        playNote(330, ctx.currentTime, 0.06, 'square', 0.15, sfxGain);
    }

    // ─── PUBLIC API ───────────────────────────────────────────────
    return {
        init() {
            try {
                ctx   = new (window.AudioContext || window.webkitAudioContext)();
                masterGain = ctx.createGain();
                musicGain  = ctx.createGain();
                sfxGain    = ctx.createGain();
                musicGain.gain.value = 0.55;
                sfxGain.gain.value   = 0.9;
                masterGain.gain.value = 1.0;
                musicGain.connect(masterGain);
                sfxGain.connect(masterGain);
                masterGain.connect(ctx.destination);
                isInitialized = true;
            } catch (e) {
                console.warn('AudioContext not available:', e);
            }
        },

        resume() {
            if (ctx && ctx.state === 'suspended') ctx.resume();
        },

        playTrack(idx) {
            if (!isInitialized) return;
            currentTrackIdx = ((idx % TRACKS.length) + TRACKS.length) % TRACKS.length;
            stopAllSources();
            if (!isMuted) startScheduler(TRACKS[currentTrackIdx]);
            const el = document.getElementById('track-name');
            if (el) el.textContent = TRACKS[currentTrackIdx].name;
        },

        nextTrack() {
            this.playTrack(currentTrackIdx + 1);
        },

        mute() {
            isMuted = !isMuted;
            if (isMuted) {
                stopAllSources();
                masterGain && (masterGain.gain.value = 0);
            } else {
                masterGain && (masterGain.gain.value = 1.0);
                this.playTrack(currentTrackIdx);
            }
            const btn = document.getElementById('btn-mute');
            if (btn) btn.textContent = isMuted ? '🔇' : '🔊';
            return isMuted;
        },

        isMuted() { return isMuted; },
        getTracksCount() { return TRACKS.length; },
        getTrackName(i) { return TRACKS[i]?.name || ''; },

        // SFX shortcuts
        jump:     sfxJump,
        slide:    sfxSlide,
        coin:     sfxCoin,
        collide:  sfxCollide,
        correct:  sfxCorrect,
        wrong:    sfxWrong,
        lane:     sfxLaneChange,
    };
})();
