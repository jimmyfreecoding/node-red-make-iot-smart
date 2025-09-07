const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Memory Manager - Manages short-term memory (RAM) and long-term memory (SQLite database)
 */
class MemoryManager {
    constructor(dbPath = null) {
        this.dbPath = dbPath || path.join(__dirname, '..', 'data', 'memory.db');
        this.db = null;
        this.shortTermMemory = new Map(); // Short-term memory (RAM)
        this.sessionContext = new Map(); // Session context
        this.maxShortTermEntries = 100; // Maximum short-term memory entries
        this.maxContextLength = 20; // Maximum context length
        
        this.initDatabase();
    }

    /**
     * Initialize database
     */
    initDatabase() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Connect to database
            this.db = new Database(this.dbPath);
            
            // Create table structure
            this.createTables();
            
            // console.log('Memory database initialized successfully');
        } catch (error) {
            // console.error('Failed to initialize memory database:', error);
            throw error;
        }
    }

    /**
     * Create database tables
     */
    createTables() {
        // Conversation history table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
                content TEXT NOT NULL,
                scenario TEXT,
                metadata TEXT, -- JSON format metadata
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for conversation history table
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_session_id ON conversations (session_id)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_timestamp ON conversations (timestamp)`);

        // User preferences table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS user_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Flow templates table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS flow_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                flow_json TEXT NOT NULL,
                scenario TEXT,
                tags TEXT, -- JSON array format tags
                usage_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for flow templates table
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_scenario ON flow_templates (scenario)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_usage_count ON flow_templates (usage_count)`);

        // Learning progress table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS learning_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                completed_lessons TEXT, -- JSON array format
                last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
                progress_data TEXT -- JSON format progress data
            )
        `);

        // Create indexes for learning progress table
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_topic ON learning_progress (topic)`);

        // Sessions table
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

        // Create indexes for sessions table
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions (updated_at)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_scenario ON sessions (scenario)`);
    }

    /**
     * Add conversation record to long-term memory
     */
    addConversation(sessionId, role, content, scenario = null, metadata = null) {
        try {
            // Ensure session exists
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
            
            // Update session's updated_at timestamp
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
     * Get conversation history
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
     * Search related conversations
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
     * Manage short-term memory
     */
    addToShortTermMemory(key, value, ttl = 3600000) { // Default 1 hour TTL
        // Clean up expired entries
        this.cleanupShortTermMemory();
        
        // If exceeds maximum entries, delete oldest entry
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
     * Get data from short-term memory
     */
    getFromShortTermMemory(key) {
        const entry = this.shortTermMemory.get(key);
        if (!entry) return null;
        
        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.shortTermMemory.delete(key);
            return null;
        }
        
        return entry.value;
    }

    /**
     * Clean up expired short-term memory
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
     * Manage session context
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
        
        // Maintain context length limit
        if (context.length > this.maxContextLength) {
            context.shift();
        }
    }

    /**
     * Get session context
     */
    getSessionContext(sessionId) {
        return this.sessionContext.get(sessionId) || [];
    }

    /**
     * Clear session context
     */
    clearSessionContext(sessionId) {
        this.sessionContext.delete(sessionId);
    }

    /**
     * User preference management
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
     * Get user preference
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
     * Flow template management
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
     * Get flow templates
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
     * Increment template usage count
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
     * Get memory statistics
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
     * Clean up old data
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
     * Create new session
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
     * Get session list
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
     * Get session details
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
     * Update session information
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
     * Delete session and all its conversations
     */
    deleteSession(sessionId) {
        try {
            // Start transaction
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
     * Delete all sessions and their conversations
     */
    deleteAllSessions() {
        try {
            // Begin transaction
            const deleteAllConversations = this.db.prepare('DELETE FROM conversations');
            const deleteAllSessions = this.db.prepare('DELETE FROM sessions');
            
            const transaction = this.db.transaction(() => {
                deleteAllConversations.run();
                deleteAllSessions.run();
            });
            
            transaction();
            
            // Clear session context in memory
            this.sessionContext.clear();
            
            return true;
        } catch (error) {
            // console.error('Failed to delete all sessions:', error);
            return false;
        }
    }

    /**
     * Ensure session exists, create if not exists
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
     * Close database connection
     */
    close() {
        if (this.db) {
            try {
                // Force close all prepared statements
                this.db.close();
                this.db = null;
                // console.log('Database connection closed');
            } catch (error) {
                // Force close if normal close fails
                try {
                    if (this.db && typeof this.db.close === 'function') {
                        this.db.close();
                    }
                } catch (forceError) {
                    // Ignore force close errors
                }
                this.db = null;
                // console.log('Database connection force closed due to error:', error.message);
            }
        }
        
        this.shortTermMemory.clear();
        this.sessionContext.clear();
    }

    /**
     * Force close database connection (for emergency cleanup)
     */
    forceClose() {
        if (this.db) {
            try {
                // Try to close gracefully first
                this.db.close();
            } catch (error) {
                // If graceful close fails, force null the reference
                // This allows garbage collection to handle cleanup
            } finally {
                this.db = null;
            }
        }
        
        this.shortTermMemory.clear();
        this.sessionContext.clear();
    }
}

module.exports = MemoryManager;