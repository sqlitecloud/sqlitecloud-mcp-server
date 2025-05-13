import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
export declare class SQLiteCloudMcpTransport {
    private connectionString;
    mcpTransport: Transport;
    constructor(connectionString: string, mcpTransport: Transport);
    private getDatabase;
    executeQuery(query: string): Promise<any>;
}
