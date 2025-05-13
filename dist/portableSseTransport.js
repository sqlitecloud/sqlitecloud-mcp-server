import { randomUUID } from 'node:crypto';
import { JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';
/**
 * Server transport for SSE to send messages over an SSE connection.
 *
 * This is a reimplementation of the `SSEServerTransport` class from `@modelcontextprotocol/sdk/server/see`
 * without the dependency with ExpressJS.
 */
export class PortableSSEServerTransport {
    _endpoint;
    writableStream;
    _sseWriter;
    _sessionId;
    onclose;
    onerror;
    onmessage;
    /**
     * Creates a new SSE server transport, which will direct the client to POST messages to the relative or absolute URL identified by `_endpoint`.
     */
    constructor(_endpoint, writableStream) {
        this._endpoint = _endpoint;
        this.writableStream = writableStream;
        this._sessionId = randomUUID();
    }
    /**
     * Handles the initial SSE connection request.
     *
     * This should be called when a GET request is made to establish the SSE stream.
     */
    async start() {
        if (this._sseWriter) {
            throw new Error('SSEServerTransport already started! If using Server class, note that connect() calls start() automatically.');
        }
        this._sseWriter = this.writableStream;
        // Send the endpoint event
        // Use a dummy base URL because this._endpoint is relative.
        // This allows using URL/URLSearchParams for robust parameter handling.
        const dummyBase = 'http://localhost'; // Any valid base works
        const endpointUrl = new URL(this._endpoint, dummyBase);
        endpointUrl.searchParams.set('sessionId', this._sessionId);
        // Reconstruct the relative URL string (pathname + search + hash)
        const relativeUrlWithSession = endpointUrl.pathname + endpointUrl.search + endpointUrl.hash;
        this._sseWriter?.write(`event: endpoint\ndata: ${relativeUrlWithSession}\n\n`);
    }
    /**
     * Handle a client message, regardless of how it arrived. This can be used to inform the server of messages that arrive via a means different than HTTP POST.
     */
    async handleMessage(message, extra) {
        if (!this._sseWriter) {
            const message = 'SSE connection not established';
            throw new Error(message);
        }
        let parsedMessage;
        try {
            parsedMessage = JSONRPCMessageSchema.parse(message);
            this.onmessage?.(parsedMessage, extra);
        }
        catch (error) {
            this.onerror?.(error);
            throw error;
        }
    }
    async close() {
        this._sseWriter?.close();
        this._sseWriter = undefined;
        this.writableStream.close();
        this.onclose?.();
    }
    async send(message) {
        if (!this._sseWriter) {
            throw new Error('Not connected');
        }
        this._sseWriter.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`);
    }
    /**
     * Returns the session ID for this transport.
     *
     * This can be used to route incoming POST requests.
     */
    get sessionId() {
        return this._sessionId;
    }
}
