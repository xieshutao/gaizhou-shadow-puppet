/**
 * 皮影角色识别答题游戏
 * 参照云游敦煌 vocabulary/answerCard 模式
 * 
 * 玩法：展示皮影角色剪影 → 用户选择角色类型（生/旦/净/丑）→ 积分排名
 * 
 * 使用：
 *   const quiz = require('../../modules/game/characterQuiz')
 *   quiz.start()           // 开始新一轮
 *   quiz.answer('生')      // 提交答案，返回 {correct, points}
 *   quiz.getProgress()     // 获取进度
 *   quiz.getResult()       // 获取最终结果
 */

// 题库
const QUESTIONS = [
  // 生角
  { id: 1, silhouette: '👤', answer: '生', hint: '男性正面角色，多为文雅书生或忠臣良将', difficulty: 1 },
  { id: 2, silhouette: '👤', answer: '生', hint: '头戴官帽，手持笏板，声腔沉稳', difficulty: 1 },
  { id: 3, silhouette: '👤', answer: '生', hint: '老生形象，长须飘然，步履稳健', difficulty: 2 },
  // 旦角
  { id: 4, silhouette: '👤', answer: '旦', hint: '女性角色，头戴凤冠，身姿婀娜', difficulty: 1 },
  { id: 5, silhouette: '👤', answer: '旦', hint: '青衣旦，端庄秀丽，唱腔清丽婉转', difficulty: 1 },
  { id: 6, silhouette: '👤', answer: '旦', hint: '花旦形象，活泼俏皮，短衫轻履', difficulty: 2 },
  // 净角
  { id: 7, silhouette: '👤', answer: '净', hint: '花脸角色，面部浓墨重彩，性格刚烈豪放', difficulty: 1 },
  { id: 8, silhouette: '👤', answer: '净', hint: '黑净，忠勇正直，声如洪钟', difficulty: 2 },
  { id: 9, silhouette: '👤', answer: '净', hint: '白净，奸诈阴险，唱腔中带有暗沉', difficulty: 3 },
  // 丑角
  { id: 10, silhouette: '👤', answer: '丑', hint: '鼻梁涂白，表情夸张，善于插科打诨', difficulty: 1 },
  { id: 11, silhouette: '👤', answer: '丑', hint: '武丑形象，身手矫健，台词俏皮幽默', difficulty: 2 },
  { id: 12, silhouette: '👤', answer: '丑', hint: '文丑，以念白见长，常在剧情中穿针引线', difficulty: 3 },
];

const ROLES = ['生', '旦', '净', '丑'];
const ROLE_NAMES = { '生': '生角', '旦': '旦角', '净': '净角', '丑': '丑角' };

class CharacterQuiz {
  constructor() {
    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.answers = [];
    this.started = false;
    this.totalQuestions = 10;
  }

  /**
   * 开始新一轮答题
   * @param {number} count 题目数量，默认10
   */
  start(count = 10) {
    // 随机选题
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
    this.questions = shuffled.slice(0, Math.min(count, QUESTIONS.length));
    this.currentIndex = 0;
    this.score = 0;
    this.answers = [];
    this.started = true;
    this.totalQuestions = this.questions.length;
    return this.getCurrentQuestion();
  }

  /** 获取当前题目 */
  getCurrentQuestion() {
    if (this.currentIndex >= this.questions.length) return null;
    const q = this.questions[this.currentIndex];
    return {
      id: q.id,
      silhouette: q.silhouette,
      hint: q.hint,
      difficulty: q.difficulty,
      index: this.currentIndex + 1,
      total: this.totalQuestions,
    };
  }

  /**
   * 提交答案
   * @param {string} role '生'|'旦'|'净'|'丑'
   * @returns {{ correct: boolean, points: number, correctAnswer: string, finished: boolean }}
   */
  answer(role) {
    if (!this.started || this.currentIndex >= this.questions.length) return null;
    
    const q = this.questions[this.currentIndex];
    const correct = q.answer === role;
    const points = correct ? (4 - q.difficulty) * 10 : 0; // 难度越低分越高
    
    if (correct) this.score += points;
    
    this.answers.push({
      questionId: q.id,
      userAnswer: role,
      correctAnswer: q.answer,
      correct,
      points,
      difficulty: q.difficulty,
    });
    
    this.currentIndex++;
    const finished = this.currentIndex >= this.questions.length;
    
    return {
      correct,
      points,
      correctAnswer: q.answer,
      correctName: ROLE_NAMES[q.answer],
      finished,
      score: this.score,
    };
  }

  /** 获取答题进度 */
  getProgress() {
    if (!this.started) return { current: 0, total: 0, score: 0 };
    return {
      current: this.currentIndex,
      total: this.totalQuestions,
      score: this.score,
      maxScore: this._getMaxScore(),
    };
  }

  /** 获取最终结果 */
  getResult() {
    if (!this.started) return null;
    
    const correctCount = this.answers.filter(a => a.correct).length;
    const accuracy = this.answers.length > 0 ? correctCount / this.answers.length : 0;
    
    // 评级
    let grade;
    if (accuracy >= 0.9) grade = '皮影大师';
    else if (accuracy >= 0.7) grade = '皮影学徒';
    else if (accuracy >= 0.5) grade = '皮影爱好者';
    else grade = '皮影新秀';
    
    // 角色分布统计
    const roleStats = {};
    ROLES.forEach(r => {
      const roleAnswers = this.answers.filter(a => {
        const q = QUESTIONS.find(q => q.id === a.questionId);
        return q && q.answer === r;
      });
      roleStats[r] = {
        total: roleAnswers.length,
        correct: roleAnswers.filter(a => a.correct).length,
      };
    });
    
    return {
      totalQuestions: this.answers.length,
      correctCount,
      accuracy,
      score: this.score,
      maxScore: this._getMaxScore(),
      grade,
      gradeEmoji: grade === '皮影大师' ? '🏆' : grade === '皮影学徒' ? '🎭' : grade === '皮影爱好者' ? '👏' : '🌱',
      answers: this.answers,
      roleStats,
      weakestRole: this._getWeakestRole(roleStats),
    };
  }

  /** 获取角色选项列表 */
  getRoleOptions() {
    return ROLES.map(r => ({ value: r, name: ROLE_NAMES[r] }));
  }

  _getMaxScore() {
    return this.questions.reduce((sum, q) => sum + (4 - q.difficulty) * 10, 0);
  }

  _getWeakestRole(roleStats) {
    let weakest = null;
    let lowestRate = 1;
    ROLES.forEach(r => {
      if (roleStats[r].total > 0) {
        const rate = roleStats[r].correct / roleStats[r].total;
        if (rate < lowestRate) { lowestRate = rate; weakest = r; }
      }
    });
    return weakest ? ROLE_NAMES[weakest] : null;
  }
}

// 单例
const quiz = new CharacterQuiz();

module.exports = { CharacterQuiz, quiz, ROLES, ROLE_NAMES, QUESTIONS };
