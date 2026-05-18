Component({
  options: {
    styleIsolation: 'apply-shared'
  },

  properties: {
    // Whether toast is visible
    show: {
      type: Boolean,
      value: false,
      observer: '_onShowChange'
    },
    // Toast message text
    message: {
      type: String,
      value: ''
    },
    // Icon type: 'success' | 'error' | 'warning' | 'info' | '' (none)
    icon: {
      type: String,
      value: ''
    },
    // Auto-dismiss duration in ms (0 = no auto-dismiss)
    duration: {
      type: Number,
      value: 2000
    },
    // Position: 'center' | 'top' | 'bottom'
    position: {
      type: String,
      value: 'center'
    }
  },

  data: {
    visible: false,
    iconMap: {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ⓘ'
    }
  },

  lifetimes: {
    attached() {
      this._timer = null
    },
    detached() {
      this._clearTimer()
    }
  },

  methods: {
    /**
     * Public API: show the toast
     * @param {string} message - toast text
     * @param {string} icon - icon type or ''
     * @param {number} duration - auto-dismiss ms
     */
    show(message, icon, duration) {
      const updates = {
        visible: true,
        show: true,
        message: message || this.data.message,
        icon: icon || this.data.icon,
        duration: duration !== undefined ? duration : this.data.duration
      }
      this.setData(updates)
      // Return a promise-like API for chaining
      return this
    },

    /**
     * Public API: hide the toast immediately
     */
    hide() {
      this.setData({ visible: false, show: false })
    },

    _onShowChange(newVal) {
      if (newVal && !this.data.visible) {
        this.setData({ visible: true })
        this._startAutoDismiss()
      } else if (!newVal && this.data.visible) {
        this.setData({ visible: false })
      }
    },

    _startAutoDismiss() {
      this._clearTimer()
      const duration = this.data.duration
      if (duration && duration > 0) {
        this._timer = setTimeout(() => {
          this.setData({ visible: false, show: false })
          this.triggerEvent('dismiss')
        }, duration)
      }
    },

    _clearTimer() {
      if (this._timer) {
        clearTimeout(this._timer)
        this._timer = null
      }
    },

    // Tap to dismiss early
    onTap() {
      this._clearTimer()
      this.setData({ visible: false, show: false })
      this.triggerEvent('dismiss')
    }
  }
})
