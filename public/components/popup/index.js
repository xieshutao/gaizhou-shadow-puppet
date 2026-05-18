Component({
  options: {
    multipleSlots: true,
    styleIsolation: 'apply-shared'
  },

  properties: {
    // Whether the popup is visible
    show: {
      type: Boolean,
      value: false,
      observer: '_onShowChange'
    },
    // Popup title (can also use slot="title")
    title: {
      type: String,
      value: ''
    },
    // Show close × button
    closable: {
      type: Boolean,
      value: true
    },
    // Allow closing by tapping the backdrop
    maskClosable: {
      type: Boolean,
      value: true
    },
    // Animation duration in ms
    animationDuration: {
      type: Number,
      value: 300
    },
    // Popup width (CSS value, e.g. '640rpx' or '80%')
    width: {
      type: String,
      value: '640rpx'
    },
    // Whether to show the popup
    visible: {
      type: Boolean,
      value: false
    }
  },

  data: {
    animating: false
  },

  lifetimes: {
    attached() {
      this._animTimer = null
    },
    detached() {
      if (this._animTimer) {
        clearTimeout(this._animTimer)
      }
    }
  },

  methods: {
    _onShowChange(newVal) {
      if (newVal) {
        // Show: set visible immediately, let CSS animation play
        this.setData({ visible: true, animating: true })
      } else {
        // Hide: wait for animation to finish before removing
        this._hideAnimated()
      }
    },

    /* API: show programmatically */
    show() {
      this.setData({ show: true, visible: true, animating: true })
    },

    /* API: hide programmatically */
    hide() {
      this._hideAnimated()
    },

    _hideAnimated() {
      this.setData({ animating: false })
      if (this._animTimer) clearTimeout(this._animTimer)
      this._animTimer = setTimeout(() => {
        this.setData({ visible: false, show: false })
        this.triggerEvent('close')
      }, this.data.animationDuration)
    },

    /* Tap backdrop to close */
    onMaskTap() {
      if (this.data.maskClosable) {
        this.hide()
      }
    },

    /* Tap close button */
    onClose() {
      this.hide()
    },

    /* Prevent tap event from propagating through the popup body */
    onPopupTap() {
      // No-op: stops event propagation to backdrop
    }
  }
})
