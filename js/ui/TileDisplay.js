// TileDisplay.js - 麻将牌显示组件
class TileDisplay {
  constructor(handContainer, drawnContainer) {
    this.handContainer = handContainer;
    this.drawnContainer = drawnContainer;
    this.onTileClick = null;
  }
  
  /**
   * 渲染手牌
   */
  renderHand(tiles, drawnTile, selectedTile = null, piziTiles = [], laiziTiles = []) {
    console.log('🎨 renderHand 被调用, selectedTile:', selectedTile);
    
    // 将摸牌加入手牌一起显示
    const allTiles = drawnTile ? [...tiles, drawnTile] : tiles;
    
    // 清空容器
    this.handContainer.innerHTML = '';
    this.drawnContainer.innerHTML = '';
    
    // 渲染所有牌，使用索引来区分相同的牌
    allTiles.forEach((tile, index) => {
      const tileElement = this.createTileElement(tile, index);
      
      // 标记刚摸到的牌
      if (tile === drawnTile && index === allTiles.length - 1) {
        tileElement.classList.add('tile-drawn');
      }
      
      // 标记皮子
      if (piziTiles && piziTiles.includes(tile)) {
        tileElement.classList.add('tile-pizi');
      }
      
      // 标记赖子
      if (laiziTiles && laiziTiles.includes(tile)) {
        tileElement.classList.add('tile-laizi');
      }
      
      // 选中状态：使用索引匹配
      if (selectedTile && selectedTile.tile === tile && selectedTile.index === index) {
        tileElement.classList.add('selected');
        console.log(`✅ 牌 ${tile} (index ${index}) 被标记为选中`);
      }
      
      // 点击事件：传递牌和索引
      tileElement.addEventListener('click', () => {
        if (this.onTileClick) {
          this.onTileClick({ tile, index });
        }
      });
      
      this.handContainer.appendChild(tileElement);
    });
  }
  
  /**
   * 创建麻将牌元素
   */
  createTileElement(tile, index = 0, className = '') {
    const div = document.createElement('div');
    div.className = `tile ${className}`;
    div.dataset.tile = tile;
    div.dataset.index = index; // 添加索引标识
    div.dataset.suit = TileUtils.getTileSuit(tile);
    
    // 使用PNG图片作为背景
    div.style.backgroundImage = `url(assets/tiles/${tile}.png)`;
    div.style.backgroundSize = 'cover';
    div.style.backgroundPosition = 'center';
    
    // 备用文字显示(图片加载失败时)
    div.setAttribute('data-text', TileUtils.getTileText(tile));
    
    return div;
  }
  
  /**
   * 设置点击回调
   */
  setOnTileClick(callback) {
    this.onTileClick = callback;
  }
}
