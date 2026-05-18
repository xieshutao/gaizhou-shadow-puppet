Component({
  options: {
    multipleSlots: true,
    styleIsolation: 'apply-shared'
  },

  properties: {
    // Navigation bar title
    title: {
      type: String,
      value: ''
    },
    // Whether to show back button
    back: {
      type: Boolean,
      value: true
    },
    // Transparent background (for home/hero pages)
    transparent: {
      type: Boolean,
      value: false
    },
    // Custom background color (overrides transparent)
    background: {
      type: String,
      value: ''
    },
    // Text color
    color: {
      type: String,
      value: '#D4AF37'
    },
    // Whether to show the nav bar
    show: {
      type: Boolean,
      value: true
    },
    // Number of pages to go back
    delta: {
      type: Number,
      value: 1
    },
    // Show home button (for deep pages)
    homeButton: {
      type: Boolean,
      value: false
    }
  },

  data: {
    statusBarHeight: 0,
    windowWidth: 375,
    navBarHeight: 44,  // iOS default
    capsuleRight: 0,
    capsuleWidth: 87,  // WeChat capsule button width
    platform: 'ios'
  },

  lifetimes: {
    attached() {
      // Get system info for accurate positioning
      const sysInfo = wx.getWindowInfo() || wx.getSystemInfoSync()
      const deviceInfo = wx.getDeviceInfo() || sysInfo
      const isAndroid = (deviceInfo.platform || sysInfo.platform) === 'android'

      // WeChat capsule button position
      let capsuleRect = { right: sysInfo.windowWidth - 8, width: 87 }
      try {
        capsuleRect = wx.getMenuButtonBoundingClientRect()
      } catch (e) {
        // Fallback for older versions
      }

      this.setData({
        statusBarHeight: sysInfo.statusBarHeight || 20,
        windowWidth: sysInfo.windowWidth,
        navBarHeight: isAndroid ? 48 : 44,
        capsuleRight: capsuleRect.right,
        capsuleWidth: capsuleRect.width,
        platform: isAndroid ? 'android' : 'ios'
      })
    }
  },

  methods: {
    // Navigate back
    onBack() {
      if (this.data.back) {
        wx.navigateBack({
          delta: this.data.delta
        })
      }
      this.triggerEvent('back', { delta: this.data.delta })
    },

    // Navigate to home
    onHome() {
      wx.switchTab({
        url: '/pages/index/index'
      })
      this.triggerEvent('home')
    }
  }
})
