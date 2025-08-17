/**
 * 统一提示管理器
 * 管理所有类型的提示信息：顶部通知、激励信息、右侧弹出通知
 */
class NotificationManager {
    constructor() {
        this.activeNotifications = new Set();
        this.motivationTimer = null;
        this.topNotificationTimer = null;
        this.lastMotivationTime = 0;
        this.motivationCooldown = 30 * 1000; // 30秒冷却时间，大幅缩短
        this.periodicMotivationTimer = null;
        this.userActiveTime = Date.now();
        this.motivationInterval = 5 * 60 * 1000; // 5分钟间隔
        this.minActiveTime = 2 * 60 * 1000; // 最少活跃2分钟后开始显示
        this.isPageVisible = true;
        this.userBehaviorData = {
            sessionStartTime: Date.now(),
            tasksCompletedInSession: 0,
            motivationsShown: 0,
            lastTaskCompletionTime: 0,
            averageTaskCompletionTime: 0,
            userEngagementScore: 0.5 // 0-1 scale
        };
        this.setupVisibilityListener();
        this.setupUserActivityListener();
    }

    /**
     * 显示提示信息
     * @param {Object} options - 提示选项
     * @param {string} options.message - 提示消息
     * @param {string} options.type - 提示类型: 'top', 'motivation', 'popup'
     * @param {string} options.urgency - 紧急程度: 'normal', 'medium', 'high'
     * @param {number} options.duration - 显示时长(毫秒)
     * @param {boolean} options.closable - 是否可关闭
     */
    show(options) {
        const {
            message,
            type = 'popup',
            urgency = 'normal',
            duration = 5000,
            closable = true
        } = options;

        switch (type) {
            case 'top':
                this.showTopNotification(message, urgency, duration, closable);
                break;
            case 'motivation':
                this.showMotivationMessage(message, duration, closable);
                break;
            case 'popup':
            default:
                this.showPopupNotification(message, urgency, duration);
                break;
        }
    }

    /**
     * 显示顶部通知
     */
    showTopNotification(message, urgency = 'normal', duration = 0, closable = true) {
        const notification = document.getElementById('unified-notification');
        const notificationText = notification?.querySelector('.notification-text');
        const notificationIcon = notification?.querySelector('.notification-icon');
        const closeBtn = notification?.querySelector('.notification-close');
        
        if (notification && notificationText) {
            // 清除之前的定时器
            if (this.topNotificationTimer) {
                clearTimeout(this.topNotificationTimer);
            }
            
            // 先移除show类，重置状态
            notification.classList.remove('show');
            
            // 设置内容和样式
            notificationText.textContent = message;
            
            // 设置样式和图标（将紧急程度映射到已有CSS类名）
            let styleClass = 'unified-notification';
            if (urgency === 'medium') styleClass += ' warning';
            else if (urgency === 'high') styleClass += ' urgent';
            notification.className = styleClass;
            
            const icons = {
                'normal': 'fas fa-info-circle',
                'medium': 'fas fa-exclamation-triangle', 
                'high': 'fas fa-exclamation-circle'
            };
            
            if (notificationIcon) {
                notificationIcon.className = `notification-icon ${icons[urgency] || icons.normal}`;
            }
            if (closeBtn) {
                closeBtn.style.display = closable ? 'block' : 'none';
            }
            
            // 使用requestAnimationFrame确保流畅显示
            requestAnimationFrame(() => {
                notification.style.display = 'block';
                requestAnimationFrame(() => {
                    notification.classList.add('show');
                });
            });
            
            // 自动隐藏
            if (duration > 0) {
                this.topNotificationTimer = setTimeout(() => {
                    this.hideTopNotification();
                }, duration);
            }
        }
    }

    /**
     * 隐藏顶部通知
     */
    hideTopNotification() {
        const notification = document.getElementById('unified-notification');
        if (notification) {
            notification.classList.remove('show');
            // 等待过渡结束后再隐藏display，避免闪烁（匹配0.4s过渡时间）
            setTimeout(() => {
                if (!notification.classList.contains('show')) {
                    notification.style.display = 'none';
                }
            }, 450);
        }
        if (this.topNotificationTimer) {
            clearTimeout(this.topNotificationTimer);
            this.topNotificationTimer = null;
        }
    }

    /**
     * 显示激励信息
     */
    showMotivationMessage(message, duration = 5000, closable = true) {
        const notification = document.getElementById('unified-notification');
        const notificationText = notification?.querySelector('.notification-text');
        const notificationIcon = notification?.querySelector('.notification-icon');
        const closeBtn = notification?.querySelector('.notification-close');
        
        if (notification && notificationText) {
            // 清除之前的定时器
            if (this.motivationTimer) {
                clearTimeout(this.motivationTimer);
            }
            
            // 先移除show类，重置状态
            notification.classList.remove('show');
            
            // 设置内容和样式
            notificationText.textContent = message;
            
            // 使用motivation样式类，保持与顶部信息相同的格式
            notification.className = 'unified-notification motivation';
            
            // 设置激励信息专用图标
            if (notificationIcon) {
                notificationIcon.className = 'notification-icon fas fa-lightbulb';
            }
            if (closeBtn) {
                closeBtn.style.display = closable ? 'block' : 'none';
            }
            
            // 使用requestAnimationFrame确保流畅显示
            requestAnimationFrame(() => {
                notification.style.display = 'block';
                requestAnimationFrame(() => {
                    notification.classList.add('show');
                });
            });
            
            // 指定时间后转换为正常顶部提示
            this.motivationTimer = setTimeout(() => {
                this.convertMotivationToTopNotification();
            }, duration);
        }
    }

    /**
     * 隐藏激励信息
     */
    hideMotivationMessage() {
        const notification = document.getElementById('unified-notification');
        if (notification) {
            notification.classList.remove('show');
            // 等待过渡结束后再隐藏display
            setTimeout(() => {
                if (!notification.classList.contains('show')) {
                    notification.style.display = 'none';
                }
            }, 350);
        }
        if (this.motivationTimer) {
            clearTimeout(this.motivationTimer);
            this.motivationTimer = null;
        }
    }

    /**
     * 将激励提示转换为正常顶部提示
     */
    convertMotivationToTopNotification() {
        const notification = document.getElementById('unified-notification');
        if (!notification || !notification.classList.contains('motivation')) return;
        
        // 获取当前任务状态，生成合适的顶部提示内容
        const tasks = (typeof app !== 'undefined' && app) ? app.tasks : [];
        const uncompletedTasks = tasks.filter(task => !task.completed);
        const importantTasks = uncompletedTasks.filter(task => task.priority === 'important');
        const timeOfDay = this.getTimeOfDay();
        
        let topMessage = '';
        let urgency = 'normal';
        
        // 根据当前状态生成合适的顶部提示
        if (uncompletedTasks.length === 0) {
            topMessage = '所有任务已完成！今天表现很棒 🎉';
            urgency = 'normal';
        } else if (importantTasks.length > 0) {
            topMessage = `还有 ${importantTasks.length} 个重要任务待处理`;
            urgency = 'medium';
        } else {
            const timeGreeting = {
                'morning': '早上好',
                'afternoon': '下午好', 
                'evening': '晚上好',
                'night': '夜深了'
            };
            topMessage = `${timeGreeting[timeOfDay]}！还有 ${uncompletedTasks.length} 个任务等待完成`;
            urgency = 'normal';
        }
        
        // 更新通知内容
        const textElement = notification.querySelector('.notification-text');
        if (textElement) {
            textElement.textContent = topMessage;
        }
        
        // 确保容器显示
        notification.style.display = 'block';
        
        // 转换为正常顶部提示样式
        let styleClass = 'unified-notification show';
        if (urgency === 'medium') styleClass += ' warning';
        else if (urgency === 'high') styleClass += ' urgent';
        notification.className = styleClass;
        
        // 更新图标
        const iconElement = notification.querySelector('.notification-icon');
        if (iconElement) {
            const icons = {
                'normal': 'fas fa-info-circle',
                'medium': 'fas fa-exclamation-triangle', 
                'high': 'fas fa-exclamation-circle'
            };
            iconElement.className = `notification-icon ${icons[urgency] || icons.normal}`;
        }
        
        // 清除激励定时器
        if (this.motivationTimer) {
            clearTimeout(this.motivationTimer);
            this.motivationTimer = null;
        }
        
        // 设置正常顶部提示的自动隐藏（15秒后）
        setTimeout(() => {
            this.hideTopNotification();
        }, 15000);
    }

    /**
     * 显示右侧弹出通知
     */
    showPopupNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        const notificationId = Date.now().toString();
        
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
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
            transition: 'transform 0.3s'
        });
        
        document.body.appendChild(notification);
        this.activeNotifications.add(notificationId);
        
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
                this.activeNotifications.delete(notificationId);
            }, 300);
        }, duration);
    }

    /**
     * 获取通知图标
     */
    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * 获取通知颜色
     */
    getNotificationColor(type) {
        const colors = {
            'success': '#10b981',
            'error': '#ef4444', 
            'warning': '#f59e0b',
            'info': '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    /**
     * 智能提示逻辑
     * 根据时间、任务状态等因素决定显示什么类型的提示
     */
    showSmartNotification(tasks) {
        const timeOfDay = this.getTimeOfDay();
        const uncompletedTasks = tasks.filter(task => !task.completed);
        const importantTasks = uncompletedTasks.filter(task => task.priority === 'important');
        const completedToday = tasks.filter(task => {
            const today = new Date().toDateString();
            return task.completed && task.completedAt && new Date(task.completedAt).toDateString() === today;
        });
        
        // 决定提示类型和内容
        let message = '';
        let type = 'top';
        let urgency = 'normal';
        let duration = 0; // 0表示不自动隐藏
        
        // 深夜强化提示
        if (timeOfDay === 'night' && uncompletedTasks.length > 0) {
            message = `夜深了，还有 ${uncompletedTasks.length} 个任务未完成，早点休息吧`;
            urgency = 'high';
        }
        // 重要任务提醒
        else if (importantTasks.length > 0) {
            message = `有 ${importantTasks.length} 个重要任务等待处理`;
            urgency = 'medium';
        }
        // 一般任务提醒
        else if (uncompletedTasks.length > 0) {
            const timeGreeting = {
                'morning': '早上好',
                'afternoon': '下午好', 
                'evening': '晚上好',
                'night': '夜深了'
            };
            message = `${timeGreeting[timeOfDay]}！还有 ${uncompletedTasks.length} 个任务等待完成`;
        }
        
        // 显示顶部提示
        if (message) {
            this.show({
                message,
                type: 'top',
                urgency,
                duration,
                closable: true
            });
        }
        
        // 动态调整激励信息出现概率
        let motivationProbability = 0.6; // 基础概率60%，大幅提升
        
        // 根据不同情况调整概率
        if (uncompletedTasks.length === 0 && completedToday.length > 0) {
            // 所有任务完成时，85%概率显示夸奖
            motivationProbability = 0.85;
        } else if (completedToday.length >= 5) {
            // 完成任务较多时，75%概率显示成就激励
            motivationProbability = 0.75;
        } else if (uncompletedTasks.length > 10) {
            // 任务很多时，适当降低但仍保持较高频率
            motivationProbability = 0.45;
        } else if (timeOfDay === 'morning') {
            // 早晨时间，增加激励概率
            motivationProbability = 0.7;
        }
        
        // 检查冷却时间，防止频繁显示激励
        const now = Date.now();
        const timeSinceLastMotivation = now - this.lastMotivationTime;
        
        if (Math.random() <= motivationProbability && timeSinceLastMotivation >= this.motivationCooldown) {
            const motivationMessages = this.getMotivationMessages(timeOfDay, uncompletedTasks.length, completedToday.length);
            if (motivationMessages.length > 0) {
                const randomMessage = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
                this.show({
                    message: randomMessage,
                    type: 'motivation',
                    duration: 5000,
                    closable: true
                });
                this.lastMotivationTime = now; // 更新最后显示时间
            }
        }
    }

    /**
     * 获取时间段
     */
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 22) return 'evening';
        return 'night';
    }

    /**
     * 设置页面可见性监听器
     */
    setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
            if (this.isPageVisible) {
                this.userActiveTime = Date.now();
                this.startPeriodicMotivation();
            } else {
                this.stopPeriodicMotivation();
            }
        });
    }

    /**
     * 设置用户活动监听器
     */
    setupUserActivityListener() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        const updateActiveTime = () => {
            this.userActiveTime = Date.now();
        };
        
        events.forEach(event => {
            document.addEventListener(event, updateActiveTime, true);
        });
        
        // 设置不活跃检测定时器
        setInterval(() => {
            const inactiveTime = Date.now() - this.userActiveTime;
            if (inactiveTime > 300000) { // 5分钟不活跃
                this.updateUserBehaviorData('user_inactive', { inactiveTime });
            }
        }, 60000); // 每分钟检查一次
    }

    /**
     * 开始定期激励
     */
    startPeriodicMotivation() {
        if (this.periodicMotivationTimer) {
            clearInterval(this.periodicMotivationTimer);
        }
        
        this.periodicMotivationTimer = setInterval(() => {
            this.checkAndShowPeriodicMotivation();
        }, this.motivationInterval);
    }

    /**
     * 停止定期激励
     */
    stopPeriodicMotivation() {
        if (this.periodicMotivationTimer) {
            clearInterval(this.periodicMotivationTimer);
            this.periodicMotivationTimer = null;
        }
    }

    /**
      * 检查并显示定期激励
      */
     checkAndShowPeriodicMotivation() {
         // 检查页面是否可见
         if (!this.isPageVisible) return;
         
         // 检查用户是否足够活跃
         const timeSinceActive = Date.now() - this.userActiveTime;
         if (timeSinceActive > this.minActiveTime) return;
         
         // 检查冷却时间
         const timeSinceLastMotivation = Date.now() - this.lastMotivationTime;
         if (timeSinceLastMotivation < this.motivationCooldown) return;
         
         // 获取当前任务状态
         const tasks = (typeof app !== 'undefined' && app) ? app.tasks : [];
         const uncompletedTasks = tasks.filter(task => !task.completed);
         const completedToday = tasks.filter(task => {
             const today = new Date().toDateString();
             return task.completed && task.completedAt && new Date(task.completedAt).toDateString() === today;
         });
         
         const timeOfDay = this.getTimeOfDay();
         
         // 智能计算显示概率
         const probability = this.calculateSmartMotivationProbability(uncompletedTasks, completedToday, timeOfDay);
         
         if (Math.random() <= probability) {
             const motivationMessages = this.getMotivationMessages(timeOfDay, uncompletedTasks.length, completedToday.length);
             if (motivationMessages.length > 0) {
                 const randomMessage = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
                 this.show({
                     message: randomMessage,
                     type: 'motivation',
                     duration: 5000,
                     closable: true
                 });
                 this.lastMotivationTime = Date.now();
                 this.userBehaviorData.motivationsShown++;
             }
         }
     }
     
     /**
      * 智能计算激励显示概率
      */
     calculateSmartMotivationProbability(uncompletedTasks, completedToday, timeOfDay) {
         let baseProbability = 0.4;
         
         // 基于任务状态调整
         if (uncompletedTasks.length === 0 && completedToday.length > 0) {
             baseProbability = 0.8; // 任务完成时高概率显示夸奖
         } else if (completedToday.length >= 3) {
             baseProbability = 0.6; // 完成较多任务时增加激励
         } else if (uncompletedTasks.length > 8) {
             baseProbability = 0.3; // 任务很多时适当降低频率
         }
         
         // 基于用户参与度调整
         const engagementMultiplier = 0.5 + (this.userBehaviorData.userEngagementScore * 0.5);
         baseProbability *= engagementMultiplier;
         
         // 基于会话时长调整
         const sessionDuration = Date.now() - this.userBehaviorData.sessionStartTime;
         const sessionHours = sessionDuration / (1000 * 60 * 60);
         if (sessionHours > 2) {
             baseProbability *= 1.2; // 长时间使用时增加激励
         } else if (sessionHours < 0.5) {
             baseProbability *= 0.8; // 短时间使用时减少激励
         }
         
         // 基于最近任务完成情况调整
         const timeSinceLastCompletion = Date.now() - this.userBehaviorData.lastTaskCompletionTime;
         if (timeSinceLastCompletion > 30 * 60 * 1000) { // 30分钟没完成任务
             baseProbability *= 1.3; // 增加激励频率
         }
         
         // 基于激励显示频率调整（防止过度激励）
         const motivationRate = this.userBehaviorData.motivationsShown / Math.max(sessionHours, 0.1);
         if (motivationRate > 3) { // 每小时超过3次激励
             baseProbability *= 0.7; // 降低频率
         }
         
         // 基于时间段调整
         const hour = new Date().getHours();
         if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
             baseProbability *= 1.1; // 高效时段增加激励
         } else if (hour >= 22 || hour <= 6) {
             baseProbability *= 0.8; // 深夜/凌晨减少激励
         }
         
         return Math.min(Math.max(baseProbability, 0.1), 0.9); // 限制在10%-90%之间
     }
     
     /**
      * 更新用户行为数据
      */
     updateUserBehaviorData(action, data = {}) {
         const now = Date.now();
         
         switch (action) {
             case 'taskCompleted':
                 this.userBehaviorData.tasksCompletedInSession++;
                 this.userBehaviorData.lastTaskCompletionTime = now;
                 
                 // 计算平均完成时间
                 if (data.taskCreatedTime) {
                     const completionTime = now - data.taskCreatedTime;
                     if (this.userBehaviorData.averageTaskCompletionTime === 0) {
                         this.userBehaviorData.averageTaskCompletionTime = completionTime;
                     } else {
                         this.userBehaviorData.averageTaskCompletionTime = 
                             (this.userBehaviorData.averageTaskCompletionTime + completionTime) / 2;
                     }
                 }
                 
                 // 提升参与度分数
                 this.userBehaviorData.userEngagementScore = Math.min(
                     this.userBehaviorData.userEngagementScore + 0.1, 1.0
                 );
                 break;
                 
             case 'taskCreated':
                 // 创建任务也是积极行为
                 this.userBehaviorData.userEngagementScore = Math.min(
                     this.userBehaviorData.userEngagementScore + 0.05, 1.0
                 );
                 break;
                 
             case 'userInactive':
                 // 用户不活跃时降低参与度
                 this.userBehaviorData.userEngagementScore = Math.max(
                     this.userBehaviorData.userEngagementScore - 0.02, 0.1
                 );
                 break;
         }
     }

    /**
     * 获取激励信息
     */
    getMotivationMessages(timeOfDay, uncompletedCount, completedCount) {
        const messages = [];
        
        // 基于时间的激励信息
        const timeMessages = {
            'morning': [
                '🌅 早起的鸟儿有虫吃，先做5分钟试试？',
                '☀️ 新的一天开始了，从最简单的任务开始吧！',
                '✨ 晨光正好，正是高效工作的时候',
                '🌱 清晨的你充满活力，让我们开始吧！',
                '🎯 早晨的专注力最棒，抓住这个黄金时间！',
                '🌈 新的一天，新的可能，你准备好了吗？',
                '☕ 来杯咖啡，开启高效的一天！',
                '🎪 早晨的魔法时光，让奇迹发生吧！',
                '🌸 春天的早晨最美好，就像现在的你！',
                '🎵 听，成功在向你招手！'
            ],
            'afternoon': [
                '🌞 下午时光，适合处理一些重要任务',
                '💪 午后精神好，不如完成一个小目标？',
                '⏰ 时间过半，看看还有什么可以快速完成的',
                '🚀 下午的你依然充满干劲！',
                '🎨 午后阳光正好，创造力爆棚的时候到了！',
                '🍃 午后微风轻拂，正是思考的好时光',
                '🎭 下午场的表演开始了，你是主角！',
                '🌻 向日葵般的你，总是朝着目标前进',
                '🎪 下午的精彩正在上演，别错过！',
                '🌊 乘风破浪的下午，勇敢前行！'
            ],
            'evening': [
                '🌆 晚上时光，整理一下今天的收获吧',
                '🌙 夜幕降临，完成最后几个任务？',
                '⭐ 今晚还有时间，不如再努力一下',
                '🕯️ 夜晚的宁静最适合专心工作',
                '🌟 晚间时光，为今天画个完美句号！',
                '🎭 夜晚的舞台属于努力的你',
                '🌙 月亮见证着你的每一份努力',
                '🎨 夜色如画，你就是画中最亮的那颗星',
                '🍷 为今天的努力干杯！',
                '🎪 夜晚的马戏团，精彩还在继续！'
            ],
            'night': [
                '🌙 夜深了，明天的任务今天能完成一点是一点',
                '🦉 深夜时分，适合做一些安静的任务',
                '💫 夜猫子模式，专注力MAX！',
                '🌌 深夜的你就像夜空中最亮的星',
                '🔥 夜深人静，正是高效工作的好时机！',
                '🌠 流星划过，为你的努力点赞',
                '🎭 深夜的独角戏，你演得很棒！',
                '🌙 月光如水，照亮你前进的路',
                '⭐ 星星都在为你加油呢！',
                '🎪 深夜的魔法时刻，创造奇迹吧！'
            ]
        };
        
        messages.push(...timeMessages[timeOfDay]);
        
        // 基于任务状态的激励信息
        if (uncompletedCount === 0) {
            messages.push(
                '🎉 太棒了！所有任务都完成了，给自己一个奖励吧！',
                '✨ 完美的一天，你真的很棒！',
                '🏆 任务清单空空如也，享受这份成就感吧！',
                '💎 哇！你把所有事情都搞定了，简直是超人！',
                '🌈 干净的任务列表就像你整理好的生活一样美好！',
                '👑 今天的你就是自己的国王/女王！',
                '🎪 完美收官！你就是今天的MVP！',
                '🌟 全部完成！你的效率让人惊叹！',
                '🎭 精彩的表演结束了，观众都在为你鼓掌！',
                '🏅 冠军就是你！今天的胜利属于你！',
                '🎨 你把今天画成了最美的画作！',
                '🚀 任务火箭发射成功，目标达成！'
            );
        } else if (uncompletedCount <= 3) {
            messages.push(
                '🎯 只剩几个任务了，冲刺一下就完成了！',
                '🏃‍♀️ 胜利在望，坚持就是胜利！',
                '💪 最后几步了，你可以的！',
                '🌟 终点线就在眼前，加油冲刺！',
                '🚀 最后的关卡，你一定能突破！',
                '🎪 压轴大戏即将上演，你准备好了吗？',
                '🏆 胜利的号角已经响起！',
                '⚡ 最后的闪电战，一鼓作气！',
                '🎭 大结局就在眼前，精彩继续！',
                '🌈 彩虹的尽头就是宝藏，加油！'
            );
        } else if (completedCount > 0) {
            messages.push(
                `🏅 已经完成了${completedCount}个任务，继续保持！`,
                '📈 进展不错，再接再厉！',
                '⭐ 每完成一个任务都是进步，加油！',
                '🎊 看看你的成就，每一个都闪闪发光！',
                '💫 你的执行力让星星都为你点赞！',
                '🎪 精彩的表演正在进行中！',
                '🌟 你就像夜空中最亮的星！',
                '🚀 火箭已经点火，继续飞向目标！',
                '🎨 你正在创作人生的杰作！',
                '🏆 每一步都在向冠军靠近！',
                `🎭 ${completedCount}个精彩片段已完成，故事还在继续！`,
                '💎 每个完成的任务都是珍贵的宝石！'
            );
        } else {
            messages.push(
                '🌱 千里之行始于足下，先做5分钟试试？',
                '🎯 不要被任务数量吓到，一个一个来！',
                '🚀 开始就是成功的一半，动起来吧！',
                '🧩 把大任务分解成小步骤，会更容易完成',
                '💎 专注当下，先完成一个小任务',
                '🌟 你比想象中更强大，相信自己！',
                '🎨 创造属于你的精彩，一步一个脚印！',
                '🍀 幸运总是眷顾努力的人，比如你！',
                '🎪 人生的马戏团开始了，你是主角！',
                '🌈 每一个开始都孕育着无限可能！',
                '⚡ 闪电般的行动力，就从现在开始！',
                '🎭 人生如戏，现在是你的主场时间！',
                '🚀 倒计时开始，准备发射你的潜能！',
                '🌟 星星之火可以燎原，从小事做起！',
                '🎨 空白的画布等待你来创作奇迹！'
            );
        }
        
        // 添加基于完成率的个性化消息
        const completionRate = completedCount / (completedCount + uncompletedCount) || 0;
        if (completionRate > 0.8) {
            messages.push(
                '🔥 完成率超过80%！你就是效率之王！',
                '⚡ 这个完成率简直逆天了！',
                '🏆 如此高的完成率，你值得所有掌声！'
            );
        } else if (completionRate > 0.5) {
            messages.push(
                '📊 完成率过半，势头很好！',
                '🎯 你正在稳步向目标前进！',
                '💪 这个节奏很棒，继续保持！'
            );
        }
        
        // 添加基于时间的特殊激励
        const hour = new Date().getHours();
        if (hour >= 9 && hour <= 11) {
            messages.push('☕ 上午黄金时间，大脑最清醒的时候！');
        } else if (hour >= 14 && hour <= 16) {
            messages.push('🌞 下午效率时段，抓住这个机会！');
        } else if (hour >= 20 && hour <= 22) {
            messages.push('🌙 夜晚思维活跃期，灵感迸发的时刻！');
        }
        
        // 添加随机的鼓励金句
        const inspirationalQuotes = [
            '💫 "成功不是终点，失败不是末日，继续前进的勇气才最可贵"',
            '🌟 "每一个不曾起舞的日子，都是对生命的辜负"',
            '🚀 "你的潜力就像宇宙一样无限"',
            '🎨 "生活是一张白纸，你可以在上面画出任何想要的图案"',
            '⚡ "行动是治愈恐惧的良药"',
            '🌈 "风雨过后必有彩虹，坚持就是胜利"',
            '🎯 "专注于过程，结果自然会来"',
            '💎 "压力是煤炭变成钻石的必经之路"',
            '🌱 "每一次努力都是在为未来的自己投资"',
            '🎪 "人生就是一场精彩的表演，你是唯一的主角"'
        ];
        
        // 10%的概率添加励志金句
        if (Math.random() < 0.1) {
            messages.push(...inspirationalQuotes);
        }
        
        return messages;
    }
}

/**
 * MyPlan 主应用程序
 * 待办事项管理应用的核心功能实现
 */

class MyPlanApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.notificationManager = new NotificationManager();
        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        this.loadTasks();
        
        this.checkDailyTasks(); // 检查每日任务
        this.bindEvents();
        this.bindMobileToggle(); // 绑定移动端折叠按钮事件
        this.bindNotificationEvents(); // 绑定通知事件
        this.updateUI();
        
        // 显示智能提示
        this.notificationManager.showSmartNotification(this.tasks);
        
        console.log('MyPlan 应用初始化完成');
        
        // 设置每日检查定时器（每小时检查一次）
        setInterval(() => {
            this.checkDailyTasks();
        }, 60 * 60 * 1000);
        
        // 设置智能提示定时器（每30分钟显示一次）
        setInterval(() => {
            this.notificationManager.showSmartNotification(this.tasks);
        }, 30 * 60 * 1000);
        
        // 启动定期激励系统
        this.notificationManager.startPeriodicMotivation();
    }

    /**
     * 绑定移动端折叠按钮事件
     */
    bindMobileToggle() {
        const toggleBtn = document.getElementById('mobileToggleBtn');
        const inputGroup = document.getElementById('inputGroup');
        
        if (toggleBtn && inputGroup) {
            toggleBtn.addEventListener('click', () => {
                inputGroup.classList.add('expanded');
                toggleBtn.classList.add('expanded');
            });
            
            // 点击其他地方收起
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.input-container')) {
                    inputGroup.classList.remove('expanded');
                    toggleBtn.classList.remove('expanded');
                }
            });
        }
    }

    /**
     * 绑定通知相关事件
     */
    bindNotificationEvents() {
        // 绑定统一通知关闭按钮
        const notification = document.getElementById('unified-notification');
        const closeBtn = notification?.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                // 根据当前通知类型决定调用哪个隐藏方法
                if (notification.classList.contains('motivation')) {
                    this.notificationManager.hideMotivationMessage();
                } else {
                    this.notificationManager.hideTopNotification();
                }
            });
        }
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
        
        // 绑定数据管理按钮事件
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToClipboard());
        }
        
        if (importBtn) {
            importBtn.addEventListener('click', () => this.showImportDialog());
        }
        
        // 绑定导入模态框事件
        const importModal = document.getElementById('importModal');
        const closeImportModal = document.getElementById('closeImportModal');
        const cancelImport = document.getElementById('cancelImport');
        const confirmImport = document.getElementById('confirmImport');
        
        if (closeImportModal) {
            closeImportModal.addEventListener('click', () => this.closeImportModal());
        }
        
        if (cancelImport) {
            cancelImport.addEventListener('click', () => this.closeImportModal());
        }
        
        if (confirmImport) {
            confirmImport.addEventListener('click', () => this.confirmImport());
        }
        
        // 点击模态框背景关闭导入模态框
        if (importModal) {
            importModal.addEventListener('click', (e) => {
                if (e.target === importModal) {
                    this.closeImportModal();
                }
            });
        }
        
        // ESC键关闭导入模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && importModal && importModal.classList.contains('show')) {
                this.closeImportModal();
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
            this.notificationManager.show({
                message: '请输入任务内容',
                type: 'popup',
                urgency: 'medium',
                duration: 3000
            });
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
        
        // 更新用户行为数据
        this.notificationManager.updateUserBehaviorData('task_created');
        
        // 清空输入框
        taskInput.value = '';
        taskInput.focus();
        
        this.updateUI();
        this.notificationManager.show({
            message: '任务添加成功',
            type: 'popup',
            urgency: 'normal',
            duration: 3000
        });
        
        console.log('添加任务:', task);
    }

    /**
     * 切换任务完成状态
     */
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            // 根据完成状态写入完成时间戳，支持下沉排序
            if (task.completed) {
                task.completedAt = new Date().toISOString();
                // 更新用户行为数据 - 任务完成
                this.notificationManager.updateUserBehaviorData('task_completed');
            } else {
                task.completedAt = null;
            }
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.updateUI();
            
            const status = task.completed ? '完成' : '未完成';
            this.notificationManager.show({
                message: `任务已标记为${status}`,
                type: 'popup',
                urgency: 'normal',
                duration: 3000
            });
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
                this.notificationManager.show({
                    message: '任务已删除',
                    type: 'popup',
                    urgency: 'normal',
                    duration: 3000
                });
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
            this.notificationManager.show({
                message: '请输入任务内容',
                type: 'popup',
                urgency: 'medium',
                duration: 3000
            });
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
            this.notificationManager.show({
                message: '任务更新成功',
                type: 'popup',
                urgency: 'normal',
                duration: 3000
            });
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
            // 对每个优先级组内的任务进行排序：已完成的任务下沉
            grouped[priority].sort((a, b) => {
                // 未完成的任务排在前面，已完成的任务下沉
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
            <div class="task-checkbox ${task.completed ? 'checked' : ''}">
                <i class="fas fa-check"></i>
            </div>
            <div class="task-text">${this.escapeHtml(task.text)}</div>
            <div class="task-priority ${task.priority}">${priorityLabels[task.priority]}</div>
            <div class="task-actions">
                <button class="task-action edit-btn" onclick="event.stopPropagation(); app.editTask('${task.id}')" title="编辑">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-action delete-btn" onclick="event.stopPropagation(); app.deleteTask('${task.id}')" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // 为整个任务项添加点击事件来切换完成状态
        taskItem.addEventListener('click', (e) => {
            // 如果点击的是操作按钮，不触发切换
            if (e.target.closest('.task-actions')) {
                return;
            }
            this.toggleTask(task.id);
        });
        
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
        
        // 获取所有任务并按完成状态分组
        const allTasks = this.getFilteredTasks();
        const uncompletedTasks = allTasks.filter(task => !task.completed);
        const completedTasks = allTasks.filter(task => task.completed);
        
        // 为未完成任务按优先级分组
        const uncompletedByPriority = {};
        priorities.forEach(priority => {
            uncompletedByPriority[priority] = uncompletedTasks.filter(task => task.priority === priority);
        });
        
        // 渲染未完成任务的优先级卡片
        priorities.forEach(priority => {
            const container = document.getElementById(`${priority}Tasks`);
            const countElement = document.getElementById(`${priority}Count`);
            const priorityGroup = document.querySelector(`[data-priority="${priority}"]`);
            
            if (!container || !priorityGroup) return;
            
            container.innerHTML = '';
            
            const tasksToShow = uncompletedByPriority[priority];
            
            // 卡片显示/隐藏逻辑
            let shouldShow = false;
            
            if (this.currentFilter !== 'all') {
                // 过滤模式：只显示匹配的优先级组，且该组有任务时才显示
                shouldShow = (this.currentFilter === priority && tasksToShow.length > 0);
            } else {
                // 全部模式：有任务时显示整个分组（包括标题）
                shouldShow = (tasksToShow.length > 0);
            }
            
            // 使用CSS类控制显示隐藏，实现平滑过渡
            if (shouldShow) {
                priorityGroup.classList.remove('hidden');
                priorityGroup.style.display = 'block';
            } else {
                priorityGroup.classList.add('hidden');
                // 延迟隐藏display，让动画完成
                setTimeout(() => {
                    if (priorityGroup.classList.contains('hidden')) {
                        priorityGroup.style.display = 'none';
                    }
                }, 300);
                return;
            }
            
            // 按创建时间排序（新任务在前）
            const sortedTasks = [...tasksToShow].sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            // 更新任务计数（只计算未完成任务）
            if (countElement) {
                countElement.textContent = tasksToShow.length;
                // 当任务数为0时添加视觉提示
                if (tasksToShow.length === 0) {
                    countElement.classList.add('zero-count');
                } else {
                    countElement.classList.remove('zero-count');
                }
            }
            
            // 添加未完成任务元素
            sortedTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                container.appendChild(taskElement);
            });
        });
        
        // 创建或更新已完成任务区域
        this.updateCompletedTasksSection(completedTasks);
        
        // 显示/隐藏空状态
        this.updateEmptyState();
    }
    
    /**
     * 更新已完成任务区域
     */
    updateCompletedTasksSection(completedTasks) {
        // 查找或创建已完成任务容器
        let completedSection = document.getElementById('completedTasksSection');
        const tasksContainer = document.querySelector('.tasks-container');
        
        if (completedTasks.length === 0) {
            // 没有已完成任务，隐藏区域
            if (completedSection) {
                completedSection.style.display = 'none';
            }
            return;
        }
        
        if (!completedSection) {
            // 创建已完成任务区域
            completedSection = document.createElement('div');
            completedSection.id = 'completedTasksSection';
            completedSection.className = 'priority-group completed-section';
            completedSection.innerHTML = `
                <h3 class="priority-title">
                    <i class="fas fa-check-circle"></i>
                    已完成任务
                    <span class="task-count" id="completedTaskCount">0</span>
                </h3>
                <div class="task-list" id="completedTasksList"></div>
            `;
            tasksContainer.appendChild(completedSection);
        }
        
        completedSection.style.display = 'block';
        
        const completedContainer = document.getElementById('completedTasksList');
        const completedCountElement = document.getElementById('completedTaskCount');
        
        if (completedContainer && completedCountElement) {
            completedContainer.innerHTML = '';
            completedCountElement.textContent = completedTasks.length;
            
            // 按完成时间排序（最近完成的在前）
            const sortedCompletedTasks = [...completedTasks].sort((a, b) => {
                return new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt);
            });
            
            // 添加已完成任务元素
            sortedCompletedTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                completedContainer.appendChild(taskElement);
            });
        }
    }

    /**
     * 更新空状态显示
     */
    updateEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const tasksContainer = document.querySelector('.tasks-container');
        
        const filteredTasks = this.getFilteredTasks();
        const uncompletedTasks = filteredTasks.filter(task => !task.completed);
        
        // 检查是否有可见的优先级分组
        const visibleGroups = document.querySelectorAll('.priority-group:not(.hidden)');
        const hasVisibleTasks = uncompletedTasks.length > 0;
        
        if (!hasVisibleTasks || visibleGroups.length === 0) {
            emptyState.classList.add('show');
            // 不隐藏tasksContainer，让已完成任务区域仍然可见
        } else {
            emptyState.classList.remove('show');
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
     * 导出任务数据到剪贴板
     */
    async exportToClipboard() {
        try {
            const data = taskStorage.exportTasks();
            await navigator.clipboard.writeText(data);
            this.notificationManager.show({
                message: '任务数据已复制到剪贴板',
                type: 'popup',
                urgency: 'normal',
                duration: 3000
            });
        } catch (error) {
            console.error('复制到剪贴板失败:', error);
            this.notificationManager.show({
                message: '复制失败，请手动复制',
                type: 'popup',
                urgency: 'medium',
                duration: 3000
            });
        }
    }

    /**
     * 显示导入对话框
     */
    showImportDialog() {
        const importModal = document.getElementById('importModal');
        const importDataInput = document.getElementById('importDataInput');
        
        // 清空输入框
        importDataInput.value = '';
        
        // 显示模态框
        importModal.classList.add('show');
        
        // 聚焦到输入框
        setTimeout(() => {
            importDataInput.focus();
        }, 100);
    }

    /**
     * 从文本导入任务数据
     */
    importFromText(data) {
        try {
            const success = taskStorage.importTasks(data);
            if (success) {
                this.loadTasks();
                this.updateUI();
                this.notificationManager.show({
                    message: '任务数据导入成功',
                    type: 'popup',
                    urgency: 'normal',
                    duration: 3000
                });
            } else {
                this.notificationManager.show({
                    message: '导入失败，请检查数据格式',
                    type: 'popup',
                    urgency: 'medium',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('导入失败:', error);
            this.notificationManager.show({
                message: '导入失败，数据格式错误',
                type: 'popup',
                urgency: 'medium',
                duration: 3000
            });
        }
    }

    /**
     * 关闭导入模态框
     */
    closeImportModal() {
        const importModal = document.getElementById('importModal');
        if (importModal) {
            importModal.classList.remove('show');
        }
    }

    /**
     * 确认导入
     */
    confirmImport() {
        const importDataInput = document.getElementById('importDataInput');
        const data = importDataInput.value.trim();
        
        if (!data) {
            this.notificationManager.show({
                message: '请输入要导入的数据',
                type: 'popup',
                urgency: 'medium',
                duration: 3000
            });
            return;
        }
        
        this.importFromText(data);
        this.closeImportModal();
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
        
        this.notificationManager.show({
            message: '任务数据已导出',
            type: 'popup',
            urgency: 'normal',
            duration: 3000
        });
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

    /**
     * 获取当前时间段
     */
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 23) return 'evening';
        return 'night';
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