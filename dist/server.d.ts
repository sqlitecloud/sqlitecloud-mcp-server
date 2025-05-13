import { z } from 'zod';
import { SQLiteCloudMcpTransport } from './sqlitecloudTransport.js';
export declare class SQLiteCloudMcpServer {
    private mcpServer;
    private registry;
    constructor();
    connect(transport: SQLiteCloudMcpTransport): Promise<void>;
    getTransport(sessionId: string): SQLiteCloudMcpTransport;
    addCustomTool(name: string, description: string, parameters: z.ZodRawShape, handler: (parameters: any, transport: SQLiteCloudMcpTransport) => Promise<any>): void;
    removeCustomTool(name: string): void;
    private initializeServer;
    private setupServer;
}
