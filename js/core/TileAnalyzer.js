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
    const detailedAnalysis = {}; // 存储每张牌的详细分析
    
    // 对每张牌进行评估
    uniqueTiles.forEach(tile => {
      const score = this.evaluateDiscardValue(tile, hand, piziTiles, laiziTiles, hasOpened);
      candidates[tile] = score;
      
      // 计算打掉这张牌后的牌效
      detailedAnalysis[tile] = this.analyzeDiscardEffect(tile, hand, piziTiles, laiziTiles);
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
    
    // 识别当前牌型中的拆搭模式
    const patterns = this.identifyPatterns(hand, piziTiles, laiziTiles);
    
    return {
      bestDiscard,
      score: minScore,
      alternatives: this.getSortedDiscards(candidates),
      reason: this.explainDiscard(bestDiscard, hand, piziTiles, laiziTiles),
      ruleChecks: this.checkGameRules(hand, piziTiles, laiziTiles, hasOpened),
      detailedAnalysis: detailedAnalysis, // 添加详细分析
      patterns: patterns // 添加模式识别
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
   * 获取边张类型（12或89）
   */
  getEdgeType(tile, hand) {
    const parsed = TileUtils.parseTile(tile);
    if (parsed.suit === 'feng') return null;
    
    const suit = parsed.suit;
    const num = parsed.number;
    
    // 检查是否形成12或89搭子
    if (num === 1 && hand.includes(suit + '2')) return '12';
    if (num === 2 && hand.includes(suit + '1')) return '12';
    if (num === 8 && hand.includes(suit + '9')) return '89';
    if (num === 9 && hand.includes(suit + '8')) return '89';
    
    return null;
  }
  
  /**
   * 获取嵌张类型（如46、357等）
   */
  getKanType(tile, hand) {
    const parsed = TileUtils.parseTile(tile);
    if (parsed.suit === 'feng') return null;
    
    const suit = parsed.suit;
    const num = parsed.number;
    
    // 检查是否形成嵌张搭子（缺中间的牌）
    if (num >= 1 && num <= 7) {
      if (hand.includes(suit + (num + 2)) && !hand.includes(suit + (num + 1))) {
        return `${num}${num+2}`; // 例如46
      }
    }
    if (num >= 3 && num <= 9) {
      if (hand.includes(suit + (num - 2)) && !hand.includes(suit + (num - 1))) {
        return `${num-2}${num}`; // 例如46
      }
    }
    
    return null;
  }
  
  /**
   * 是否有两面听潜力
   */
  hasTwoWayPotential(tile, hand) {
    const parsed = TileUtils.parseTile(tile);
    if (parsed.suit === 'feng') return false;
    
    const suit = parsed.suit;
    const num = parsed.number;
    
    // 检查是否能形成两面听（例如34听14）
    if (num >= 2 && num <= 8) {
      const hasPrev = hand.includes(suit + (num - 1));
      const hasNext = hand.includes(suit + (num + 1));
      if (hasPrev && hasNext) {
        return true; // 已经是两面听的一部分
      }
    }
    
    return false;
  }
  
  /**
   * 是否有顺子潜力
   */
  hasSequencePotential(tile, hand, piziTiles, laiziTiles) {
    const parsed = TileUtils.parseTile(tile);
    if (parsed.suit === 'feng') return false;
    
    const suit = parsed.suit;
    const num = parsed.number;
    
    // 检查相邻位置是否有牌
    for (let offset of [-2, -1, 1, 2]) {
      const targetNum = num + offset;
      if (targetNum >= 1 && targetNum <= 9) {
        const targetTile = suit + targetNum;
        if (hand.includes(targetTile)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * 获取复合搭类型（例如234、345等）
   */
  getComplexType(tile, hand) {
    const parsed = TileUtils.parseTile(tile);
    if (parsed.suit === 'feng') return null;
    
    const suit = parsed.suit;
    const num = parsed.number;
    
    // 检查是否形成三连张或更复杂的结构
    const prevPrev = num >= 3 ? hand.includes(suit + (num - 2)) : false;
    const prev = num >= 2 ? hand.includes(suit + (num - 1)) : false;
    const next = num <= 8 ? hand.includes(suit + (num + 1)) : false;
    const nextNext = num <= 7 ? hand.includes(suit + (num + 2)) : false;
    
    // 三连张复合搭
    if (prev && next) {
      if (prevPrev || nextNext) {
        return `${num-1}${num}${num+1}+`; // 例如234+
      }
      return `${num-1}${num}${num+1}`; // 例如234
    }
    
    // 两组相连搭子
    if ((prev && prevPrev) || (next && nextNext)) {
      return '相连搭子';
    }
    
    return null;
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
   * 解释为什么打这张牌（融合武汉麻将拆搭技巧）
   */
  explainDiscard(tile, hand, piziTiles, laiziTiles) {
    const reasons = [];
    const parsed = TileUtils.parseTile(tile);
    
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
    
    // 孤张判断（拆小不拆大）
    if (this.isIsolatedTile(tile, hand, piziTiles, laiziTiles)) {
      reasons.push('孤张优先打出（拆小不拆大）:无相邻牌，进张效率极低');
    }
    
    // 边张判断（拆边不拆卡）
    if (this.isEdgeTile(tile)) {
      const edgeType = this.getEdgeType(tile, hand);
      if (edgeType === '12' || edgeType === '89') {
        reasons.push(`边张搭子（${edgeType}）优先拆（拆边不拆卡）:进张只有3张，改良机会小`);
      } else {
        reasons.push('边张优先打出:进张效率低，难以成搭');
      }
    }
    
    // 对子处理（拆对不拆嵌）
    const tileCount = hand.filter(t => t === tile).length;
    if (tileCount === 2) {
      const isPair = !this.hasSequencePotential(tile, hand, piziTiles, laiziTiles);
      if (isPair) {
        if (parsed.number === 1 || parsed.number === 9) {
          reasons.push('边张对子优先拆（拆对不拆嵌）:边张对最难碰出，仅能进3张');
        } else if (parsed.suit === 'feng') {
          reasons.push('字牌对子优先拆:无法成顺，仅能进3张，效率低');
        } else {
          reasons.push('孤对优先拆（拆对不拆嵌）:对子仅能进3张，嵌张改良机会更大');
        }
      }
    }
    
    // 嵌张判断
    const kanType = this.getKanType(tile, hand);
    if (kanType) {
      reasons.push(`嵌张搭子（${kanType}）保留:虽进张少但牌池概率均匀，比边张更优`);
    }
    
    // 两面听判断
    const hasTwoWay = this.hasTwoWayPotential(tile, hand);
    if (hasTwoWay) {
      reasons.push('保留两面听搭子:可形成多面听，听牌效率高');
    }
    
    // 复合搭判断
    const complexType = this.getComplexType(tile, hand);
    if (complexType) {
      reasons.push(`复合搭优先保留（${complexType}）:多个进张方向，灵活性高`);
    }
    
    // 258将牌规则
    if (MajiangRules.is258Jiang(tile) && tileCount === 2) {
      reasons.push('258将牌保留:小胡必须是258将，提高胡牌概率');
    }
    
    // 熟张vs生张（需要牌池信息，这里简化处理）
    if (parsed.suit !== 'feng') {
      if (parsed.number >= 3 && parsed.number <= 7) {
        // 中张在中后期较危险
      } else {
        reasons.push('边张相对安全:中后期打边张点炮风险低');
      }
    }
    
    // 如果没有特定原因，给出通用建议
    if (reasons.length === 0) {
      const potential = this.calculatePartialPotential(tile, hand, piziTiles, laiziTiles);
      if (potential === 0) {
        reasons.push('无相邻牌，留牌价值低，应优先打出');
      } else {
        reasons.push('相比其他牌，此牌留牌价值较低');
      }
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
  
  /**
   * 分析打掉某张牌后的牌效
   * 返回详细的效果分析
   */
  analyzeDiscardEffect(tile, hand, piziTiles, laiziTiles) {
    // 模拟打掉这张牌
    const remainingHand = hand.filter(t => t !== tile || hand.indexOf(t) !== hand.indexOf(tile));
    const newHand = [...remainingHand].slice(0, 13); // 13张牌
    
    // 计算各项指标
    const structure = this.analyzeHandStructure(newHand);
    const sequences = this.countSequences(newHand);
    
    // 计算孤张数
    const isolatedCount = structure.singles.filter(t => 
      this.isIsolatedTile(t, newHand, piziTiles, laiziTiles)
    ).length;
    
    // 计算搭子数（对子+顺子）
    const partnerships = structure.pairs.length + sequences;
    
    // 计算进张数和具体进张列表
    const waitingInfo = this.calculateWaitingTilesDetailed(newHand, piziTiles, laiziTiles);
    
    // 计算向听数（估算）
    const shanten = this.estimateShanten(newHand, piziTiles, laiziTiles);
    
    return {
      tile: tile,
      isolatedCount: isolatedCount,        // 孤张数
      partnerships: partnerships,          // 搭子数
      sequences: sequences,                // 顺子数
      pairs: structure.pairs.length,       // 对子数
      triplets: structure.triplets.length, // 刻子数
      waitingTiles: waitingInfo.count,     // 进张数
      waitingTilesList: waitingInfo.tiles, // 进张列表（详细）
      shanten: shanten,                    // 向听数
      handQuality: this.evaluateHandQuality(newHand, piziTiles, laiziTiles) // 牌型质量
    };
  }
  
  /**
   * 计算进张数（详细版）
   * 返回能让手牌改善的牌种数和具体牌列表
   */
  calculateWaitingTilesDetailed(hand, piziTiles, laiziTiles) {
    const allPossibleTiles = TileConstants.ALL_TILES;
    const waitingTilesList = [];
    
    // 检查每种可能的牌
    allPossibleTiles.forEach(tile => {
      const testHand = [...hand, tile];
      const currentQuality = this.evaluateHandQuality(hand, piziTiles, laiziTiles);
      const newQuality = this.evaluateHandQuality(testHand, piziTiles, laiziTiles);
      
      // 如果质量明显提升，认为是有效进张
      if (newQuality > currentQuality + 5) {
        waitingTilesList.push({
          tile: tile,
          improvement: newQuality - currentQuality
        });
      }
    });
    
    return {
      count: waitingTilesList.length,
      tiles: waitingTilesList
    };
  }
  
  /**
   * 估算向听数（简化版）
   * 返回离听牌还差几张
   */
  estimateShanten(hand, piziTiles, laiziTiles) {
    const structure = this.analyzeHandStructure(hand);
    const sequences = this.countSequences(hand);
    
    // 简化计算：理想状态是4组+1将(13张牌)
    const groups = structure.triplets.length + sequences; // 已成型的组
    const potentialGroups = structure.pairs.length; // 潜在的组
    
    // 粗略估算
    const completedGroups = groups + Math.floor(potentialGroups / 2);
    const neededGroups = 4 - completedGroups;
    
    // 向听数 = 需要的组数
    return Math.max(0, neededGroups);
  }
  
  /**
   * 识别手牌中的拆搭模式，匹配对应技巧
   * 从具体牌型中抽象出规律
   */
  identifyPatterns(hand, piziTiles, laiziTiles) {
    const patterns = [];
    const structure = this.analyzeHandStructure(hand);
    
    // 1. 识别边张搭子模式（12/89）
    const edgePatterns = this.findEdgePatterns(hand);
    if (edgePatterns.length > 0) {
      patterns.push({
        type: 'edge',
        tiles: edgePatterns,
        rule: '拆边不拆卡',
        description: `发现${edgePatterns.length}个边张搭子（${edgePatterns.map(p => p.display).join('、')}），进张只有3张，应优先拆除`,
        example: `例如：12万搭子只能听3万，89筒搭子只能听7筒，而46条嵌张能听5条，虽然都是4张，但嵌张改良机会更大`
      });
    }
    
    // 2. 识别嵌张搭子模式（如46、357等）
    const kanPatterns = this.findKanPatterns(hand);
    if (kanPatterns.length > 0) {
      patterns.push({
        type: 'kan',
        tiles: kanPatterns,
        rule: '拆对不拆嵌',
        description: `发现${kanPatterns.length}个嵌张搭子（${kanPatterns.map(p => p.display).join('、')}），虽然进张4张，但牌池概率均匀，优于对子`,
        example: `例如：46万嵌张能听5万（4张），而单对子只能碰出或成刻（3张），嵌张更灵活`
      });
    }
    
    // 3. 识别孤对模式
    const isolatedPairs = this.findIsolatedPairs(hand, piziTiles, laiziTiles);
    if (isolatedPairs.length > 0) {
      patterns.push({
        type: 'isolated_pair',
        tiles: isolatedPairs,
        rule: '拆对不拆嵌',
        description: `发现${isolatedPairs.length}个孤对（${isolatedPairs.map(p => TileUtils.getTileText(p)).join('、')}），无法成顺，仅能进3张，应优先拆除`,
        example: `例如：手牌有两个9万，无其他万子，这是孤对，只能碰出或9万，不如保留能成顺的嵌张`
      });
    }
    
    // 4. 识别复合搭模式（三连张等）
    const complexPatterns = this.findComplexPatterns(hand);
    if (complexPatterns.length > 0) {
      patterns.push({
        type: 'complex',
        tiles: complexPatterns,
        rule: '复合搭优先保留',
        description: `发现${complexPatterns.length}个复合搭（${complexPatterns.map(p => p.display).join('、')}），多个进张方向，灵活性高`,
        example: `例如：234万三连张，可进1万成25万成36万成顺，比单一搭子灵活得多`
      });
    }
    
    // 5. 识别两面听模式
    const twoWayPatterns = this.findTwoWayPatterns(hand);
    if (twoWayPatterns.length > 0) {
      patterns.push({
        type: 'two_way',
        tiles: twoWayPatterns,
        rule: '两面听为王',
        description: `发现${twoWayPatterns.length}个两面听搭子（${twoWayPatterns.map(p => p.display).join('、')}），可形成多面听，胡牌概率高`,
        example: `例如：34筒是两面听搭子，能听2筒或5筒，是最优搭子形态`
      });
    }
    
    // 6. 识别258将牌模式
    const jiangPatterns = this.find258JiangPatterns(hand, structure);
    if (jiangPatterns.length > 0) {
      patterns.push({
        type: 'jiang',
        tiles: jiangPatterns,
        rule: '258将牌规则',
        description: `发现${jiangPatterns.length}个258将牌对子（${jiangPatterns.map(t => TileUtils.getTileText(t)).join('、')}），小胡必须是258将`,
        example: `例如：有两个5万，这是合格的将牌，可以胡小胡，而两个4万只能胡大胡`
      });
    }
    
    // 7. 识别搭子过多模式（超过5搭）
    const totalPartnerships = structure.pairs.length + this.countSequences(hand);
    if (totalPartnerships > 5) {
      patterns.push({
        type: 'too_many',
        count: totalPartnerships,
        rule: '五搭黄金法则',
        description: `当前有${totalPartnerships}个搭子，超过5搭，必须立即拆除效率最低的搭子`,
        example: `胡牌只需要五搭牌，超过5搭会导致听牌慢，应立即拆掉边张或孤对`
      });
    }
    
    return patterns;
  }
  
  // 辅助方法：查找各种模式
  
  findEdgePatterns(hand) {
    const patterns = [];
    const suits = ['wan', 'tong', 'tiao'];
    
    suits.forEach(suit => {
      // 12搭子
      if (hand.includes(suit + '1') && hand.includes(suit + '2')) {
        patterns.push({ tiles: [suit + '1', suit + '2'], display: '12' + this.getSuitName(suit) });
      }
      // 89搭子
      if (hand.includes(suit + '8') && hand.includes(suit + '9')) {
        patterns.push({ tiles: [suit + '8', suit + '9'], display: '89' + this.getSuitName(suit) });
      }
    });
    
    return patterns;
  }
  
  findKanPatterns(hand) {
    const patterns = [];
    const suits = ['wan', 'tong', 'tiao'];
    
    suits.forEach(suit => {
      for (let i = 1; i <= 7; i++) {
        // 检查嵌张（如13、24、46等）
        const tile1 = suit + i;
        const tile2 = suit + (i + 2);
        const middle = suit + (i + 1);
        
        if (hand.includes(tile1) && hand.includes(tile2) && !hand.includes(middle)) {
          patterns.push({ tiles: [tile1, tile2], display: `${i}${i+2}` + this.getSuitName(suit) });
        }
      }
    });
    
    return patterns;
  }
  
  findIsolatedPairs(hand, piziTiles, laiziTiles) {
    const pairs = [];
    const tileGroups = {};
    
    hand.forEach(tile => {
      tileGroups[tile] = (tileGroups[tile] || 0) + 1;
    });
    
    for (let tile in tileGroups) {
      if (tileGroups[tile] === 2) {
        // 检查是否是孤对（无相邻牌）
        if (!this.hasSequencePotential(tile, hand, piziTiles, laiziTiles)) {
          pairs.push(tile);
        }
      }
    }
    
    return pairs;
  }
  
  findComplexPatterns(hand) {
    const patterns = [];
    const suits = ['wan', 'tong', 'tiao'];
    
    suits.forEach(suit => {
      for (let i = 1; i <= 7; i++) {
        // 检查三连张（如123、234等）
        const tile1 = suit + i;
        const tile2 = suit + (i + 1);
        const tile3 = suit + (i + 2);
        
        if (hand.includes(tile1) && hand.includes(tile2) && hand.includes(tile3)) {
          patterns.push({ tiles: [tile1, tile2, tile3], display: `${i}${i+1}${i+2}` + this.getSuitName(suit) });
        }
      }
    });
    
    return patterns;
  }
  
  findTwoWayPatterns(hand) {
    const patterns = [];
    const suits = ['wan', 'tong', 'tiao'];
    
    suits.forEach(suit => {
      for (let i = 2; i <= 8; i++) {
        // 检查两面听（如34、45等）
        const tile1 = suit + i;
        const tile2 = suit + (i + 1);
        
        if (hand.includes(tile1) && hand.includes(tile2)) {
          // 确保不是已经成顺的一部分
          const prevTile = suit + (i - 1);
          const nextTile = suit + (i + 2);
          
          if (!hand.includes(prevTile) || !hand.includes(nextTile)) {
            patterns.push({ tiles: [tile1, tile2], display: `${i}${i+1}` + this.getSuitName(suit) });
          }
        }
      }
    });
    
    return patterns;
  }
  
  find258JiangPatterns(hand, structure) {
    const jiangTiles = [];
    
    structure.pairs.forEach(tile => {
      if (MajiangRules.is258Jiang(tile)) {
        jiangTiles.push(tile);
      }
    });
    
    return jiangTiles;
  }
  
  getSuitName(suit) {
    const names = { wan: '万', tong: '筒', tiao: '条' };
    return names[suit] || '';
  }
}
