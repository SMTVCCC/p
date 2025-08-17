/**
 * MyPlan 本地存储管理模块
 * 负责任务数据的持久化存储和读取
 */

class TaskStorage {
    constructor() {
        this.storageKey = 'myplan_tasks';
        this.settingsKey = 'myplan_settings';
        this.init();
    }

    /**
     * 初始化存储
     */
    init() {
        // 检查localStorage是否可用
        if (!this.isStorageAvailable()) {
            console.warn('LocalStorage不可用，数据将不会被保存');
            return;
        }

        // 初始化默认设置
        this.initDefaultSettings();
    }

    /**
     * 检查localStorage是否可用
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 初始化默认设置
     */
    initDefaultSettings() {
        const defaultSettings = {
            theme: 'light',
            autoSave: true,
            showCompleted: true,
            defaultPriority: 'daily',
            lastBackup: null
        };

        if (!this.getSettings()) {
            this.saveSettings(defaultSettings);
        }
    }

    /**
     * 保存任务列表到本地存储
     * @param {Array} tasks - 任务数组
     */
    saveTasks(tasks) {
        try {
            const taskData = {
                tasks: tasks,
                lastModified: new Date().toISOString(),
                version: '1.0'
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(taskData));
            console.log(`已保存 ${tasks.length} 个任务到本地存储`);
            return true;
        } catch (error) {
            console.error('保存任务失败:', error);
            return false;
        }
    }

    /**
     * 从本地存储加载任务列表
     * @returns {Array} 任务数组
     */
    loadTasks() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                console.log('未找到已保存的任务数据，返回空数组');
                return [];
            }

            const taskData = JSON.parse(stored);
            
            // 验证数据结构
            if (!taskData.tasks || !Array.isArray(taskData.tasks)) {
                console.warn('任务数据格式无效，返回空数组');
                return [];
            }

            console.log(`从本地存储加载了 ${taskData.tasks.length} 个任务`);
            return taskData.tasks;
        } catch (error) {
            console.error('加载任务失败:', error);
            return [];
        }
    }

    /**
     * 添加单个任务
     * @param {Object} task - 任务对象
     */
    addTask(task) {
        const tasks = this.loadTasks();
        tasks.push(task);
        return this.saveTasks(tasks);
    }

    /**
     * 更新任务
     * @param {string} taskId - 任务ID
     * @param {Object} updatedTask - 更新的任务对象
     */
    updateTask(taskId, updatedTask) {
        const tasks = this.loadTasks();
        const index = tasks.findIndex(task => task.id === taskId);
        
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updatedTask };
            return this.saveTasks(tasks);
        }
        
        console.warn(`未找到ID为 ${taskId} 的任务`);
        return false;
    }

    /**
     * 删除任务
     * @param {string} taskId - 任务ID
     */
    deleteTask(taskId) {
        const tasks = this.loadTasks();
        const filteredTasks = tasks.filter(task => task.id !== taskId);
        
        if (filteredTasks.length < tasks.length) {
            return this.saveTasks(filteredTasks);
        }
        
        console.warn(`未找到ID为 ${taskId} 的任务`);
        return false;
    }

    /**
     * 根据优先级获取任务
     * @param {string} priority - 优先级
     * @returns {Array} 指定优先级的任务数组
     */
    getTasksByPriority(priority) {
        const tasks = this.loadTasks();
        return tasks.filter(task => task.priority === priority);
    }

    /**
     * 获取已完成的任务
     * @returns {Array} 已完成的任务数组
     */
    getCompletedTasks() {
        const tasks = this.loadTasks();
        return tasks.filter(task => task.completed);
    }

    /**
     * 获取未完成的任务
     * @returns {Array} 未完成的任务数组
     */
    getPendingTasks() {
        const tasks = this.loadTasks();
        return tasks.filter(task => !task.completed);
    }

    /**
     * 清空所有任务
     */
    clearAllTasks() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('已清空所有任务');
            return true;
        } catch (error) {
            console.error('清空任务失败:', error);
            return false;
        }
    }

    /**
     * 保存应用设置
     * @param {Object} settings - 设置对象
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('保存设置失败:', error);
            return false;
        }
    }

    /**
     * 加载应用设置
     * @returns {Object} 设置对象
     */
    getSettings() {
        try {
            const stored = localStorage.getItem(this.settingsKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('加载设置失败:', error);
            return null;
        }
    }

    /**
     * 导出任务数据
     * @returns {string} JSON格式的任务数据
     */
    exportTasks() {
        const tasks = this.loadTasks();
        const settings = this.getSettings();
        
        const exportData = {
            tasks: tasks,
            settings: settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * 导入任务数据
     * @param {string} jsonData - JSON格式的任务数据
     * @returns {boolean} 导入是否成功
     */
    importTasks(jsonData) {
        try {
            const importData = JSON.parse(jsonData);
            
            // 验证数据格式
            if (!importData.tasks || !Array.isArray(importData.tasks)) {
                throw new Error('无效的数据格式');
            }
            
            // 保存任务
            const success = this.saveTasks(importData.tasks);
            
            // 如果有设置数据，也导入设置
            if (importData.settings && success) {
                this.saveSettings(importData.settings);
            }
            
            console.log(`成功导入 ${importData.tasks.length} 个任务`);
            return true;
        } catch (error) {
            console.error('导入任务失败:', error);
            return false;
        }
    }

    /**
     * 获取存储统计信息
     * @returns {Object} 存储统计信息
     */
    getStorageStats() {
        const tasks = this.loadTasks();
        const settings = this.getSettings();
        
        const stats = {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(task => task.completed).length,
            pendingTasks: tasks.filter(task => !task.completed).length,
            priorityStats: {
                important: tasks.filter(task => task.priority === 'important').length,
                daily: tasks.filter(task => task.priority === 'daily').length,
                secondary: tasks.filter(task => task.priority === 'secondary').length,
                general: tasks.filter(task => task.priority === 'general').length
            },
            storageSize: this.getStorageSize(),
            lastModified: this.getLastModified()
        };
        
        return stats;
    }

    /**
     * 获取存储大小（字节）
     * @returns {number} 存储大小
     */
    getStorageSize() {
        try {
            const tasks = localStorage.getItem(this.storageKey) || '';
            const settings = localStorage.getItem(this.settingsKey) || '';
            return new Blob([tasks + settings]).size;
        } catch (error) {
            return 0;
        }
    }

    /**
     * 获取最后修改时间
     * @returns {string} 最后修改时间
     */
    getLastModified() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const taskData = JSON.parse(stored);
                return taskData.lastModified || null;
            }
        } catch (error) {
            console.error('获取最后修改时间失败:', error);
        }
        return null;
    }

    /**
     * 创建数据备份
     * @returns {string} 备份数据的JSON字符串
     */
    createBackup() {
        const backupData = {
            tasks: this.loadTasks(),
            settings: this.getSettings(),
            backupDate: new Date().toISOString(),
            version: '1.0'
        };
        
        // 更新最后备份时间
        const settings = this.getSettings() || {};
        settings.lastBackup = backupData.backupDate;
        this.saveSettings(settings);
        
        return JSON.stringify(backupData, null, 2);
    }

    /**
     * 从备份恢复数据
     * @param {string} backupData - 备份数据的JSON字符串
     * @returns {boolean} 恢复是否成功
     */
    restoreFromBackup(backupData) {
        try {
            const data = JSON.parse(backupData);
            
            if (data.tasks) {
                this.saveTasks(data.tasks);
            }
            
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            
            console.log('数据恢复成功');
            return true;
        } catch (error) {
            console.error('数据恢复失败:', error);
            return false;
        }
    }
}

// 创建全局存储实例
const taskStorage = new TaskStorage();

// 导出存储实例供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskStorage;
} else {
    window.TaskStorage = TaskStorage;
    window.taskStorage = taskStorage;
}