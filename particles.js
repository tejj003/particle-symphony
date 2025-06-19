// Enhanced audio engine with Web Audio API
class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.analyser = null;
        this.reverb = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            
            // Create analyser for visualization
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            
            // Create reverb
            this.reverb = await this.createReverb();
            
            // Connect nodes
            this.masterGain.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            if (this.reverb) {
                this.masterGain.connect(this.reverb);
                this.reverb.connect(this.audioContext.destination);
            }
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    async createReverb() {
        try {
            const convolver = this.audioContext.createConvolver();
            const response = await fetch('https://cdn.jsdelivr.net/gh/GoogleChromeLabs/web-audio-samples@main/samples/audio/impulse-responses/spreader50-65ms.wav');
            const arrayBuffer = await response.arrayBuffer();
            const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
            convolver.buffer = buffer;
            return convolver;
        } catch (error) {
            console.log('Reverb not available');
            return null;
        }
    }

    playNote(frequency, type, duration = 0.5) {
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        
        // Create oscillator
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Set oscillator properties
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.type = type;
        
        // ADSR envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.1); // Decay/Sustain
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Release
        
        // Connect and play
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(value, this.audioContext.currentTime);
        }
    }
}

// Export for use in main file
window.AudioEngine = AudioEngine;
