// HistoryPanel.js - 历史记录面板
class HistoryPanel {
  constructor(panelElement) {
    this.panel = panelElement;
  }
  
  /**
   * 显示历史记录
   */
  show(sessionData, stats) {
    this.panel.classList.remove('hidden');
    
    // 更新统计信息
    document.getElementById('rounds-count').textContent = sessionData.rounds.length;
    document.getElementById('history-avg-score').textContent = 
      stats.averageScore ? stats.averageScore.toFixed(1) : '--';
    document.getElementById('history-avg-time').textContent = 
      stats.averageTime ? stats.averageTime.toFixed(1) : '--';
    document.getElementById('current-level').textContent = stats.level.level;
    document.getElementById('current-level').style.color = stats.level.color;
    
    // 渲染历史记录列表
    this.renderRounds(sessionData.rounds);
  }
  
  /**
   * 隐藏面板
   */
  hide() {
    this.panel.classList.add('hidden');
  }
  
  /**
   * 渲染历史记录列表
   */
  renderRounds(rounds) {
    const list = document.getElementById('rounds-list');
    list.innerHTML = '';
    
    if (rounds.length === 0) {
      list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">暂无训练记录</p>';
      return;
    }
    
    // 倒序显示(最新的在前)
    const reversedRounds = [...rounds].reverse();
    
    reversedRounds.forEach((round, index) => {
      const item = document.createElement('div');
      item.className = 'round-item';
      
      const header = document.createElement('div');
      header.className = 'round-header';
      
      const roundNum = document.createElement('span');
      roundNum.textContent = `第 ${rounds.length - index} 轮`;
      
      const score = document.createElement('span');
      score.className = 'round-score';
      score.textContent = `${round.score} 分`;
      
      header.appendChild(roundNum);
      header.appendChild(score);
      
      const details = document.createElement('div');
      details.className = 'round-details';
      
      const userChoice = document.createElement('span');
      userChoice.textContent = `打出: ${TileUtils.getTileText(round.userDiscard)}`;
      
      const bestChoice = document.createElement('span');
      bestChoice.textContent = `最优: ${TileUtils.getTileText(round.bestDiscard)}`;
      
      const time = document.createElement('span');
      time.textContent = `用时: ${round.timeSpent.toFixed(1)}秒`;
      
      details.appendChild(userChoice);
      details.appendChild(bestChoice);
      details.appendChild(time);
      
      item.appendChild(header);
      item.appendChild(details);
      
      list.appendChild(item);
    });
  }
}
