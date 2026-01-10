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
      improvement: []
    };
    
    // 找到用户选择的排名
    result.rank = alternatives.findIndex(alt => alt.tile === userChoice) + 1;
    
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
