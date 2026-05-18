// modules/ai-chat/pipeline.js
// 对话管线 —— 统一编排 ASR→LLM→TTS→Animation 全流程
// 全局锁 + 错误兜底 + 任意步骤失败可安全回退到 IDLE

const fsm = require('./stateMachine.js')
const { STATES } = fsm
const memory = require('./memory.js')
const emotion = require('./emotion.js')
const config = require('./config.js')

// ============================================================
// 全局请求锁
// ============================================================
let _pipelineLock = false

function _acquireLock() {
  if (_pipelineLock) return false
  _pipelineLock = true
  return true
}

function _releaseLock() {
  _pipelineLock = false
}

function _delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================
// 主入口：run(userText)
// 调用方不需要管状态，pipeline 全权负责状态转移
// ============================================================
async function run(userText) {
  // 防重复
  if (!_acquireLock()) {
    console.warn('[Pipeline] 管线锁定，忽略重复请求')
    return
  }

  // ★ 状态检查：只允许从 IDLE 或 LISTENING 进入
  const curState = fsm.state
  if (curState !== STATES.IDLE && curState !== STATES.LISTENING) {
    console.warn('[Pipeline] 当前状态不可进入管线:', curState)
    _releaseLock()
    return
  }

  const text = (userText || '').trim()
  if (!text) {
    _releaseLock()
    return
  }

  // ===== 阶段0：切到 PROCESSING =====
  // LISTENING → PROCESSING  或  IDLE → PROCESSING
  fsm.transition(STATES.PROCESSING, {
    currentText: text,
    thinkAnim: true,
    statusText: '老人正在想...',
  })

  // 添加用户消息到对话记录
  fsm.addDialogue('user', text)

  try {
    // ===== 阶段1：思考延迟 =====
    const thinkDelay = 800 + Math.random() * 1400
    await _delay(thinkDelay)

    // ===== 阶段2：LLM =====
    let llmResult
    try {
      llmResult = await _callLLM(text)
    } catch (llmErr) {
      console.error('[Pipeline] LLM 失败', llmErr)
      llmResult = _llmFallback(text)
    }

    const { text: replyText, emotion: emo } = emotion.parseLLMOutput(llmResult)

    // 记录记忆
    memory.add(text, replyText, emo)
    fsm.addDialogue('assistant', replyText, emo)

    // ===== 阶段3：切到 SPEAKING =====
    fsm.transition(STATES.SPEAKING, {
      replyText: replyText,
      replyEmotion: emo,
      statusText: '老人回复中...',
    })

    // 启动情绪驱动嘴型动画
    const anim = require('./animation.js')
    anim.startSpeak(emo)

    // ===== 阶段4：TTS 播放 =====
    try {
      await _callTTS(replyText, emo)
    } catch (ttsErr) {
      console.error('[Pipeline] TTS 失败，静音降级', ttsErr)
      await _delay(Math.max(2000, replyText.length * 250))
    }

    // ===== 阶段5：结束 =====
    anim.stopSpeak()
    fsm.transition(STATES.IDLE, {
      replyText: '',
    })

  } catch (err) {
    console.error('[Pipeline] 未捕获异常', err)
    _safeStopAnim()
    fsm.setError('出了点问题，请重试')

  } finally {
    _releaseLock()
  }
}

// ============================================================
// 文本输入入口
// ============================================================
async function runFromText(userText) {
  const text = (userText || '').trim()
  if (!text) return
  if (!fsm.canDo('sendText')) return

  // 文本输入从 IDLE 进入，直接走 run()
  // run() 内部会处理状态转移和 dialogue 记录
  return run(text)
}

// ============================================================
// LLM 调用
// ============================================================
async function _callLLM(userText) {
  if (config.llm.mode === 'mock') {
    return _mockLLM(userText)
  }
  if (config.llm.mode === 'cloud-api') {
    return _cloudLLM(userText)
  }
  return _mockLLM(userText)
}

// ============================================================
// Mock LLM —— 返回 { text, emotion }
// ============================================================
function _mockLLM(userText) {
  let emo = 'calm'
  let replies = []

  const txt = userText || ''

  if (/皮影|戏|表演|光影/.test(txt)) {
    emo = 'nostalgic'
    replies = [
      '孩子，皮影戏讲究的是光影相随，手上功夫得练一辈子。',
      '一口道尽千古事，双手对舞百万兵——这就是咱皮影戏。',
      '皮影啊，灯一照就活了，可这里头的门道深着哩。',
    ]
  } else if (/多少年|多久|时间|岁数|年轻|故事/.test(txt)) {
    emo = 'nostalgic'
    replies = [
      '算算啊，打十六岁学艺，到现在六十来年了。',
      '这手艺传了三代人了，我爷爷那辈儿就开始耍皮影。',
      '日子久了记不太清，反正一辈子就干这一件事。',
    ]
  } else if (/讲究|规矩|门道|怎么|什么/.test(txt)) {
    emo = 'serious'
    replies = [
      '皮影是五分刻、三分画、两分耍。刻刀得有魂儿。',
      '老辈人讲究"七紧八慢九消停"，一台戏七个人正忙活。',
      '做皮影得用驴皮，刮得透亮了才能下刀。',
    ]
  } else if (/教|学|做|新手|容易/.test(txt)) {
    emo = 'calm'
    replies = [
      '想学啊？先得磨性子，坐得住冷板凳才行。',
      '手艺是偷来的，不是教出来的，得自己看自己琢磨。',
      '从描样子开始吧，线条走不顺，刻出来也是死的。',
    ]
  } else if (/拿手|擅长|最好|喜欢/.test(txt)) {
    emo = 'happy'
    replies = [
      '《穆桂英挂帅》！这出戏我耍了不下千遍了。',
      '讲关公的戏我最爱，耍起来那叫一个带劲儿。',
      '文戏《西厢记》、武戏《三英战吕布》，各有各的味儿。',
    ]
  } else if (/厉害|棒|牛|佩服|真行/.test(txt)) {
    emo = 'happy'
    replies = [
      '哈哈，后生会说话！来来来，我再给你露一手。',
      '不敢当不敢当，就是耍得久了，手熟了而已。',
    ]
  } else if (/嗯|哦|好|行|对/.test(txt) && txt.length <= 3) {
    const recent = memory.getRecent(1)
    if (recent.length > 0 && recent[0].emotion === 'nostalgic') {
      emo = 'nostalgic'
      replies = ['是啊……一晃眼都这么多年了。', '人老了就爱念叨这些旧事。']
    } else {
      emo = 'calm'
      replies = ['后生啊，你有这份心听老家伙叨叨，我就高兴。', '这年头惦记皮影的人不多了，你是个有心人。']
    }
  } else {
    const recent = memory.getRecent(2)
    if (recent.length > 0) {
      replies = [
        '说到这个啊，风土人情都在戏里头，你慢慢品就懂了。',
        '老祖宗传下来的东西，看着土，里头全是智慧。',
        '想听哪一段？我这儿故事多着哩。',
      ]
    } else {
      replies = [
        '后生啊，你有这份心听老家伙叨叨，我就高兴。',
        '这年头惦记皮影的人不多了，你是个有心人。',
        '风土人情都在戏里头，你慢慢品就懂了。',
        '想听哪一段？我这儿故事多着哩。',
        '老祖宗传下来的东西，看着土，里头全是智慧。',
      ]
    }
  }

  const text = replies[Math.floor(Math.random() * replies.length)]
  return { text, emotion: emo }
}

// ============================================================
// 云端 LLM
// ============================================================
function _cloudLLM(userText) {
  if (!config.llm.apiUrl) throw new Error('未配置 LLM API')

  return new Promise((resolve, reject) => {
    const contextStr = memory.getContext()
    const systemPrompt = config.llm.persona + '\n\n' +
      '你必须用 JSON 格式回复：{"text":"回复","emotion":"calm|happy|nostalgic|serious"}\n' +
      '只输出 JSON。'

    const messages = [{ role: 'system', content: systemPrompt }]
    if (contextStr) {
      messages.push({ role: 'system', content: '对话历史：\n' + contextStr })
    }
    messages.push({ role: 'user', content: userText })

    wx.request({
      url: config.llm.apiUrl,
      method: 'POST',
      timeout: 15000,
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (config.llm.apiKey || ''),
      },
      data: { messages, max_tokens: 150, temperature: 0.7 },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data?.choices?.[0]?.message?.content || '')
        } else {
          reject(new Error('HTTP ' + res.statusCode))
        }
      },
      fail: reject,
    })
  })
}

// ============================================================
// LLM 兜底
// ============================================================
function _llmFallback(_userText) {
  return {
    text: '嗯……后生啊，让我想想。老祖宗传下来的东西，看着土，里头全是智慧。',
    emotion: 'calm',
  }
}

// ============================================================
// TTS 调用
// ============================================================
function _callTTS(text, _emotion) {
  if (config.tts.mode === 'mock') {
    const duration = Math.max(2000, text.length * 250)
    return _delay(duration)
  }
  if (config.tts.mode === 'cloud-api') {
    return _cloudTTS(text)
  }
  return _delay(Math.max(2000, text.length * 250))
}

function _cloudTTS(text) {
  return new Promise((resolve, reject) => {
    if (!config.tts.apiUrl) return reject(new Error('未配置 TTS API'))

    wx.request({
      url: config.tts.apiUrl,
      method: 'POST',
      timeout: 20000,
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (config.tts.apiKey || ''),
      },
      data: { text, voice: 'elder_male', speed: 0.9 },
      responseType: 'arraybuffer',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const fs = wx.getFileSystemManager()
          const tempPath = wx.env.USER_DATA_PATH + '/tts_' + Date.now() + '.mp3'
          fs.writeFile({
            filePath: tempPath,
            data: res.data,
            success: () => {
              const audio = wx.createInnerAudioContext()
              audio.obeyMuteSwitch = false
              audio.src = tempPath
              audio.onEnded(() => { audio.destroy(); resolve() })
              audio.onError((err) => { audio.destroy(); reject(err) })
              audio.play()
            },
            fail: reject,
          })
        } else {
          reject(new Error('HTTP ' + res.statusCode))
        }
      },
      fail: reject,
    })
  })
}

function _safeStopAnim() {
  try {
    const anim = require('./animation.js')
    anim.stopSpeak()
  } catch (e) { /* ignore */ }
}

function isBusy() {
  return _pipelineLock || fsm.is(STATES.PROCESSING) || fsm.is(STATES.SPEAKING)
}

module.exports = { run, runFromText, isBusy }
