// modules/ai-chat/stateMachine.js
// 对话状态机 —— 统一控制所有状态切换
// 替代旧的 state.js，成为系统唯一状态权威

// ============================================================
// 状态定义
// ============================================================
const STATES = {
  IDLE:       'IDLE',       // 空闲，等待用户输入
  LISTENING:  'LISTENING',  // 录音中
  PROCESSING: 'PROCESSING', // AI 处理中（ASR→LLM→TTS）
  SPEAKING:   'SPEAKING',   // 老人说话中（播放音频+动画）
  ERROR:      'ERROR',      // 异常状态，自动恢复
}

// ============================================================
// 状态转移表：from -> [allowed to]
// ============================================================
const TRANSITIONS = {
  [STATES.IDLE]:       [STATES.LISTENING, STATES.PROCESSING],
  [STATES.LISTENING]:  [STATES.IDLE, STATES.PROCESSING, STATES.ERROR],
  [STATES.PROCESSING]: [STATES.SPEAKING, STATES.IDLE, STATES.ERROR],
  [STATES.SPEAKING]:   [STATES.IDLE, STATES.ERROR],
  [STATES.ERROR]:      [STATES.IDLE],
}

// ============================================================
// 每个状态允许的用户操作
// ============================================================
const ALLOWED_ACTIONS = {
  [STATES.IDLE]:       ['startRecord', 'sendText', 'toggleContinuous'],
  [STATES.LISTENING]:  ['stopRecord', 'cancelRecord'],
  [STATES.PROCESSING]: ['cancel'],
  [STATES.SPEAKING]:   [],                          // 完全锁定
  [STATES.ERROR]:      ['retry', 'dismiss'],
}

// ============================================================
// 状态机类
// ============================================================
class StateMachine {
  constructor() {
    this._state = STATES.IDLE
    this._pageCtx = null
    this._listeners = []
    this._errorTimer = null
    this._data = {
      // UI 绑定数据
      fsmState: STATES.IDLE,
      isRecording: false,
      isSpeaking: false,
      isProcessing: false,
      isError: false,

      currentText: '',
      replyText: '',
      replyEmotion: 'calm',

      mouthLevel: 0,
      characterImage: '/image3/laor1.png',
      statusText: '按住说话',
      errorMsg: '',

      thinkAnim: false,          // 思考动画
      dialogueHistory: [],       // 对话记录 [{role, content, emotion}]
      continuousMode: false,     // 连续对话模式
    }
  }

  // ----- 页面绑定 -----
  bindPage(ctx) {
    this._pageCtx = ctx
    ctx.setData({ ...this._data })
  }

  // ----- 状态查询 -----
  get state() { return this._state }
  is(state) { return this._state === state }
  canTransition(to) {
    return TRANSITIONS[this._state]?.includes(to) || false
  }
  canDo(action) {
    return ALLOWED_ACTIONS[this._state]?.includes(action) || false
  }

  // ----- 数据读写 -----
  getData(key) { return key ? this._data[key] : { ...this._data } }
  _syncUI(patch) {
    Object.assign(this._data, patch)
    if (this._pageCtx) this._pageCtx.setData(patch)
  }
  _notify() {
    this._listeners.forEach(fn => { try { fn(this._state, this._data) } catch(e) {} })
  }

  // ----- 核心：状态转移 -----
  transition(to, extraData = {}) {
    if (!this.canTransition(to)) {
      console.warn(`[StateMachine] 非法转移: ${this._state} -> ${to}`)
      return false
    }

    const from = this._state
    this._state = to

    // 清除 ERROR 自动恢复定时器
    if (this._errorTimer) {
      clearTimeout(this._errorTimer)
      this._errorTimer = null
    }

    // 根据目标状态同步 UI 数据
    const patch = {
      fsmState: to,
      isRecording: to === STATES.LISTENING,
      isProcessing: to === STATES.PROCESSING,
      isSpeaking: to === STATES.SPEAKING,
      isError: to === STATES.ERROR,
      ...extraData,
    }

    // 状态特定处理
    switch (to) {
      case STATES.IDLE:
        patch.mouthLevel = 0
        patch.characterImage = '/image3/laor1.png'
        patch.thinkAnim = false
        if (!extraData.statusText) {
          patch.statusText = this._data.continuousMode ? '请继续说话' : '按住说话'
        }
        patch.errorMsg = ''
        break

      case STATES.LISTENING:
        patch.statusText = '正在听...'
        patch.errorMsg = ''
        break

      case STATES.PROCESSING:
        patch.thinkAnim = true
        patch.statusText = '老人正在想...'
        break

      case STATES.SPEAKING:
        patch.thinkAnim = false
        patch.statusText = '老人回复中...'
        break

      case STATES.ERROR:
        patch.thinkAnim = false
        patch.mouthLevel = 0
        patch.characterImage = '/image3/laor1.png'
        patch.isRecording = false
        patch.isSpeaking = false
        patch.isProcessing = false
        if (!extraData.errorMsg) patch.errorMsg = '出了点问题，稍后再试'
        // 3秒后自动恢复到 IDLE
        this._errorTimer = setTimeout(() => {
          this.transition(STATES.IDLE)
        }, 3000)
        break
    }

    this._syncUI(patch)
    this._notify()
    console.log(`[StateMachine] ${from} -> ${to}`)
    return true
  }

  // ----- 便捷方法（供页面调用） -----
  startRecord() {
    if (!this.canDo('startRecord')) return false
    return this.transition(STATES.LISTENING)
  }

  stopRecord(text) {
    if (!this.canDo('stopRecord')) return false
    this._data.currentText = text || ''
    return this.transition(STATES.PROCESSING)
  }

  cancelRecord() {
    if (!this.canDo('cancelRecord')) return false
    return this.transition(STATES.IDLE)
  }

  startProcess() {
    return this.transition(STATES.PROCESSING)
  }

  cancelProcess() {
    if (!this.canDo('cancel')) return false
    this._data.currentText = ''
    return this.transition(STATES.IDLE)
  }

  startSpeak(text, emotion) {
    if (!this.canTransition(STATES.SPEAKING)) return false
    this._data.replyText = text
    this._data.replyEmotion = emotion || 'calm'
    return this.transition(STATES.SPEAKING, {
      replyText: text,
      replyEmotion: emotion || 'calm',
    })
  }

  finishSpeak() {
    if (!this.is(STATES.SPEAKING)) return false
    return this.transition(STATES.IDLE, {
      replyText: '',
    })
  }

  setError(msg) {
    this._data.errorMsg = msg || '出了点问题'
    return this.transition(STATES.ERROR, { errorMsg: this._data.errorMsg })
  }

  dismissError() {
    if (!this.canDo('dismiss')) return false
    return this.transition(STATES.IDLE)
  }

  // ----- 对话历史 -----
  addDialogue(role, content, emotion) {
    const entry = { role, content }
    if (emotion) entry.emotion = emotion
    this._data.dialogueHistory.push(entry)
    // 保留最近 30 条
    if (this._data.dialogueHistory.length > 30) {
      this._data.dialogueHistory = this._data.dialogueHistory.slice(-30)
    }
    this._syncUI({ dialogueHistory: this._data.dialogueHistory })
  }

  // ----- 连续模式 -----
  toggleContinuous() {
    if (!this.canDo('toggleContinuous')) return false
    this._data.continuousMode = !this._data.continuousMode
    if (this.is(STATES.IDLE)) {
      this._data.statusText = this._data.continuousMode ? '请继续说话' : '按住说话'
    }
    this._syncUI({
      continuousMode: this._data.continuousMode,
      statusText: this._data.statusText,
    })
    return this._data.continuousMode
  }

  // ----- 监听器 -----
  onChange(fn) { this._listeners.push(fn) }

  // ----- 销毁 -----
  destroy() {
    if (this._errorTimer) clearTimeout(this._errorTimer)
    this._listeners = []
    this._pageCtx = null
  }
}

// 单例
module.exports = new StateMachine()
module.exports.STATES = STATES
