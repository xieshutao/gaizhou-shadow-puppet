// pages/create-play/create-play.js
// 盖州皮影 · AI造戏 — 8故事×4人物×4场景×4特效 = 128种组合
// 关键词匹配 → 一键生成皮影戏组合

// ==================== 故事库 (4传统+4现代) ====================
var STORIES = [
  {
    id: 'wufenghui', name: '五峰会', era: '传统剧目',
    summary: '忠良曹克让遭奸相沈恒威陷害，满门抄斩。长子曹珍逃出生天，考中状元后娶仇人之女沈冰洁。沈冰洁深明大义助夫翻案，曹家三代合力平冤卫国。',
    keywords: '忠良 陷害 复仇 状元 团圆 奸臣 忠臣'
  },
  {
    id: 'xuerengui', name: '薛仁贵征东', era: '传统剧目',
    summary: '白袍小将薛仁贵投军报国，被奸臣张士贵冒功打压。淤泥河单骑救驾唐太宗，三箭定天山，终封平辽王。辽东本土英雄传说。',
    keywords: '白袍 征东 救驾 天山 辽东 唐太宗 将军'
  },
  {
    id: 'fanlihua', name: '樊梨花征西', era: '传统剧目',
    summary: '寒江关女将樊梨花，自幼师从黎山老母学得移山倒海之术。三休三请嫁薛丁山为妻，挂帅征西，大破白虎关。盖州皮影经典刀马旦戏。',
    keywords: '女将 征西 梨花 挂帅 白虎关 薛丁山 巾帼'
  },
  {
    id: 'yangjiajiang', name: '杨家将', era: '传统剧目',
    summary: '老令公杨业率七郎八虎血战金沙滩，杨门女将穆桂英挂帅大破天门阵。满门忠烈，世代戍边，盖州皮影连演月余不衰的大部头。',
    keywords: '杨家 七郎 八虎 穆桂英 天门阵 忠烈 辽'
  },
  {
    id: 'wangershan', name: '望儿山·慈母谣', era: '现代创作',
    summary: '盖州熊岳望儿山下，母亲日复一日眺望大海，盼儿赶考归来。十年、二十年……年迈的母亲化为石像。上天感其母爱，拔地而起望儿山。',
    keywords: '望儿山 母亲 母爱 熊岳 盼归 大海 等待'
  },
  {
    id: 'laokedao', name: '老刻刀', era: '现代创作',
    summary: '七十岁的老艺人林师傅，把用了五十年的刻刀交到小徒弟手里。一刀一刻间，驴皮上的纹路刻着两代人的皮影岁月。手艺在，魂就在。',
    keywords: '刻刀 传承 老艺人 徒弟 手艺 师傅 岁月'
  },
  {
    id: 'xihekou', name: '西河口灯火', era: '现代创作',
    summary: '康熙年间，盖州西河口港千帆云集，南北客商辐辏。夜幕降临，皮影班的影窗在码头亮起，船工们围坐看戏，光影里的辽南乡愁。',
    keywords: '西河口 码头 港口 船工 灯火 乡愁 海'
  },
  {
    id: 'youjianyingchuang', name: '又见影窗亮', era: '现代创作',
    summary: '在外打工的年轻人回到盖州老家，发现村里最后一个皮影班快散了。他拿起爷爷留下的影人，擦去灰尘——老影窗再一次亮起了灯。',
    keywords: '回乡 重建 影窗 年轻 复兴 爷爷 灯'
  }
]

// ==================== 人物库 (4个，对应生旦净丑体系) ====================
var CHARACTERS = [
  {
    id: 'baiPaoJiang', name: '白袍将', role: '武生',
    summary: '银枪白马少年郎，一人一骑破敌阵',
    keywords: '白袍 少年 将军 英雄 武生 勇敢 冲锋'
  },
  {
    id: 'nvYuanShuai', name: '女元帅', role: '武旦',
    summary: '巾帼不让须眉，挂帅出征镇边关',
    keywords: '女将 挂帅 巾帼 元帅 武旦 英姿 征'
  },
  {
    id: 'laoShiFu', name: '老师傅', role: '老生',
    summary: '苍颜白发刻影人，一口皮影唱一生',
    keywords: '老艺人 刻刀 师傅 传承 老生 手艺 岁月'
  },
  {
    id: 'shaoBanZhu', name: '少班主', role: '小生',
    summary: '初出茅庐接衣钵，要让影窗再亮起',
    keywords: '年轻 徒弟 传承 后生 小生 回乡 复兴'
  }
]

// ==================== 场景库 (4个) ====================
var SCENES = [
  {
    id: 'shuaiZhang', name: '帅帐点兵', 
    summary: '中军大帐烛火摇曳，将令如山，三军待发',
    keywords: '帅帐 军营 战场 点兵 中军 烛火 营寨'
  },
  {
    id: 'wangerShan', name: '望儿山下', 
    summary: '孤峰耸立辽东大地，母亲的目光穿越千年',
    keywords: '望儿山 山 母亲 熊岳 辽南 孤峰 眺望'
  },
  {
    id: 'xiHeKou', name: '西河口渡', 
    summary: '大清河入海口，桅杆如林灯火连天',
    keywords: '西河口 码头 河口 港口 海 船 渡口'
  },
  {
    id: 'piYingZuoFang', name: '皮影作坊', 
    summary: '满墙影人静悬，刻刀声声里驴皮透光',
    keywords: '作坊 刻皮影 影人 雕刻 制作 手艺 工坊'
  }
]

// ==================== 特效库 (4个) ====================
var EFFECTS = [
  {
    id: 'dengYing', name: '油灯灯影', 
    summary: '老油灯在影窗后忽明忽暗，光影摇曳',
    keywords: '灯 光影 油灯 烛火 闪烁 影窗 摇曳'
  },
  {
    id: 'fengXue', name: '漫天风雪', 
    summary: '辽东冬夜，大雪纷飞落满影窗，天地苍茫',
    keywords: '雪 风雪 冬 寒冷 辽东 纷飞 苍茫'
  },
  {
    id: 'muSe', name: '夕阳暮色', 
    summary: '橙红余晖洒在皮影人身上，时光凝固',
    keywords: '夕阳 暮色 黄昏 晚霞 橙红 余晖 温暖'
  },
  {
    id: 'luoGu', name: '锣鼓震动', 
    summary: '戏台上的锣鼓点一声紧似一声，震颤影窗',
    keywords: '锣鼓 鼓点 震动 戏台 节奏 紧促 热闹'
  }
]

// ==================== 匹配引擎 ====================
function _scoreKeywords(input, keywords) {
  if (!input || !keywords) return 0
  var kw = keywords.split(/\s+/)
  var score = 0
  for (var i = 0; i < kw.length; i++) {
    if (input.indexOf(kw[i]) !== -1) score += 1
  }
  return score
}

function _bestMatch(input, list) {
  if (!input || !input.trim()) {
    var idx = Math.floor(Math.random() * list.length)
    return list[idx]
  }
  var best = list[0]
  var bestScore = -1
  for (var i = 0; i < list.length; i++) {
    var item = list[i]
    var s = _scoreKeywords(input, item.keywords) +
            _scoreKeywords(input, item.name) * 2 +
            _scoreKeywords(input, item.summary) * 0.5
    if (s > bestScore) { bestScore = s; best = item }
  }
  return best
}

function _findById(list, id) {
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) return list[i]
  }
  return null
}

// ==================== 页面 ====================
Page({
  data: {
    phase: 'input',  // 'input' | 'result'
    inputText: '',
    // 当前选中
    selStory: null, selChar: null, selScene: null, selEffect: null,
    // 生成结果
    resultStory: null, resultChar: null, resultScene: null, resultEffect: null,
    // 列表（模板渲染用）
    stories: STORIES,
    characters: CHARACTERS,
    scenes: SCENES,
    effects: EFFECTS
  },

  onLoad: function () {},

  // 关键词输入
  onInput: function (e) {
    this.setData({ inputText: e.detail.value })
  },

  onInputConfirm: function (e) {
    this._doAutoMatch(e.detail.value)
  },

  // 自动匹配（输入完回车）
  _doAutoMatch: function (input) {
    var story = _bestMatch(input, STORIES)
    var ch = _bestMatch(input, CHARACTERS)
    var sc = _bestMatch(input, SCENES)
    var ef = _bestMatch(input, EFFECTS)
    this.setData({
      inputText: input,
      selStory: story,
      selChar: ch,
      selScene: sc,
      selEffect: ef
    })
  },

  // 手动选故事
  onTapStory: function (e) {
    var story = _findById(STORIES, e.currentTarget.dataset.id)
    this.setData({ selStory: story, phase: 'input' })
  },

  onTapChar: function (e) {
    var ch = _findById(CHARACTERS, e.currentTarget.dataset.id)
    this.setData({ selChar: ch, phase: 'input' })
  },

  onTapScene: function (e) {
    var sc = _findById(SCENES, e.currentTarget.dataset.id)
    this.setData({ selScene: sc, phase: 'input' })
  },

  onTapEffect: function (e) {
    var ef = _findById(EFFECTS, e.currentTarget.dataset.id)
    this.setData({ selEffect: ef, phase: 'input' })
  },

  // ===== 一键生成 =====
  onGenerate: function () {
    var input = (this.data.inputText || '').trim()
    var story = this.data.selStory || _bestMatch(input, STORIES)
    var ch = this.data.selChar || _bestMatch(input, CHARACTERS)
    var sc = this.data.selScene || _bestMatch(input, SCENES)
    var ef = this.data.selEffect || _bestMatch(input, EFFECTS)

    this.setData({
      phase: 'result',
      resultStory: story,
      resultChar: ch,
      resultScene: sc,
      resultEffect: ef
    })

    try { wx.vibrateShort({ type: 'medium' }) } catch (e) {}
  },

  // ===== 重新来过 =====
  onReset: function () {
    this.setData({
      phase: 'input',
      inputText: '',
      selStory: null,
      selChar: null,
      selScene: null,
      selEffect: null,
      resultStory: null,
      resultChar: null,
      resultScene: null,
      resultEffect: null
    })
  },

  // ===== 导航 =====
  onTabHome: function () {
    wx.redirectTo({ url: '/pages/index/index' })
  },
  onTabInteractive: function () {
    wx.redirectTo({ url: '/pages/interactive/interactive' })
  }
})
