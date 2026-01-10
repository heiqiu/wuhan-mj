// TileConstants.js - 麻将牌常量定义
const TileConstants = {
  // 所有牌型
  ALL_TILES: [
    'wan1','wan2','wan3','wan4','wan5','wan6','wan7','wan8','wan9',
    'tong1','tong2','tong3','tong4','tong5','tong6','tong7','tong8','tong9',
    'tiao1','tiao2','tiao3','tiao4','tiao5','tiao6','tiao7','tiao8','tiao9',
    'dong','nan','xi','bei','zhong','facai','bai'
  ],
  
  // 每张牌的数量
  TILE_COUNT: 4,
  
  // 手牌数量
  HAND_SIZE: 13,
  HAND_SIZE_WITH_DRAW: 14,
  
  // 可以杠的牌(红中)
  GANGABLE_TILES: ['zhong']
};
