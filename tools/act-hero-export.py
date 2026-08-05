import json, os, re
from PIL import Image
Image.MAX_IMAGE_PIXELS = None

best = json.load(open('F:/hooxi-zzz/artifacts/act_hero.json', encoding='utf-8'))
OUT = 'F:/hooxi-zzz/assets/hero/acts'
os.makedirs(OUT, exist_ok=True)

# 活动名 -> 英文 slug
SLUG = {
    '某个梦游者的自白': 'sleepwalker-confession',
    '旧梦的安可曲': 'old-dream-encore',
    '画手侧写簿': 'artist-profile-book',
    '走近丽都异闻': 'lido-strange-tales',
    '游乐岛拯救计划': 'amusement-island-rescue',
    '极限裁决试炼': 'extreme-judgment-trial',
    '妄想协鸣于此刻': 'delusion-resonance',
    '天枢情报图册': 'tianshu-intel-atlas',
    '拟境湮灭战': 'simulated-annihilation',
    '锋芒契影协战': 'blade-shadow-coop',
    '目不可及': 'beyond-sight',
    '白银的复苏': 'silver-revival',
    '跛脚乌鸦奇闻录': 'lame-crow-chronicle',
    '艺术就是邦布': 'art-is-bangboo',
    '邦邦！天才与奇迹芯片': 'bangboo-genius-chip',
    '集结！模考逆袭计划': 'mock-exam-comeback',
    '虚狩加冕之时': 'hollow-hunt-coronation',
    '心愿代投站': 'wish-proxy-station',
    '天使与缪斯妄想': 'angel-muse-delusion',
}

TARGET_W = 2200          # 首页全幅够用，避免 2560 过大
manifest = []

for name, v in best.items():
    slug = SLUG.get(name)
    if not slug:
        print('!! 缺 slug:', name)
        continue
    im = Image.open(v['path']).convert('RGB')
    if im.width > TARGET_W:
        im = im.resize((TARGET_W, round(im.height * TARGET_W / im.width)), Image.LANCZOS)
    dst = os.path.join(OUT, slug + '.webp')
    im.save(dst, 'WEBP', quality=82, method=6)
    kb = os.path.getsize(dst) // 1024
    manifest.append({'slug': slug, 'name': name, 'w': im.width, 'h': im.height, 'kb': kb})
    print('%-26s %dx%d  %dKB' % (slug, im.width, im.height, kb))

manifest.sort(key=lambda m: m['slug'])
json.dump(manifest, open('F:/hooxi-zzz/artifacts/act_manifest.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print('\n共', len(manifest), '张, 总体积', sum(m['kb'] for m in manifest) // 1024, 'MB')
