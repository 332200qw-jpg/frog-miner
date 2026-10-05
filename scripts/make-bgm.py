# 生成舒缓的工厂背景音乐（八音盒风格，无缝循环）
# 输出 assets/bgm.wav（44.1kHz 单声道 16bit），替换原来较吵的 bgm.mp3
import numpy as np
import wave, struct, os

SR = 44100
BPM = 66
BEAT = 60.0 / BPM          # 每拍秒数
BAR = BEAT * 4             # 4/4 拍
BARS = 8
TOTAL = BAR * BARS
N = int(SR * TOTAL)
track = np.zeros(N, dtype=np.float64)

def note_at(name):
    # 音名 -> 频率，如 'E5' 'C4' 'F#3'
    names = {'C':0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11}
    i = 1 if name[1] != '#' else 2
    semis = names[name[:i]]
    octave = int(name[i:])
    midi = semis + (octave + 1) * 12
    return 440.0 * 2 ** ((midi - 69) / 12)

def add(sig, t0):
    i0 = int(t0 * SR)
    i1 = min(N, i0 + len(sig))
    if i1 > i0:
        track[i0:i1] += sig[:i1 - i0]

def music_box(freq, dur=1.4, vol=0.30):
    """八音盒拨弦：基频 + 泛音列，指数衰减"""
    t = np.arange(int(SR * dur)) / SR
    sig = np.zeros_like(t)
    for ratio, amp in [(1, 1.0), (2, 0.42), (3, 0.18), (4.2, 0.07)]:
        sig += amp * np.sin(2 * np.pi * freq * ratio * t)
    env = np.exp(-t / 0.34)
    env[: int(SR * 0.004)] *= np.linspace(0, 1, int(SR * 0.004))  # 4ms 防爆音起音
    return sig * env * vol

def pad_chord(freqs, t0, dur=BAR, vol=0.045):
    """柔和垫底和声：三角波感（正弦+三阶泛音），慢起慢落"""
    t = np.arange(int(SR * dur)) / SR
    sig = np.zeros_like(t)
    for f in freqs:
        sig += np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * f * 3 * t)
    a = int(SR * 0.9)
    env = np.ones_like(t)
    env[:a] = np.linspace(0, 1, a)
    env[-a:] = np.linspace(1, 0, a)
    return sig * env * vol / max(1, len(freqs)) * 2.2

def bass(freq, dur=1.8, vol=0.11):
    t = np.arange(int(SR * dur)) / SR
    sig = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t)
    env = np.exp(-t / 0.55)
    env[: int(SR * 0.01)] *= np.linspace(0, 1, int(SR * 0.01))
    return sig * env * vol

# 和弦进行：C - Am - F - G（每和弦两小节）
CHORDS = [
    ('C',  ['C3', 'E3', 'G3'], ['C4', 'E4', 'G4']),
    ('Am', ['A2', 'C3', 'E3'], ['A3', 'C4', 'E4']),
    ('F',  ['F2', 'A2', 'C3'], ['F3', 'A3', 'C4']),
    ('G',  ['G2', 'B2', 'D3'], ['G3', 'B3', 'D4']),
]

# 八音盒旋律：(小节, 拍, 音名, 音量) —— C 大调，舒缓童谣感
MELODY = [
    (0, 0, 'E5', .30), (0, 2, 'G5', .26),
    (1, 0, 'C6', .32), (1, 2, 'G5', .24), (1, 3, 'E5', .22),
    (2, 0, 'A5', .30), (2, 2, 'E5', .24),
    (3, 0, 'C5', .24), (3, 2, 'E5', .24), (3, 3, 'A5', .26),
    (4, 0, 'A5', .30), (4, 2, 'C6', .28),
    (5, 0, 'A5', .24), (5, 1, 'G5', .22), (5, 2, 'F5', .26),
    (6, 0, 'G5', .28), (6, 2, 'B5', .26),
    (7, 0, 'D6', .30), (7, 2, 'B5', .22), (7, 3, 'G5', .20),
]

for ci, (name, bassNotes, padNotes) in enumerate(CHORDS):
    bar0 = ci * 2  # 每个和弦占 2 小节
    # 低音：每小节第 1、3 拍
    for b in range(2):
        add(bass(note_at(bassNotes[0])), (bar0 + b) * BAR)
        add(bass(note_at(bassNotes[1]), vol=0.08), (bar0 + b) * BAR + BEAT * 2)
    # 垫底和声：铺满两小节
    add(pad_chord([note_at(n) for n in padNotes], 0, dur=BAR * 2, vol=0.05), bar0 * BAR)
    # 分解和弦琶音（很轻，填充中频）
    arp = padNotes + [padNotes[1]]
    for b in range(2):
        for k, nn in enumerate(arp):
            add(music_box(note_at(nn), dur=1.0, vol=0.075),
                (bar0 + b) * BAR + k * BEAT)

for bar, beat, nn, v in MELODY:
    add(music_box(note_at(nn), dur=1.5, vol=v), bar * BAR + beat * BEAT)

# 母带：软限制 + 归一化到 -3 dBFS
track = np.tanh(track * 1.1)
peak = np.max(np.abs(track))
track = track / peak * 0.70

out = os.path.join(os.path.dirname(__file__), '..', 'assets', 'bgm.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, s)) * 32767)) for s in track))
print('written', out, '%.1f sec' % TOTAL, '%.2f MB' % (os.path.getsize(out) / 1048576))
