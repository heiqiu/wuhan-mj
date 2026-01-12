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
    console.log('🔗 开始绑定事件...');
    
    // 开始新训练
    document.getElementById('btn-new-session').addEventListener('click', () => {
      const difficulty = document.getElementById('difficulty-select').value;
      this.gameState.startNewSession(difficulty);
      this.startTimer();
      this.hideHint();
    });
    console.log('✅ btn-new-session 事件已绑定');
    
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
    const btnNextRound = document.getElementById('btn-next-round');
    console.log('🔍 查找 btn-next-round 元素:', btnNextRound);
    
    if (btnNextRound) {
      btnNextRound.addEventListener('click', () => {
        console.log('▶️ 点击下一轮按钮');
        this.gameState.completeRound();
        this.startTimer();
        console.log('✅ 已开始下一轮');
      });
      console.log('✅ btn-next-round 事件已绑定');
    } else {
      console.error('❌ 找不到 btn-next-round 元素！');
    }
    
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
      console.log('🔄 点击重新选择按钮');
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
    document.getElementById('btn-clear-history').addEventListener('click', async () => {
      const confirmed = await showConfirm('确定要清除所有历史记录吗？', '清除历史记录');
      if (confirmed) {
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
  async onTileClick(tileData) {
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
    setTimeout(async () => {
      const confirmResult = await showConfirm(
        `确定打出 ${TileUtils.getTileText(tileData.tile)} 吗？`,
        '确认出牌'
      );
      console.log('💬 用户确认结果:', confirmResult);
      
      if (confirmResult) {
        try {
          // 打牌时传递tile值和index
          this.gameState.userDiscard(tileData.tile, tileData.index);
          console.log('✅ 打牌成功');
        } catch (error) {
          console.error('❌ 打牌错误:', error);
          await showError(error.message, '出牌错误');
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
  async showHelp() {
    const helpContent = `
      <div style="text-align: left; line-height: 1.8;">
        <h3 style="color: #6dd47e; text-align: center; margin-bottom: 20px;">🀄 武汉麻将拆搭训练系统</h3>
        
        <h4 style="color: #6dd47e; margin-top: 20px;">【训练目标】</h4>
        <p>通过反复练习，掌握麻将拆搭技巧，学会识别孤张、边张、中张，理解搭子价值。</p>
        
        <h4 style="color: #6dd47e; margin-top: 20px;">【操作流程】</h4>
        <ol style="padding-left: 20px;">
          <li>选择难度等级（简单/中等/困难）</li>
          <li>点击"开始新训练"生成随机牌型</li>
          <li>系统发13张手牌 + 1张摸牌（高亮显示）</li>
          <li>点击"📋 整理手牌"按钮排序手牌</li>
          <li>如果有四张红中，可以点击"🀄 杠红中"重新摸牌</li>
          <li>点击要打出的牌</li>
          <li>查看分析结果，了解最优打法和自己的选择差距</li>
          <li>点击"下一轮"继续训练</li>
        </ol>
        
        <h4 style="color: #6dd47e; margin-top: 20px;">【新功能】</h4>
        <ul style="padding-left: 20px;">
          <li>✅ 手牌整理：将摸牌加入手牌一起排序，方便查看和决策</li>
          <li>🀄 杠红中：当有四张红中时可以杠牌，杠后重新摸一张牌</li>
          <li>🖼️ PNG图片：使用高清牌面图片，更加美观</li>
        </ul>
        
        <h4 style="color: #6dd47e; margin-top: 20px;">【拆搭原则】</h4>
        <ul style="padding-left: 20px;">
          <li>优先打孤张（无相邻牌）</li>
          <li>边张（1,2,8,9）进张效率低</li>
          <li>保留中张（3-7）和有搭子潜力的牌</li>
          <li>单张字牌优先打出</li>
          <li>对子和刻子要保留</li>
        </ul>
        
        <h4 style="color: #6dd47e; margin-top: 20px;">【评分标准】</h4>
        <ul style="padding-left: 20px; list-style: none;">
          <li>💯 100分：选择最优解</li>
          <li>⭐ 80分：前三名选择</li>
          <li>👍 60分：合理选择</li>
          <li>😐 40分：次优选择</li>
          <li>😢 20分：较差选择</li>
        </ul>
        
        <h4 style="color: #6dd47e; margin-top: 20px;">【等级系统】</h4>
        <ul style="padding-left: 20px; list-style: none;">
          <li>🏆 平均分90+：大师</li>
          <li>⭐ 平均分80+：高手</li>
          <li>💎 平均分70+：熟练</li>
          <li>🎯 平均分60+：进阶</li>
          <li>📖 其他：入门</li>
        </ul>
        
        <p style="text-align: center; color: #6dd47e; font-weight: bold; margin-top: 20px;">
          加油练习，成为麻将高手！💪
        </p>
      </div>
    `;
    
    await showHelp(helpContent, '💡 游戏帮助');
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  window.app = new MajiangTrainingApp();
  console.log('🀄 武汉麻将拆搭训练系统已启动');
});
