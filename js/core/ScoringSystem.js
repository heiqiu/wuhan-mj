// ScoringSystem.js - 评分系统
class ScoringSystem {
  constructor() {
    this.weights = {
      correctChoice: 100,
      topThree: 80,
      reasonable: 60,
      suboptimal: 40,
      poor: 20
    };
  }
  
  /**
   * 评分用户的打牌选择
   */
  scoreChoice(userChoice, bestSolution, alternatives) {
    const result = {
      score: 0,
      rank: 0,
      feedback: '',
      improvement: [],
      comparison: null // 添加详细对比
    };
    
    // 找到用户选择的牌效评分
    const userAlternative = alternatives.find(alt => alt.tile === userChoice);
    const userTileScore = userAlternative ? userAlternative.score : Infinity;
    
    // 计算并列排名：找出有多少张牌的评分比用户选择的牌更低（更优）
    // 评分越低越优，所以要统计score < userTileScore的牌的数量
    const betterTilesCount = alternatives.filter(alt => alt.score < userTileScore).length;
    result.rank = betterTilesCount + 1;
    
    // 检查是否有并列排名
    const sameTilesCount = alternatives.filter(alt => 
      alt.score === userTileScore && alt.tile !== userChoice
    ).length;
    result.isTied = sameTilesCount > 0;
    result.tiedCount = sameTilesCount + 1; // 包括用户选择的牌
    
    // 计算分数
    if (userChoice === bestSolution.bestDiscard) {
      result.score = this.weights.correctChoice;
      result.feedback = '完美! 这是当前最优选择 🎉';
    } else if (result.rank <= 3) {
      result.score = this.weights.topThree;
      result.feedback = '不错! 这是一个合理的选择 👍';
      result.improvement.push(`最优解是打 ${TileUtils.getTileText(bestSolution.bestDiscard)}: ${bestSolution.reason}`);
    } else if (result.rank <= 5) {
      result.score = this.weights.reasonable;
      result.feedback = '还可以,但有更好的选择 🤔';
      result.improvement.push(`建议打 ${TileUtils.getTileText(bestSolution.bestDiscard)}: ${bestSolution.reason}`);
    } else if (result.rank <= 8) {
      result.score = this.weights.suboptimal;
      result.feedback = '次优选择,需要加强拆搭判断 📚';
      result.improvement = this.generateImprovementSuggestions(
        userChoice, 
        bestSolution, 
        alternatives
      );
    } else {
      result.score = this.weights.poor;
      result.feedback = '选择欠佳,请仔细分析牌效 ⚠️';
      result.improvement = this.generateImprovementSuggestions(
        userChoice,
        bestSolution,
        alternatives
      );
    }
    
    // 生成详细对比（如果有详细分析数据）
    if (bestSolution.detailedAnalysis) {
      result.comparison = this.generateDetailedComparison(
        userChoice, 
        bestSolution.bestDiscard, 
        bestSolution.detailedAnalysis
      );
    }
    
    return result;
  }
  
  /**
   * 生成改进建议
   */
  generateImprovementSuggestions(userChoice, bestSolution, alternatives) {
    const suggestions = [];
    
    suggestions.push(`最优打法: ${TileUtils.getTileText(bestSolution.bestDiscard)} - ${bestSolution.reason}`);
    
    // 比较用户选择与最优选择的差距
    const userScore = alternatives.find(a => a.tile === userChoice)?.score || 0;
    const bestScore = bestSolution.score;
    const scoreDiff = Math.abs(userScore - bestScore);
    
    if (scoreDiff > 50) {
      suggestions.push('差距较大,建议重点学习孤张识别和搭子保留原则');
    } else if (scoreDiff > 30) {
      suggestions.push('注意边张和中张的进张效率差异');
    } else {
      suggestions.push('选择已经比较接近最优,继续保持');
    }
    
    // 展示前三名选择
    suggestions.push('推荐打法:');
    alternatives.slice(0, 3).forEach((alt, idx) => {
      suggestions.push(`${idx + 1}. ${TileUtils.getTileText(alt.tile)} (评分: ${alt.score.toFixed(1)})`);
    });
    
    return suggestions;
  }
  
  /**
   * 生成详细的牌效对比（融合武汉麻将技巧）
   */
  generateDetailedComparison(userChoice, bestChoice, detailedAnalysis) {
    const userAnalysis = detailedAnalysis[userChoice];
    const bestAnalysis = detailedAnalysis[bestChoice];
      
    if (!userAnalysis || !bestAnalysis) {
      return null;
    }
      
    const comparison = {
      summary: '',
      details: [],
      tips: [], // 添加技巧提示
      conclusion: ''
    };
      
    // 生成总结
    if (userChoice === bestChoice) {
      comparison.summary = '🎉 你的选择与最优解一致！';
    } else {
      comparison.summary = `🔍 对比分析: ${TileUtils.getTileText(userChoice)} vs ${TileUtils.getTileText(bestChoice)}`;
    }
      
    // 详细对比各项指标
      
    // 1. 向听数对比
    if (userAnalysis.shanten !== bestAnalysis.shanten) {
      const diff = userAnalysis.shanten - bestAnalysis.shanten;
      if (diff > 0) {
        comparison.details.push(`⚠️ 向听数: 你的选择${userAnalysis.shanten}向听，最优解${bestAnalysis.shanten}向听，相差${diff}张`);
        comparison.tips.push('▶ 听牌口诀:"早听要听好、晚听要听早" - 尽量减少向听数');
      } else {
        comparison.details.push(`✅ 向听数: 两者都是${userAnalysis.shanten}向听`);
      }
    } else {
      comparison.details.push(`✅ 向听数: 两者相同，均为${userAnalysis.shanten}向听`);
    }
    
    // 2. 进张数对比（听牌效率）
    if (userAnalysis.waitingTiles !== bestAnalysis.waitingTiles) {
      const diff = bestAnalysis.waitingTiles - userAnalysis.waitingTiles;
      if (diff > 0) {
        // 生成进张列表
        const userWaitingText = this.formatWaitingTiles(userAnalysis.waitingTilesList);
        const bestWaitingText = this.formatWaitingTiles(bestAnalysis.waitingTilesList);
            
        comparison.details.push(
          `⚠️ 进张效率: 你的选择有${userAnalysis.waitingTiles}种有效进张，最优解有${bestAnalysis.waitingTiles}种，多${diff}种`
        );
        comparison.details.push(`  • 你的进张: ${userWaitingText}`);
        comparison.details.push(`  • 最优进张: ${bestWaitingText}`);
        comparison.tips.push('▶ 拆搭原则:"拆小不拆大" - 优先拆掉进张少的搭子，保留进张多的搭子');
      } else if (diff < 0) {
        const userWaitingText = this.formatWaitingTiles(userAnalysis.waitingTilesList);
        comparison.details.push(`✅ 进张效率: 你的选择更优，有${userAnalysis.waitingTiles}种有效进张`);
        comparison.details.push(`  • 进张列表: ${userWaitingText}`);
      } else {
        const userWaitingText = this.formatWaitingTiles(userAnalysis.waitingTilesList);
        comparison.details.push(`✅ 进张效率: 两者相同，均有${userAnalysis.waitingTiles}种有效进张`);
        comparison.details.push(`  • 进张列表: ${userWaitingText}`);
      }
    } else {
      const userWaitingText = this.formatWaitingTiles(userAnalysis.waitingTilesList);
      comparison.details.push(`✅ 进张效率: 两者相同，均有${userAnalysis.waitingTiles}种有效进张`);
      if (userWaitingText) {
        comparison.details.push(`  • 进张列表: ${userWaitingText}`);
      }
    }
    
    // 3. 搭子数对比
    if (userAnalysis.partnerships !== bestAnalysis.partnerships) {
      const diff = bestAnalysis.partnerships - userAnalysis.partnerships;
      if (diff > 0) {
        comparison.details.push(`⚠️ 搭子数量: 你的选择有${userAnalysis.partnerships}个搭子，最优解有${bestAnalysis.partnerships}个，多${diff}个`);
        comparison.tips.push('▶ 五搭黄金法则:胡牌只需要五搭牌，超过五搭必须立即拆搭');
      } else {
        comparison.details.push(`✅ 搭子数量: 两者相当`);
      }
    }
    
    // 4. 孤张数对比
    if (userAnalysis.isolatedCount !== bestAnalysis.isolatedCount) {
      const diff = userAnalysis.isolatedCount - bestAnalysis.isolatedCount;
      if (diff > 0) {
        comparison.details.push(`⚠️ 孤张数量: 你的选择有${userAnalysis.isolatedCount}个孤张，最优解有${bestAnalysis.isolatedCount}个，多${diff}个`);
        comparison.tips.push('▶ 孤张处理:孤张优先打出，留牌价值低，无法组成搭子');
      } else {
        comparison.details.push(`✅ 孤张数量: 你的选择更好，孤张更少`);
      }
    }
    
    // 5. 牌型质量对比
    const qualityDiff = bestAnalysis.handQuality - userAnalysis.handQuality;
    if (qualityDiff > 10) {
      comparison.details.push(`⚠️ 牌型质量: 最优解牌型质量更高（${bestAnalysis.handQuality.toFixed(0)} vs ${userAnalysis.handQuality.toFixed(0)}）`);
      comparison.tips.push('▶ 拆搭口诀:“边卡先拆、两面为王、对子多余、早拆不慥”');
    } else if (qualityDiff < -10) {
      comparison.details.push(`✅ 牌型质量: 你的选择牌型质量更高`);
    } else {
      comparison.details.push(`✅ 牌型质量: 两者相当`);
    }
    
    // 生成结论
    if (userChoice === bestChoice) {
      comparison.conclusion = '你的判断非常准确！继续保持！';
    } else {
      const majorDiffs = comparison.details.filter(d => d.startsWith('⚠️')).length;
      if (majorDiffs >= 3) {
        comparison.conclusion = '最优解在多个方面都更优，建议重点学习拆搭原则:“拆小不拆大、拆边不拆卡、拆对不拆嵌”';
      } else if (majorDiffs >= 2) {
        comparison.conclusion = '最优解在部分方面更优，注意听牌口选择:“多口听一条线”，提升50%概率';
      } else {
        comparison.conclusion = '两者差异不大，你的选择也是合理的，继续保持';
      }
    }
    
    return comparison;
  }
  
  /**
   * 格式化进张列表，显示具体牌名
   */
  formatWaitingTiles(waitingTilesList) {
    if (!waitingTilesList || waitingTilesList.length === 0) {
      return '无';
    }
    
    // 按改善程度排序（降序）
    const sorted = [...waitingTilesList].sort((a, b) => b.improvement - a.improvement);
    
    // 按花色分组
    const grouped = {
      wan: [],
      tong: [],
      tiao: [],
      feng: []
    };
    
    sorted.forEach(item => {
      const suit = TileUtils.getTileSuit(item.tile);
      if (grouped[suit]) {
        grouped[suit].push(item.tile);
      }
    });
    
    // 生成文本
    const parts = [];
    if (grouped.wan.length > 0) {
      parts.push(grouped.wan.map(t => TileUtils.getTileText(t)).join('、'));
    }
    if (grouped.tong.length > 0) {
      parts.push(grouped.tong.map(t => TileUtils.getTileText(t)).join('、'));
    }
    if (grouped.tiao.length > 0) {
      parts.push(grouped.tiao.map(t => TileUtils.getTileText(t)).join('、'));
    }
    if (grouped.feng.length > 0) {
      parts.push(grouped.feng.map(t => TileUtils.getTileText(t)).join('、'));
    }
    
    return parts.join(' | ');
  }
  
  /**
   * 计算训练会话总分
   */
  calculateSessionScore(rounds) {
    if (rounds.length === 0) {
      return {
        totalScore: 0,
        averageScore: 0,
        averageTime: 0,
        level: { level: '未开始', color: '#999' },
        improvement: '暂无数据'
      };
    }
    
    const totalScore = rounds.reduce((sum, round) => sum + round.score, 0);
    const avgScore = totalScore / rounds.length;
    const avgTime = rounds.reduce((sum, r) => sum + r.timeSpent, 0) / rounds.length;
    
    return {
      totalScore,
      averageScore: avgScore,
      averageTime: avgTime,
      level: this.determineLevel(avgScore),
      improvement: this.analyzeImprovement(rounds)
    };
  }
  
  /**
   * 判定水平等级
   */
  determineLevel(avgScore) {
    if (avgScore >= 90) return { level: '大师 🏆', color: '#FFD700' };
    if (avgScore >= 80) return { level: '高手 ⭐', color: '#9B59B6' };
    if (avgScore >= 70) return { level: '熟练 💎', color: '#3498DB' };
    if (avgScore >= 60) return { level: '进阶 🎯', color: '#2ECC71' };
    return { level: '入门 📖', color: '#95A5A6' };
  }
  
  /**
   * 分析进步趋势
   */
  analyzeImprovement(rounds) {
    if (rounds.length < 5) return '数据不足,继续训练';
    
    const recentAvg = rounds.slice(-5).reduce((sum, r) => sum + r.score, 0) / 5;
    const earlyAvg = rounds.slice(0, 5).reduce((sum, r) => sum + r.score, 0) / 5;
    
    const improvement = recentAvg - earlyAvg;
    
    if (improvement > 10) return '进步显著 📈';
    if (improvement > 0) return '稳步提升 ↗️';
    if (improvement > -5) return '基本稳定 →';
    return '需要加强练习 📚';
  }
}
