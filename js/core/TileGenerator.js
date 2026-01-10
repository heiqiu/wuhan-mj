// TileGenerator.js - 牌型生成器
class TileGenerator {
  constructor() {
    this.allTiles = this.createTileDeck();
  }
  
  /**
   * 创建完整牌堆(136张)
   */
  createTileDeck() {
    const deck = [];
    TileConstants.ALL_TILES.forEach(tile => {
      for (let i = 0; i < TileConstants.TILE_COUNT; i++) {
        deck.push(tile);
      }
    });
    return deck;
  }
  
  /**
   * 生成一副随机手牌(13张)
   */
  generateHand(options = {}) {
    const { difficulty = 'medium' } = options;
    
    let hand = [];
    let remainingTiles = [...this.allTiles];
    
    switch(difficulty) {
      case 'easy':
        hand = this.generateEasyHand(remainingTiles);
        break;
      case 'hard':
        hand = this.generateHardHand(remainingTiles);
        break;
      default:
        hand = this.generateRandomHand(remainingTiles, 13);
    }
    
    return TileUtils.sortTiles(hand);
  }
  
  /**
   * 生成简单手牌(1-2向听,搭子较多)
   */
  generateEasyHand(deck) {
    const hand = [];
    const usedIndices = new Set();
    
    // 生成2-3个顺子结构
    for (let i = 0; i < 2; i++) {
      const suit = ['wan', 'tong', 'tiao'][Math.floor(Math.random() * 3)];
      const startNum = Math.floor(Math.random() * 7) + 1;
      
      for (let j = 0; j < 3; j++) {
        const tile = suit + (startNum + j);
        const idx = this.findAvailableTile(deck, tile, usedIndices);
        if (idx !== -1) {
          hand.push(deck[idx]);
          usedIndices.add(idx);
        }
      }
    }
    
    // 补充到13张
    while (hand.length < 13) {
      const idx = this.getRandomAvailableIndex(deck, usedIndices);
      hand.push(deck[idx]);
      usedIndices.add(idx);
    }
    
    return hand;
  }
  
  /**
   * 生成困难手牌(3+向听,搭子少)
   */
  generateHardHand(deck) {
    const hand = [];
    const usedIndices = new Set();
    
    const suits = ['wan', 'tong', 'tiao', 'feng'];
    
    for (let i = 0; i < 13; i++) {
      const suit = suits[Math.floor(Math.random() * suits.length)];
      let tile;
      
      if (suit === 'feng') {
        const fengTiles = ['dong','nan','xi','bei','zhong','facai','bai'];
        tile = fengTiles[Math.floor(Math.random() * fengTiles.length)];
      } else {
        const num = Math.floor(Math.random() * 9) + 1;
        tile = suit + num;
      }
      
      const idx = this.findAvailableTile(deck, tile, usedIndices);
      if (idx !== -1) {
        hand.push(deck[idx]);
        usedIndices.add(idx);
      }
    }
    
    return hand;
  }
  
  /**
   * 完全随机生成
   */
  generateRandomHand(deck, count) {
    const hand = [];
    const usedIndices = new Set();
    
    while (hand.length < count) {
      const idx = this.getRandomAvailableIndex(deck, usedIndices);
      hand.push(deck[idx]);
      usedIndices.add(idx);
    }
    
    return hand;
  }
  
  /**
   * 模拟摸牌
   */
  drawTile(excludeTiles = []) {
    const availableTiles = this.allTiles.filter(tile => {
      const count = excludeTiles.filter(t => t === tile).length;
      const deckCount = this.allTiles.filter(t => t === tile).length;
      return count < deckCount;
    });
    
    if (availableTiles.length === 0) return null;
    
    const idx = Math.floor(Math.random() * availableTiles.length);
    return availableTiles[idx];
  }
  
  /**
   * 翻指示牌(用于确定皮子和赖子)
   * @param {Array} excludeTiles - 已经发出的牌（包括庄家和闲家手牌）
   */
  drawIndicatorTile(excludeTiles = []) {
    // 从剩余牌堆中翻一张牌
    return this.drawTile(excludeTiles);
  }
  
  // 辅助方法
  findAvailableTile(deck, tile, usedIndices) {
    for (let i = 0; i < deck.length; i++) {
      if (deck[i] === tile && !usedIndices.has(i)) {
        return i;
      }
    }
    return -1;
  }
  
  getRandomAvailableIndex(deck, usedIndices) {
    let idx;
    let attempts = 0;
    do {
      idx = Math.floor(Math.random() * deck.length);
      attempts++;
      if (attempts > 1000) break;
    } while (usedIndices.has(idx));
    return idx;
  }
}
