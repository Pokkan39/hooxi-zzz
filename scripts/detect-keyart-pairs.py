"""按饱和度与构图比例，为每个角色识别「低饱和版 + 彩色版」影画配对。

判据：同一角色目录内，宽高比接近（差值 <= 0.04）的两张图视为同构图；
其中平均饱和度较低的一张为低饱和版，较高的为彩色版，且两者饱和度差
需达到 0.06 以上，避免把两张都彩色的图误判成一对。

只读取素材并输出 JSON 报告，不修改任何图片。
"""
import glob
import json
import os

from PIL import Image

MIN_HD_W, MIN_HD_H = 1920, 1080
RATIO_TOL = 0.04
SAT_GAP = 0.06


def stats(path):
    """用色相集中度而非饱和度均值区分单色版与彩色版。

    单色化的影画即使饱和度很高（例如整张荧光绿），色相也高度集中在一个区间；
    彩色版的色相分布明显更分散。用最大色相桶占比衡量集中度，越高越接近单色。
    """
    im = Image.open(path).convert('HSV')
    w, h = Image.open(path).size
    small = im.resize((64, 64))
    buckets = [0] * 18
    counted = 0
    for hue, sat, val in small.getdata():
        if sat < 40 or val < 24:
            continue
        buckets[min(17, hue * 18 // 256)] += 1
        counted += 1
    concentration = 0.0 if counted == 0 else max(buckets) / counted
    return {'w': w, 'h': h, 'ratio': w / h, 'mono': concentration, 'counted': counted}


def main():
    report = {'pairs': {}, 'unpaired': {}, 'lowres': []}
    for d in sorted(glob.glob('assets/gallery/*/')):
        agent = os.path.basename(d.rstrip('/\\'))
        items = {}
        for f in sorted(glob.glob(os.path.join(d, '*.webp'))):
            try:
                items[os.path.basename(f)] = stats(f)
            except Exception as exc:
                report['unpaired'].setdefault(agent, []).append(f'{os.path.basename(f)} ERR {exc}')
        best = None
        names = sorted(items)
        for i in range(len(names)):
            for j in range(i + 1, len(names)):
                a, b = items[names[i]], items[names[j]]
                if abs(a['ratio'] - b['ratio']) > RATIO_TOL:
                    continue
                if a['counted'] < 200 or b['counted'] < 200:
                    continue
                gap = abs(a['mono'] - b['mono'])
                if gap < SAT_GAP:
                    continue
                if best is None or gap > best['gap']:
                    mono, color = (names[i], names[j]) if a['mono'] > b['mono'] else (names[j], names[i])
                    best = {'gap': gap, 'mono': mono, 'color': color}
        if best:
            mono, color = items[best['mono']], items[best['color']]
            report['pairs'][agent] = {
                'mono': best['mono'], 'color': best['color'],
                'satGap': round(best['gap'], 3),
                'monoSize': [mono['w'], mono['h']], 'colorSize': [color['w'], color['h']],
            }
            for tag, st in (('mono', mono), ('color', color)):
                if st['w'] < MIN_HD_W and st['h'] < MIN_HD_H:
                    report['lowres'].append(f"{agent}/{best[tag]} {st['w']}x{st['h']}")
        else:
            report['unpaired'].setdefault(agent, []).append(f'no pair among {len(items)} images')

    os.makedirs('artifacts', exist_ok=True)
    with open('artifacts/keyart-pairs.json', 'w', encoding='utf-8') as fh:
        json.dump(report, fh, ensure_ascii=False, indent=1)
    print('paired agents:', len(report['pairs']))
    print('unpaired agents:', len(report['unpaired']))
    print('lowres in pairs:', len(report['lowres']))
    for agent, info in list(report['pairs'].items())[:6]:
        print(f"  {agent}: mono={info['mono']} color={info['color']} gap={info['satGap']}")
    for agent, why in list(report['unpaired'].items())[:8]:
        print(f"  MISS {agent}: {why[0]}")


if __name__ == '__main__':
    main()
