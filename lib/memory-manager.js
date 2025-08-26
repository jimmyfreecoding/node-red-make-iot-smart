const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * 记忆管理器 - 负责短期记忆（内存）和长期记忆（SQLite数据库）的管理
 */
class MemoryManager {
    constructor(dbPath = null) {
        this.dbPath = dbPath || path.join(__dirname, '..', 'data', 'memory.db');
        this.db = null;
        this.shortTermMemory = new Map(); // 短期记忆（内存）
        this.sessionContext = new Map(); // 会话上下文
        this.maxShortTermEntries = 100; // 短期记忆最大条目数
        this.maxContextLength = 20; // 最大上下文长度
        
        this.initDatabase();
    }

    /**
     * 初始化数据库
     */
    initDatabase() {
        try {
            // 确保数据目录存在
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // 连接数据库
            this.db = new Database(this.dbPath);
            
            // 创建表结构
            this.createTables();
            
            // console.log('Memory database initialized successfully');
        } catch (error) {
            // console.error('Failed to initialize memory database:', error);
            throw error;
        }
    }

    /**
     * 创建数据库表
     */
    createTables() {
        // 对话历史表
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
                content TEXT NOT NULL,
                scenario TEXT,
                metadata TEXT, -- JSON格式的元数据
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 创建对话历史表的索引
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_session_id ON conversations (session_id)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_timestamp ON conversations (timestamp)`);

        // 用户偏好表
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS user_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 流程模板表
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS flow_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                flow_json TEXT NOT NULL,
                scenario TEXT,
                tags TEXT, -- JSON数组格式的标签
                usage_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 创建流程模板表的索引
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_scenario ON flow_templates (scenario)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_usage_count ON flow_templates (usage_count)`);

        // 学习进度表
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS learning_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                completed_lessons TEXT, -- JSON数组格式
                last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
                progress_data TEXT -- JSON格式的进度数据
            )
        `);

        // 创建学习进度表的索引
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_topic ON learning_progress (topic)`);

        // 会话表
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT,
                scenario TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                message_count INTEGER DEFAULT 0
            )
        `);

        // 创建会话表的索引
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions (updated_at)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_scenario ON sessions (scenario)`);
    }

    /**
     * 添加对话记录到长期记忆
     */
    addConversation(sessionId, role, content, scenario = null, metadata = null) {
        try {
            // 确保会话存在
            this.ensureSession(sessionId, null, scenario);
            
            const stmt = this.db.prepare(`
                INSERT INTO conversations (session_id, role, content, scenario, metadata)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            const result = stmt.run(
                sessionId,
                role,
                content,
                scenario,
                metadata ? JSON.stringify(metadata) : null
            );
            
            // 更新会话的updated_at时间戳
            const updateSessionStmt = this.db.prepare(`
                UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
            `);
            updateSessionStmt.run(sessionId);
            
            return result.lastInsertRowid;
        } catch (error) {
            // console.error('Failed to add conversation:', error);
            throw error;
        }
    }

    /**
     * 获取会话历史
     */
    getConversationHistory(sessionId, limit = 50) {
        try {
            const stmt = this.db.prepare(`
                SELECT role, content, scenario, metadata, timestamp
                FROM conversations
                WHERE session_id = ?
                ORDER BY timestamp ASC
                LIMIT ?
            `);
            
            const rows = stmt.all(sessionId, limit);
            return rows.map(row => ({
                ...row,
                metadata: row.metadata ? JSON.parse(row.metadata) : null
            }));
        } catch (error) {
            // console.error('Failed to get conversation history:', error);
            return [];
        }
    }

    /**
     * 搜索相关对话
     */
    searchConversations(query, scenario = null, limit = 10) {
        try {
            let sql = `
                SELECT session_id, role, content, scenario, timestamp
                FROM conversations
                WHERE content LIKE ?
            `;
            const params = [`%${query}%`];
            
            if (scenario) {
                sql += ' AND scenario = ?';
                params.push(scenario);
            }
            
            sql += ' ORDER BY timestamp DESC LIMIT ?';
            params.push(limit);
            
            const stmt = this.db.prepare(sql);
            return stmt.all(...params);
        } catch (error) {
            // console.error('Failed to search conversations:', error);
            return [];
        }
    }

    /**
     * 管理短期记忆
     */
    addToShortTermMemory(key, value, ttl = 3600000) { // 默认1小时TTL
        // 清理过期条目
        this.cleanupShortTermMemory();
        
        // 如果超过最大条目数，删除最旧的条目
        if (this.shortTermMemory.size >= this.maxShortTermEntries) {
            const oldestKey = this.shortTermMemory.keys().next().value;
            this.shortTermMemory.delete(oldestKey);
        }
        
        this.shortTermMemory.set(key, {
            value,
            timestamp: Date.now(),
            ttl
        });
    }

    /**
     * 从短期记忆获取数据
     */
    getFromShortTermMemory(key) {
        const entry = this.shortTermMemory.get(key);
        if (!entry) return null;
        
        // 检查是否过期
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.shortTermMemory.delete(key);
            return null;
        }
        
        return entry.value;
    }

    /**
     * 清理过期的短期记忆
     */
    cleanupShortTermMemory() {
        const now = Date.now();
        for (const [key, entry] of this.shortTermMemory.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.shortTermMemory.delete(key);
            }
        }
    }

    /**
     * 管理会话上下文
     */
    addToSessionContext(sessionId, message) {
        if (!this.sessionContext.has(sessionId)) {
            this.sessionContext.set(sessionId, []);
        }
        
        const context = this.sessionContext.get(sessionId);
        context.push({
            ...message,
            timestamp: Date.now()
        });
        
        // 保持上下文长度限制
        if (context.length > this.maxContextLength) {
            context.shift();
        }
    }

    /**
     * 获取会话上下文
     */
    getSessionContext(sessionId) {
        return this.sessionContext.get(sessionId) || [];
    }

    /**
     * 清理会话上下文
     */
    clearSessionContext(sessionId) {
        this.sessionContext.delete(sessionId);
    }

    /**
     * 用户偏好管理
     */
    setUserPreference(key, value, category = 'general') {
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO user_preferences (key, value, category, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `);
            
            stmt.run(key, JSON.stringify(value), category);
        } catch (error) {
            // console.error('Failed to set user preference:', error);
            throw error;
        }
    }

    /**
     * 获取用户偏好
     */
    getUserPreference(key, defaultValue = null) {
        try {
            const stmt = this.db.prepare(`
                SELECT value FROM user_preferences WHERE key = ?
            `);
            
            const row = stmt.get(key);
            return row ? JSON.parse(row.value) : defaultValue;
        } catch (error) {
            // console.error('Failed to get user preference:', error);
            return defaultValue;
        }
    }

    /**
     * 流程模板管理
     */
    saveFlowTemplate(name, description, flowJson, scenario, tags = []) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO flow_templates (name, description, flow_json, scenario, tags)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            const result = stmt.run(
                name,
                description,
                JSON.stringify(flowJson),
                scenario,
                JSON.stringify(tags)
            );
            
            return result.lastInsertRowid;
        } catch (error) {
            // console.error('Failed to save flow template:', error);
            throw error;
        }
    }

    /**
     * 获取流程模板
     */
    getFlowTemplates(scenario = null, limit = 20) {
        try {
            let sql = `
                SELECT id, name, description, flow_json, scenario, tags, usage_count
                FROM flow_templates
            `;
            const params = [];
            
            if (scenario) {
                sql += ' WHERE scenario = ?';
                params.push(scenario);
            }
            
            sql += ' ORDER BY usage_count DESC, created_at DESC LIMIT ?';
            params.push(limit);
            
            const stmt = this.db.prepare(sql);
            const rows = stmt.all(...params);
            
            return rows.map(row => ({
                ...row,
                flow_json: JSON.parse(row.flow_json),
                tags: JSON.parse(row.tags || '[]')
            }));
        } catch (error) {
            // console.error('Failed to get flow templates:', error);
            return [];
        }
    }

    /**
     * 增加模板使用次数
     */
    incrementTemplateUsage(templateId) {
        try {
            const stmt = this.db.prepare(`
                UPDATE flow_templates 
                SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);
            
            stmt.run(templateId);
        } catch (error) {
            // console.error('Failed to increment template usage:', error);
        }
    }

    /**
     * 获取记忆统计信息
     */
    getMemoryStats() {
        try {
            const conversationCount = this.db.prepare('SELECT COUNT(*) as count FROM conversations').get().count;
            const templateCount = this.db.prepare('SELECT COUNT(*) as count FROM flow_templates').get().count;
            const preferenceCount = this.db.prepare('SELECT COUNT(*) as count FROM user_preferences').get().count;
            
            return {
                conversations: conversationCount,
                templates: templateCount,
                preferences: preferenceCount,
                shortTermMemory: this.shortTermMemory.size,
                activeSessions: this.sessionContext.size
            };
        } catch (error) {
            // console.error('Failed to get memory stats:', error);
            return null;
        }
    }

    /**
     * 清理旧数据
     */
    cleanup(daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            const stmt = this.db.prepare(`
                DELETE FROM conversations 
                WHERE timestamp < ?
            `);
            
            const result = stmt.run(cutoffDate.toISOString());
            // console.log(`Cleaned up ${result.changes} old conversation records`);
            
            return result.changes;
        } catch (error) {
            // console.error('Failed to cleanup old data:', error);
            return 0;
        }
    }

    /**
     * 创建新会话
     */
    createSession(sessionId, title = null, scenario = null) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO sessions (id, title, scenario, created_at, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `);
            
            const result = stmt.run(sessionId, title, scenario);
            return result.changes > 0;
        } catch (error) {
            // console.error('Failed to create session:', error);
            return false;
        }
    }

    /**
     * 获取会话列表
     */
    getSessions(limit = 20) {
        try {
            const stmt = this.db.prepare(`
                SELECT s.*, 
                       COUNT(c.id) as message_count,
                       MAX(c.timestamp) as last_message_time,
                       (
                           SELECT content 
                           FROM conversations 
                           WHERE session_id = s.id AND role = 'user' 
                           ORDER BY timestamp ASC 
                           LIMIT 1
                       ) as first_user_message
                FROM sessions s
                LEFT JOIN conversations c ON s.id = c.session_id
                GROUP BY s.id
                ORDER BY s.updated_at DESC
                LIMIT ?
            `);
            
            return stmt.all(limit);
        } catch (error) {
            // console.error('Failed to get sessions:', error);
            return [];
        }
    }

    /**
     * 获取会话详情
     */
    getSession(sessionId) {
        try {
            const stmt = this.db.prepare(`
                SELECT s.*, 
                       COUNT(c.id) as message_count,
                       MAX(c.timestamp) as last_message_time
                FROM sessions s
                LEFT JOIN conversations c ON s.id = c.session_id
                WHERE s.id = ?
                GROUP BY s.id
            `);
            
            return stmt.get(sessionId);
        } catch (error) {
            // console.error('Failed to get session:', error);
            return null;
        }
    }

    /**
     * 更新会话信息
     */
    updateSession(sessionId, updates = {}) {
        try {
            const fields = [];
            const values = [];
            
            if (updates.title !== undefined) {
                fields.push('title = ?');
                values.push(updates.title);
            }
            
            if (updates.scenario !== undefined) {
                fields.push('scenario = ?');
                values.push(updates.scenario);
            }
            
            fields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(sessionId);
            
            const stmt = this.db.prepare(`
                UPDATE sessions 
                SET ${fields.join(', ')}
                WHERE id = ?
            `);
            
            const result = stmt.run(...values);
            return result.changes > 0;
        } catch (error) {
            // console.error('Failed to update session:', error);
            return false;
        }
    }

    /**
     * 删除会话及其所有对话
     */
    deleteSession(sessionId) {
        try {
            // 开始事务
            const deleteConversations = this.db.prepare('DELETE FROM conversations WHERE session_id = ?');
            const deleteSession = this.db.prepare('DELETE FROM sessions WHERE id = ?');
            
            const transaction = this.db.transaction(() => {
                deleteConversations.run(sessionId);
                deleteSession.run(sessionId);
            });
            
            transaction();
            return true;
        } catch (error) {
            // console.error('Failed to delete session:', error);
            return false;
        }
    }

    /**
     * 删除所有会话及其对话
     */
    deleteAllSessions() {
        try {
            // 开始事务
            const deleteAllConversations = this.db.prepare('DELETE FROM conversations');
            const deleteAllSessions = this.db.prepare('DELETE FROM sessions');
            
            const transaction = this.db.transaction(() => {
                deleteAllConversations.run();
                deleteAllSessions.run();
            });
            
            transaction();
            
            // 清理内存中的会话上下文
            this.sessionContext.clear();
            
            return true;
        } catch (error) {
            // console.error('Failed to delete all sessions:', error);
            return false;
        }
    }

    /**
     * 确保会话存在，如果不存在则创建
     */
    ensureSession(sessionId, title = null, scenario = null) {
        try {
            const session = this.getSession(sessionId);
            if (!session) {
                return this.createSession(sessionId, title, scenario);
            }
            return true;
        } catch (error) {
            // console.error('Failed to ensure session:', error);
            return false;
        }
    }

    /**
     * 关闭数据库连接
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            // console.log('Database connection closed');
        }
        
        this.shortTermMemory.clear();
        this.sessionContext.clear();
    }
}

module.exports = MemoryManager;