// TileUtils.js - 麻将牌工具函数
class TileUtils {
  /**
   * 解析牌的花色和数字
   * @param {string} tile - 牌名(如'wan5')
   * @returns {{suit: string, number: number|null}}
   */
  static parseTile(tile) {
    if (tile.startsWith('wan')) {
      return { suit: 'wan', number: parseInt(tile.replace('wan', '')) };
    }
    if (tile.startsWith('tong')) {
      return { suit: 'tong', number: parseInt(tile.replace('tong', '')) };
    }
    if (tile.startsWith('tiao')) {
      return { suit: 'tiao', number: parseInt(tile.replace('tiao', '')) };
    }
    return { suit: 'feng', number: null, tile: tile };
  }
  
  /**
   * 理牌排序
   * @param {Array} tiles - 手牌数组
   * @returns {Array} 排序后的手牌
   */
  static sortTiles(tiles) {
    const groups = {
      wan: [],
      tiao: [],
      tong: [],
      feng: []
    };
    
    tiles.forEach(tile => {
      const parsed = this.parseTile(tile);
      groups[parsed.suit].push(tile);
    });
    
    // 对每组进行排序
    ['wan', 'tiao', 'tong'].forEach(suit => {
      groups[suit].sort((a, b) => {
        const numA = this.parseTile(a).number;
        const numB = this.parseTile(b).number;
        return numA - numB;
      });
    });
    
    // 风牌排序
    const fengOrder = ['dong','nan','xi','bei','zhong','facai','bai'];
    groups.feng.sort((a, b) => fengOrder.indexOf(a) - fengOrder.indexOf(b));
    
    return [
      ...groups.wan,
      ...groups.tiao,
      ...groups.tong,
      ...groups.feng
    ];
  }
  
  /**
   * 计算两张牌的差值
   * @param {string} tile1 
   * @param {string} tile2 
   * @returns {number|null}
   */
  static getTileDistance(tile1, tile2) {
    const p1 = this.parseTile(tile1);
    const p2 = this.parseTile(tile2);
    
    if (p1.suit !== p2.suit || p1.suit === 'feng') {
      return null;
    }
    
    return Math.abs(p1.number - p2.number);
  }
  
  /**
   * 获取牌的中文显示
   */
  static getTileText(tile) {
    const textMap = {
      'wan': '万', 'tong': '筒', 'tiao': '条',
      'dong': '东', 'nan': '南', 'xi': '西', 'bei': '北',
      'zhong': '中', 'facai': '发', 'bai': '白'
    };
    
    for (let key in textMap) {
      if (tile.includes(key)) {
        const match = tile.match(/\d/);
        if (match) {
          return match[0] + textMap[key];
        }
        return textMap[key];
      }
    }
    return tile;
  }
  
  /**
   * 获取牌的花色(用于CSS类名)
   */
  static getTileSuit(tile) {
    const parsed = this.parseTile(tile);
    return parsed.suit;
  }
}
