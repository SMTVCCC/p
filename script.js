/**
 * MyPlan 主应用程序
 * 待办事项管理应用的核心功能实现
 */

class MyPlanApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        this.loadTasks();
        this.checkDailyTasks(); // 检查每日任务
        this.bindEvents();
        this.updateUI();
        console.log('MyPlan 应用初始化完成');
        
        // 设置每日检查定时器（每小时检查一次）
        setInterval(() => {
            this.checkDailyTasks();
        }, 60 * 60 * 1000);
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 添加任务
        const addBtn = document.getElementById('addTaskBtn');
        const taskInput = document.getElementById('taskInput');
        
        addBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        // 过滤器标签
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const priority = e.currentTarget.dataset.priority;
                this.setFilter(priority);
            });
        });

        // 模态框事件
        const editModal = document.getElementById('editModal');
        const closeModal = document.getElementById('closeModal');
        const cancelEdit = document.getElementById('cancelEdit');
        const saveEdit = document.getElementById('saveEdit');

        closeModal.addEventListener('click', () => this.closeEditModal());
        cancelEdit.addEventListener('click', () => this.closeEditModal());
        saveEdit.addEventListener('click', () => this.saveTaskEdit());

        // 点击模态框背景关闭
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                this.closeEditModal();
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && editModal.classList.contains('show')) {
                this.closeEditModal();
            }
        });
    }

    /**
     * 从存储加载任务
     */
    loadTasks() {
        this.tasks = taskStorage.loadTasks();
        console.log(`加载了 ${this.tasks.length} 个任务`);
    }

    /**
     * 保存任务到存储
     */
    saveTasks() {
        taskStorage.saveTasks(this.tasks);
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 添加新任务
     */
    addTask() {
        const taskInput = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        
        const text = taskInput.value.trim();
        const priority = prioritySelect.value;
        
        if (!text) {
            this.showNotification('请输入任务内容', 'warning');
            taskInput.focus();
            return;
        }

        const task = {
            id: this.generateId(),
            text: text,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        
        // 清空输入框
        taskInput.value = '';
        taskInput.focus();
        
        this.updateUI();
        this.showNotification('任务添加成功', 'success');
        
        console.log('添加任务:', task);
    }

    /**
     * 切换任务完成状态
     */
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.updateUI();
            
            const status = task.completed ? '完成' : '未完成';
            this.showNotification(`任务已标记为${status}`, 'info');
        }
    }

    /**
     * 删除任务
     */
    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const task = this.tasks[taskIndex];
            
            // 确认删除
            if (confirm(`确定要删除任务"${task.text}"吗？`)) {
                this.tasks.splice(taskIndex, 1);
                this.saveTasks();
                this.updateUI();
                this.showNotification('任务已删除', 'success');
            }
        }
    }

    /**
     * 编辑任务
     */
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.editingTaskId = taskId;
            
            const editInput = document.getElementById('editTaskInput');
            const editSelect = document.getElementById('editPrioritySelect');
            
            editInput.value = task.text;
            editSelect.value = task.priority;
            
            this.showEditModal();
            editInput.focus();
        }
    }

    /**
     * 保存任务编辑
     */
    saveTaskEdit() {
        if (!this.editingTaskId) return;
        
        const editInput = document.getElementById('editTaskInput');
        const editSelect = document.getElementById('editPrioritySelect');
        
        const newText = editInput.value.trim();
        const newPriority = editSelect.value;
        
        if (!newText) {
            this.showNotification('请输入任务内容', 'warning');
            editInput.focus();
            return;
        }
        
        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.text = newText;
            task.priority = newPriority;
            task.updatedAt = new Date().toISOString();
            
            this.saveTasks();
            this.updateUI();
            this.closeEditModal();
            this.showNotification('任务更新成功', 'success');
        }
    }

    /**
     * 显示编辑模态框
     */
    showEditModal() {
        const modal = document.getElementById('editModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    /**
     * 关闭编辑模态框
     */
    closeEditModal() {
        const modal = document.getElementById('editModal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
        this.editingTaskId = null;
    }

    /**
     * 设置过滤器
     */
    setFilter(priority) {
        this.currentFilter = priority;
        
        // 更新过滤器标签状态
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.priority === priority) {
                tab.classList.add('active');
            }
        });
        
        this.updateTaskDisplay();
    }

    /**
     * 获取过滤后的任务
     */
    getFilteredTasks() {
        if (this.currentFilter === 'all') {
            return this.tasks;
        }
        return this.tasks.filter(task => task.priority === this.currentFilter);
    }

    /**
     * 按优先级分组任务
     */
    getTasksByPriority() {
        // 按优先级顺序：重要 > 每日 > 次要 > 一般
        const priorities = ['important', 'daily', 'secondary', 'general'];
        const grouped = {};
        
        priorities.forEach(priority => {
            grouped[priority] = this.tasks.filter(task => task.priority === priority);
            // 对每个优先级组内的任务进行排序
            grouped[priority].sort((a, b) => {
                // 未完成的任务排在前面
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                // 按创建时间排序，新任务在前
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        });
        
        return grouped;
    }

    /**
     * 创建任务元素
     */
    createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.taskId = task.id;
        
        const priorityLabels = {
            important: '重要',
            daily: '每日',
            secondary: '次要',
            general: '一般'
        };
        
        taskItem.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="app.toggleTask('${task.id}')">
                <i class="fas fa-check"></i>
            </div>
            <div class="task-text">${this.escapeHtml(task.text)}</div>
            <div class="task-priority ${task.priority}">${priorityLabels[task.priority]}</div>
            <div class="task-actions">
                <button class="task-action edit-btn" onclick="app.editTask('${task.id}')" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-action delete-btn" onclick="app.deleteTask('${task.id}')" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return taskItem;
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 更新任务显示
     */
    updateTaskDisplay() {
        // 按优先级顺序渲染：重要 > 每日 > 次要 > 一般
        const priorities = ['important', 'daily', 'secondary', 'general'];
        const tasksByPriority = this.getTasksByPriority();
        
        priorities.forEach(priority => {
            const container = document.getElementById(`${priority}Tasks`);
            const countElement = document.getElementById(`${priority}Count`);
            const priorityGroup = document.querySelector(`[data-priority="${priority}"]`);
            
            if (!container) return;
            
            container.innerHTML = '';
            
            let tasksToShow = tasksByPriority[priority];
            
            // 如果当前过滤器不是"全部"，只显示匹配的优先级组
            if (this.currentFilter !== 'all') {
                if (this.currentFilter === priority) {
                    priorityGroup.style.display = 'block';
                } else {
                    priorityGroup.style.display = 'none';
                    return;
                }
            } else {
                priorityGroup.style.display = 'block';
            }
            
            // 更新任务计数
            countElement.textContent = tasksToShow.length;
            
            // 添加任务元素
            tasksToShow.forEach(task => {
                const taskElement = this.createTaskElement(task);
                container.appendChild(taskElement);
            });
        });
        
        // 显示/隐藏空状态
        this.updateEmptyState();
    }

    /**
     * 更新空状态显示
     */
    updateEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const tasksContainer = document.querySelector('.tasks-container');
        
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            emptyState.classList.add('show');
            tasksContainer.style.display = 'none';
        } else {
            emptyState.classList.remove('show');
            tasksContainer.style.display = 'block';
        }
    }

    /**
     * 更新统计信息
     */
    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        
        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
    }

    /**
     * 更新整个UI
     */
    updateUI() {
        this.updateTaskDisplay();
        this.updateStats();
    }

    /**
     * 检查每日任务
     */
    checkDailyTasks() {
        const today = new Date().toDateString();
        const lastCheck = localStorage.getItem('myplan_last_daily_check');
        
        if (lastCheck !== today) {
            // 重置每日任务的完成状态
            this.tasks.forEach(task => {
                if (task.priority === 'daily' && task.completed) {
                    task.completed = false;
                    task.completedAt = null;
                }
            });
            
            // 更新最后检查日期
            localStorage.setItem('myplan_last_daily_check', today);
            
            this.saveTasks();
            this.updateUI();
            
            // 如果有每日任务，显示提醒
            const dailyTasks = this.tasks.filter(task => task.priority === 'daily');
            if (dailyTasks.length > 0) {
                this.showNotification(`今日有 ${dailyTasks.length} 个每日任务等待完成！`, 'info');
            }
        }
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // 添加样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: this.getNotificationColor(type),
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: '10000',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // 动画显示
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // 自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 获取通知图标
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * 获取通知颜色
     */
    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6'
        };
        return colors[type] || '#3b82f6';
    }

    /**
     * 导出任务数据
     */
    exportTasks() {
        const data = taskStorage.exportTasks();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `myplan-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('任务数据已导出', 'success');
    }

    /**
     * 导入任务数据
     */
    importTasks(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const success = taskStorage.importTasks(e.target.result);
                if (success) {
                    this.loadTasks();
                    this.updateUI();
                    this.showNotification('任务数据导入成功', 'success');
                } else {
                    this.showNotification('导入失败，请检查文件格式', 'error');
                }
            } catch (error) {
                this.showNotification('导入失败，文件格式错误', 'error');
            }
        };
        reader.readAsText(file);
    }

    /**
     * 清空所有任务
     */
    clearAllTasks() {
        if (confirm('确定要清空所有任务吗？此操作不可撤销！')) {
            this.tasks = [];
            this.saveTasks();
            this.updateUI();
            this.showNotification('所有任务已清空', 'success');
        }
    }

    /**
     * 获取应用统计信息
     */
    getStats() {
        return taskStorage.getStorageStats();
    }
}

// 初始化应用
let app;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    app = new MyPlanApp();
    
    // 添加一些快捷键
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N: 聚焦到输入框
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            document.getElementById('taskInput').focus();
        }
        
        // Ctrl/Cmd + E: 导出数据
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            app.exportTasks();
        }
    });
    
    console.log('MyPlan 应用已启动');
});

// 页面卸载前保存数据
window.addEventListener('beforeunload', () => {
    if (app) {
        app.saveTasks();
    }
});

// 导出应用实例供全局使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MyPlanApp;
} else {
    window.MyPlanApp = MyPlanApp;
}