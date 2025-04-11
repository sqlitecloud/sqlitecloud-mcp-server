# Model Context Protocol (MCP) Server for SQLite Cloud

## Overview
The MCP Server for SQLite Cloud is designed to facilitate seamless interaction with SQLite Cloud databases. It leverages the Model Context Protocol (MCP) to provide an interface for executing queries, commands and analyzing query performance.

## Features
- **Execute Queries**: Run `SELECT`, `INSERT`, `UPDATE`, and `DELETE` SQL queries on SQLite Cloud databases.
- **Schema Management**: Create new tables, list existing tables, and retrieve schema information for specific tables.
- **Command Execution**: Execute predefined commands supported by SQLite Cloud.
- **Performance Analysis**: Analyze the slowest queries, gather information about query plans, and reset query statistics.

## Tools
The MCP Server provides the following tools:

1. **read-query**: Execute `SELECT` queries and retrieve results.
2. **write-query**: Execute `INSERT`, `UPDATE`, or `DELETE` queries.
3. **create-table**: Create new tables in the database.
4. **list-tables**: List all tables in the database.
5. **describe-table**: Retrieve schema information for a specific table.
6. **list-commands**: List all available commands and fetch external documentation.
7. **execute-command**: Execute commands listed in the `list-commands` tool.
8. **list-analyzer**: Analyze the slowest queries with optional filters.
9. **analyzer-plan-id**: Gather information about query plans and indexes.
10. **analyzer-reset**: Reset query statistics for specific queries, groups, or databases.

## Getting Started
To use the MCP Server, ensure you have a valid connection string for your SQLite Cloud database. The server can be started using the following command:

```bash
node build/index.js --connectionString <your_connection_string>
```

Replace `<your_connection_string>` with the appropriate connection string for your SQLite Cloud project.

## Configure in your AI Agent

### VSCode

[Official documentation](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)

1. **Locate the settings.json file**: Open `VSCode Settings` and search for `mcp`. Edit the `User`'s `settings.json`. _MCP requires your connection string and it's not safe to keep it into the project's VSCode settings._

2. **Add the MCP configuration**: Include the following configuration in the settings.json file:

```json
{
  "mcp": {
    "inputs": [],
    "servers": {
      "sqlitecloud-mcp-server": {
        "type": "stdio",
        "command": "node",
        "args": [
          "build/index.js",
          "--connectionString",
          "<your_connection_string>"
        ]
      }
    }
  }
}
```

# Build


```bash
npm run build
```