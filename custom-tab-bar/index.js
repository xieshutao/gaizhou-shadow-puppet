// custom-tab-bar/index.js
// 盖州皮影戏 · 自定义底部导航
// 参考云游敦煌：custom TabBar 组件模式

Component({
  data: {
    selected: 0,
    color: 'rgba(255, 240, 200, 0.3)',
    selectedColor: '#D4AF37',
    list: [
      {
        pagePath: '/pages/index/index',
        text: '首页',
        icon: '🏠'
      },
      {
        pagePath: '/packageTab/pages/explore/index',
        text: '探索',
        icon: '🔍'
      },
      {
        pagePath: '/pages/interactive/interactive',
        text: '体验',
        icon: '🎭'
      },
      {
        pagePath: '/packageTab/pages/heritage/index',
        text: '传承',
        icon: '📜'
      },
      {
        pagePath: '/packageTab/pages/user/index',
        text: '我的',
        icon: '👤'
      }
    ]
  },

  lifetimes: {
    attached() {
      // 同步当前页面到 tab 选中状态
      const pages = getCurrentPages()
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        const route = '/' + currentPage.route
        this._updateSelected(route)
      }
    }
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const item = this.data.list[index]

      if (this.data.selected === index) {
        return // 已在当前 tab，不操作
      }

      wx.switchTab({
        url: item.pagePath,
        success: () => {
          this.setData({ selected: index })
          // 同步到全局
          const app = getApp()
          if (app) app.globalData.currentTab = index
        },
        fail: (err) => {
          console.error('[TabBar] switchTab failed:', err)
        }
      })
    },

    _updateSelected(route) {
      for (let i = 0; i < this.data.list.length; i++) {
        if (route.indexOf(this.data.list[i].pagePath.replace(/^\//, '')) !== -1) {
          this.setData({ selected: i })
          return
        }
      }
    }
  }
})
