// GameState.js - 游戏状态管理
class GameState {
  constructor() {
    this.state = {
      currentRound: {
        initialHand: [],
        drawnTile: null,
        currentHand: [],
        userDiscard: null,
        bestDiscard: null,
        analysis: null,
        score: 0,
        timeSpent: 0,
        startTime: null,
        canGang: false,  // 是否可以杠牌
        hasGang: false,   // 是否已经杠过牌
        hasOpened: false, // 是否已开口(吃、碰、杠)
        laiziTile: null   // 赖子牌(可选)
      },
      session: {
        sessionId: null,
        startTime: null,
        rounds: [],
        totalScore: 0,
        difficulty: 'medium'
      },
      ui: {
        showAnalysis: false,
        showHistory: false,
        selectedTile: null
      }
    };
    
    this.listeners = [];
    this.generator = new TileGenerator();
    this.analyzer = new TileAnalyzer();
    this.scoringSystem = new ScoringSystem();
  }
  
  /**
   * 开始新的训练会话
   */
  startNewSession(difficulty = 'medium') {
    this.state.session = {
      sessionId: this.generateSessionId(),
      startTime: new Date(),
      rounds: [],
      totalScore: 0,
      difficulty
    };
    
    this.startNewRound();
    this.notify();
  }
  
  /**
   * 开始新的一轮
   */
  startNewRound() {
    const initialHand = this.generator.generateHand({ 
      difficulty: this.state.session.difficulty 
    });
    
    const drawnTile = this.generator.drawTile(initialHand);
    
    // 翻指示牌，确定皮子和赖子
    const allTiles = [...initialHand, drawnTile];
    const indicatorTile = this.generator.drawIndicatorTile(allTiles);
    const piziLaiziInfo = MajiangRules.calculatePiziLaizi(indicatorTile);
    
    this.state.currentRound = {
      initialHand: [...initialHand],
      drawnTile,
      currentHand: [...initialHand, drawnTile],
      userDiscard: null,
      bestDiscard: null,
      analysis: null,
      score: 0,
      timeSpent: 0,
      startTime: Date.now(),
      canGang: false,
      hasGang: false,
      hasOpened: false, // 初始未开口
      indicatorTile: indicatorTile,  // 指示牌
      piziTiles: piziLaiziInfo.piziTiles,  // 皮子列表
      laiziTiles: piziLaiziInfo.laiziTiles // 赖子列表
    };
    
    // 检查是否可以杠牌(红中有四张)
    this.checkCanGang();
    
    this.state.ui.showAnalysis = false;
    this.state.ui.selectedTile = null;
    
    this.notify();
  }
  
  /**
   * 用户打牌
   */
  userDiscard(tile, index) {
    const { currentHand } = this.state.currentRound;
    
    // 验证牌是否在手牌中
    if (!currentHand.includes(tile)) {
      throw new Error('Invalid tile: not in hand');
    }
    
    // 验证索引是否有效
    if (index < 0 || index >= currentHand.length || currentHand[index] !== tile) {
      throw new Error('Invalid tile index');
    }
    
    this.state.currentRound.userDiscard = tile;
    this.state.currentRound.userDiscardIndex = index; // 保存索引
    this.state.currentRound.timeSpent = 
      (Date.now() - this.state.currentRound.startTime) / 1000;
    
    // 执行分析和评分
    this.analyzeRound();
    this.notify();
  }
  
  /**
   * 分析本轮结果
   */
  analyzeRound() {
    const round = this.state.currentRound;
    
    // 构建游戏上下文
    const gameContext = {
      hasOpened: round.hasOpened,
      piziTiles: round.piziTiles,
      laiziTiles: round.laiziTiles
    };
    
    // 找出最佳打法
    const bestSolution = this.analyzer.findBestDiscard(round.currentHand, gameContext);
    
    // 评分用户选择
    const scoreResult = this.scoringSystem.scoreChoice(
      round.userDiscard,
      bestSolution,
      bestSolution.alternatives
    );
    
    // 更新状态
    round.bestDiscard = bestSolution.bestDiscard;
    round.score = scoreResult.score;
    round.scoreResult = scoreResult;
    round.bestSolution = bestSolution;
    
    // 显示分析面板
    this.state.ui.showAnalysis = true;
  }
  
  /**
   * 完成本轮,开始下一轮
   */
  completeRound() {
    // 保存到历史
    this.state.session.rounds.push({
      ...this.state.currentRound
    });
    
    this.state.session.totalScore += this.state.currentRound.score;
    
    // 重置UI
    this.state.ui.showAnalysis = false;
    this.state.ui.selectedTile = null;
    
    // 开始新轮
    this.startNewRound();
  }
  
  /**
   * 选中牌
   */
  selectTile(tile) {
    console.log('🎯 selectTile 被调用, 参数:', tile);
    this.state.ui.selectedTile = tile;
    console.log('🎯 当前 selectedTile:', this.state.ui.selectedTile);
    this.notify();
  }
  
  /**
   * 重置到选牌状态（关闭分析面板后恢复）
   */
  resetToSelectState() {
    console.log('🔄 resetToSelectState 被调用');
    
    // 隐藏分析面板
    this.state.ui.showAnalysis = false;
    
    // 清除选中状态
    this.state.ui.selectedTile = null;
    
    // 清除本轮的打牌记录（允许重新选择）
    this.state.currentRound.userDiscard = null;
    this.state.currentRound.userDiscardIndex = null;
    this.state.currentRound.score = 0;
    this.state.currentRound.scoreResult = null;
    this.state.currentRound.bestDiscard = null;
    this.state.currentRound.bestSolution = null;
    
    // 重置计时（从当前时间继续）
    // this.state.currentRound.startTime 保持不变，继续累计时间
    
    console.log('✅ 已重置到选牌状态');
    this.notify();
  }
  
  /**
   * 显示/隐藏历史面板
   */
  toggleHistory() {
    this.state.ui.showHistory = !this.state.ui.showHistory;
    this.notify();
  }
  
  /**
   * 检查是否可以杠牌
   */
  checkCanGang() {
    const { currentHand, hasGang } = this.state.currentRound;
    
    // 如果已经杠过牌,不能再杠
    if (hasGang) {
      this.state.currentRound.canGang = false;
      return;
    }
    
    // 检查是否有四张红中
    const zhongCount = currentHand.filter(tile => tile === 'zhong').length;
    this.state.currentRound.canGang = zhongCount === 4;
  }
  
  /**
   * 杠牌(红中)
   */
  gangTile() {
    const { currentHand, canGang } = this.state.currentRound;
    
    if (!canGang) {
      return false;
    }
    
    // 移除四张红中
    const newHand = currentHand.filter(tile => tile !== 'zhong');
    
    // 重新摸牌
    const newDrawnTile = this.generator.drawTile(newHand);
    
    // 更新状态
    this.state.currentRound.initialHand = [...newHand];
    this.state.currentRound.drawnTile = newDrawnTile;
    this.state.currentRound.currentHand = [...newHand, newDrawnTile];
    this.state.currentRound.hasGang = true;
    this.state.currentRound.canGang = false;
    
    // 杠牌时清除选中状态
    this.state.ui.selectedTile = null;
    
    this.notify();
    return true;
  }
  
  /**
   * 整理手牌
   */
  sortHand() {
    const { initialHand, drawnTile } = this.state.currentRound;
    
    // 将摸牌加入手牌后排序
    const allTiles = drawnTile ? [...initialHand, drawnTile] : initialHand;
    const sortedTiles = TileUtils.sortTiles(allTiles);
    
    // 更新状态(摘出最后一张作为摸牌标记)
    if (drawnTile) {
      const lastTile = sortedTiles[sortedTiles.length - 1];
      this.state.currentRound.initialHand = sortedTiles.slice(0, -1);
      this.state.currentRound.drawnTile = lastTile;
      this.state.currentRound.currentHand = [...sortedTiles];
    } else {
      this.state.currentRound.initialHand = sortedTiles;
      this.state.currentRound.currentHand = sortedTiles;
    }
    
    // 整理手牌时清除选中状态
    this.state.ui.selectedTile = null;
    
    this.notify();
  }
  
  /**
   * 获取当前状态
   */
  getState() {
    return this.state;
  }
  
  /**
   * 获取会话统计
   */
  getSessionStats() {
    return this.scoringSystem.calculateSessionScore(this.state.session.rounds);
  }
  
  // 观察者模式
  subscribe(listener) {
    this.listeners.push(listener);
  }
  
  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
  
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
