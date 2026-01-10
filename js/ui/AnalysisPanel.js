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
    
    // 显示牌型模式识别（如果有）
    if (bestSolution.patterns && bestSolution.patterns.length > 0) {
      this.renderPatterns(bestSolution.patterns);
    }
    
    // 显示详细对比（如果有）
    if (scoreResult.comparison) {
      this.renderComparison(scoreResult.comparison);
    }
    
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
      ruleSection.style.background = 'rgba(30, 30, 30, 0.6)'; // 暗色背景
      ruleSection.style.borderRadius = '8px';
      ruleSection.style.border = '1px solid rgba(109, 212, 126, 0.2)';
      
      const title = document.createElement('h3');
      title.textContent = '🎯 规则提示';
      title.style.marginBottom = '10px';
      title.style.color = '#6dd47e'; // 亮色标题
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
      item.style.padding = '12px';
      item.style.borderRadius = '6px';
      item.style.color = '#e8e8e8'; // 亮色文字
      item.style.fontSize = '14px';
      item.style.lineHeight = '1.6';
      
      // 根据类型设置颜色（暗色主题适配）
      if (check.type === 'warning') {
        item.style.background = 'rgba(255, 193, 7, 0.15)'; // 黄色警告背景
        item.style.borderLeft = '4px solid #ffc107';
        item.innerHTML = `<strong style="color: #ffc107;">⚠️ ${check.rule}:</strong> <span style="color: #f0f0f0;">${check.message}</span>`;
      } else if (check.type === 'success') {
        item.style.background = 'rgba(40, 167, 69, 0.15)'; // 绿色成功背景
        item.style.borderLeft = '4px solid #28a745';
        item.innerHTML = `<strong style="color: #6dd47e;">✅ ${check.rule}:</strong> <span style="color: #f0f0f0;">${check.message}</span>`;
      } else {
        item.style.background = 'rgba(23, 162, 184, 0.15)'; // 蓝色信息背景
        item.style.borderLeft = '4px solid #17a2b8';
        item.innerHTML = `<strong style="color: #5dade2;">ℹ️ ${check.rule}:</strong> <span style="color: #f0f0f0;">${check.message}</span>`;
      }
      
      list.appendChild(item);
    });
  }
  
  /**
   * 渲染牌型模式识别（举一反三）
   */
  renderPatterns(patterns) {
    // 在最优选择下方显示模式识别
    const bestChoiceSection = document.querySelector('.best-choice');
    let patternsSection = document.getElementById('patterns-section');
    
    // 如果不存在，创建该节
    if (!patternsSection) {
      patternsSection = document.createElement('div');
      patternsSection.id = 'patterns-section';
      patternsSection.className = 'patterns-section';
      patternsSection.style.marginTop = '16px';
      patternsSection.style.marginBottom = '16px';
      patternsSection.style.padding = '16px';
      patternsSection.style.background = 'rgba(30, 30, 30, 0.5)';
      patternsSection.style.borderRadius = '10px';
      patternsSection.style.border = '1px solid rgba(255, 167, 38, 0.3)';
      
      bestChoiceSection.parentNode.insertBefore(patternsSection, bestChoiceSection.nextSibling);
    }
    
    // 清空并添加内容
    patternsSection.innerHTML = '';
    
    // 标题
    const title = document.createElement('h3');
    title.textContent = '🔍 牌型模式识别（举一反三）';
    title.style.marginBottom = '12px';
    title.style.color = '#ffa726';
    title.style.fontSize = '16px';
    title.style.padding = '8px 12px';
    title.style.background = 'rgba(255, 167, 38, 0.12)';
    title.style.borderRadius = '6px';
    title.style.borderLeft = '3px solid #ffa726';
    patternsSection.appendChild(title);
    
    // 渲染每个模式
    patterns.forEach(pattern => {
      const patternCard = document.createElement('div');
      patternCard.style.marginBottom = '12px';
      patternCard.style.padding = '12px';
      patternCard.style.background = 'rgba(255, 167, 38, 0.08)';
      patternCard.style.borderRadius = '8px';
      patternCard.style.borderLeft = '3px solid #ffa726';
      
      // 规则名称
      const ruleName = document.createElement('div');
      ruleName.textContent = `📌 ${pattern.rule}`;
      ruleName.style.fontWeight = 'bold';
      ruleName.style.color = '#ffa726';
      ruleName.style.fontSize = '14px';
      ruleName.style.marginBottom = '8px';
      patternCard.appendChild(ruleName);
      
      // 描述
      const description = document.createElement('div');
      description.textContent = pattern.description;
      description.style.color = '#f0f0f0';
      description.style.fontSize = '13px';
      description.style.lineHeight = '1.6';
      description.style.marginBottom = '8px';
      patternCard.appendChild(description);
      
      // 示例
      if (pattern.example) {
        const example = document.createElement('div');
        example.textContent = `💡 ${pattern.example}`;
        example.style.color = '#ffcc80';
        example.style.fontSize = '12px';
        example.style.lineHeight = '1.5';
        example.style.fontStyle = 'italic';
        example.style.padding = '8px';
        example.style.background = 'rgba(0, 0, 0, 0.2)';
        example.style.borderRadius = '4px';
        example.style.marginTop = '6px';
        patternCard.appendChild(example);
      }
      
      patternsSection.appendChild(patternCard);
    });
  }
  
  /**
   * 渲染详细对比
   */
  renderComparison(comparison) {
    // 在最优选择下方显示详细对比
    const bestChoiceSection = document.querySelector('.best-choice');
    let comparisonSection = document.getElementById('comparison-section');
    
    // 如果不存在，创建该节
    if (!comparisonSection) {
      comparisonSection = document.createElement('div');
      comparisonSection.id = 'comparison-section';
      comparisonSection.className = 'comparison-section';
      comparisonSection.style.marginTop = '16px';
      comparisonSection.style.marginBottom = '16px';
      comparisonSection.style.padding = '16px';
      comparisonSection.style.background = 'rgba(30, 30, 30, 0.5)';
      comparisonSection.style.borderRadius = '10px';
      comparisonSection.style.border = '1px solid rgba(93, 173, 226, 0.25)';
      
      bestChoiceSection.parentNode.insertBefore(comparisonSection, bestChoiceSection.nextSibling);
    }
    
    // 清空并添加内容
    comparisonSection.innerHTML = '';
    
    // 标题
    const title = document.createElement('h3');
    title.textContent = '📊 牌效对比分析';
    title.style.marginBottom = '12px';
    title.style.color = '#5dade2';
    title.style.fontSize = '16px';
    title.style.padding = '8px 12px';
    title.style.background = 'rgba(93, 173, 226, 0.1)';
    title.style.borderRadius = '6px';
    title.style.borderLeft = '3px solid #5dade2';
    comparisonSection.appendChild(title);
    
    // 总结
    const summary = document.createElement('div');
    summary.textContent = comparison.summary;
    summary.style.marginBottom = '12px';
    summary.style.fontSize = '14px';
    summary.style.color = '#f0f0f0';
    summary.style.fontWeight = 'bold';
    summary.style.padding = '8px 12px';
    summary.style.background = 'rgba(93, 173, 226, 0.08)';
    summary.style.borderRadius = '6px';
    comparisonSection.appendChild(summary);
    
    // 详细对比
    const detailsContainer = document.createElement('div');
    detailsContainer.style.marginBottom = '12px';
    
    comparison.details.forEach(detail => {
      const item = document.createElement('div');
      item.textContent = detail;
      item.style.marginBottom = '6px';
      item.style.padding = '8px 10px';
      item.style.borderRadius = '6px';
      item.style.fontSize = '12px';
      item.style.lineHeight = '1.5';
      
      // 根据是否为警告设置背景色
      if (detail.startsWith('⚠️')) {
        item.style.background = 'rgba(255, 193, 7, 0.08)';
        item.style.borderLeft = '2px solid #ffc107';
        item.style.color = '#ffe082';
      } else {
        item.style.background = 'rgba(76, 175, 80, 0.08)';
        item.style.borderLeft = '2px solid #4caf50';
        item.style.color = '#a5d6a7';
      }
      
      detailsContainer.appendChild(item);
    });
    
    comparisonSection.appendChild(detailsContainer);
    
    // 技巧提示（如果有）
    if (comparison.tips && comparison.tips.length > 0) {
      const tipsTitle = document.createElement('h4');
      tipsTitle.textContent = '💡 实战技巧提示';
      tipsTitle.style.marginTop = '12px';
      tipsTitle.style.marginBottom = '8px';
      tipsTitle.style.color = '#ffa726';
      tipsTitle.style.fontSize = '14px';
      tipsTitle.style.padding = '6px 10px';
      tipsTitle.style.background = 'rgba(255, 167, 38, 0.1)';
      tipsTitle.style.borderRadius = '6px';
      tipsTitle.style.borderLeft = '3px solid #ffa726';
      comparisonSection.appendChild(tipsTitle);
      
      const tipsContainer = document.createElement('div');
      comparison.tips.forEach(tip => {
        const tipItem = document.createElement('div');
        tipItem.textContent = tip;
        tipItem.style.marginBottom = '6px';
        tipItem.style.padding = '8px 10px';
        tipItem.style.borderRadius = '6px';
        tipItem.style.background = 'rgba(255, 167, 38, 0.08)';
        tipItem.style.borderLeft = '2px solid #ffa726';
        tipItem.style.color = '#ffcc80';
        tipItem.style.fontSize = '12px';
        tipItem.style.lineHeight = '1.5';
        tipsContainer.appendChild(tipItem);
      });
      comparisonSection.appendChild(tipsContainer);
    }
    
    // 结论
    const conclusion = document.createElement('div');
    conclusion.textContent = '💡 ' + comparison.conclusion;
    conclusion.style.marginTop = '12px';
    conclusion.style.padding = '10px 12px';
    conclusion.style.borderRadius = '6px';
    conclusion.style.background = 'rgba(93, 173, 226, 0.12)';
    conclusion.style.color = '#5dade2';
    conclusion.style.fontSize = '13px';
    conclusion.style.fontWeight = 'bold';
    conclusion.style.textAlign = 'center';
    conclusion.style.lineHeight = '1.5';
    comparisonSection.appendChild(conclusion);
  }
  
  /**
   * 隐藏面板
   */
  hide() {
    console.log('🚪 AnalysisPanel.hide() 被调用');
    this.panel.classList.add('hidden');
    console.log('✅ 分析面板已隐藏');
    
    // 清除规则检查节
    const ruleSection = document.getElementById('rule-checks-section');
    if (ruleSection) {
      ruleSection.remove();
    }
    
    // 清除模式识别区域
    const patternsSection = document.getElementById('patterns-section');
    if (patternsSection) {
      patternsSection.remove();
    }
    
    // 清除对比区域
    const comparisonSection = document.getElementById('comparison-section');
    if (comparisonSection) {
      comparisonSection.remove();
    }
  }
  
  /**
   * 渲染备选方案列表
   */
  renderAlternatives(alternatives) {
    const list = document.getElementById('alternatives-list');
    list.innerHTML = '';
    
    // 找出最大和最小的分数用于归一化
    const scores = alternatives.map(alt => alt.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const scoreRange = maxScore - minScore;
    
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
      
      // 将原始评分转换为用户友好的显示：分数越低的牌越应该打出
      // 使用倒序映射：排名第一的（分数最低）显示100分
      let displayScore;
      if (scoreRange === 0) {
        displayScore = 50; // 所有牌分数相同
      } else {
        // 线性映射：最低分→100，最高分→0
        displayScore = 100 - ((alt.score - minScore) / scoreRange * 100);
      }
      
      const score = document.createElement('span');
      score.className = 'alternative-score';
      score.textContent = `优先级: ${displayScore.toFixed(0)}`;
      
      // 根据排名设置颜色
      if (index === 0) {
        score.style.color = '#6dd47e'; // 绿色 - 最优
      } else if (index <= 2) {
        score.style.color = '#5dade2'; // 蓝色 - 较好
      } else if (index <= 5) {
        score.style.color = '#f0f0f0'; // 白色 - 一般
      } else {
        score.style.color = '#ff8787'; // 红色 - 较差
      }
      
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
