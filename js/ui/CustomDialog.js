// CustomDialog.js - 自定义对话框组件
class CustomDialog {
  constructor() {
    this.createDialogContainer();
  }
  
  /**
   * 创建对话框容器
   */
  createDialogContainer() {
    // 检查是否已存在
    if (document.getElementById('custom-dialog-overlay')) {
      return;
    }
    
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.id = 'custom-dialog-overlay';
    overlay.className = 'custom-dialog-overlay hidden';
    
    // 创建对话框
    const dialog = document.createElement('div');
    dialog.id = 'custom-dialog';
    dialog.className = 'custom-dialog';
    
    // 对话框内容容器
    const content = document.createElement('div');
    content.className = 'custom-dialog-content';
    
    // 图标
    const icon = document.createElement('div');
    icon.id = 'dialog-icon';
    icon.className = 'dialog-icon';
    
    // 标题
    const title = document.createElement('h3');
    title.id = 'dialog-title';
    title.className = 'dialog-title';
    
    // 消息
    const message = document.createElement('div');
    message.id = 'dialog-message';
    message.className = 'dialog-message';
    
    // 按钮容器
    const buttons = document.createElement('div');
    buttons.id = 'dialog-buttons';
    buttons.className = 'dialog-buttons';
    
    content.appendChild(icon);
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(buttons);
    dialog.appendChild(content);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 点击遮罩层关闭（仅对alert类型）
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && this.currentType === 'alert') {
        this.close(false);
      }
    });
  }
  
  /**
   * 显示确认对话框
   * @param {string} message - 消息内容
   * @param {string} title - 标题
   * @returns {Promise<boolean>} - 用户选择
   */
  confirm(message, title = '确认操作') {
    return new Promise((resolve) => {
      this.show({
        type: 'confirm',
        title,
        message,
        icon: '❓',
        buttons: [
          {
            text: '取消',
            class: 'btn-secondary',
            onClick: () => {
              this.close(false);
              resolve(false);
            }
          },
          {
            text: '确定',
            class: 'btn-primary',
            onClick: () => {
              this.close(true);
              resolve(true);
            }
          }
        ]
      });
    });
  }
  
  /**
   * 显示提示对话框
   * @param {string} message - 消息内容
   * @param {string} title - 标题
   * @returns {Promise<void>}
   */
  alert(message, title = '提示') {
    return new Promise((resolve) => {
      this.show({
        type: 'alert',
        title,
        message,
        icon: 'ℹ️',
        buttons: [
          {
            text: '确定',
            class: 'btn-primary',
            onClick: () => {
              this.close(true);
              resolve();
            }
          }
        ]
      });
    });
  }
  
  /**
   * 显示帮助对话框
   * @param {string} content - 帮助内容（支持HTML）
   * @param {string} title - 标题
   * @returns {Promise<void>}
   */
  help(content, title = '💡 游戏帮助') {
    return new Promise((resolve) => {
      this.show({
        type: 'help',
        title,
        message: content,
        icon: '📖',
        isHtml: true,
        buttons: [
          {
            text: '我知道了',
            class: 'btn-primary',
            onClick: () => {
              this.close(true);
              resolve();
            }
          }
        ]
      });
    });
  }
  
  /**
   * 显示错误对话框
   * @param {string} message - 错误消息
   * @param {string} title - 标题
   * @returns {Promise<void>}
   */
  error(message, title = '错误') {
    return new Promise((resolve) => {
      this.show({
        type: 'error',
        title,
        message,
        icon: '⚠️',
        buttons: [
          {
            text: '确定',
            class: 'btn-danger',
            onClick: () => {
              this.close(true);
              resolve();
            }
          }
        ]
      });
    });
  }
  
  /**
   * 显示对话框
   * @param {Object} options - 配置选项
   */
  show(options) {
    const {
      type = 'alert',
      title = '提示',
      message = '',
      icon = 'ℹ️',
      buttons = [],
      isHtml = false
    } = options;
    
    this.currentType = type;
    
    const overlay = document.getElementById('custom-dialog-overlay');
    const dialog = document.getElementById('custom-dialog');
    const iconEl = document.getElementById('dialog-icon');
    const titleEl = document.getElementById('dialog-title');
    const messageEl = document.getElementById('dialog-message');
    const buttonsEl = document.getElementById('dialog-buttons');
    
    // 设置内容
    iconEl.textContent = icon;
    titleEl.textContent = title;
    
    if (isHtml) {
      messageEl.innerHTML = message;
    } else {
      messageEl.textContent = message;
    }
    
    // 清空并创建按钮
    buttonsEl.innerHTML = '';
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = `btn ${btn.class}`;
      button.textContent = btn.text;
      button.onclick = btn.onClick;
      buttonsEl.appendChild(button);
    });
    
    // 设置对话框类型样式
    dialog.className = `custom-dialog dialog-${type}`;
    
    // 显示对话框
    overlay.classList.remove('hidden');
    
    // 添加动画
    setTimeout(() => {
      overlay.classList.add('show');
      dialog.classList.add('show');
    }, 10);
    
    // 聚焦第一个按钮（通常是确定按钮）
    setTimeout(() => {
      const firstButton = buttonsEl.querySelector('.btn-primary, .btn');
      if (firstButton) {
        firstButton.focus();
      }
    }, 100);
  }
  
  /**
   * 关闭对话框
   */
  close(result) {
    const overlay = document.getElementById('custom-dialog-overlay');
    const dialog = document.getElementById('custom-dialog');
    
    // 移除动画类
    overlay.classList.remove('show');
    dialog.classList.remove('show');
    
    // 等待动画完成后隐藏
    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 300);
    
    this.currentType = null;
  }
}

// 创建全局实例
window.customDialog = new CustomDialog();

// 提供便捷方法
window.showConfirm = (message, title) => window.customDialog.confirm(message, title);
window.showAlert = (message, title) => window.customDialog.alert(message, title);
window.showHelp = (content, title) => window.customDialog.help(content, title);
window.showError = (message, title) => window.customDialog.error(message, title);
