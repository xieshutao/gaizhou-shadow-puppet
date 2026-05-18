// pages/elder-chat/elder-chat.js
// 盖州皮影作坊 — 舞台级伪3D人物AI对话

// ★ API接入点：替换这三个函数即可接入真实LLM/TTS
//   _callLLM(userText, charId) → 返回 { text: "回复文本" }
//   _callTTS(text) → 返回音频并播放，或返回时长(ms)
//   当前为占位实现，仅驱动视觉效果

var CHARACTERS = {
  master: { id: 'master', name: '老师傅', title: '盖州皮影老艺人', imgClosed: '/image3/laor1.png', imgOpen: '/image3/laor2.png' },
  young:  { id: 'young',  name: '年轻学徒', title: '皮影技艺传承人',   imgClosed: '/image3/nianq1.png', imgOpen: '/image3/nianq1.png' },
  teen:   { id: 'teen',   name: '小徒弟',   title: '皮影小小传承人',   imgClosed: '/image3/shaonian.png', imgOpen: '/image3/shaonian.png' }
}

// ★ 占位 LLM —— 替换为真实 API 调用
function _callLLM(userText, charId) {
  // TODO: 接入真实 LLM API，返回 { text: "..." }
  // 示例: return await wx.request({ url: '...', data: { prompt: userText, character: charId } })
  var demoTexts = {
    master: '一口道尽千古事，双手对舞百万兵。孩子，皮影戏的魂儿，在光影之间。',
    young: '我跟师傅学了五年，越学越觉得皮影这手艺深得很。',
    teen: '爷爷说等我刻出第一个皮影人，就带我去庙会表演。'
  }
  return { text: demoTexts[charId] || '你好，我是皮影作坊的一员。' }
}

// ★ 占位 TTS —— 替换为真实语音合成
function _callTTS(text, onDone) {
  // TODO: 接入真实 TTS API 播放音频，播放结束后调用 onDone()
  // 当前按字数估算时长
  var duration = Math.max(1500, (text || '').length * 220)
  setTimeout(onDone, duration)
}

// ============ 引擎 ============
var _busy = false, _mouthTimer = null, _breathTimer = null
var _typewriterTimer = null, _recorder = null, _recordTimer = null
var _activeChar = null, _recorderAvailable = true

function _mockReplyQuick(charId) {
  return _callLLM('', charId).text
}

// 嘴型
function _startMouth(page) {
  _stopMouth(page)
  if (!_activeChar || _activeChar.imgOpen === _activeChar.imgClosed) {
    // 单图角色：缩放脉冲
    page.setData({ charPulse: true })
    return
  }
  page.setData({ charImg: _activeChar.imgOpen })
  var open = false
  _mouthTimer = setInterval(function () {
    open = !open
    page.setData({ charImg: open ? _activeChar.imgOpen : _activeChar.imgClosed })
  }, 140)
}

function _stopMouth(page) {
  if (_mouthTimer) { clearInterval(_mouthTimer); _mouthTimer = null }
  if (_activeChar) page.setData({ charImg: _activeChar.imgClosed, charPulse: false })
}

// 打字机字幕
function _typewriter(page, text, onDone) {
  if (_typewriterTimer) clearInterval(_typewriterTimer)
  var i = 0
  page.setData({ subtitle: '' })
  _typewriterTimer = setInterval(function () {
    if (i < text.length) {
      page.setData({ subtitle: text.slice(0, i + 1) })
      i++
    } else {
      clearInterval(_typewriterTimer); _typewriterTimer = null
      if (onDone) onDone()
    }
  }, 80)
}

// 角色呼吸
function _startBreath(page) {
  _stopBreath(page)
  var up = false
  _breathTimer = setInterval(function () {
    up = !up
    page.setData({ breathUp: up })
  }, 2500)
}

function _stopBreath(page) {
  if (_breathTimer) { clearInterval(_breathTimer); _breathTimer = null }
  page.setData({ breathUp: false })
}

// 录音
function _initRecorder(page) {
  if (_recorder) return _recorder
  try {
    _recorder = wx.getRecorderManager()
    _recorder.onStart(function () { _recordTimer = setTimeout(function () { try { _recorder.stop() } catch (e) {} }, 60000) })
    _recorder.onStop(function (res) {
      clearTimeout(_recordTimer)
      if (res.duration < 500) { page.setData({ isRecording: false, micRipple: false }); return }
      page.setData({ isRecording: false, micRipple: false })
      var q = '你好' // 真实 ASR 结果放这里
      page.setData({ userSubtitle: q })
      _doReply(q, page)
    })
    _recorder.onError(function () { clearTimeout(_recordTimer); _recorderAvailable = false; page.setData({ isRecording: false, micRipple: false, recorderError: true }) })
    _recorderAvailable = true
  } catch (e) { _recorderAvailable = false; _recorder = null }
  return _recorder
}

function _doReply(userText, page) {
  if (_busy) return; _busy = true
  _stopBreath(page)
  page.setData({ isProcessing: true })
  setTimeout(function () {
    var result = _callLLM(userText || '', _activeChar.id)
    var reply = result.text
    page.setData({ isProcessing: false, isSpeaking: true })
    _startMouth(page)
    _typewriter(page, reply, function () {
      // 字幕打完，等 TTS 播完
      _callTTS(reply, function () {
        _stopMouth(page)
        page.setData({ isSpeaking: false, subtitle: '', userSubtitle: '' })
        _startBreath(page)
        _busy = false
      })
    })
  }, 600 + Math.random() * 1000)
}

Page({
  data: {
    scenePhase: 'intro', introText: '', introVisible: false,
    highlightedChar: null,
    activeChar: null, charName: '', charTitle: '', charImg: '',
    charPulse: false, breathUp: false,
    isRecording: false, isSpeaking: false, isProcessing: false,
    micRipple: false,
    subtitle: '', userSubtitle: '', recorderError: false, inputText: '',
    particles: []
  },

  onLoad() {
    _busy = false; _activeChar = null; _recorderAvailable = true
    _initRecorder(this)
    this._startIntro()
    // 生成粒子数据
    var p = []
    for (var i = 0; i < 15; i++) {
      p.push({
        id: i,
        left: Math.floor(Math.random() * 90) + 5,
        delay: (Math.random() * 6).toFixed(1),
        duration: (4 + Math.random() * 6).toFixed(1),
        size: (4 + Math.random() * 6).toFixed(0)
      })
    }
    this.setData({ particles: p })
  },

  onUnload() { _stopMouth(this); _stopBreath(this); if (_typewriterTimer) clearInterval(_typewriterTimer); if (_recorder) try { _recorder.stop() } catch (e) {}; _busy = false },

  _startIntro() {
    var page = this
    var text = '盖州，一座百年皮影作坊。老师傅带着徒弟们，正在为下一场庙会演出做准备……'
    page.setData({ scenePhase: 'intro', introText: '', introVisible: true })
    var i = 0, timer = setInterval(function () {
      if (i < text.length) { page.setData({ introText: text.slice(0, i + 1) }); i++ }
      else { clearInterval(timer); setTimeout(function () { page.setData({ introVisible: false }); setTimeout(function () { page.setData({ scenePhase: 'scene' }) }, 400) }, 2000) }
    }, 60)
  },

  onSceneTouchStart(e) { if (!_busy && this.data.scenePhase === 'scene') this._checkTouch(e) },
  onSceneTouchMove(e)  { if (!_busy && this.data.scenePhase === 'scene') this._checkTouch(e) },
  onSceneTouchEnd()    { if (this.data.scenePhase === 'scene' && this.data.highlightedChar) this.setData({ highlightedChar: null }) },

  _checkTouch(e) {
    var t = e.touches[0]; if (!t) return
    var sys = wx.getSystemInfoSync(), w = sys.windowWidth, h = sys.windowHeight, x = t.x, y = t.y, hit = null
    if      (x > w * 0.15 && x < w * 0.50 && y > h * 0.20 && y < h * 0.60) hit = 'master'
    else if (x > w * 0.50 && x < w * 0.88 && y > h * 0.15 && y < h * 0.55) hit = 'young'
    else if (x > w * 0.12 && x < w * 0.48 && y > h * 0.48 && y < h * 0.82) hit = 'teen'
    if (hit !== this.data.highlightedChar) this.setData({ highlightedChar: hit })
  },

  onCharTapMaster() { this._selectChar('master') },
  onCharTapYoung()  { this._selectChar('young') },
  onCharTapTeen()   { this._selectChar('teen') },

  _selectChar(charId) {
    if (_busy) return; var cfg = CHARACTERS[charId]; if (!cfg) return
    _activeChar = cfg
    this.setData({
      scenePhase: 'character', activeChar: charId, charName: cfg.name, charTitle: cfg.title,
      charImg: cfg.imgClosed, charPulse: false, breathUp: false,
      subtitle: '', userSubtitle: '', isSpeaking: false, isRecording: false, recorderError: false
    })
    _startBreath(this)
    try { wx.vibrateShort({ type: 'light' }) } catch (e) {}
  },

  onBackToScene() {
    _busy = false
    _stopMouth(this); _stopBreath(this)
    if (_typewriterTimer) { clearInterval(_typewriterTimer); _typewriterTimer = null }
    _activeChar = null
    this.setData({
      scenePhase: 'scene', activeChar: null, charName: '', charTitle: '', charImg: '',
      subtitle: '', userSubtitle: '', charPulse: false, breathUp: false,
      isSpeaking: false, isRecording: false, isProcessing: false, recorderError: false
    })
  },

  onPressTalk() {
    if (_busy || !_activeChar || this.data.isSpeaking || this.data.isProcessing) return
    var r = _initRecorder(this)
    if (!r || !_recorderAvailable) { this.setData({ recorderError: true }); return }
    this.setData({ isRecording: true, micRipple: true, userSubtitle: '', recorderError: false })
    try { r.start({ duration: 60000, sampleRate: 16000, numberOfChannels: 1, encodeBitRate: 48000, format: 'mp3' }) } catch (e) { this.setData({ isRecording: false, micRipple: false, recorderError: true }) }
  },

  onReleaseTalk() { if (!this.data.isRecording) return; try { _recorder.stop() } catch (e) { this.setData({ isRecording: false, micRipple: false }) } },

  onInputConfirm(e) {
    var text = (e.detail.value || '').trim(); if (!text || _busy || !_activeChar) return
    this.setData({ inputText: '', userSubtitle: text })
    _doReply(text, this)
  },

  onTabHome() { wx.redirectTo({ url: '/pages/index/index' }) },
  onTabInteractive() { wx.redirectTo({ url: '/pages/interactive/interactive' }) }
})
