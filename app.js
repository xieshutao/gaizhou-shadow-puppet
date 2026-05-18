// ───────────────────────────────────────────────
//  盖州皮影戏 · 小程序入口
//  架构参考：云游敦煌（壳-内容分离 + 导航中枢）
// ───────────────────────────────────────────────

App({

  /**
   * 小程序启动 / 冷启动
   * 云游敦煌模式：此处做轻量初始化，重逻辑延迟到 onLaunch 回调
   */
  onLaunch(options) {
    const that = this

    // ── 系统信息采集（全局共享） ──
    const sysInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = sysInfo
    this.globalData.statusBarHeight = sysInfo.statusBarHeight
    this.globalData.safeArea = sysInfo.safeArea || {}
    this.globalData.platform = sysInfo.platform
    this.globalData.isIOS = sysInfo.platform === 'ios'
    this.globalData.isDevtools = sysInfo.platform === 'devtools'

    // 胶囊按钮位置（自定义导航栏用）
    try {
      const menuRect = wx.getMenuButtonBoundingClientRect()
      this.globalData.menuRect = menuRect
      this.globalData.navBarHeight = (menuRect.top - sysInfo.statusBarHeight) * 2 + menuRect.height
    } catch (e) {
      // devtools 降级
      this.globalData.navBarHeight = this.globalData.isIOS ? 44 : 48
    }

    // ── 启动场景 ──
    this.globalData.launchScene = options.scene
    this.globalData.launchQuery = options.query || {}

    // ── 本地缓存用户偏好 ──
    const cachedPrefs = wx.getStorageSync('user_prefs') || {}
    this.globalData.userPrefs = cachedPrefs
  },

  /**
   * 小程序进入前台 / 热启动
   * 云游敦煌模式：检测是否需要刷新首页内容、检查更新
   */
  onShow(options) {
    this.globalData.foregroundScene = options.scene

    // 从分享进入时记录 shareTicket
    if (options.shareTicket) {
      this.globalData.shareTicket = options.shareTicket
    }

    // 检查更新（静默）
    if (!this.globalData.isDevtools) {
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate(res => {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(() => {
            wx.showModal({
              title: '有新版本',
              content: '检测到新版本，是否立即重启应用？',
              success(modalRes) {
                if (modalRes.confirm) {
                  updateManager.applyUpdate()
                }
              }
            })
          })
        }
      })
    }
  },

  /**
   * 小程序进入后台
   */
  onHide() {
    // 预留：清理定时器、断开长连接等
  },

  /**
   * 全局错误捕获
   */
  onError(msg) {
    if (!this.globalData.isDevtools) {
      console.error('[App Error]', msg)
    }
  },

  /**
   * 页面不存在
   */
  onPageNotFound(res) {
    wx.redirectTo({
      url: '/pages/index/index'
    })
  },

  // ── 全局数据 ──
  globalData: {
    // 系统
    systemInfo: null,
    statusBarHeight: 0,
    safeArea: {},
    platform: '',
    isIOS: false,
    isDevtools: false,
    menuRect: null,
    navBarHeight: 44,

    // 启动
    launchScene: 0,
    launchQuery: {},
    foregroundScene: 0,
    shareTicket: '',

    // 用户
    userInfo: null,
    userPrefs: {},
    openId: '',
    sessionKey: '',

    // 运行时
    isSpeaking: false,       // 全局 TTS 状态锁
    isRecording: false,      // 全局录音状态锁
    currentTab: 0            // 当前 Tab 索引
  }
})
