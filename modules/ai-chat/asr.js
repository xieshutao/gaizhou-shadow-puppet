// modules/ai-chat/asr.js
// 语音输入模块 —— 只管录音，文本生成和状态全交给 pipeline

const fsm = require('./stateMachine.js')
const { STATES } = fsm
const pipeline = require('./pipeline.js')

let recorderManager = null
let recordTimer = null

// Mock 用户文本（mock模式下替代真实的 ASR 结果）
const MOCK_TEXTS = [
  '老先生，能给我们讲讲皮影戏吗',
  '您做皮影多少年了',
  '皮影戏有什么讲究吗',
  '能教我做皮影吗',
  '您最拿手的是哪出戏',
  '皮影是用什么做的呀',
  '您现在还经常表演吗',
  '讲讲您年轻时候的故事吧',
]

function _getRecorder() {
  if (!recorderManager) {
    recorderManager = wx.getRecorderManager()

    recorderManager.onStart(() => {
      recordTimer = setTimeout(() => {
        stopRecord()
      }, 60000)
    })

    recorderManager.onStop((res) => {
      clearTimeout(recordTimer)

      if (res.duration < 500) {
        // 录音过短，视为误触
        fsm.transition('IDLE')
        return
      }

      // ★ 不在此处切换状态，全部交给 pipeline 管理
      // 生成 mock 用户文本（真实 ASR 接入时从这里拿识别结果）
      const userText = MOCK_TEXTS[Math.floor(Math.random() * MOCK_TEXTS.length)]

      // pipeline 会自己处理 idle/listening → processing → speaking → idle
      pipeline.run(userText)
    })

    recorderManager.onError((err) => {
      clearTimeout(recordTimer)
      fsm.transition('IDLE')
      wx.showToast({ title: '录音失败', icon: 'none' })
    })
  }
  return recorderManager
}

function startRecord() {
  if (!fsm.startRecord()) return

  try {
    _getRecorder().start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3',
    })
  } catch (e) {
    fsm.transition('IDLE')
  }
}

function stopRecord() {
  try {
    _getRecorder().stop()
  } catch (e) {
    fsm.transition('IDLE')
  }
}

module.exports = { startRecord, stopRecord }
