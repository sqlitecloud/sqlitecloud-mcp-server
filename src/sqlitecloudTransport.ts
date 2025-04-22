import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { Database } from '@sqlitecloud/drivers'

export class SQLiteCloudMcpTransport {
  constructor(private connectionString: string, public mcpTransport: Transport) {}

  private getDatabase(): Database {
    return new Database(this.connectionString, err => {
      if (err) {
        console.error('Error opening database:', err)
        throw err
      } else {
        console.info('Database connected')
      }
    })
  }

  async executeQuery(query: string): Promise<any> {
    const db = this.getDatabase()
    try {
      return db.sql(query)
    } finally {
      db.close()
    }
  }
}
