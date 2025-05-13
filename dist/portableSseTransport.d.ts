import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
interface PortableWriter {
    write: (message: string) => Promise<void>;
    close: () => void;
}
/**
 * Server transport for SSE to send messages over an SSE connection.
 *
 * This is a reimplementation of the `SSEServerTransport` class from `@modelcontextprotocol/sdk/server/see`
 * without the dependency with ExpressJS.
 */
export declare class PortableSSEServerTransport implements Transport {
    private _endpoint;
    private writableStream;
    private _sseWriter?;
    private _sessionId;
    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: JSONRPCMessage, extra?: {
        authInfo?: AuthInfo;
    }) => void;
    /**
     * Creates a new SSE server transport, which will direct the client to POST messages to the relative or absolute URL identified by `_endpoint`.
     */
    constructor(_endpoint: string, writableStream: PortableWriter);
    /**
     * Handles the initial SSE connection request.
     *
     * This should be called when a GET request is made to establish the SSE stream.
     */
    start(): Promise<void>;
    /**
     * Handle a client message, regardless of how it arrived. This can be used to inform the server of messages that arrive via a means different than HTTP POST.
     */
    handleMessage(message: unknown, extra?: {
        authInfo?: AuthInfo;
    }): Promise<void>;
    close(): Promise<void>;
    send(message: JSONRPCMessage): Promise<void>;
    /**
     * Returns the session ID for this transport.
     *
     * This can be used to route incoming POST requests.
     */
    get sessionId(): string;
}
export {};
