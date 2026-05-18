// modules/ai-chat/emotion.js
// 情绪控制器 —— 解析 LLM 情绪输出，映射到动画参数

// ============================================================
// 情绪类型
// ============================================================
const EMOTIONS = {
  CALM:      'calm',       // 平静 —— 默认
  HAPPY:     'happy',      // 高兴
  NOSTALGIC: 'nostalgic',  // 怀念
  SERIOUS:   'serious',    // 严肃
}

// ============================================================
// 情绪 → 动画参数映射
// ============================================================
const EMOTION_PARAMS = {
  [EMOTIONS.CALM]: {
    mouthInterval: 180,           // 嘴型切换间隔 (ms)
    mouthPatterns: {
      0: [220, 0],               // 闭口
      1: [130, 70],              // 微张
      2: [70, 130],              // 张开
    },
    floatAmplitude: '12rpx',     // 浮动幅度
    floatDuration: '0.6s',       // 浮动周期
    jitter: false,               // 是否抖动
    pauseChance: 0.1,            // 随机停顿概率
  },

  [EMOTIONS.HAPPY]: {
    mouthInterval: 120,           // 更快
    mouthPatterns: {
      0: [180, 0],
      1: [80, 100],
      2: [50, 150],
    },
    floatAmplitude: '18rpx',     // 更大幅度
    floatDuration: '0.4s',       // 更快
    jitter: true,                // 轻微抖动
    jitterIntensity: '2rpx',
    pauseChance: 0.05,           // 很少停顿
  },

  [EMOTIONS.NOSTALGIC]: {
    mouthInterval: 220,           // 更慢
    mouthPatterns: {
      0: [280, 0],
      1: [160, 60],
      2: [80, 140],
    },
    floatAmplitude: '8rpx',      // 轻微浮动
    floatDuration: '0.8s',       // 更慢
    jitter: false,
    pauseChance: 0.25,           // 更多停顿（像在回忆）
  },

  [EMOTIONS.SERIOUS]: {
    mouthInterval: 200,
    mouthPatterns: {
      0: [240, 0],
      1: [150, 50],
      2: [100, 100],
    },
    floatAmplitude: '6rpx',      // 几乎不动
    floatDuration: '0.7s',
    jitter: false,
    pauseChance: 0.15,
  },
}

// ============================================================
// 情绪解析器
// ============================================================

/**
 * 从 LLM 响应中提取情绪
 * @param {object|string} llmOutput - LLM 返回的 JSON 或纯文本
 * @returns {{ text: string, emotion: string }}
 */
function parseLLMOutput(llmOutput) {
  // 如果已经是结构化对象
  if (typeof llmOutput === 'object' && llmOutput.text) {
    const emotion = _normalizeEmotion(llmOutput.emotion)
    return { text: llmOutput.text, emotion }
  }

  // 尝试解析 JSON 字符串
  if (typeof llmOutput === 'string') {
    // 尝试提取 JSON
    const jsonMatch = llmOutput.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.text) {
          return { text: parsed.text, emotion: _normalizeEmotion(parsed.emotion) }
        }
      } catch (e) { /* fall through */ }
    }
    // 纯文本，默认 calm
    return { text: llmOutput, emotion: EMOTIONS.CALM }
  }

  return { text: String(llmOutput || ''), emotion: EMOTIONS.CALM }
}

function _normalizeEmotion(emotion) {
  if (!emotion) return EMOTIONS.CALM
  const lower = String(emotion).toLowerCase().trim()
  if (EMOTION_PARAMS[lower]) return lower
  // 模糊匹配
  if (lower.includes('happy') || lower.includes('高兴') || lower.includes('开心')) return EMOTIONS.HAPPY
  if (lower.includes('nostalg') || lower.includes('怀念') || lower.includes('回忆')) return EMOTIONS.NOSTALGIC
  if (lower.includes('serious') || lower.includes('严肃') || lower.includes('认真')) return EMOTIONS.SERIOUS
  return EMOTIONS.CALM
}

/**
 * 获取情绪对应的动画参数
 */
function getParams(emotion) {
  return EMOTION_PARAMS[_normalizeEmotion(emotion)] || EMOTION_PARAMS[EMOTIONS.CALM]
}

/**
 * 获取情绪的 CSS 动画样式字符串
 */
function getAnimationStyle(emotion) {
  const p = getParams(emotion)
  // 返回可注入 WXML style 属性的字符串
  return `--float-amp: ${p.floatAmplitude}; --float-dur: ${p.floatDuration};`
}

/**
 * 获取情绪中文名
 */
function getLabel(emotion) {
  const labels = {
    [EMOTIONS.CALM]: '平静',
    [EMOTIONS.HAPPY]: '高兴',
    [EMOTIONS.NOSTALGIC]: '怀念',
    [EMOTIONS.SERIOUS]: '严肃',
  }
  return labels[_normalizeEmotion(emotion)] || '平静'
}

module.exports = {
  EMOTIONS,
  EMOTION_PARAMS,
  parseLLMOutput,
  getParams,
  getAnimationStyle,
  getLabel,
}
