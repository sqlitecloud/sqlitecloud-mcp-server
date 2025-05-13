import { Database } from '@sqlitecloud/drivers';
export class SQLiteCloudMcpTransport {
    connectionString;
    mcpTransport;
    constructor(connectionString, mcpTransport) {
        this.connectionString = connectionString;
        this.mcpTransport = mcpTransport;
    }
    getDatabase() {
        return new Database(this.connectionString, err => {
            if (err) {
                console.error('Error opening database:', err);
                throw err;
            }
        });
    }
    async executeQuery(query) {
        const db = this.getDatabase();
        try {
            return db.sql(query);
        }
        finally {
            db.close();
        }
    }
}
