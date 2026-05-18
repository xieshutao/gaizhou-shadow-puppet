// packageTab/pages/explore/index.js
// 探索 · 皮影角色、唱腔、流派深度内容

Page({
  data: {
    title: '探索'
  },

  onLoad() {
    // 预留：加载探索内容
  },

  onShow() {
    // 同步 TabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  }
})
