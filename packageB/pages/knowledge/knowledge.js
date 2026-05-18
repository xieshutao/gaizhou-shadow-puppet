// packageB/pages/knowledge/knowledge.js
// 皮影知识 · 术语词典 + 流派介绍 + 经典剧目

Page({
  data: {
    title: '皮影知识',
    categories: [
      { id: 'terms', name: '术语词典', icon: '📖' },
      { id: 'schools', name: '流派介绍', icon: '🏛' },
      { id: 'repertoire', name: '经典剧目', icon: '🎪' }
    ]
  },

  onLoad() {
    // 预留：加载知识库内容
  },

  onTapCategory(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: id + ' · 即将开放', icon: 'none' })
  }
})
