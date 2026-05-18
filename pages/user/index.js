// packageTab/pages/user/index.js
// 我的 · 收藏、创作、设置

Page({
  data: {
    title: '我的'
  },

  onLoad() {
    // 预留：加载用户信息、收藏列表
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 })
    }
  }
})
