import asyncio
import json
import os
import re
import shutil
import subprocess
import sys
import edge_tts
import numpy as np

PROJECT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
DATA_DIR = os.path.join(PROJECT, 'data')
os.makedirs(DATA_DIR, exist_ok=True)

FFMPEG = shutil.which("ffmpeg") or (r'd:\Youtube\bin\ffmpeg.exe' if os.path.exists(r'd:\Youtube\bin\ffmpeg.exe') else "ffmpeg")
FFPROBE = shutil.which("ffprobe") or (r'd:\Youtube\bin\ffprobe.exe' if os.path.exists(r'd:\Youtube\bin\ffprobe.exe') else "ffprobe")

norm = lambda w: re.sub(r'[^a-z0-9]+', '', w.lower())

async def synth_line(text, voice, out_mp3):
    c = edge_tts.Communicate(text, voice, rate="+18%", pitch="+0Hz")
    await c.save(out_mp3)

def mp3_to_wav(mp3_path, wav_path):
    subprocess.run([
        FFMPEG, '-v', 'error', '-y', '-i', mp3_path,
        '-ac', '1', '-ar', '24000', wav_path
    ], check=True)

def get_duration(wav_path):
    res = subprocess.run([
        FFPROBE, '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'csv=p=0', wav_path
    ], capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

async def main():
    script_path = os.path.join(PROJECT, 'script.json')
    if not os.path.exists(script_path):
        print(f"[!] script.json not found at {script_path}")
        sys.exit(1)

    with open(script_path, 'r', encoding='utf-8') as f:
        S = json.load(f)

    voice = S.get('voice', 'en-US-ChristopherNeural')
    lead = S.get('lead', 0.35)
    outro = S.get('outro', 0.65)
    gap = S.get('gap', 0.22)

    print(f"[*] Synthesizing {len(S['lines'])} lines with voice {voice}...")

    line_wavs = []
    line_durs = []

    for i, ln in enumerate(S['lines']):
        mp3 = os.path.join(DATA_DIR, f'line_{i}.mp3')
        wav = os.path.join(DATA_DIR, f'line_{i}.wav')
        await synth_line(ln['text'], voice, mp3)
        mp3_to_wav(mp3, wav)
        d = get_duration(wav)
        line_wavs.append(wav)
        line_durs.append(d)
        print(f"  Line {i}: {d:.2f}s - {ln['text'][:40]}...")

    sr = 24000
    lead_samples = np.zeros(int(lead * sr), dtype=np.int16)
    gap_samples = np.zeros(int(gap * sr), dtype=np.int16)
    outro_samples = np.zeros(int(outro * sr), dtype=np.int16)

    full_audio = [lead_samples]
    line_infos = []
    current_time = lead

    for i, (wav, d, ln) in enumerate(zip(line_wavs, line_durs, S['lines'])):
        data = subprocess.run([
            FFMPEG, '-v', 'error', '-i', wav,
            '-f', 's16le', '-ac', '1', '-ar', str(sr), '-'
        ], capture_output=True, check=True).stdout
        samples = np.frombuffer(data, dtype=np.int16)
        actual_dur = len(samples) / sr
        line_infos.append({
            'i': i,
            'text': ln['text'],
            'start': round(current_time, 3),
            'end': round(current_time + actual_dur, 3)
        })
        full_audio.append(samples)
        current_time += actual_dur
        if i < len(S['lines']) - 1:
            full_audio.append(gap_samples)
            current_time += gap

    full_audio.append(outro_samples)
    total_audio = np.concatenate(full_audio)
    total_dur = len(total_audio) / sr

    narration_wav = os.path.join(DATA_DIR, 'narration.wav')
    p = subprocess.Popen([
        FFMPEG, '-v', 'error', '-y',
        '-f', 's16le', '-ar', str(sr), '-ac', '1', '-i', '-',
        '-ar', '24000', '-ac', '1', narration_wav
    ], stdin=subprocess.PIPE)
    p.communicate(input=total_audio.tobytes())
    print(f"[+] Saved narration.wav ({total_dur:.2f} s)")

    lines_json_path = os.path.join(DATA_DIR, 'lines.json')
    lines_data = {
        'duration': round(total_dur, 3),
        'voice': voice,
        'speed': S.get('speed', 1.0),
        'lines': line_infos
    }
    with open(lines_json_path, 'w', encoding='utf-8') as f:
        json.dump(lines_data, f, indent=2)

    print("[*] Performing proportional syllable word alignment...")
    words = []
    for line in line_infos:
        l_idx = line['i']
        l_start = line['start']
        l_end = line['end']
        toks = [w for w in line['text'].split() if norm(w)]

        wts = [len(norm(w)) + 2.5 + (2.5 if w.endswith(',') else 4.0 if re.search(r'[.?!]$', w) and k < len(toks) - 1 else 0) for k, w in enumerate(toks)]
        tot = sum(wts) if wts else 1
        c = l_start
        for k, w in enumerate(toks):
            d = (l_end - l_start) * wts[k] / tot
            speak = d * 0.92
            s = round(c, 3)
            e = round(c + speak, 3)
            words.append({'w': w, 'line': l_idx, 's': s, 'e': e})
            c += d

    words_json_path = os.path.join(DATA_DIR, 'words.json')
    with open(words_json_path, 'w', encoding='utf-8') as f:
        json.dump(words, f, indent=1)

    words_txt_path = os.path.join(DATA_DIR, 'words.txt')
    with open(words_txt_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(f"{w['s']:7.2f} {w['e']:7.2f}  L{w['line']:<2d} {w['w']}" for w in words))

    print(f"[+] words.json: {len(words)} words aligned.")
    print(f"[✓] Narration and alignment complete! Total duration: {total_dur:.2f}s")

if __name__ == '__main__':
    asyncio.run(main())
