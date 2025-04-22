import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { SQLiteCloudMcpTransport } from './sqlitecloudTransport.js'

export class SQLiteCloudMcpServer {
  private mcpServer: McpServer

  private registry: Record<string, SQLiteCloudMcpTransport>

  constructor() {
    this.registry = {}

    this.mcpServer = this.initializeServer()
    this.setupServer()
  }

  async connect(transport: SQLiteCloudMcpTransport): Promise<void> {
    const mcpTransport = transport.mcpTransport
    let sessionId = mcpTransport.sessionId
    if (!sessionId) {
      sessionId = 'anonymous'
      mcpTransport.sessionId = sessionId
    }

    mcpTransport.onerror = error => {
      console.error('Error in transport:', error)
      delete this.registry[sessionId]
    }
    mcpTransport.onclose = () => {
      delete this.registry[sessionId]
    }

    this.registry[sessionId] = transport
    await this.mcpServer.connect(mcpTransport)
  }

  getTransport(sessionId: string): SQLiteCloudMcpTransport {
    const transport = this.registry[sessionId]
    if (!transport) {
      throw new Error(`Transport not found for session ID: ${sessionId}`)
    }
    return transport
  }

  private initializeServer(): McpServer {
    return new McpServer(
      {
        name: 'sqlitecloud-mcp-server',
        version: '0.0.1',
        description: 'MCP Server for SQLite Cloud: https://sqlitecloud.io'
      },
      {
        capabilities: { tools: {} },
        instructions: 'This server provides tools to interact with SQLite databases on SQLite Cloud, execute SQL queries, manage table schemas and analyze performance metrics.'
      }
    )
  }

  private setupServer(): void {
    this.mcpServer.tool(
      'read-query',
      'Execute a SELECT query on the SQLite database on SQLite Cloud',
      {
        query: z.string().describe('SELECT SQL query to execute')
      },
      async ({ query }, extra) => {
        // console.log("Executing read-query with query:", query, "and parameters:", parameters);
        if (!query.trim().toUpperCase().startsWith('SELECT')) {
          throw new Error('Only SELECT queries are allowed for read-query')
        }

        if (!extra.sessionId) {
          throw new Error('Session ID is required')
        }

        const results = await this.getTransport(extra.sessionId).executeQuery(query)
        return { content: [{ type: 'text', text: JSON.stringify(results) }] }
      }
    )

    this.mcpServer.tool(
      'write-query',
      'Execute a INSERT, UPDATE, or DELETE query on the SQLite database on SQLite Cloud',
      {
        query: z.string().describe('SELECT SQL query to execute')
      },
      async ({ query }, extra) => {
        // console.log("Executing write-query with query:", query, "and parameters:", parameters);
        if (query.trim().toUpperCase().startsWith('SELECT')) {
          throw new Error('SELECT queries are not allowed for write_query')
        }

        if (!extra.sessionId) {
          throw new Error('Session ID is required')
        }

        const results = await this.getTransport(extra.sessionId).executeQuery(query)

        return { content: [{ type: 'text', text: JSON.stringify(results) }] }
      }
    )

    this.mcpServer.tool(
      'create-table',
      'Create a new table in the SQLite database on SQLite Cloud',
      {
        query: z.string().describe('CREATE TABLE SQL statement')
      },
      async ({ query }, extra) => {
        if (!query.trim().toUpperCase().startsWith('CREATE TABLE')) {
          throw new Error('Only CREATE TABLE statements are allowed')
        }

        if (!extra.sessionId) {
          throw new Error('Session ID is required')
        }

        const results = await this.getTransport(extra.sessionId).executeQuery(query)

        return {
          content: [{ type: 'text', text: 'Table created successfully' }]
        }
      }
    )

    this.mcpServer.tool('list-tables', 'List all tables in the SQLite database on SQLite Cloud', {}, async ({}, extra) => {
      if (!extra.sessionId) {
        throw new Error('Session ID is required')
      }

      const results = await this.getTransport(extra.sessionId).executeQuery("SELECT name FROM sqlite_master WHERE type='table'")

      return { content: [{ type: 'text', text: JSON.stringify(results) }] }
    })

    this.mcpServer.tool(
      'describe-table',
      'Get the schema information for a specific table on SQLite Cloud database',
      {
        tableName: z.string().describe('Name of the table to describe')
      },
      async ({ tableName }, extra) => {
        if (!extra.sessionId) {
          throw new Error('Session ID is required')
        }

        const results = await this.getTransport(extra.sessionId).executeQuery(`PRAGMA table_info(${tableName})`)
        return { content: [{ type: 'text', text: JSON.stringify(results) }] }
      }
    )

    this.mcpServer.tool('list-commands', 'List all available commands and their descriptions from the SQLite database and an external documentation page.', {}, async ({}, extra) => {
      try {
        if (!extra.sessionId) {
          throw new Error('Session ID is required')
        }

        const results = await this.getTransport(extra.sessionId).executeQuery('LIST COMMANDS;')

        // Download the documentation page
        const documentationUrl = 'https://raw.githubusercontent.com/sqlitecloud/docs/refs/heads/main/sqlite-cloud/reference/general-commands.mdx'
        const response = await fetch(documentationUrl, {
          redirect: 'follow'
        })
        const documentationContent = await response.text()

        return {
          content: [
            { type: 'text', text: JSON.stringify(results) },
            { type: 'text', text: documentationContent }
          ]
        }
      } catch (error) {
        throw new Error('Failed to list commands and fetch documentation.', { cause: error})
      }
    })

    this.mcpServer.tool(
      'execute-command',
      'Execute only SQLite Cloud commands listed in the `list-commands` tool. You can use the `list-commands` tool to see the available commands.',
      {
        command: z.string().describe('SQLite Cloud available command to execute')
      },
      async ({ command }, extra) => {
        if (!extra.sessionId) {
          throw new Error('Session ID is required')
        }

        const results = await this.getTransport(extra.sessionId).executeQuery(command)
        return { content: [{ type: 'text', text: JSON.stringify(results) }] }
      }
    )

    this.mcpServer.tool(
      'list-analyzer',
      'Returns a rowset with the slowest queries performed on the connected this.mcpServer. Supports filtering with GROUPID, DATABASE, GROUPED, and NODE options.',
      {
        groupId: z.string().optional().describe('Group ID to filter the results'),
        database: z.string().optional().describe('Database name to filter the results'),
        grouped: z.boolean().optional().describe('Whether to group the slowest queries'),
        node: z.string().optional().describe('Node ID to execute the command on a specific cluster node')
      },
      async ({ groupId, database, grouped, node }, extra) => {
        let query = 'LIST ANALYZER'
        if (groupId) query += ` GROUPID ${groupId}`
        if (database) query += ` DATABASE ${database}`
        if (grouped) query += ' GROUPED'
        if (node) query += ` NODE ${node}`

        if (!extra.sessionId) {
          throw new Error('Session ID is required')
        }

        const results = await this.getTransport(extra.sessionId).executeQuery(query)

        return { content: [{ type: 'text', text: JSON.stringify(results) }] }
      }
    )

    this.mcpServer.tool(
      'analyzer-plan-id',
      'Gathers information about the indexes used in the query plan of a query execution.',
      {
        queryId: z.string().describe('Query ID to analyze'),
        node: z.string().optional().describe('SQLite Cloud Node ID to execute the command on a specific cluster node')
      },
      async ({ queryId, node }, extra) => {
        let query = `ANALYZER PLAN ID ${queryId}`
        if (node) query += ` NODE ${node}`

        if (!extra.sessionId) {
          throw new Error('Session ID is required')
        }

        const results = await this.getTransport(extra.sessionId).executeQuery(query)
        return { content: [{ type: 'text', text: JSON.stringify(results) }] }
      }
    )

    this.mcpServer.tool(
      'analyzer-reset',
      'Resets the statistics about a specific query, group of queries, or database.',
      {
        queryId: z.string().optional().describe('Query ID to reset'),
        groupId: z.string().optional().describe('Group ID to reset'),
        database: z.string().optional().describe('Database name to reset'),
        all: z.boolean().optional().describe('Whether to reset all statistics'),
        node: z.string().optional().describe('SQLite Cloud Node ID to execute the command on a specific cluster node')
      },
      async ({ queryId, groupId, database, all, node }, extra) => {
        let query = 'ANALYZER RESET'
        if (queryId) query += ` ID ${queryId}`
        if (groupId) query += ` GROUPID ${groupId}`
        if (database) query += ` DATABASE ${database}`
        if (all) query += ' ALL'
        if (node) query += ` NODE ${node}`

        if (!extra.sessionId) {
          throw new Error('Session ID is required')
        }

        const results = await this.getTransport(extra.sessionId).executeQuery(query)
        return { content: [{ type: 'text', text: JSON.stringify(results) }] }
      }
    )
  }
}
