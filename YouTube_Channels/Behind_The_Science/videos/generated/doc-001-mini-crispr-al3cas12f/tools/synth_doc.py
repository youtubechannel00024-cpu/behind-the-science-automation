import asyncio
import json
import os
import re
import shutil
import subprocess
import sys
import wave
import numpy as np
import edge_tts

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_DIR = os.path.join(ROOT, 'data')
AUDIO_DIR = os.path.join(ROOT, 'audio')
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

FFMPEG = shutil.which('ffmpeg') or 'ffmpeg'
FFPROBE = shutil.which('ffprobe') or 'ffprobe'


def get_dur(wav_path):
    res = subprocess.run([
        FFPROBE, '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'csv=p=0', wav_path
    ], capture_output=True, text=True, check=True)
    return float(res.stdout.strip())


def split_caption_chunks(cap_text, start_t, end_t):
    """Split a long Hinglish caption into smooth 2-3 readable subtitle phrases aligned by char weight."""
    words = cap_text.strip().split()
    if len(words) <= 10:
        return [{'s': round(start_t, 3), 'e': round(end_t, 3), 'text': cap_text}]

    # Group into chunks of ~8-11 words, preferring natural punctuation splits
    chunks = []
    cur = []
    for w in words:
        cur.append(w)
        if len(cur) >= 7 and (w.endswith(',') or w.endswith('.') or w.endswith('?') or w.endswith('!') or w.endswith('—') or len(cur) >= 10):
            chunks.append(' '.join(cur))
            cur = []
    if cur:
        if len(cur) <= 3 and chunks:
            chunks[-1] += ' ' + ' '.join(cur)
        else:
            chunks.append(' '.join(cur))

    weights = [max(4, len(c)) for c in chunks]
    tot = sum(weights)
    dur = end_t - start_t
    out = []
    t = start_t
    for idx, (c, wt) in enumerate(zip(chunks, weights)):
        d = dur * (wt / tot)
        nxt = end_t if idx == len(chunks) - 1 else t + d
        out.append({'s': round(t, 3), 'e': round(nxt, 3), 'text': c})
        t = nxt
    return out


async def synth_one(sem, sc_id, ln_idx, tts_text, voice, rate, sr):
    mp3 = os.path.join(AUDIO_DIR, f"{sc_id}_L{ln_idx:02d}.mp3")
    wav = os.path.join(AUDIO_DIR, f"{sc_id}_L{ln_idx:02d}.wav")
    if '--rebuild' in sys.argv or not os.path.exists(wav):
        async with sem:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(tts_text, voice, rate=rate, pitch="-2Hz").save(mp3)
                    subprocess.run([FFMPEG, '-v', 'error', '-y', '-i', mp3, '-ac', '1', '-ar', str(sr), wav], check=True)
                    break
                except Exception as e:
                    print(f"  Retry {attempt+1} for {sc_id}_L{ln_idx:02d}: {e}")
                    await asyncio.sleep(1.5)
    return wav


async def synth_all():
    script = json.loads(open(os.path.join(ROOT, 'script.json'), 'r', encoding='utf-8').read())
    voice = script.get('voice', 'hi-IN-MadhurNeural')
    rate = script.get('rate', '+4%')
    lead = float(script.get('lead', 1.0))
    outro = float(script.get('outro', 2.5))
    gap = float(script.get('gap', 0.35))
    scene_gap = 0.85

    sr = 24000
    sem = asyncio.Semaphore(5)
    tasks = []
    for sc in script['scenes']:
        for ln_idx, ln in enumerate(sc['lines']):
            tasks.append(synth_one(sem, sc['id'], ln_idx, ln['tts'], voice, rate, sr))
    print(f"[*] Synthesizing {len(tasks)} Hinglish voice lines concurrently...")
    await asyncio.gather(*tasks)

    full_samples = [np.zeros(int(lead * sr), dtype=np.int16)]
    cur_t = lead

    timeline_scenes = []
    timeline_lines = []
    subtitles = []
    line_counter = 0

    for sc_idx, sc in enumerate(script['scenes']):
        sc_start = cur_t
        print(f"\n=== {sc['id']}: {sc['chapter']} ===")
        for ln_idx, ln in enumerate(sc['lines']):
            wav = os.path.join(AUDIO_DIR, f"{sc['id']}_L{ln_idx:02d}.wav")

            raw = subprocess.run([
                FFMPEG, '-v', 'error', '-i', wav, '-f', 's16le', '-ac', '1', '-ar', str(sr), '-'
            ], capture_output=True, check=True).stdout
            samples = np.frombuffer(raw, dtype=np.int16)
            dur = len(samples) / sr

            l_start = cur_t
            l_end = cur_t + dur
            full_samples.append(samples)
            cur_t = l_end

            timeline_lines.append({
                'idx': line_counter,
                'sceneId': sc['id'],
                'start': round(l_start, 3),
                'end': round(l_end, 3),
                'tts': ln['tts'],
                'cap': ln['cap'],
                'tag': ln['tag']
            })
            subtitles.extend(split_caption_chunks(ln['cap'], l_start, l_end))
            line_counter += 1
            print(f"  {sc['id']}_L{ln_idx:02d} ({l_start:6.2f} -> {l_end:6.2f}, {dur:5.2f}s): {ln['cap'][:52]}...")

            if ln_idx < len(sc['lines']) - 1:
                full_samples.append(np.zeros(int(gap * sr), dtype=np.int16))
                cur_t += gap

        sc_end = cur_t
        if sc_idx < len(script['scenes']) - 1:
            full_samples.append(np.zeros(int(scene_gap * sr), dtype=np.int16))
            cur_t += scene_gap
            sc_visual_end = cur_t - 0.35
        else:
            full_samples.append(np.zeros(int(outro * sr), dtype=np.int16))
            cur_t += outro
            sc_visual_end = cur_t

        timeline_scenes.append({
            'id': sc['id'],
            'chapter': sc['chapter'],
            'title': sc['title'],
            'plate': sc['plate'],
            'altPlate': sc.get('altPlate', sc['plate']),
            'mood': sc.get('mood', 'science'),
            'start': round(0.0 if sc_idx == 0 else timeline_scenes[-1]['end'], 3),
            'end': round(sc_visual_end, 3),
            'speechStart': round(sc_start, 3),
            'speechEnd': round(sc_end, 3)
        })

    total_samples = np.concatenate(full_samples)
    total_dur = len(total_samples) / sr
    narration_wav = os.path.join(DATA_DIR, 'narration.wav')
    with wave.open(narration_wav, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(total_samples.tobytes())

    timeline = {
        'title': script['title'],
        'duration': round(total_dur, 3),
        'voice': voice,
        'scenes': timeline_scenes,
        'lines': timeline_lines,
        'subtitles': subtitles
    }
    with open(os.path.join(DATA_DIR, 'timeline.json'), 'w', encoding='utf-8') as f:
        json.dump(timeline, f, indent=2, ensure_ascii=False)

    mins = int(total_dur // 60)
    secs = total_dur % 60
    print(f"\n[DONE] narration.wav saved: {total_dur:.2f}s ({mins}:{secs:05.2f}) · {len(timeline_lines)} lines · {len(subtitles)} subtitle chunks")


if __name__ == '__main__':
    asyncio.run(synth_all())
