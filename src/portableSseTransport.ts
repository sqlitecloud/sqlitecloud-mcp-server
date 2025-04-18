import { randomUUID } from 'node:crypto'
import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { JSONRPCMessage, JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js'

interface PortableWriter {
  write: (message: string) => Promise<void>
  close: () => void
}

/**
 * Server transport for SSE to send messages over an SSE connection.
 * 
 * This is a reimplementation of the `SSEServerTransport` class from `@modelcontextprotocol/sdk/server/see`
 * without the dependency with ExpressJS.
 */
export class PortableSSEServerTransport implements Transport {
  private _sseWriter?: PortableWriter
  private _sessionId: string

  onclose?: () => void
  onerror?: (error: Error) => void
  onmessage?: (message: JSONRPCMessage, extra?: { authInfo?: AuthInfo }) => void

  /**
   * Creates a new SSE server transport, which will direct the client to POST messages to the relative or absolute URL identified by `_endpoint`.
   */
  constructor(
    private _endpoint: string,
    private writableStream: PortableWriter
  ) {
    this._sessionId = randomUUID()
  }

  /**
   * Handles the initial SSE connection request.
   *
   * This should be called when a GET request is made to establish the SSE stream.
   */
  async start(): Promise<void> {
    if (this._sseWriter) {
      throw new Error('SSEServerTransport already started! If using Server class, note that connect() calls start() automatically.')
    }

    this._sseWriter = this.writableStream

    // Send the endpoint event
    // Use a dummy base URL because this._endpoint is relative.
    // This allows using URL/URLSearchParams for robust parameter handling.
    const dummyBase = 'http://localhost' // Any valid base works
    const endpointUrl = new URL(this._endpoint, dummyBase)
    endpointUrl.searchParams.set('sessionId', this._sessionId)

    // Reconstruct the relative URL string (pathname + search + hash)
    const relativeUrlWithSession = endpointUrl.pathname + endpointUrl.search + endpointUrl.hash

    this._sseWriter?.write(`event: endpoint\ndata: ${relativeUrlWithSession}\n\n`)
  }

  /**
   * Handle a client message, regardless of how it arrived. This can be used to inform the server of messages that arrive via a means different than HTTP POST.
   */
  async handleMessage(message: unknown): Promise<void> {
    if (!this._sseWriter) {
      const message = 'SSE connection not established'
      throw new Error(message)
    }

    let parsedMessage: JSONRPCMessage
    try {
      parsedMessage = JSONRPCMessageSchema.parse(message)
      this.onmessage?.(parsedMessage)
    } catch (error) {
      this.onerror?.(error as Error)
      throw error
    }
  }

  async close(): Promise<void> {
    this._sseWriter?.close()
    this._sseWriter = undefined
    this.writableStream.close()
    this.onclose?.()
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this._sseWriter) {
      throw new Error('Not connected')
    }

    this._sseWriter.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`)
  }

  /**
   * Returns the session ID for this transport.
   *
   * This can be used to route incoming POST requests.
   */
  get sessionId(): string {
    return this._sessionId
  }
}
