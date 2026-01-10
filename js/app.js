// app.js - 主应用入口
class MajiangTrainingApp {
  constructor() {
    this.gameState = new GameState();
    this.storageManager = new StorageManager();
    
    // UI组件
    this.tileDisplay = new TileDisplay(
      document.getElementById('hand-tiles'),
      document.getElementById('drawn-tile')
    );
    this.analysisPanel = new AnalysisPanel(document.getElementById('analysis-panel'));
    this.historyPanel = new HistoryPanel(document.getElementById('history-panel'));
    
    this.timer = null;
    
    this.init();
  }
  
  init() {
    // 订阅状态变化
    this.gameState.subscribe(state => this.onStateChange(state));
    
    // 绑定事件
    this.bindEvents();
    
    // 显示欢迎信息
    this.showHint('👋 欢迎使用武汉麻将拆搭训练系统！点击"开始新训练"开始练习');
  }
  
  bindEvents() {
    // 开始新训练
    document.getElementById('btn-new-session').addEventListener('click', () => {
      const difficulty = document.getElementById('difficulty-select').value;
      this.gameState.startNewSession(difficulty);
      this.startTimer();
      this.hideHint();
    });
    
    // 整理手牌
    document.getElementById('btn-sort-hand').addEventListener('click', () => {
      this.gameState.sortHand();
      this.showHint('✅ 手牌已整理', 1500);
    });
    
    // 杠牌
    document.getElementById('btn-gang').addEventListener('click', () => {
      if (this.gameState.gangTile()) {
        this.showHint('🀄 杠红中成功！重新摸了一张牌', 2000);
      }
    });
    
    // 牌被点击
    this.tileDisplay.setOnTileClick((tile) => {
      this.onTileClick(tile);
    });
    
    // 下一轮
    document.getElementById('btn-next-round').addEventListener('click', () => {
      this.gameState.completeRound();
      this.startTimer();
    });
    
    // 保存会话
    document.getElementById('btn-save-session').addEventListener('click', () => {
      const state = this.gameState.getState();
      if (this.storageManager.saveSession(state.session)) {
        this.showHint('✅ 训练记录已保存', 2000);
      } else {
        this.showHint('❌ 保存失败', 2000);
      }
    });
    
    // 查看历史
    document.getElementById('btn-history').addEventListener('click', () => {
      const state = this.gameState.getState();
      const stats = this.gameState.getSessionStats();
      this.historyPanel.show(state.session, stats);
    });
    
    // 关闭分析面板
    document.getElementById('btn-close-analysis').addEventListener('click', () => {
      // 隐藏分析面板
      this.analysisPanel.hide();
      // 恢复到选牌状态，允许用户重新选择
      this.gameState.resetToSelectState();
      // 重启计时器
      this.startTimer();
      this.showHint('🔄 已恢复，请重新选择要打出的牌', 2000);
    });
    
    // 重新选择按钮
    document.getElementById('btn-reselect').addEventListener('click', () => {
      // 隐藏分析面板
      this.analysisPanel.hide();
      // 恢复到选牌状态
      this.gameState.resetToSelectState();
      // 重启计时器
      this.startTimer();
      this.showHint('🔄 已恢复，请重新选择要打出的牌', 2000);
    });
    
    // 关闭历史面板
    document.getElementById('btn-close-history').addEventListener('click', () => {
      this.historyPanel.hide();
    });
    
    // 清除历史
    document.getElementById('btn-clear-history').addEventListener('click', () => {
      if (confirm('确定要清除所有历史记录吗?')) {
        if (this.storageManager.clearAll()) {
          this.showHint('✅ 历史记录已清除', 2000);
          this.historyPanel.hide();
        }
      }
    });
    
    // 帮助按钮
    document.getElementById('btn-help').addEventListener('click', () => {
      this.showHelp();
    });
  }
  
  /**
   * 状态变化回调
   */
  onStateChange(state) {
    const { currentRound, session, ui } = state;
    
    // 更新指示牌信息
    if (currentRound.indicatorTile) {
      const indicatorInfo = document.getElementById('indicator-info');
      indicatorInfo.style.display = 'flex';
      
      // 显示指示牌
      document.getElementById('indicator-tile-text').textContent = 
        TileUtils.getTileText(currentRound.indicatorTile);
      
      // 显示皮子
      const piziText = currentRound.piziTiles
        .map(t => TileUtils.getTileText(t))
        .join('、');
      document.getElementById('pizi-tiles-text').textContent = piziText;
      
      // 显示赖子
      const laiziText = currentRound.laiziTiles
        .map(t => TileUtils.getTileText(t))
        .join('、');
      document.getElementById('laizi-tiles-text').textContent = laiziText;
    }
    
    // 更新手牌显示
    if (currentRound.initialHand.length > 0) {
      this.tileDisplay.renderHand(
        currentRound.initialHand,
        currentRound.drawnTile,
        ui.selectedTile,
        currentRound.piziTiles || [],
        currentRound.laiziTiles || []
      );
    }
    
    // 显示/隐藏杠牌按钮
    const gangBtn = document.getElementById('btn-gang');
    if (currentRound.canGang && !ui.showAnalysis) {
      gangBtn.classList.remove('hidden');
    } else {
      gangBtn.classList.add('hidden');
    }
    
    // 更新统计
    document.getElementById('total-score').textContent = session.totalScore;
    if (session.rounds.length > 0) {
      const avgScore = session.totalScore / session.rounds.length;
      document.getElementById('avg-score').textContent = avgScore.toFixed(1);
      
      // 更新等级显示
      const stats = this.gameState.getSessionStats();
      const levelEl = document.getElementById('level-display');
      levelEl.textContent = stats.level.level;
      levelEl.style.color = stats.level.color;
    }
    
    // 显示本轮得分
    if (currentRound.score > 0) {
      document.getElementById('round-score').textContent = currentRound.score;
    }
    
    // 显示分析结果
    if (ui.showAnalysis && currentRound.scoreResult) {
      this.stopTimer();
      this.analysisPanel.show(currentRound);
    }
  }
  
  /**
   * 牌被点击
   */
  onTileClick(tileData) {
    const state = this.gameState.getState();
    
    console.log('👆 点击牌:', tileData);
    
    // 如果已经显示分析面板,不允许再点击
    if (state.ui.showAnalysis) {
      console.log('⚠️ 已显示分析面板，忽略点击');
      return;
    }
    
    // 选中牌（传递完整的tileData对象）
    this.gameState.selectTile(tileData);
    console.log('✅ 牌已选中');
    
    // 确认打出
    setTimeout(() => {
      const confirmResult = confirm(`确定打出 ${TileUtils.getTileText(tileData.tile)} 吗？`);
      console.log('💬 用户确认结果:', confirmResult);
      
      if (confirmResult) {
        try {
          // 打牌时传递tile值和index
          this.gameState.userDiscard(tileData.tile, tileData.index);
          console.log('✅ 打牌成功');
        } catch (error) {
          console.error('❌ 打牌错误:', error);
          alert(error.message);
          // 出错后取消选中
          this.gameState.selectTile(null);
          console.log('🔄 已取消选中状态（错误）');
        }
      } else {
        // 用户取消，取消选中状态，允许重新选择
        this.gameState.selectTile(null);
        console.log('🔄 用户取消，已取消选中状态');
      }
    }, 100);
  }
  
  /**
   * 计时器
   */
  startTimer() {
    this.stopTimer();
    const startTime = Date.now();
    
    this.timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const seconds = (elapsed % 60).toString().padStart(2, '0');
      document.getElementById('timer-display').textContent = `${minutes}:${seconds}`;
    }, 1000);
  }
  
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  /**
   * 显示提示信息
   */
  showHint(text, duration = 0) {
    const hintArea = document.getElementById('hint-area');
    const hintText = document.getElementById('hint-text');
    
    hintText.textContent = text;
    hintArea.classList.remove('hidden');
    
    if (duration > 0) {
      setTimeout(() => {
        this.hideHint();
      }, duration);
    }
  }
  
  hideHint() {
    document.getElementById('hint-area').classList.add('hidden');
  }
  
  /**
   * 显示帮助信息
   */
  showHelp() {
    const helpText = `
🀄 武汉麻将拆搭训练系统使用说明

【训练目标】
通过反复练习,掌握麻将拆搭技巧,学会识别孤张、边张、中张,理解搭子价值。

【操作流程】
1. 选择难度等级(简单/中等/困难)
2. 点击"开始新训练"生成随机牌型
3. 系统发13张手牌 + 1张摸牌(高亮显示)
4. 点击"📋 整理手牌"按钮排序手牌
5. 如果有四张红中,可以点击"🀄 杠红中"重新摸牌
6. 点击要打出的牌
7. 查看分析结果,了解最优打法和自己的选择差距
8. 点击"下一轮"继续训练

【新功能】
✅ 手牌整理: 将摸牌加入手牌一起排序,方便查看和决策
🀄 杠红中: 当有四张红中时可以杠牌,杠后重新摸一张牌
🖼️ PNG图片: 使用高清牌面图片,更加美观

【拆搭原则】
• 优先打孤张(无相邻牌)
• 边张(1,2,8,9)进张效率低
• 保留中张(3-7)和有搭子潜力的牌
• 单张字牌优先打出
• 对子和刻子要保留

【评分标准】
100分: 选择最优解
80分: 前三名选择
60分: 合理选择
40分: 次优选择
20分: 较差选择

【等级系统】
平均分90+: 大师🏆
平均分80+: 高手⭐
平均分70+: 熟练💎
平均分60+: 进阶🎯
其他: 入门📖

加油练习,成为麻将高手! 💪
    `;
    
    alert(helpText);
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  window.app = new MajiangTrainingApp();
  console.log('🀄 武汉麻将拆搭训练系统已启动');
});
