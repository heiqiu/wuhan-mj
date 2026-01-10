// TileAnalyzer.js - 牌型分析器(核心算法)
class TileAnalyzer {
  constructor(piziTiles = null, laiziTiles = null) {
    this.piziTiles = piziTiles;
    this.laiziTiles = laiziTiles;
  }
  
  /**
   * 找出最佳打法
   * @param {Array} hand - 14张手牌
   * @param {Object} gameContext - 游戏上下文(是否开口、皮子、赖子等)
   * @returns {Object} {bestDiscard, score, alternatives, reason}
   */
  findBestDiscard(hand, gameContext = {}) {
    const { hasOpened = false, piziTiles = this.piziTiles, laiziTiles = this.laiziTiles } = gameContext;
    const uniqueTiles = [...new Set(hand)];
    const candidates = {};
    
    // 对每张牌进行评估
    uniqueTiles.forEach(tile => {
      const score = this.evaluateDiscardValue(tile, hand, piziTiles, laiziTiles, hasOpened);
      candidates[tile] = score;
    });
    
    // 找出评分最低的牌(最佳打出)
    let bestDiscard = null;
    let minScore = Infinity;
    
    for (let tile in candidates) {
      if (candidates[tile] < minScore) {
        minScore = candidates[tile];
        bestDiscard = tile;
      }
    }
    
    return {
      bestDiscard,
      score: minScore,
      alternatives: this.getSortedDiscards(candidates),
      reason: this.explainDiscard(bestDiscard, hand, piziTiles, laiziTiles),
      ruleChecks: this.checkGameRules(hand, piziTiles, laiziTiles, hasOpened)
    };
  }
  
  /**
   * 评估打出某张牌的价值
   * 分数越低越应该打出
   */
  evaluateDiscardValue(tile, hand, piziTiles, laiziTiles, hasOpened) {
    let score = 0;
    
    // 特殊规则处理
    
    // 1. 红中和皮子规则: 可作万能牌，但不是必须打出（修正！）
    if (tile === 'zhong' || MajiangRules.isPizi(tile, piziTiles)) {
      // 皮子/红中可以保留作万能牌
      const handQuality = this.evaluateHandQuality(hand, piziTiles, laiziTiles);
      if (handQuality > 50) {
        score += 50; // 手牌好时保留皮子/红中
      } else {
        score -= 20; // 手牌差时可以打掉
      }
    }
    
    // 2. 赖子规则
    if (MajiangRules.isLaizi(tile, laiziTiles)) {
      const laiziCount = MajiangRules.countLaizi(hand, laiziTiles);
      
      // 两个赖子不能胡小胡,必须打掉一个
      if (laiziCount >= 2) {
        return -800; // 次高优先级打出
      }
      
      // 单张赖子可以当万能牌,但硬胡更好(×2),需要评估
      // 如果手牌已经很好,可以保留赖子
      const handQuality = this.evaluateHandQuality(hand, piziTiles, laiziTiles);
      if (handQuality > 50) {
        score += 100; // 手牌好时保留赖子
      } else {
        score -= 50; // 手牌差时可以打掉
      }
    }
    
    // 3. 判断是否孤张(无相邻牌)
    const isIsolated = this.isIsolatedTile(tile, hand, piziTiles, laiziTiles);
    if (isIsolated) {
      score -= 50; // 孤张优先打出
    }
    
    // 4. 计算能形成搭子的潜力
    const partialPotential = this.calculatePartialPotential(tile, hand, piziTiles, laiziTiles);
    score += partialPotential * 30;
    
    // 5. 字牌/风牌额外惩罚
    const parsed = TileUtils.parseTile(tile);
    if (parsed.suit === 'feng' && tile !== 'zhong') {
      score -= 30;
      // 字牌如果有对子,加分(保留)
      const pairCount = hand.filter(t => t === tile).length;
      if (pairCount >= 2) {
        score += 40;
      }
    }
    
    // 6. 边张(1,2,8,9)惩罚
    if (this.isEdgeTile(tile)) {
      score -= 20;
    }
    
    // 7. 中张(3-7)加分(保留)
    if (this.isMiddleTile(tile)) {
      score += 25;
    }
    
    // 8. 检查是否有对子/刻子
    const tileCount = hand.filter(t => t === tile).length;
    if (tileCount >= 2) {
      score += 30; // 对子优先保留
    }
    if (tileCount >= 3) {
      score += 50; // 刻子更要保留
    }
    
    // 9. 检查能否组成顺子
    const sequencePotential = this.checkSequencePotential(tile, hand, piziTiles, laiziTiles);
    score += sequencePotential * 20;
    
    // 10. 将牌规则: 2、5、8更有价值(小胡必须是258将)
    if (MajiangRules.is258Jiang(tile)) {
      score += 15;
    }
    
    return score;
  }
  
  /**
   * 判断是否孤张(无相邻牌)
   */
  isIsolatedTile(tile, hand, piziTiles, laiziTiles) {
    // 红中和皮子总是孤立的
    if (tile === 'zhong' || MajiangRules.isPizi(tile, piziTiles)) {
      return true;
    }
    
    // 赖子是万能牌,不算孤张
    if (MajiangRules.isLaizi(tile, laiziTiles)) {
      return false;
    }
    
    const parsed = TileUtils.parseTile(tile);
    if (parsed.suit === 'feng') {
      // 字牌只看对子
      return hand.filter(t => t === tile).length === 1;
    }
    
    const suit = parsed.suit;
    const num = parsed.number;
    
    // 检查±1和±2位置是否有牌
    for (let offset of [-2, -1, 1, 2]) {
      const targetNum = num + offset;
      if (targetNum >= 1 && targetNum <= 9) {
        const targetTile = suit + targetNum;
        if (hand.includes(targetTile)) {
          return false;
        }
      }
    }
    
    // 检查是否有相同的牌
    if (hand.filter(t => t === tile).length > 1) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 计算能形成搭子的潜力
   */
  calculatePartialPotential(tile, hand, piziTiles, laiziTiles) {
    const parsed = TileUtils.parseTile(tile);
    if (parsed.suit === 'feng') return 0;
    
    let potential = 0;
    const suit = parsed.suit;
    const num = parsed.number;
    
    // 检查相邻牌(考虑赖子可以代替)
    for (let offset of [-2, -1, 1, 2]) {
      const targetNum = num + offset;
      if (targetNum >= 1 && targetNum <= 9) {
        const targetTile = suit + targetNum;
        if (hand.includes(targetTile)) {
          potential++;
        }
        // 如果有赖子,可以增加潜力
        const laiziCount = MajiangRules.countLaizi(hand, laiziTiles);
        if (laiziCount > 0 && !MajiangRules.isLaizi(targetTile, laiziTiles)) {
          potential += 0.5;
        }
      }
    }
    
    return potential;
  }
  
  /**
   * 检查顺子潜力
   */
  checkSequencePotential(tile, hand, piziTiles, laiziTiles) {
    const parsed = TileUtils.parseTile(tile);
    if (parsed.suit === 'feng') return 0;
    
    let potential = 0;
    const suit = parsed.suit;
    const num = parsed.number;
    
    // 检查是否已经形成顺子
    if (num >= 1 && num <= 7) {
      if (hand.includes(suit + (num + 1)) && hand.includes(suit + (num + 2))) {
        potential += 3;
      }
    }
    if (num >= 2 && num <= 8) {
      if (hand.includes(suit + (num - 1)) && hand.includes(suit + (num + 1))) {
        potential += 3;
      }
    }
    if (num >= 3 && num <= 9) {
      if (hand.includes(suit + (num - 2)) && hand.includes(suit + (num - 1))) {
        potential += 3;
      }
    }
    
    return potential;
  }
  
  /**
   * 是否边张(1,2,8,9)
   */
  isEdgeTile(tile) {
    const parsed = TileUtils.parseTile(tile);
    if (parsed.suit === 'feng') return false;
    return [1, 2, 8, 9].includes(parsed.number);
  }
  
  /**
   * 是否中张(3-7)
   */
  isMiddleTile(tile) {
    const parsed = TileUtils.parseTile(tile);
    if (parsed.suit === 'feng') return false;
    return parsed.number >= 3 && parsed.number <= 7;
  }
  
  /**
   * 排序所有打法选项
   */
  getSortedDiscards(candidates) {
    return Object.entries(candidates)
      .sort((a, b) => a[1] - b[1])
      .map(([tile, score]) => ({ tile, score }));
  }
  
  /**
   * 解释为什么打这张牌
   */
  explainDiscard(tile, hand, piziTiles, laiziTiles) {
    const reasons = [];
    
    // 特殊规则检查
    if (tile === 'zhong') {
      reasons.push('红中(皮子):可作万能牌，根据手牌情况决定是否打出');
      return reasons.join('; ');
    }
    
    if (MajiangRules.isPizi(tile, piziTiles)) {
      reasons.push('皮子:可作万能牌，根据手牌情况决定是否打出');
      return reasons.join('; ');
    }
    
    if (MajiangRules.isLaizi(tile, laiziTiles)) {
      const laiziCount = MajiangRules.countLaizi(hand, laiziTiles);
      if (laiziCount >= 2) {
        reasons.push('赖子规则:两个赖子不能胡小胡,必须打掉一个');
        return reasons.join('; ');
      }
    }
    
    if (this.isIsolatedTile(tile, hand, piziTiles, laiziTiles)) {
      reasons.push('孤张,无法组成搭子');
    }
    
    if (this.isEdgeTile(tile)) {
      reasons.push('边张,进张效率低');
    }
    
    const parsed = TileUtils.parseTile(tile);
    if (parsed.suit === 'feng') {
      const count = hand.filter(t => t === tile).length;
      if (count === 1) {
        reasons.push('单张字牌,难以组合');
      }
    }
    
    const potential = this.calculatePartialPotential(tile, hand, piziTiles, laiziTiles);
    if (potential === 0) {
      reasons.push('无相邻牌,留牌价值低');
    }
    
    if (reasons.length === 0) {
      reasons.push('相比其他牌,此牌留牌价值较低');
    }
    
    return reasons.join('; ');
  }
  
  /**
   * 分析手牌结构(用于显示详细信息)
   */
  analyzeHandStructure(hand) {
    const tileGroups = {};
    hand.forEach(tile => {
      tileGroups[tile] = (tileGroups[tile] || 0) + 1;
    });
    
    const pairs = [];
    const triplets = [];
    const singles = [];
    
    for (let tile in tileGroups) {
      const count = tileGroups[tile];
      if (count >= 3) {
        triplets.push(tile);
      } else if (count === 2) {
        pairs.push(tile);
      } else {
        singles.push(tile);
      }
    }
    
    return {
      pairs,
      triplets,
      singles,
      tileGroups
    };
  }
  
  /**
   * 检查游戏规则(红中、皮子、赖子、开口)
   */
  checkGameRules(hand, piziTiles, laiziTiles, hasOpened) {
    const checks = [];
    
    // 1. 检查红中
    const hasZhong = MajiangRules.hasZhong(hand);
    if (hasZhong) {
      checks.push({
        type: 'info',
        rule: '红中规则(皮子)',
        message: '手牌中有红中(皮子)，可作万能牌使用，也可选择杠牌重新摸牌'
      });
    }
    
    // 2. 检查皮子
    const piziCount = MajiangRules.countPizi(hand, piziTiles);
    if (piziCount > 0) {
      const piziNames = hand.filter(t => MajiangRules.isPizi(t, piziTiles))
        .map(t => TileUtils.getTileText(t))
        .join('、');
      checks.push({
        type: 'info',
        rule: '皮子规则',
        message: `手牌中有${piziCount}张皮子(${piziNames})，可作万能牌使用，也可选择杠牌重新摸牌`
      });
    }
    
    // 3. 检查赖子数量
    const laiziCount = MajiangRules.countLaizi(hand, laiziTiles);
    if (laiziCount >= 2) {
      checks.push({
        type: 'warning',
        rule: '赖子规则',
        message: `手牌中有${laiziCount}张赖子，不能胡小胡，建议打掉一张`
      });
    } else if (laiziCount === 1) {
      checks.push({
        type: 'info',
        rule: '赖子规则',
        message: '有一张赖子可作万能牌(软胡×1)，或硬胡(×2)'
      });
    }
    
    // 4. 检查开口状态
    if (!hasOpened) {
      checks.push({
        type: 'info',
        rule: '开口规则',
        message: '尚未开口，需要吃、碰或杠才能胡牌'
      });
    } else {
      checks.push({
        type: 'success',
        rule: '开口规则',
        message: '已开口，可以胡牌'
      });
    }
    
    return checks;
  }
  
  /**
   * 评估手牌质量(0-100分)
   */
  evaluateHandQuality(hand, piziTiles, laiziTiles) {
    let quality = 50; // 基础分
    
    const structure = this.analyzeHandStructure(hand);
    
    // 刻子加分
    quality += structure.triplets.length * 15;
    
    // 对子加分
    quality += structure.pairs.length * 10;
    
    // 孤张减分
    quality -= structure.singles.length * 3;
    
    // 检查顺子数量
    const sequences = this.countSequences(hand);
    quality += sequences * 12;
    
    // 258将牌加分
    structure.pairs.forEach(tile => {
      if (MajiangRules.is258Jiang(tile)) {
        quality += 5;
      }
    });
    
    return Math.max(0, Math.min(100, quality));
  }
  
  /**
   * 统计顺子数量
   */
  countSequences(hand) {
    let count = 0;
    const suits = ['wan', 'tong', 'tiao'];
    
    suits.forEach(suit => {
      const suitTiles = hand
        .filter(t => t.startsWith(suit))
        .map(t => TileUtils.parseTile(t).number)
        .sort((a, b) => a - b);
      
      const unique = [...new Set(suitTiles)];
      for (let i = 0; i < unique.length - 2; i++) {
        if (unique[i+1] === unique[i] + 1 && unique[i+2] === unique[i] + 2) {
          count++;
        }
      }
    });
    
    return count;
  }
}
