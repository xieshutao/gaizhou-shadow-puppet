// modules/ai-chat/llm.js
// AI 对话模块（精简版）—— 不再独立工作，由 pipeline 调用
// 保留模块仅为向后兼容

module.exports = {
  chat(text) {
    // 降级调用 pipeline（向后兼容）
    const pipeline = require('./pipeline.js')
    return pipeline.run(text)
  },
}
