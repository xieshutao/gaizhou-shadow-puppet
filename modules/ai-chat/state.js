// modules/ai-chat/state.js
// 状态模块（兼容层）
// 已被 stateMachine.js 取代，保留此文件仅为向后兼容
// 新代码请直接使用 stateMachine.js

const fsm = require('./stateMachine.js')

module.exports = {
  bindPage(ctx) { return fsm.bindPage(ctx) },
  get(key) { return fsm.getData(key) },
  set(patch) { fsm._syncUI(patch) },
  reset() {
    fsm._syncUI({
      currentText: '',
      replyText: '',
      errorMsg: '',
      statusText: '按住说话',
    })
  },
}
