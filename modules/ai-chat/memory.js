// modules/ai-chat/memory.js
// 多轮对话记忆系统
// 维护对话上下文，支持自动截断和语义压缩

const MAX_ROUNDS = 5          // 最多保留轮数
const MAX_TOKENS_EST = 600    // 估算 token 上限（中文约 1.5 字/token）

class MemoryBuffer {
  constructor() {
    this._rounds = []   // [{user, ai, emotion, timestamp}]
    this._summary = ''  // 超限后的语义压缩摘要
  }

  // ----- 添加一轮对话 -----
  add(userText, aiText, emotion) {
    if (!userText && !aiText) return

    this._rounds.push({
      user: userText || '',
      ai: aiText || '',
      emotion: emotion || 'calm',
      timestamp: Date.now(),
    })

    // 超过限制时压缩
    if (this._rounds.length > MAX_ROUNDS) {
      this._compress()
    }
  }

  // ----- 获取 LLM 上下文 -----
  // 返回格式化的对话历史字符串
  getContext() {
    if (this._rounds.length === 0) return ''

    const parts = []

    // 如果有压缩摘要
    if (this._summary) {
      parts.push(`[之前的对话摘要] ${this._summary}`)
    }

    // 最近几轮
    this._rounds.forEach((r, i) => {
      parts.push(`用户第${i + 1}轮: ${r.user}`)
      parts.push(`老人第${i + 1}轮: ${r.ai}`)
    })

    return parts.join('\n')
  }

  // ----- 获取最近的 N 轮（结构化） -----
  getRecent(n) {
    const count = Math.min(n || MAX_ROUNDS, this._rounds.length)
    return this._rounds.slice(-count)
  }

  // ----- 是否为空 -----
  isEmpty() {
    return this._rounds.length === 0 && !this._summary
  }

  // ----- 轮数 -----
  get roundCount() {
    return this._rounds.length
  }

  // ----- 估算总 token 数 -----
  estimateTokens() {
    let chars = 0
    if (this._summary) chars += this._summary.length
    this._rounds.forEach(r => {
      chars += r.user.length + r.ai.length
    })
    return Math.ceil(chars / 1.5)  // 中文约 1.5 字/token
  }

  // ----- 压缩旧对话 -----
  _compress() {
    // 取出最早的一轮
    const oldest = this._rounds.shift()
    if (!oldest) return

    // 简单的语义摘要：提取关键词
    const snippet = this._summarizeRound(oldest)
    if (this._summary) {
      this._summary += '；' + snippet
    } else {
      this._summary = snippet
    }

    // 摘要过长时再次压缩
    if (this._summary.length > 200) {
      this._summary = this._summary.slice(-180) + '…'
    }
  }

  // ----- 单轮摘要 -----
  _summarizeRound(round) {
    const user = round.user.slice(0, 30)
    const ai = round.ai.slice(0, 30)
    const emotionMap = {
      calm: '平静', happy: '高兴', nostalgic: '怀念', serious: '严肃',
    }
    const emo = emotionMap[round.emotion] || ''
    return emo
      ? `用户询问"${user}"，老人${emo}地回答`
      : `用户询问"${user}"，老人回答`
  }

  // ----- 清空 -----
  clear() {
    this._rounds = []
    this._summary = ''
  }

  // ----- 导出（调试用） -----
  dump() {
    return {
      rounds: this._rounds.length,
      summary: this._summary,
      tokens: this.estimateTokens(),
      context: this.getContext(),
    }
  }
}

// 单例
module.exports = new MemoryBuffer()
