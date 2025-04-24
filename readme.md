# Model Context Protocol (MCP) Server for SQLite Cloud

> _This project is currently in the experimental phase. Feel free to explore, report issues, and share your feedback._

![mcp-demonstration](https://private-user-images.githubusercontent.com/6153996/436944588-e374f8f0-1bc6-4079-ae3e-21bfe842c412.gif)

## Overview

The MCP Server for SQLite Cloud enables seamless interaction with SQLite Cloud databases using the AI models. It utilizes the Model Context Protocol (MCP) to provide tools for executing queries, managing schemas, and analyzing query performance.

## Features

- **Query Execution**: Perform `SELECT`, `INSERT`, `UPDATE`, and `DELETE` SQL operations on SQLite Cloud databases.
- **Schema Management**: Create tables, list existing ones, and retrieve schema details.
- **Command Execution**: Run predefined commands supported by SQLite Cloud.
- **Performance Analysis**: Identify slow queries, analyze query plans, and reset query statistics.

## Tools

The MCP Server offers the following tools:

1. **read-query**: Perform `SELECT` queries and fetch results.
2. **write-query**: Perform `INSERT`, `UPDATE`, or `DELETE` operations.
3. **create-table**: Create new database tables.
4. **list-tables**: Display all tables in the database.
5. **describe-table**: Retrieve schema details for a specific table.
6. **list-commands**: List available commands and access external documentation.
7. **execute-command**: Run commands from the `list-commands` tool.
8. **list-analyzer**: Analyze slow queries with optional filters.
9. **analyzer-plan-id**: Gather details about query plans and indexes.
10. **analyzer-reset**: Reset query statistics for specific queries, groups, or databases.

## Getting Started

To use the MCP Server, create a [free account on SQLite Cloud](https://sqlitecloud.io) and get your _Connection String_.  
Start the server with the following command:

```bash
npx @sqlitecloud/mcp-server --connectionString <your_connection_string>
```

Replace `<your_connection_string>` with your SQLite Cloud connection string.

## Configure Your AI model

### Requirements

Ensure Node.js is installed on your machine with:

```bash
node --version
```

If Node.js is not installed, you can download it from [nodejs.org](https://nodejs.org/).

### VSCode Integration

Refer to the [official documentation](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) for detailed instructions.

1. In the root of your project create the file `.vscode/mcp.json`

2. Add the following configuration (choose the server configuration you prefer):

```json
{
  "mcp": {
    "inputs": [
     {
       "type": "promptString",
       "id": "sqlitecloud-connection-string",
       "description": "Set the SQLite Cloud Connection String",
       "password": true
     }
    ],
    "servers": {
      "sqlitecloud-mcp-server-dev": {
        "type": "stdio",
        "command": "node",
        "args": [
          "./build/index.js",
          "--connectionString",
          "${input:sqlitecloud-connection-string}"
        ]
      },
      "sqlitecloud-mcp-server": {
        "type": "stdio",
        "command": "npx",
        "args": [
          "-y",
          "@sqlitecloud/mcp-server",
          "--connectionString",
          "${input:sqlitecloud-connection-string}"
        ]
      },
      "sqlitecloud-mcp-server-sse": {
        "type": "sse",
        "url": "<YOUR_NODE_ADDRESS>/v1/mcp/sse",
        "headers": {
          "Authorization": "Bearer ${input:sqlitecloud-connection-string}"
        }
      }
    }
  }
}
```

## Development

### Build

```bash
npm run build
```

### Run

After building the package, run it with:

```bash
node build/index.js --connectionString <CONNECTION_STRING>
```

### Local Testing

To locally test the package:

1. Pack the package:

```bash
npm pack
```

2. Run the packed file:

```bash
npx <PACKAGE_FILENAME>.tgz --connectionString <CONNECTION_STRING>
```

### Inspection

Use the inspector to test `stdio` and `sse` transports. First, build the package, then run:

```bash
npx @modelcontextprotocol/inspector@latest
```

Access the inspector at: [http://127.0.0.1:6274/](http://127.0.0.1:6274/)

#### Stdio Transport

- **Transport Type**: `stdio`
- **Command**: `npx`
- **Arguments**: `<PATH_TO_PACKAGE_FOLDER> --connectionString <CONNECTION_STRING>`

_Note: Use the `PATH_TO_PACKAGE_FOLDER` from your home directory to avoid permission issues._

#### SSE Transport

To test `sse` transport with a remote or local server:

- **URL**: `http://localhost:8090/v1/mcp/sse`
