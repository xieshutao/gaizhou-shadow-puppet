// modules/ai-chat/animation.js
// 动画驱动模块 —— 情绪驱动嘴型动画
// 支持 calm/happy/nostalgic/serious 四种情绪 + 思考动画

const fsm = require('./stateMachine.js')
const emotion = require('./emotion.js')

let animTimer = null
let thinkTimer = null

// ============================================================
// 开始说话动画（情绪驱动）
// ============================================================
function startSpeak(emo) {
  stopSpeak()  // 清除旧动画

  const params = emotion.getParams(emo)
  const pattern = params.mouthPatterns
  let stepIndex = 0

  // 初始张嘴
  fsm._syncUI({
    mouthLevel: 2,
    characterImage: '/image3/laor2.png',
  })

  animTimer = setInterval(() => {
    // 随机停顿（nostalgic 更频繁）
    if (Math.random() < params.pauseChance) {
      // 保持当前嘴型不变，跳过本次切换
      return
    }

    const isOpen = stepIndex % 2 === 1
    const seq = isOpen ? pattern[2] : pattern[0]  // 用 level 2/0 参数
    const img = isOpen ? '/image3/laor2.png' : '/image3/laor1.png'
    const level = isOpen ? 2 : 0

    fsm._syncUI({
      characterImage: img,
      mouthLevel: level,
    })

    stepIndex++
  }, params.mouthInterval)
}

// ============================================================
// 停止说话动画
// ============================================================
function stopSpeak() {
  if (animTimer) {
    clearInterval(animTimer)
    animTimer = null
  }
  if (thinkTimer) {
    clearInterval(thinkTimer)
    thinkTimer = null
  }

  fsm._syncUI({
    mouthLevel: 0,
    characterImage: '/image3/laor1.png',
  })
}

// ============================================================
// 思考动画 —— PROCESSING 状态下轻微点头
// ============================================================
function startThink() {
  stopSpeak()

  let tilt = 0
  thinkTimer = setInterval(() => {
    tilt = tilt === 0 ? 3 : 0  // 轻微倾斜
    fsm._syncUI({
      characterImage: '/image3/laor1.png',
      mouthLevel: 0,
      thinkTilt: tilt,
    })
  }, 600)
}

function stopThink() {
  if (thinkTimer) {
    clearInterval(thinkTimer)
    thinkTimer = null
  }
}

// ============================================================
// 情绪 CSS 动画类名
// ============================================================
function getEmotionClass(emo) {
  const clsMap = {
    calm: 'emo-calm',
    happy: 'emo-happy',
    nostalgic: 'emo-nostalgic',
    serious: 'emo-serious',
  }
  return clsMap[emo] || 'emo-calm'
}

module.exports = { startSpeak, stopSpeak, startThink, stopThink, getEmotionClass }
