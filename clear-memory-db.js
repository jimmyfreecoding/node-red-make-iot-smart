const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Clear all tables in the memory.db database
 */
function clearMemoryDatabase() {
    const dbPath = path.join(__dirname, 'data', 'memory.db');
    
    try {
        // Check if database file exists
        if (!fs.existsSync(dbPath)) {
            console.log('Database file does not exist, no need to clear');
            return;
        }
        
        // Connect to database
        const db = new Database(dbPath);
        
        console.log('Starting to clear database tables...');
        
        // Clear data from all tables
        const tables = [
            'conversations',
            'user_preferences', 
            'flow_templates',
            'learning_progress',
            'sessions'
        ];
        
        // Begin transaction
        const transaction = db.transaction(() => {
            tables.forEach(tableName => {
                try {
                    const result = db.prepare(`DELETE FROM ${tableName}`).run();
                    console.log(`Cleared table ${tableName}, deleted ${result.changes} records`);
                } catch (error) {
                    console.log(`Table ${tableName} does not exist or clearing failed: ${error.message}`);
                }
            });
            
            // Reset auto-increment IDs (if needed)
            tables.forEach(tableName => {
                try {
                    db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(tableName);
                } catch (error) {
                    // Ignore errors, some tables may not have auto-increment fields
                }
            });
        });
        
        // Execute transaction
        transaction();
        
        console.log('All tables have been successfully cleared!');
        
        // Close database connection
        db.close();
        
    } catch (error) {
        console.error('Error occurred while clearing database:', error);
    }
}

// Execute clearing operation
clearMemoryDatabase();