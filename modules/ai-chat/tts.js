// modules/ai-chat/tts.js
// 语音合成模块（精简版）—— 不再独立工作，由 pipeline 调用
// 保留模块仅为对外接口一致性

// 此模块功能已合并到 pipeline.js 的 _callTTS 中
// 保留此文件仅为兼容旧引用，实际调用请走 pipeline.run()

module.exports = {
  speak(text, emotion) {
    // 降级调用 pipeline（向后兼容）
    const pipeline = require('./pipeline.js')
    return pipeline.run(text)
  },
}
