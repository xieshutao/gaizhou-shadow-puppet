# 皮影戏小程序 - AI 数字老人对话系统 改造文档

> 目标：在不破坏原有结构的前提下，新增「AI 皮影老艺人实时对话」能力
> 日期：2026-05-09
> 改造原则：只新增模块 + 最小侵入修改（仅改 2 个旧文件）

---

## 一、改造总览

### 做了什么

原来「互动馆」页面有三个占位按钮，全是 TODO。现在把第一个按钮接入了 AI 对话，点它跳到一个全新的「老艺人对话」页面。

在这个新页面里，你可以：

1. 长按按钮说话（录音）
2. 松开发送，AI 老艺人用语音+动画回复
3. 也能打字输入

### 没动什么

- 首页（index）一行没改
- 互动馆页面只改了 onTapBtn1 那一行（从 TODO 变成跳转）
- app.json 只加了一行新页面路由
- 旧图片、旧样式、旧组件全部保留

### 文件清单

| 状态 | 文件 | 说明 |
|------|------|------|
| 新增 | `modules/ai-chat/config.js` | 配置中心，改 API 只改这里 |
| 新增 | `modules/ai-chat/state.js` | 状态管理器（录音/说话/嘴型...） |
| 新增 | `modules/ai-chat/asr.js` | 语音输入：录音 + 识别 |
| 新增 | `modules/ai-chat/llm.js` | AI 对话：生成老艺人风格回复 |
| 新增 | `modules/ai-chat/tts.js` | 语音合成：把文字"念"出来 |
| 新增 | `modules/ai-chat/animation.js` | 嘴型动画：驱动 laor1/laor2 交替 |
| 新增 | `pages/elder-chat/elder-chat.js` | 对话页面逻辑 |
| 新增 | `pages/elder-chat/elder-chat.wxml` | 对话页面模板 |
| 新增 | `pages/elder-chat/elder-chat.wxss` | 对话页面样式 |
| 新增 | `pages/elder-chat/elder-chat.json` | 对话页面配置 |
| 修改 | `app.json` | +1 行：注册新页面路由 |
| 修改 | `pages/interactive/interactive.js` | 改 1 行：按钮1跳转到对话页 |

---

## 二、模块架构

```
modules/ai-chat/
├── config.js       ← 改 API 地址/模式/角色设定 只改这一个文件
├── state.js        ← 全局状态（isRecording, isSpeaking, mouthLevel...）
├── asr.js          ← 录音 → 识别 → 得到文本 → 自动调 llm.chat()
├── llm.js          ← 拿文本 → 生成老艺人回复 → 自动调 tts.speak()
├── tts.js          ← 拿文本 → 播放语音 → 自动调 animation 驱动嘴型
└── animation.js    ← 播放时切换 laor1/laor2 → 播完恢复闭嘴
```

### 数据流（一句话版）

```
用户长按 → 录音 → 识别文字 → AI生成回复 → 朗读+嘴型动画 → 显示气泡
```

### 详细链路

```
用户 (长按金色圆钮)
  │
  ├─ touchstart → asr.startRecord()
  │     └─ RecorderManager 开始录音，状态 → isRecording: true
  │
  └─ touchend → asr.stopRecord()
        └─ 录音结束回调
              │
              ├─ 录音 < 0.5秒 → 误触，不处理
              └─ 录音 ≥ 0.5秒 → _triggerASR()
                    │
                    ├─ mock模式：随机选一句预设文本，延迟 600ms
                    ├─ 微信插件：同声传译
                    └─ 云端API：上传音频文件
                    │
                    得到用户文本 → state.currentText
                    │
                    llm.chat(text)
                    │
                    ├─ mock：关键词匹配15条老艺人回复，延迟0.8-2s
                    └─ 云端API：POST JSON，OpenAI 格式
                    │
                    得到回复文本 → state.replyText
                    │
                    tts.speak(replyText)
                    │
                    ├─ animation.startSpeak()
                    │     └─ setInterval(150ms)
                    │         交替: laor1(闭) / laor2(开)
                    │         3档嘴型通过停留时长比例实现
                    │
                    ├─ mock：按字数估算时长 (4字/秒)
                    └─ 云端API：播放真实 mp3
                    │
                    播放结束 → animation.stopSpeak()
                    │
                    └─ 状态全部恢复，等待下一轮
```

---

## 三、嘴型动画原理

用两张图（laor1.png 闭嘴 / laor2.png 张嘴），通过 `setInterval` 每 150ms 切换一次，实现 3 种嘴型：

| 档位 | 效果 | laor1 停留 | laor2 停留 |
|------|------|-----------|-----------|
| 0 闭口 | 完全闭嘴（默认状态） | 200ms | 0ms |
| 1 微张 | 微微翕动 | 120ms | 80ms |
| 2 张开 | 明显开合 | 60ms | 140ms |

说话时角色还有 CSS 上下浮动动画（charFloat），营造"说话带动作"的感觉。

---

## 四、三种运行模式

### 当前模式（全 mock，开箱即用）

```js
// config.js 中的设置
asr: { mode: 'mock' }   // 随机返回一句预设用户文本
llm: { mode: 'mock' }   // 关键词匹配15条老艺人回复
tts: { mode: 'mock' }   // 按字数估算时长，驱动嘴型动画（无真实声音）
```

**不需要任何外部 API，微信开发者工具里直接跑。**

### 切换到真实 API

只需改 `modules/ai-chat/config.js`：

```js
// 示例：接入 OpenAI 格式的 LLM
llm: {
  mode: 'cloud-api',
  apiUrl: 'https://your-api.com/v1/chat/completions',
  apiKey: 'sk-xxxxxxxx',
  persona: `...`,  // 角色设定保持不变
}

// 接入 TTS（返回 mp3 arraybuffer）
tts: {
  mode: 'cloud-api',
  apiUrl: 'https://your-api.com/tts',
  apiKey: 'xxx',
}
```

**三个模块独立切换，互不影响。一个换真 API，另外两个继续用 mock 也能跑。**

---

## 五、老艺人角色设定

```text
你是一位盖州皮影戏老艺人，七十多岁，操着一口东北口音。

说话风格：
- 短句为主，每句不超过 20 字
- 喜欢用民间俗语、歇后语
- 语气亲切，爱叫年轻人"孩子""后生"
- 偶尔引用皮影戏台词
- 回答要有画面感，像在讲故事
- 不要用任何英文或现代网络用语
```

Mock 模式下的 15 条预设回复覆盖了这些话题：

- 皮影戏介绍（光影相随、一口道尽千古事...）
- 从艺年限（六十来年、传了三代人...）
- 行当规矩（五分刻三分画两分耍...）
- 教学收徒（先磨性子、手艺是偷来的...）
- 拿手好戏（穆桂英挂帅、关公戏...）
- 通用闲聊（后生有心、风土人情在戏里...）

---

## 六、怎么跑起来

1. 微信开发者工具打开项目：`C:\Users\LENOVO\WeChatProjects\miniprogram-3`
2. 编译运行
3. 首页 → 底部「互动馆」→ 点第一个按钮「盖州皮影」
4. 进入「老艺人」对话页
5. 长按金色圆形按钮说话，松开发送
6. 也可以点下面的输入框打字发送

---

## 七、可能遇到的问题 & 解决

| 问题 | 原因 | 解决 |
|------|------|------|
| 录音没反应 | 没授权录音权限 | 在 app.json 加 `permission.scope.record` 声明 |
| 开发者工具里听不到声音 | TTS 用的是 mock 模式 | mock 模式不产生真实音频，只驱动嘴型动画。切到 cloud-api 模式才能听到声音 |
| 点按钮跳转黑屏 | elder-chat 页面没注册 | 检查 app.json 的 pages 数组是否包含 `pages/elder-chat/elder-chat` |
| 老人说话时还能录音 | 状态锁被绕过 | isSpeaking=true 时会弹 toast 提示「请等老人说完」并拦截 |
| 页面切走后动画不停止 | setInterval 没清理 | onUnload 里主动调 stopSpeak + stopRecord，不会泄漏 |
| 对话记录太多内存炸 | history 无限制增长 | 自动截断为最近 20 条 |

---

## 八、下一步可以做的

- [ ] 接入真实 ASR（微信同声传译插件 or 百度/讯飞 API）
- [ ] 接入真实 LLM（DeepSeek / 通义千问 / 本地 ollama）
- [ ] 接入真实 TTS（Edge TTS / 火山引擎 / 讯飞）
- [ ] 增加对话历史滚动查看
- [ ] 增加老人"思考时"的微表情动画（眨眼、点头）
- [ ] 录音时增加波形/音量可视化
- [ ] 支持连续对话模式（不用每次长按）
- [ ] 在 app.json 添加录音权限声明
