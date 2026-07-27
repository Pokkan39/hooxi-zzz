/* 角色影画 x-ray 数据表 — 由 assets/gallery 影画素材离线采样生成，勿手改。
     a = 主影画   ar = 宽高比   f = 主体集中度
     c = 全图采样并抬亮的角色强调色
     l = 影画上大号彩色英文字母/招牌的颜色，用于驱动 UI 按钮与描边

   l 的提取方式（见 artifacts/extract-colors.mjs）：按色相分 24 桶，
   只收 S>=0.45 且亮度适中的像素以滤掉背景与皮肤，再对每个色相桶做
   连通区域标记，取「最大连通块面积」最高的那个色。按总像素数排序会被
   大面积背景主导，按连通块才能区分成块的字母与散落噪点。

   为什么没有瞳孔色：浏览器端无法可靠检测二次元人脸虹膜——MediaPipe 与
   face-api 均为真人照片训练，对插画检测率显著下降；能识别 anime 脸的
   anime-face-detector 是 Python-only。实测启发式近似在 39/53 个角色上
   退化为与字母色同色，不可用。需要精确瞳色应改为人工标注。

   不要再引入 m0/m1/m2「邂逅影画三态」字段：那批素材来自 Steam 创意工坊
   壁纸包（workshop 431960/3491187965），不是游戏解包，其第三态（_Full）是
   去除服装的二次改图，53 个角色全部如此，已整体弃用。若要重做三态显形，
   素材须来自官方解包并逐个人工过目确认。

   am / ac = 官方成对影画：am 为单色版、ac 为彩色版，两者构图逐像素对齐。
   角色页用 am 作底层常驻、ac 按跟随光标的径向遮罩显形，于是鼠标周围
   透出真实彩色版，而不是对单图做 CSS 去色。

   配对规律：单色版编号 +1 即彩色版（编号相邻，单色在前）。
   判定单色版不能用饱和度均值或色相集中度——单色版整张被单一色相染满，
   统计上比彩色版更「彩」，两种指标都会判反。有效判据是「无彩灰像素占比」
   与「独立色相桶数」：单色版几乎无灰底，彩色版有大面积白发/黑件/灰底。
   亦不可用灰度相似度配对：velina 单彩两版灰度差达 121 但构图完全一致。

   例外：piper 是黄底深剪影单色版，亮底把色相桶撑到 24，判据漏检，人工指定；
   pyrois 的 05/06 都是单色版、无全彩版，不给 am/ac，回退单图 CSS 去色。 */
window.agentXray = {
 "zhao": {
  "a": "assets/gallery/zhao/05.png",
  "c": [
   210,
   187,
   191
  ],
  "ar": 1.81,
  "f": 0.93,
  "l": [
   241,
   99,
   123
  ],
  "am": "assets/gallery/zhao/04.png",
  "ac": "assets/gallery/zhao/05.png"
 },
 "caesar": {
  "a": "assets/gallery/caesar/02.png",
  "c": [
   210,
   195,
   163
  ],
  "ar": 1.81,
  "f": 1.09,
  "l": [
   197,
   163,
   72
  ],
  "am": "assets/gallery/caesar/01.png",
  "ac": "assets/gallery/caesar/02.png"
 },
 "nicole-demara": {
  "a": "assets/gallery/nicole-demara/05.png",
  "c": [
   210,
   175,
   185
  ],
  "ar": 1.81,
  "f": 1.11,
  "l": [
   247,
   123,
   161
  ],
  "am": "assets/gallery/nicole-demara/04.png",
  "ac": "assets/gallery/nicole-demara/05.png"
 },
 "trigger": {
  "a": "assets/gallery/trigger/01.png",
  "c": [
   210,
   195,
   129
  ],
  "ar": 1.81,
  "f": 0.89,
  "l": [
   172,
   128,
   27
  ],
  "am": "assets/gallery/trigger/00.png",
  "ac": "assets/gallery/trigger/01.png"
 },
 "manato": {
  "a": "assets/gallery/manato/05.png",
  "c": [
   210,
   164,
   156
  ],
  "ar": 1.81,
  "f": 1.27,
  "l": [
   174,
   57,
   34
  ],
  "am": "assets/gallery/manato/04.png",
  "ac": "assets/gallery/manato/05.png"
 },
 "billy-kid": {
  "a": "assets/gallery/billy-kid/02.png",
  "c": [
   210,
   145,
   143
  ],
  "ar": 1.81,
  "f": 1.38,
  "l": [
   172,
   30,
   30
  ],
  "am": "assets/gallery/billy-kid/01.png",
  "ac": "assets/gallery/billy-kid/02.png"
 },
 "anton": {
  "a": "assets/gallery/anton/04.png",
  "c": [
   210,
   158,
   131
  ],
  "ar": 1.8,
  "f": 1.27,
  "l": [
   226,
   88,
   14
  ],
  "am": "assets/gallery/anton/03.png",
  "ac": "assets/gallery/anton/04.png"
 },
 "harumasa": {
  "a": "assets/gallery/harumasa/05.png",
  "c": [
   210,
   193,
   132
  ],
  "ar": 1.82,
  "f": 0.95,
  "l": [
   219,
   179,
   19
  ],
  "am": "assets/gallery/harumasa/04.png",
  "ac": "assets/gallery/harumasa/05.png"
 },
 "ellen": {
  "a": "assets/gallery/ellen/03.png",
  "c": [
   210,
   150,
   169
  ],
  "ar": 1.81,
  "f": 1.19,
  "l": [
   228,
   55,
   111
  ],
  "am": "assets/gallery/ellen/02.png",
  "ac": "assets/gallery/ellen/03.png"
 },
 "banyue": {
  "a": "assets/gallery/banyue/05.png",
  "c": [
   210,
   203,
   184
  ],
  "ar": 1.82,
  "f": 1.03,
  "l": [
   209,
   166,
   95
  ],
  "am": "assets/gallery/banyue/04.png",
  "ac": "assets/gallery/banyue/05.png"
 },
 "piper": {
  "a": "assets/gallery/piper/02.png",
  "c": [
   210,
   194,
   146
  ],
  "ar": 1.81,
  "f": 0.94,
  "l": [
   214,
   160,
   10
  ],
  "am": "assets/gallery/piper/01.png",
  "ac": "assets/gallery/piper/02.png"
 },
 "lucy": {
  "a": "assets/gallery/lucy/03.png",
  "c": [
   210,
   180,
   153
  ],
  "ar": 1.82,
  "f": 1.3,
  "l": [
   241,
   199,
   118
  ],
  "am": "assets/gallery/lucy/01.png",
  "ac": "assets/gallery/lucy/02.png"
 },
 "yanagi": {
  "a": "assets/gallery/yanagi/03.png",
  "c": [
   210,
   175,
   182
  ],
  "ar": 1.8,
  "f": 1.12,
  "l": [
   246,
   119,
   140
  ],
  "am": "assets/gallery/yanagi/02.png",
  "ac": "assets/gallery/yanagi/03.png"
 },
 "jane-doe": {
  "a": "assets/gallery/jane-doe/07.png",
  "c": [
   210,
   169,
   189
  ],
  "ar": 1.81,
  "f": 1.03,
  "l": [
   242,
   66,
   123
  ],
  "am": "assets/gallery/jane-doe/05.png",
  "ac": "assets/gallery/jane-doe/06.png"
 },
 "pan-yinhu": {
  "a": "assets/gallery/pan-yinhu/07.jpg",
  "c": [
   210,
   184,
   125
  ],
  "ar": 1.81,
  "f": 1.14,
  "l": [
   227,
   176,
   63
  ]
 },
 "velina": {
  "a": "assets/gallery/velina/06.png",
  "c": [
   173,
   172,
   210
  ],
  "ar": 1.8,
  "f": 1.28,
  "l": [
   140,
   137,
   250
  ],
  "am": "assets/gallery/velina/05.png",
  "ac": "assets/gallery/velina/06.png"
 },
 "ben": {
  "a": "assets/gallery/ben/04.png",
  "c": [
   210,
   168,
   126
  ],
  "ar": 1.81,
  "f": 0.89,
  "l": [
   227,
   138,
   34
  ],
  "am": "assets/gallery/ben/03.png",
  "ac": "assets/gallery/ben/04.png"
 },
 "promeia": {
  "a": "assets/gallery/promeia/06.png",
  "c": [
   175,
   165,
   210
  ],
  "ar": 1.81,
  "f": 1.16,
  "l": [
   138,
   85,
   233
  ],
  "am": "assets/gallery/promeia/04.png",
  "ac": "assets/gallery/promeia/05.png"
 },
 "lighter": {
  "a": "assets/gallery/lighter/04.png",
  "c": [
   210,
   129,
   136
  ],
  "ar": 1.82,
  "f": 1.36,
  "l": [
   155,
   32,
   43
  ],
  "am": "assets/gallery/lighter/03.png",
  "ac": "assets/gallery/lighter/04.png"
 },
 "pulchra": {
  "a": "assets/gallery/pulchra/02.png",
  "c": [
   210,
   182,
   141
  ],
  "ar": 1.8,
  "f": 1.17,
  "l": [
   234,
   189,
   118
  ],
  "am": "assets/gallery/pulchra/00.png",
  "ac": "assets/gallery/pulchra/01.png"
 },
 "rina": {
  "a": "assets/gallery/rina/03.png",
  "c": [
   210,
   160,
   164
  ],
  "ar": 1.81,
  "f": 1.34,
  "l": [
   211,
   58,
   71
  ],
  "am": "assets/gallery/rina/02.png",
  "ac": "assets/gallery/rina/03.png"
 },
 "zhu-yuan": {
  "a": "assets/gallery/zhu-yuan/03.png",
  "c": [
   155,
   171,
   210
  ],
  "ar": 1.82,
  "f": 1.27,
  "l": [
   5,
   72,
   190
  ],
  "am": "assets/gallery/zhu-yuan/02.png",
  "ac": "assets/gallery/zhu-yuan/03.png"
 },
 "miyabi": {
  "a": "assets/gallery/miyabi/06.png",
  "c": [
   189,
   210,
   203
  ],
  "ar": 1.82,
  "f": 1.02,
  "l": [
   44,
   115,
   120
  ],
  "am": "assets/gallery/miyabi/04.png",
  "ac": "assets/gallery/miyabi/05.png"
 },
 "corin": {
  "a": "assets/gallery/corin/02.png",
  "c": [
   188,
   152,
   210
  ],
  "ar": 1.81,
  "f": 0.99,
  "l": [
   163,
   62,
   226
  ],
  "am": "assets/gallery/corin/01.png",
  "ac": "assets/gallery/corin/02.png"
 },
 "grace-howard": {
  "a": "assets/gallery/grace-howard/03.png",
  "c": [
   210,
   154,
   137
  ],
  "ar": 1.81,
  "f": 1.01,
  "l": [
   208,
   91,
   53
  ],
  "am": "assets/gallery/grace-howard/02.png",
  "ac": "assets/gallery/grace-howard/03.png"
 },
 "seed": {
  "a": "assets/gallery/seed/05.png",
  "c": [
   210,
   193,
   158
  ],
  "ar": 1.82,
  "f": 1.12,
  "l": [
   233,
   170,
   36
  ],
  "am": "assets/gallery/seed/04.png",
  "ac": "assets/gallery/seed/05.png"
 },
 "evelyn": {
  "a": "assets/gallery/evelyn/02.png",
  "c": [
   185,
   171,
   210
  ],
  "ar": 1.81,
  "f": 0.9,
  "l": [
   182,
   153,
   226
  ],
  "am": "assets/gallery/evelyn/01.png",
  "ac": "assets/gallery/evelyn/02.png"
 },
 "starlight-billy": {
  "a": "assets/gallery/starlight-billy/06.png",
  "c": [
   210,
   168,
   162
  ],
  "ar": 1.82,
  "f": 1.17,
  "l": [
   252,
   239,
   132
  ],
  "am": "assets/gallery/starlight-billy/04.png",
  "ac": "assets/gallery/starlight-billy/05.png"
 },
 "soukaku": {
  "a": "assets/gallery/soukaku/03.png",
  "c": [
   159,
   202,
   210
  ],
  "ar": 1.81,
  "f": 1.1,
  "l": [
   61,
   212,
   233
  ],
  "am": "assets/gallery/soukaku/02.png",
  "ac": "assets/gallery/soukaku/03.png"
 },
 "yidhari": {
  "a": "assets/gallery/yidhari/05.png",
  "c": [
   192,
   176,
   210
  ],
  "ar": 1.81,
  "f": 0.94,
  "l": [
   138,
   68,
   219
  ],
  "am": "assets/gallery/yidhari/04.png",
  "ac": "assets/gallery/yidhari/05.png"
 },
 "ju-fufu": {
  "a": "assets/gallery/ju-fufu/04.jpg",
  "c": [
   210,
   192,
   168
  ],
  "ar": 1.81,
  "f": 1.08,
  "l": [
   214,
   128,
   14
  ]
 },
 "orphie-and-magus": {
  "a": "assets/gallery/orphie-and-magus/05.png",
  "c": [
   210,
   132,
   145
  ],
  "ar": 1.81,
  "f": 1.25,
  "l": [
   193,
   46,
   74
  ],
  "am": "assets/gallery/orphie-and-magus/04.png",
  "ac": "assets/gallery/orphie-and-magus/05.png"
 },
 "burnice": {
  "a": "assets/gallery/burnice/04.png",
  "c": [
   210,
   194,
   163
  ],
  "ar": 1.82,
  "f": 1.2,
  "l": [
   198,
   163,
   68
  ],
  "am": "assets/gallery/burnice/03.png",
  "ac": "assets/gallery/burnice/04.png"
 },
 "norma": {
  "a": "assets/gallery/norma/05.png",
  "c": [
   160,
   178,
   210
  ],
  "ar": 1.82,
  "f": 1.25,
  "l": [
   64,
   110,
   184
  ],
  "am": "assets/gallery/norma/04.png",
  "ac": "assets/gallery/norma/05.png"
 },
 "soldier-11": {
  "a": "assets/gallery/soldier-11/02.png",
  "c": [
   210,
   194,
   145
  ],
  "ar": 1.81,
  "f": 1.07,
  "l": [
   225,
   185,
   25
  ],
  "am": "assets/gallery/soldier-11/01.png",
  "ac": "assets/gallery/soldier-11/02.png"
 },
 "anby": {
  "a": "assets/gallery/anby/02.png",
  "c": [
   199,
   210,
   139
  ],
  "ar": 1.81,
  "f": 0.95,
  "l": [
   189,
   213,
   45
  ],
  "am": "assets/gallery/anby/01.png",
  "ac": "assets/gallery/anby/02.png"
 },
 "lycaon": {
  "a": "assets/gallery/lycaon/04.png",
  "c": [
   204,
   205,
   210
  ],
  "ar": 1.81,
  "f": 1.23,
  "l": [
   116,
   31,
   36
  ],
  "am": "assets/gallery/lycaon/03.png",
  "ac": "assets/gallery/lycaon/04.png"
 },
 "hugo": {
  "a": "assets/gallery/hugo/05.png",
  "c": [
   210,
   107,
   107
  ],
  "ar": 1.82,
  "f": 1.51,
  "l": [
   235,
   6,
   6
  ],
  "am": "assets/gallery/hugo/04.png",
  "ac": "assets/gallery/hugo/05.png"
 },
 "vivian": {
  "a": "assets/gallery/vivian/08.png",
  "c": [
   189,
   181,
   210
  ],
  "ar": 1.81,
  "f": 1.26,
  "l": [
   133,
   97,
   225
  ],
  "am": "assets/gallery/vivian/07.png",
  "ac": "assets/gallery/vivian/08.png"
 },
 "alice": {
  "a": "assets/gallery/alice/08.png",
  "c": [
   210,
   195,
   167
  ],
  "ar": 1.82,
  "f": 0.96,
  "l": [
   245,
   206,
   123
  ],
  "am": "assets/gallery/alice/07.png",
  "ac": "assets/gallery/alice/08.png"
 },
 "pyrois": {
  "a": "assets/gallery/pyrois/05.png",
  "c": [
   53,
   69,
   210
  ],
  "ar": 1.81,
  "f": 1.09,
  "l": [
   34,
   47,
   137
  ]
 },
 "dialyn": {
  "a": "assets/gallery/dialyn/05.png",
  "c": [
   183,
   210,
   207
  ],
  "ar": 1.81,
  "f": 0.93,
  "l": [
   109,
   245,
   229
  ],
  "am": "assets/gallery/dialyn/04.png",
  "ac": "assets/gallery/dialyn/05.png"
 },
 "cissia": {
  "a": "assets/gallery/cissia/05.png",
  "c": [
   210,
   167,
   187
  ],
  "ar": 1.82,
  "f": 1.31,
  "l": [
   219,
   53,
   134
  ],
  "am": "assets/gallery/cissia/04.png",
  "ac": "assets/gallery/cissia/05.png"
 },
 "ye-shunguang": {
  "a": "assets/gallery/ye-shunguang/08.png",
  "c": [
   210,
   173,
   170
  ],
  "ar": 1.82,
  "f": 1.24,
  "l": [
   199,
   47,
   37
  ],
  "am": "assets/gallery/ye-shunguang/07.png",
  "ac": "assets/gallery/ye-shunguang/08.png"
 },
 "koleda": {
  "a": "assets/gallery/koleda/04.png",
  "c": [
   210,
   137,
   110
  ],
  "ar": 1.81,
  "f": 1.22,
  "l": [
   200,
   69,
   48
  ],
  "am": "assets/gallery/koleda/02.png",
  "ac": "assets/gallery/koleda/03.png"
 },
 "nekomata": {
  "a": "assets/gallery/nekomata/03.png",
  "c": [
   210,
   160,
   153
  ],
  "ar": 1.82,
  "f": 1.21,
  "l": [
   223,
   80,
   58
  ],
  "am": "assets/gallery/nekomata/02.png",
  "ac": "assets/gallery/nekomata/03.png"
 },
 "soldier-0-anby": {
  "a": "assets/gallery/soldier-0-anby/01.jpg",
  "c": [
   210,
   190,
   154
  ],
  "ar": 1.81,
  "f": 1.06,
  "l": [
   226,
   172,
   56
  ]
 },
 "seth": {
  "a": "assets/gallery/seth/01.png",
  "c": [
   175,
   187,
   210
  ],
  "ar": 1.81,
  "f": 1.01,
  "l": [
   75,
   120,
   206
  ],
  "am": "assets/gallery/seth/00.png",
  "ac": "assets/gallery/seth/01.png"
 },
 "qingyi": {
  "a": "assets/gallery/qingyi/03.png",
  "c": [
   165,
   210,
   201
  ],
  "ar": 1.81,
  "f": 1.19,
  "l": [
   43,
   202,
   170
  ],
  "am": "assets/gallery/qingyi/02.png",
  "ac": "assets/gallery/qingyi/03.png"
 },
 "astra-yao": {
  "a": "assets/gallery/astra-yao/03.png",
  "c": [
   210,
   168,
   169
  ],
  "ar": 1.8,
  "f": 1.09,
  "l": [
   172,
   35,
   49
  ],
  "am": "assets/gallery/astra-yao/01.png",
  "ac": "assets/gallery/astra-yao/02.png"
 },
 "lucia": {
  "a": "assets/gallery/lucia/05.png",
  "c": [
   184,
   207,
   210
  ],
  "ar": 1.82,
  "f": 0.95,
  "l": [
   29,
   181,
   203
  ],
  "am": "assets/gallery/lucia/04.png",
  "ac": "assets/gallery/lucia/05.png"
 },
 "yixuan": {
  "a": "assets/gallery/yixuan/08.jpg",
  "c": [
   210,
   192,
   159
  ],
  "ar": 1.82,
  "f": 1.05,
  "l": [
   209,
   163,
   61
  ]
 },
 "ukinami-yuzuha": {
  "a": "assets/gallery/ukinami-yuzuha/06.png",
  "c": [
   210,
   179,
   179
  ],
  "ar": 1.82,
  "f": 1.14,
  "l": [
   203,
   59,
   61
  ],
  "am": "assets/gallery/ukinami-yuzuha/05.png",
  "ac": "assets/gallery/ukinami-yuzuha/06.png"
 }
};
