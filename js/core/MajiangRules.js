// MajiangRules.js - 武汉红中赖子杠规则配置
class MajiangRules {
  /**
   * 基础规则配置
   */
  static RULES = {
    // 必须开口才能胡牌
    MUST_OPEN: true,
    
    // 红中规则（红中=皮子）
    ZHONG_RULES: {
      IS_PIZI: true,            // 红中是皮子
      CAN_GANG: true,           // 红中可以选择杠牌（不是必须）
      DISCARD_IS_GANG: false,   // 打出红中不算杠牌（修正！）
      CANNOT_PENG: true,        // 不能碰红中
      CANNOT_MINGGANG: true,    // 不能明杠红中
      CANNOT_ANGANG: true,      // 不能暗杠红中
      HOLD_CANNOT_HU: false,    // 持有红中可以胡牌（修正！）
      GANG_FANSHU: 1            // 红中杠1番
    },
    
    // 皮子规则（前皮规则）
    PIZI_RULES: {
      IS_WILDCARD: true,        // 可以当任意牌使用
      CAN_GANG: true,           // 可以选择杠牌（不是必须）
      HOLD_CANNOT_HU: false,    // 持有皮子可以胡牌（修正！）
      GANG_FANSHU: 1,           // 皮子杠1番（黑的）
      COUNT: 4                  // 前一张的4张是皮子
    },
    
    // 赖子规则（后赖规则）
    LAIZI_RULES: {
      IS_WILDCARD: true,        // 可以当任意牌使用
      SOFT_HU_MULTIPLY: 1,      // 软胡倍数×1
      HARD_HU_MULTIPLY: 2,      // 硬胡倍数×2
      CAN_SINGLE_GANG: true,    // 可以单张成杠打出
      GANG_FANSHU: 2,           // 赖子杠2番
      TWO_LAIZI_NO_XIAOHU: true,// 两个赖子不能胡小胡
      CANNOT_USE_FOR_CHI_PENG: true, // 不能用来吃碰杠
      COUNT: 4                  // 后一张的4张是赖子
    },
    
    // 将牌规则
    JIANG_RULES: {
      MUST_BE_258: true,        // 小胡必须用2、5、8做将牌
      EXCEPTIONS: ['碰碰胡', '清一色', '将一色', '风一色'] // 这些大胡不受限制
    },
    
    // 杠牌规则
    GANG_RULES: {
      CHONG_GANG: { fanshu: 1, can_qiangang: false }, // 冲杠(直杠)×2,不能抢杠
      XU_GANG: { fanshu: 1, can_qiangang: true },     // 蓄杠×2,可以抢杠
      AN_GANG: { fanshu: 2, can_qiangang: false }     // 暗杠×4,不能抢杠
    },
    
    // 胡牌类型
    HU_TYPES: {
      XIAOHU: {
        name: '小胡(屁胡)',
        baseScore: 1,
        requiresOpen: true,
        requires258Jiang: true
      },
      DAHU: {
        PENGPENGHU: { name: '碰碰胡', baseScore: 10, anyJiang: true },
        QINGYISE: { name: '清一色', baseScore: 10, anyJiang: true },
        JIANGYISE: { name: '将一色', baseScore: 10, anyJiang: true },
        FENGYISE: { name: '风一色', baseScore: 10, anyJiang: true },
        QUANQIUREN: { name: '全求人', baseScore: 10, anyJiang: true },
        GANGSHANGHUA: { name: '杠上花', baseScore: 10, anyJiang: false },
        HAIDILAO: { name: '海底捞', baseScore: 10, anyJiang: false },
        QIANGGANG: { name: '抢杠', baseScore: 10, anyJiang: false }
      }
    }
  };
  
  /**
   * 根据指示牌计算皮子和赖子
   * @param {string} indicatorTile - 翻出的指示牌（如'wan8'）
   * @returns {Object} { piziTiles: [], laiziTiles: [] }
   */
  static calculatePiziLaizi(indicatorTile) {
    const parsed = TileUtils.parseTile(indicatorTile);
    const result = {
      indicatorTile,
      piziTiles: ['zhong'], // 红中永远是皮子
      laiziTiles: []
    };
    
    // 如果是风牌，按特殊顺序处理
    if (parsed.suit === 'feng') {
      const fengOrder = ['dong', 'nan', 'xi', 'bei', 'zhong', 'fa', 'bai'];
      const index = fengOrder.indexOf(indicatorTile);
      
      if (index >= 0) {
        // 前一张是皮子（循环）
        const prevIndex = (index - 1 + fengOrder.length) % fengOrder.length;
        const prevTile = fengOrder[prevIndex];
        if (prevTile !== 'zhong') { // 红中已经加过了
          result.piziTiles.push(prevTile);
        }
        
        // 后一张是赖子（循环）
        const nextIndex = (index + 1) % fengOrder.length;
        result.laiziTiles.push(fengOrder[nextIndex]);
      }
    } else {
      // 数字牌处理
      const { suit, number } = parsed;
      
      // 前一张（number-1）的4张是皮子
      if (number > 1) {
        result.piziTiles.push(suit + (number - 1));
      } else if (number === 1) {
        // 如果是1，那么9是前一张（循环）
        result.piziTiles.push(suit + '9');
      }
      
      // 后一张（number+1）的4张是赖子
      if (number < 9) {
        result.laiziTiles.push(suit + (number + 1));
      } else if (number === 9) {
        // 如果是9，那么1是后一张（循环）
        result.laiziTiles.push(suit + '1');
      }
    }
    
    return result;
  }
  
  /**
   * 判断是否为皮子
   */
  static isPizi(tile, piziTiles) {
    return piziTiles && piziTiles.includes(tile);
  }
  
  /**
   * 判断是否为赖子
   */
  static isLaizi(tile, laiziTiles) {
    return laiziTiles && laiziTiles.includes(tile);
  }
  
  /**
   * 判断是否为2、5、8将牌
   */
  static is258Jiang(tile) {
    const parsed = TileUtils.parseTile(tile);
    if (parsed.suit === 'feng') return false;
    return [2, 5, 8].includes(parsed.number);
  }
  
  /**
   * 判断是否可以作为将牌
   */
  static canBeJiang(tile, huType = 'XIAOHU') {
    if (huType !== 'XIAOHU') {
      // 大胡中的特殊类型不受限制
      const exceptions = this.RULES.JIANG_RULES.EXCEPTIONS;
      if (exceptions.includes(huType)) {
        return true;
      }
    }
    
    // 小胡必须是2、5、8
    return this.is258Jiang(tile);
  }
  
  /**
   * 检查是否持有红中(持有红中不能胡牌)
   */
  static hasZhong(hand) {
    return hand.includes('zhong');
  }
  
  /**
   * 检查皮子数量
   */
  static countPizi(hand, piziTiles) {
    if (!piziTiles) return 0;
    return hand.filter(t => piziTiles.includes(t)).length;
  }
  
  /**
   * 检查赖子数量
   */
  static countLaizi(hand, laiziTiles) {
    if (!laiziTiles) return 0;
    return hand.filter(t => laiziTiles.includes(t)).length;
  }
  
  /**
   * 判断是否可以胡牌(基础检查)
   */
  static canHu(hand, piziTiles, laiziTiles, hasOpened) {
    const checks = [];
    
    // 1. 必须开口
    if (this.RULES.MUST_OPEN && !hasOpened) {
      checks.push({ pass: false, reason: '未开口,不能胡牌' });
      return { canHu: false, checks };
    }
    checks.push({ pass: true, reason: '已开口✓' });
    
    // 2. 皮子和红中可以持有(修正！)
    const piziCount = this.countPizi(hand, piziTiles);
    const hasZhong = this.hasZhong(hand);
    if (piziCount > 0 || hasZhong) {
      checks.push({ pass: true, reason: `持有皮子/红中,可作万能牌✓` });
    }
    
    // 3. 两个赖子不能胡小胡
    const laiziCount = this.countLaizi(hand, laiziTiles);
    if (laiziCount >= 2 && this.RULES.LAIZI_RULES.TWO_LAIZI_NO_XIAOHU) {
      checks.push({ pass: false, reason: '两个赖子不能胡小胡' });
      return { canHu: false, checks };
    }
    if (laiziCount > 0) {
      checks.push({ pass: true, reason: `赖子${laiziCount}张,可用✓` });
    }
    
    return { canHu: true, checks };
  }
  
  /**
   * 计算番数
   */
  static calculateFanshu(scoreData) {
    let fanshu = scoreData.baseScore;
    
    // 开口×2
    if (scoreData.openCount > 0) {
      fanshu *= Math.pow(2, scoreData.openCount);
    }
    
    // 杠牌番数
    if (scoreData.zhongGang > 0) {
      fanshu += scoreData.zhongGang * this.RULES.ZHONG_RULES.GANG_FANSHU;
    }
    if (scoreData.laiziGang > 0) {
      fanshu += scoreData.laiziGang * this.RULES.LAIZI_RULES.GANG_FANSHU;
    }
    if (scoreData.anGang > 0) {
      fanshu *= Math.pow(4, scoreData.anGang);
    }
    if (scoreData.mingGang > 0) {
      fanshu *= Math.pow(2, scoreData.mingGang);
    }
    
    // 硬胡×2
    if (scoreData.isHardHu) {
      fanshu *= this.RULES.LAIZI_RULES.HARD_HU_MULTIPLY;
    }
    
    // 自摸
    if (scoreData.isZimo) {
      fanshu *= (scoreData.isDahu ? 1.5 : 2);
    }
    
    // 放冲×2
    if (!scoreData.isZimo) {
      fanshu *= 2;
    }
    
    return Math.floor(fanshu);
  }
}
