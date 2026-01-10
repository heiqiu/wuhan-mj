// StorageManager.js - 本地存储管理
class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'majiang_training_data';
  }
  
  /**
   * 保存训练会话
   */
  saveSession(session) {
    try {
      const allData = this.loadAllData();
      allData.sessions.push({
        ...session,
        savedAt: new Date().toISOString()
      });
      
      // 只保留最近50个会话
      if (allData.sessions.length > 50) {
        allData.sessions = allData.sessions.slice(-50);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
      return true;
    } catch (error) {
      console.error('保存数据失败:', error);
      return false;
    }
  }
  
  /**
   * 加载所有数据
   */
  loadAllData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : { sessions: [], statistics: {} };
    } catch (error) {
      console.error('加载数据失败:', error);
      return { sessions: [], statistics: {} };
    }
  }
  
  /**
   * 加载所有会话
   */
  loadSessions() {
    return this.loadAllData().sessions;
  }
  
  /**
   * 清除所有数据
   */
  clearAll() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('清除数据失败:', error);
      return false;
    }
  }
  
  /**
   * 获取存储空间使用情况
   */
  getStorageSize() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? (data.length / 1024).toFixed(2) + ' KB' : '0 KB';
    } catch (error) {
      return 'N/A';
    }
  }
}
