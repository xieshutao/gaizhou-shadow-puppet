// modules/ai-chat/config.js
// AI对话模块 - 统一配置
// 切换真实API只需修改此文件

module.exports = {
  // ===== ASR 配置 =====
  asr: {
    // 'mock' | 'wechat-plugin' | 'cloud-api'
    mode: 'mock',
    // 微信同声传译插件（仅 mode='wechat-plugin' 时需要）
    pluginAppId: 'wx069ba97219f66d99',
    // 云端 ASR API（仅 mode='cloud-api' 时需要）
    cloudUrl: '',
    cloudKey: '',
  },

  // ===== LLM 配置 =====
  llm: {
    // 'mock' | 'cloud-api'
    mode: 'mock',
    apiUrl: '',
    apiKey: '',
    // 角色设定
    persona: `你是一位盖州皮影戏老艺人，七十多岁，操着一口东北口音。
说话风格：
- 短句为主，每句不超过20字
- 喜欢用民间俗语、歇后语
- 语气亲切，爱叫年轻人"孩子""后生"
- 偶尔引用皮影戏台词
- 回答要有画面感，像在讲故事
- 不要用任何英文或现代网络用语`,
  },

  // ===== TTS 配置 =====
  tts: {
    // 'mock' | 'cloud-api'
    mode: 'mock',
    apiUrl: '',
    apiKey: '',
    // mock 模式用的占位音频（silent mp3 base64，1秒）
    mockAudioBase64: '',
  },

  // ===== 动画配置 =====
  animation: {
    // 嘴型切换间隔 (ms)
    mouthInterval: 150,
    // 嘴型档位对应的开合比例 {档位: [laor1显示时长, laor2显示时长]} (ms)
    mouthPatterns: {
      0: [200, 0],    // 闭口：全显示 laor1
      1: [120, 80],   // 微张：交替但 laor1 更多
      2: [60, 140],   // 张开：laor2 更多
    },
  },
}
