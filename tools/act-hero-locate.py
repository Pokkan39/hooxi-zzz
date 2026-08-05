import json, os, glob, re
from PIL import Image
Image.MAX_IMAGE_PIXELS = None

MIRROR = 'F:/website-archives/zzz-wiki'
NAMES = ['某个梦游者的自白','画手侧写簿','走近丽都异闻','游乐岛拯救计划','极限裁决试炼',
         '妄想协鸣于此刻','天枢情报图册','拟境湮灭战','锋芒契影协战','目不可及','白银的复苏',
         '跛脚乌鸦奇闻录','艺术就是邦布','邦邦！天才与奇迹芯片','集结！模考逆袭计划',
         '旧梦的安可曲','虚狩加冕之时','心愿代投站','天使与缪斯妄想']

PATH_RE = re.compile(r'/zzz/wiki/assets/([^\s"\\]+?\.(?:png|jpg|jpeg|webp))', re.I)

cache = {}
def imginfo(rel):
    if rel in cache:
        return cache[rel]
    p = os.path.join(MIRROR, 'assets', rel)
    r = None
    if os.path.exists(p):
        try:
            sz = os.path.getsize(p)
            with Image.open(p) as im:
                w, h = im.size
            r = {'w': w, 'h': h, 'kb': sz // 1024, 'path': p.replace('\\', '/')}
        except Exception:
            r = None
    cache[rel] = r
    return r

# 就近匹配：在原始文本里找活动名，取其后最近的一张合规大图
best = {}
for fp in glob.glob(os.path.join(MIRROR, 'mirror/responses/*.json')):
    try:
        raw = open(fp, encoding='utf-8').read()
    except Exception:
        continue
    for w in NAMES:
        for m in re.finditer(re.escape(w), raw):
            window = raw[m.end():m.end() + 3000]
            for rel in dict.fromkeys(PATH_RE.findall(window)):
                info = imginfo(rel)
                if not info:
                    continue
                ar = info['w'] / info['h']
                # 首页主视觉：横版 banner，宽>=1400 且比例 1.8~2.6
                if info['w'] >= 1400 and 1.8 <= ar <= 2.6:
                    prev = best.get(w)
                    if not prev or info['w'] * info['h'] > prev['w'] * prev['h']:
                        best[w] = info
                    break

json.dump(best, open('F:/hooxi-zzz/artifacts/act_hero.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print('定位到活动:', len(best), '/', len(NAMES))
for w, v in best.items():
    print('%-16s %dx%d  %dKB' % (w[:16], v['w'], v['h'], v['kb']))
