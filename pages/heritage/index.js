// packageTab/pages/heritage/index.js
// 传承 · 非遗保护、传承人故事、技艺档案

Page({
  data: {
    title: '传承'
  },

  onLoad() {
    // 预留：加载传承内容（传承人介绍、技艺展示）
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  }
})
