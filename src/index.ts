#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { SQLiteCloudMcpServer } from './server.js'
import { SQLiteCloudMcpTransport } from './sqlitecloudTransport.js'
import { parseArgs } from 'util'

const server = new SQLiteCloudMcpServer()

async function main() {
  // console.debug('Starting SQLite Cloud MCP Server...')
  const {
    values: { connectionString }
  } = parseArgs({
    options: {
      connectionString: {
        type: 'string'
      }
    }
  })

  if (!connectionString) {
    throw new Error('Please provide a Connection String with the --connectionString flag')
  }

  const transport = new SQLiteCloudMcpTransport(connectionString, new StdioServerTransport())
  await server.connect(transport)
  // console.debug('SQLite Cloud MCP Server running on stdio')
}

main().catch(error => {
  console.error('Fatal error in main():', error)
  process.exit(1)
})
