"""Long-form documentary soundtrack mixer: warm cinema ambient score + subtle transition cues + auto-ducked Hinglish voice."""
import json
import subprocess
import sys
import wave
from pathlib import Path
import numpy as np

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
SR = 48000
rng = np.random.default_rng(42)
tl = json.loads((ROOT / 'data/timeline.json').read_text(encoding='utf-8'))
DUR = float(tl['duration'])
N = int(DUR * SR) + SR // 5


def lp(x, f, o=2):
    X = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(len(x), 1.0 / SR)
    H = 1.0 / (1.0 + (freqs / max(f, 1e-3)) ** (2 * o))
    return np.fft.irfft(X * H, len(x))


def db(x):
    return 10 ** (x / 20)


def ema_filter(x, alpha=0.00025):
    y = np.empty_like(x)
    val = 0.0
    for i in range(len(x)):
        val = (1.0 - alpha) * val + alpha * x[i]
        y[i] = val
    return y


def load_audio(f):
    out = subprocess.run([
        'ffmpeg', '-v', 'error', '-i', str(f), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'
    ], capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def make_cinema_bed():
    """Smooth 10-minute ambient scientific documentary score (minor warm drone + crystalline pulses)."""
    t = np.arange(N) / SR
    # Chord progression shifting every 15s (C minor -> Ab major -> Eb major -> Bb/G)
    prog = [
        (65.41, 130.81, 196.00, 311.13),  # Cm (C2, C3, G3, Eb4)
        (51.91, 103.83, 155.56, 261.63),  # Ab (Ab1, Ab2, Eb3, C4)
        (77.78, 155.56, 233.08, 392.00),  # Eb (Eb2, Eb3, Bb3, G4)
        (58.27, 116.54, 174.61, 293.66),  # Bb (Bb1, Bb2, F3, D4)
    ]
    x = np.zeros(N, dtype=np.float64)
    seg_s = 16.0
    for k in range(int(DUR / seg_s) + 1):
        i0 = int(k * seg_s * SR)
        i1 = min(N, int((k + 1) * seg_s * SR))
        if i0 >= N:
            break
        n_seg = i1 - i0
        tt = np.arange(n_seg) / SR
        env = np.sin(np.pi * np.linspace(0, 1, n_seg)) ** 0.35
        freqs = prog[k % len(prog)]
        pad = np.zeros(n_seg)
        for fi, f in enumerate(freqs):
            pad += np.sin(2 * np.pi * f * tt + np.sin(tt * 0.2 + fi) * 0.3) * (0.42 / (fi + 1))
        x[i0:i1] += pad * env

    # Subtle pulsing warm glass marimba dots every 3.5s
    tt_note = np.arange(int(1.6 * SR)) / SR
    note_env = np.exp(-tt_note * 2.8) * np.minimum(1.0, tt_note * 60)
    notes = [523.25, 622.25, 783.99, 587.33]
    for k in range(int(DUR / 3.5)):
        i0 = int(k * 3.5 * SR)
        if i0 + len(tt_note) >= N:
            break
        f = notes[k % len(notes)]
        chime = np.sin(2 * np.pi * f * tt_note) * note_env * 0.14
        x[i0:i0 + len(chime)] += chime

    x = lp(x, 1800)
    fade = np.ones(N)
    fi, fo = int(1.5 * SR), int(3.0 * SR)
    fade[:fi] *= np.linspace(0, 1, fi)
    fade[-fo:] *= np.linspace(1, 0, fo)
    return x / (np.abs(x).max() + 1e-9) * fade


print('[*] Synthesizing 10-min cinema music bed...')
music = make_cinema_bed()
m_stereo = np.stack([music, music], axis=1) * db(-25.5)

print('[*] Loading narration.wav & ducking music smoothly...')
v = load_audio(ROOT / 'data/narration.wav')[:N]
voice = np.zeros((N, 2), dtype=np.float64)
voice[:len(v)] = v
v_rms = np.sqrt(np.mean(voice ** 2) + 1e-12)
voice *= db(-17.5) / v_rms

lev = ema_filter(np.abs(voice.mean(1)), alpha=0.00018)
lev /= (lev.max() + 1e-9)
m_stereo *= (1.0 - 0.58 * np.clip(lev * 3.8, 0, 1))[:, None]

mix = voice + m_stereo

# Subtle documentary transition chimes & soft breath whooshes at chapter cuts
for sc_idx, sc in enumerate(tl['scenes']):
    if sc_idx == 0:
        continue
    ts = float(sc['start'])
    i0 = int(ts * SR)
    d = 0.7
    nn = int(d * SR)
    if i0 + nn < N:
        n_noise = lp(rng.standard_normal(nn), 650)
        w_env = np.sin(np.pi * np.linspace(0, 1, nn)) ** 2
        wh = n_noise / (np.abs(n_noise).max() + 1e-9) * w_env * db(-22)
        mix[i0:i0 + nn, 0] += wh
        mix[i0:i0 + nn, 1] += wh

    tt_c = np.arange(int(1.8 * SR)) / SR
    cf = 587.33 if sc_idx != 3 else 783.99
    ch = (np.sin(2 * np.pi * cf * tt_c) + 0.25 * np.sin(4 * np.pi * cf * tt_c)) * np.exp(-tt_c * 2.4) * np.minimum(1, tt_c * 80) * db(-23)
    if i0 + len(ch) < N:
        mix[i0:i0 + len(ch), 0] += ch
        mix[i0:i0 + len(ch), 1] += ch

# Soft limiting at -1 dBFS
mix = np.tanh(mix * 1.15) / 1.15
mix *= db(-1.0) / (np.abs(mix).max() + 1e-9)

out_wav = ROOT / 'data/mix.wav'
int_data = (np.clip(mix, -1.0, 1.0) * 32767).astype(np.int16)
with wave.open(str(out_wav), 'wb') as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(int_data.tobytes())

print(f"[DONE] data/mix.wav written ({DUR:.2f}s @ 48kHz stereo)")
