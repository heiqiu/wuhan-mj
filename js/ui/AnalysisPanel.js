// AnalysisPanel.js - 分析结果面板
class AnalysisPanel {
  constructor(panelElement) {
    this.panel = panelElement;
  }
  
  /**
   * 显示分析结果
   */
  show(roundData) {
    const { userDiscard, bestDiscard, score, scoreResult, bestSolution } = roundData;
    
    // 显示面板
    this.panel.classList.remove('hidden');
    
    // 更新得分
    document.getElementById('score-value').textContent = score;
    document.getElementById('score-feedback').textContent = scoreResult.feedback;
    
    // 更新得分圆圈颜色
    const scoreCircle = document.getElementById('score-circle');
    if (score >= 90) {
      scoreCircle.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
    } else if (score >= 70) {
      scoreCircle.style.background = 'linear-gradient(135deg, #2c5f2d, #97ce4c)';
    } else if (score >= 50) {
      scoreCircle.style.background = 'linear-gradient(135deg, #3498DB, #5DADE2)';
    } else {
      scoreCircle.style.background = 'linear-gradient(135deg, #E74C3C, #EC7063)';
    }
    
    // 显示用户选择
    const userChoiceTile = document.getElementById('user-choice-tile');
    userChoiceTile.innerHTML = '';
    const userTileEl = this.createTileElement(userDiscard);
    userChoiceTile.appendChild(userTileEl);
    
    document.getElementById('user-choice-rank').textContent = 
      `排名: 第 ${scoreResult.rank} 位`;
    
    // 显示最优选择
    const bestChoiceTile = document.getElementById('best-choice-tile');
    bestChoiceTile.innerHTML = '';
    const bestTileEl = this.createTileElement(bestDiscard);
    bestChoiceTile.appendChild(bestTileEl);
    
    document.getElementById('best-choice-reason').textContent = bestSolution.reason;
    
    // 显示规则检查(如果有)
    if (bestSolution.ruleChecks && bestSolution.ruleChecks.length > 0) {
      this.renderRuleChecks(bestSolution.ruleChecks);
    }
    
    // 显示所有备选方案
    this.renderAlternatives(bestSolution.alternatives);
    
    // 显示改进建议
    this.renderImprovements(scoreResult.improvement);
  }
  
  /**
   * 渲染规则检查
   */
  renderRuleChecks(checks) {
    // 在改进建议之前显示规则检查
    const improvementSection = document.querySelector('.improvement-section');
    let ruleSection = document.getElementById('rule-checks-section');
    
    // 如果不存在，创建该节
    if (!ruleSection) {
      ruleSection = document.createElement('div');
      ruleSection.id = 'rule-checks-section';
      ruleSection.className = 'rule-checks-section';
      ruleSection.style.marginBottom = '20px';
      ruleSection.style.padding = '15px';
      ruleSection.style.background = '#f8f9fa';
      ruleSection.style.borderRadius = '8px';
      
      const title = document.createElement('h3');
      title.textContent = '🎯 规则提示';
      title.style.marginBottom = '10px';
      ruleSection.appendChild(title);
      
      const list = document.createElement('div');
      list.id = 'rule-checks-list';
      ruleSection.appendChild(list);
      
      improvementSection.parentNode.insertBefore(ruleSection, improvementSection);
    }
    
    // 更新规则检查列表
    const list = document.getElementById('rule-checks-list');
    list.innerHTML = '';
    
    checks.forEach(check => {
      const item = document.createElement('div');
      item.style.marginBottom = '8px';
      item.style.padding = '10px';
      item.style.borderRadius = '4px';
      
      // 根据类型设置颜色
      if (check.type === 'warning') {
        item.style.background = '#fff3cd';
        item.style.borderLeft = '4px solid #ffc107';
        item.innerHTML = `<strong>⚠️ ${check.rule}:</strong> ${check.message}`;
      } else if (check.type === 'success') {
        item.style.background = '#d4edda';
        item.style.borderLeft = '4px solid #28a745';
        item.innerHTML = `<strong>✅ ${check.rule}:</strong> ${check.message}`;
      } else {
        item.style.background = '#d1ecf1';
        item.style.borderLeft = '4px solid #17a2b8';
        item.innerHTML = `<strong>ℹ️ ${check.rule}:</strong> ${check.message}`;
      }
      
      list.appendChild(item);
    });
  }
  
  /**
   * 隐藏面板
   */
  hide() {
    this.panel.classList.add('hidden');
    
    // 清除规则检查节
    const ruleSection = document.getElementById('rule-checks-section');
    if (ruleSection) {
      ruleSection.remove();
    }
  }
  
  /**
   * 渲染备选方案列表
   */
  renderAlternatives(alternatives) {
    const list = document.getElementById('alternatives-list');
    list.innerHTML = '';
    
    alternatives.forEach((alt, index) => {
      const item = document.createElement('div');
      item.className = 'alternative-item';
      
      const rank = document.createElement('span');
      rank.className = 'alternative-rank';
      rank.textContent = `${index + 1}.`;
      
      const tile = this.createTileElement(alt.tile);
      tile.className = 'tile alternative-tile';
      
      const tileText = document.createElement('span');
      tileText.textContent = TileUtils.getTileText(alt.tile);
      tileText.style.fontWeight = 'bold';
      tileText.style.marginLeft = '10px';
      
      const score = document.createElement('span');
      score.className = 'alternative-score';
      score.textContent = `评分: ${alt.score.toFixed(1)}`;
      
      item.appendChild(rank);
      item.appendChild(tile);
      item.appendChild(tileText);
      item.appendChild(score);
      
      list.appendChild(item);
    });
  }
  
  /**
   * 渲染改进建议
   */
  renderImprovements(improvements) {
    const list = document.getElementById('improvement-list');
    list.innerHTML = '';
    
    improvements.forEach(improvement => {
      const li = document.createElement('li');
      li.textContent = improvement;
      list.appendChild(li);
    });
  }
  
  /**
   * 创建牌元素
   */
  createTileElement(tile) {
    const div = document.createElement('div');
    div.className = 'tile';
    div.dataset.tile = tile;
    div.dataset.suit = TileUtils.getTileSuit(tile);
    
    // 使用PNG图片
    div.style.backgroundImage = `url(assets/tiles/${tile}.png)`;
    div.style.backgroundSize = 'cover';
    div.style.backgroundPosition = 'center';
    
    // 备用文字
    div.setAttribute('data-text', TileUtils.getTileText(tile));
    
    return div;
  }
}
