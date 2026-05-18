// packageB/pages/character-guide/character-guide.js
// 角色图谱 · 识别皮影角色（生旦净丑）

Page({
  data: {
    title: '角色图谱',
    roles: [
      { id: 'sheng', name: '生', desc: '男性角色，文雅端正', emoji: '🎩' },
      { id: 'dan', name: '旦', desc: '女性角色，端庄秀丽', emoji: '👑' },
      { id: 'jing', name: '净', desc: '花脸武将，刚烈勇猛', emoji: '⚔️' },
      { id: 'chou', name: '丑', desc: '滑稽角色，幽默风趣', emoji: '🤡' }
    ]
  },

  onLoad() {
    // 预留：加载角色详细数据
  },

  onTapRole(e) {
    const role = e.currentTarget.dataset.role
    wx.showToast({ title: role.name + ' · 详情即将开放', icon: 'none' })
  }
})
