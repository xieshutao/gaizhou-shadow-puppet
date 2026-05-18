// interactive.js
Page({
  data: {
    pressing1: false,
    pressing2: false,
    pressing3: false
  },

  onPress1() { this.setData({ pressing1: true }) },
  onRelease1() { this.setData({ pressing1: false }) },

  onPress2() { this.setData({ pressing2: true }) },
  onRelease2() { this.setData({ pressing2: false }) },

  onPress3() { this.setData({ pressing3: true }) },
  onRelease3() { this.setData({ pressing3: false }) },

  onTapBtn1() {
    wx.navigateTo({ url: '/pages/elder-chat/elder-chat' })
  },

  onTapBtn2() {
    wx.navigateTo({ url: '/pages/create-play/create-play' })
  },

  onTapBtn3() {
    // TODO: 跳转第三个功能页
  },

  onTabHome() {
    wx.redirectTo({ url: '/pages/index/index' })
  }
})
