// pages/guide/index.js — 盖州皮影戏 · 导航中枢
// 全屏欢迎页 + 登录门 + 路由分发

Page({
  data: {
    // 登录态
    isLoggedIn: false,
    showLoginPopup: false,
    loginLoading: false,
    userInfo: null,

    // 动画状态
    introPhase: 'loading',  // loading | welcome | ready
    welcomeText: '',
    welcomeFull: '欢迎来到盖州皮影戏\n光影千年，匠心永传',
    showParticles: false,
    lampFlicker: 0,

    // 导航卡片
    navCards: [
      {
        id: 'explore',
        title: '探索皮影',
        subtitle: 'EXPLORE',
        desc: '生旦净丑 · 经典剧目 · 艺术特色',
        icon: '戏',
        color: '#D4AF37',
        url: '/pages/explore/index'
      },
      {
        id: 'heritage',
        title: '非遗传承',
        subtitle: 'HERITAGE',
        desc: '历史渊源 · 传承人 · 数字化保护',
        icon: '承',
        color: '#C9A96E',
        url: '/pages/heritage/index'
      },
      {
        id: 'user',
        title: '我的皮影',
        subtitle: 'MY SPACE',
        desc: '收藏 · 创作 · 足迹',
        icon: '吾',
        color: '#B8860B',
        url: '/pages/user/index'
      }
    ]
  },

  onLoad(options) {
    // 检查登录态（mock）
    var cached = wx.getStorageSync('shadow_user')
    if (cached && cached.nickName) {
      this.setData({ isLoggedIn: true, userInfo: cached, introPhase: 'ready' })
    } else {
      this._runIntro()
    }
    // 深链支持
    if (options.redirect) {
      this._pendingRedirect = options.redirect
    }
  },

  onShow() {
    this.setData({ showParticles: true })
    this._startLampFlicker()
  },

  onHide() {
    this.setData({ showParticles: false })
    if (this._lampTimer) { clearInterval(this._lampTimer); this._lampTimer = null }
  },

  onUnload() {
    if (this._lampTimer) { clearInterval(this._lampTimer) }
  },

  // ==================== 开场动画 ====================
  _runIntro() {
    var page = this
    var text = page.data.welcomeFull
    var i = 0

    page.setData({ introPhase: 'loading' })

    // 模拟加载
    setTimeout(function () {
      page.setData({ introPhase: 'welcome' })

      var timer = setInterval(function () {
        if (i < text.length) {
          page.setData({ welcomeText: text.slice(0, i + 1) })
          i++
        } else {
          clearInterval(timer)
          setTimeout(function () {
            page.setData({ introPhase: 'ready', showLoginPopup: true })
          }, 1200)
        }
      }, 80)
    }, 800)
  },

  _startLampFlicker() {
    var page = this
    if (page._lampTimer) clearInterval(page._lampTimer)
    page._lampTimer = setInterval(function () {
      page.setData({ lampFlicker: (page.data.lampFlicker + 1) % 3 })
    }, 3000)
  },

  // ==================== 登录门（Mock） ====================
  onShowLogin() {
    this.setData({ showLoginPopup: true })
  },

  onCloseLogin() {
    this.setData({ showLoginPopup: false })
  },

  onMockLogin() {
    var page = this
    page.setData({ loginLoading: true })

    // 模拟微信授权
    setTimeout(function () {
      var mockUser = {
        nickName: '皮影爱好者',
        avatarUrl: '/images/icon-1.png',
        loginTime: Date.now()
      }
      wx.setStorageSync('shadow_user', mockUser)
      page.setData({
        isLoggedIn: true,
        userInfo: mockUser,
        showLoginPopup: false,
        loginLoading: false
      })

      wx.showToast({ title: '登录成功', icon: 'success', duration: 1500 })

      // 处理深链跳转
      if (page._pendingRedirect) {
        var redir = page._pendingRedirect
        page._pendingRedirect = null
        setTimeout(function () {
          wx.navigateTo({ url: redir })
        }, 600)
      }
    }, 1200)
  },

  onSkipLogin() {
    this.setData({ showLoginPopup: false })
    // 游客模式也可浏览
  },

  // ==================== 导航路由 ====================
  onNavTo(e) {
    var url = e.currentTarget.dataset.url
    if (!url) return
    wx.navigateTo({ url: url, fail: function () { wx.switchTab({ url: url }) } })
  },

  // ==================== 底部Tab ====================
  onTabHome() {
    wx.redirectTo({ url: '/pages/index/index' })
  },

  onTabInteractive() {
    wx.redirectTo({ url: '/pages/interactive/interactive' })
  },

  onTabUser() {
    wx.redirectTo({ url: '/pages/user/index' })
  },

  // ==================== 分享 ====================
  onShareAppMessage() {
    return {
      title: '盖州皮影戏 — 光影千年，匠心永传',
      path: '/pages/guide/index'
    }
  }
})
