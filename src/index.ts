import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Database, SQLiteCloudDataTypes } from "@sqlitecloud/drivers";
import { parseArgs } from "node:util";
import { z } from "zod";

let db: Database | null;

const server = new McpServer({
  name: "sqlitecloud-database",
  version: "0.0.1",
  capabilities: {
    resources: {},
    tools: {},
    prompts: {}
  },
  description: "MCP Server for SQLite Cloud: https://sqlitecloud.io",
});

function getDatabase(connectionString: string): Database {
  if (!db || !db.isConnected()) {
    db = new Database(connectionString, (err) => {
      if (err) {
        // console.error("Error opening database:", err);
        throw err;
      } else {
        // console.info("Database opened successfully");
      }
    });
  }
  return db;
}

async function main() {
  const {
    values: { connectionString },
  } = parseArgs({
    options: {
      connectionString: {
        type: 'string',
      },
    },
  });

  if (!connectionString) {
    // console.error('Please provide a Connection String with the --connectionString flag');
    throw new Error('Please provide a Connection String with the --connectionString flag');
  }
  
  server.tool(
    "read-query",
    "Execute a SELECT query on the SQLite database on SQLite Cloud",
    {
      query: z.string().describe("SELECT SQL query to execute"),
    },
    async ({ query }) => {
      // console.log("Executing read-query with query:", query, "and parameters:", parameters);
      if (!query.trim().toUpperCase().startsWith("SELECT")) {
        throw new Error("Only SELECT queries are allowed for read-query");
      }
      const results = await getDatabase(connectionString).sql(query);
      return { content: [{ type: "text", text: JSON.stringify(results) }] };
    }
  );

  server.tool(
    "write-query",
    "Execute a INSERT, UPDATE, or DELETE query on the SQLite database on SQLite Cloud",
    {
      query: z.string().describe("SELECT SQL query to execute"),
    },
    async ({ query }) => {
      // console.log("Executing write-query with query:", query, "and parameters:", parameters);
      if (query.trim().toUpperCase().startsWith("SELECT")) {
        throw new Error("SELECT queries are not allowed for write_query");
      }
      const results = await getDatabase(connectionString).sql(query);
      return { content: [{ type: "text", text: JSON.stringify(results) }] };
    }
  );

  server.tool(
    "create-table",
    "Create a new table in the SQLite database on SQLite Cloud",
    {
      query: z.string().describe("CREATE TABLE SQL statement"),
    },
    async ({ query }) => {
      if (!query.trim().toUpperCase().startsWith("CREATE TABLE")) {
        throw new Error("Only CREATE TABLE statements are allowed");
      }
      await getDatabase(connectionString).sql(query);
      return {
        content: [{ type: "text", text: "Table created successfully" }],
      };
    }
  );

  server.tool(
    "list-tables",
    "List all tables in the SQLite database on SQLite Cloud",
    {},
    async () => {
      const results = await getDatabase(connectionString).sql(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      return { content: [{ type: "text", text: JSON.stringify(results) }] };
    }
  );

  server.tool(
    "describe-table",
    "Get the schema information for a specific table",
    {
      tableName: z.string().describe("Name of the table to describe"),
    },
    async ({ tableName }) => {
      const results = await getDatabase(connectionString).sql(`PRAGMA table_info(${tableName})`);
      return { content: [{ type: "text", text: JSON.stringify(results) }] };
    }
  );

  server.tool(
    "list-commands",
    "List all available commands and their descriptions from the SQLite database and an external documentation page.",
    {},
    async () => {
      try {
        const queryResults = await getDatabase(connectionString).sql("LIST COMMANDS;");
  
        // Download the documentation page
        const documentationUrl = "https://raw.githubusercontent.com/sqlitecloud/docs/refs/heads/main/sqlite-cloud/reference/general-commands.mdx";
        const response = await fetch(documentationUrl, { redirect: "follow" });
        const documentationContent = await response.text();
        // console.log("doc:", documentationContent);
  
        return {
          content: [
            { type: "text", text: JSON.stringify(queryResults) },
            { type: "text", text: documentationContent },
          ],
        };
      } catch (error) {
        // console.error("Error in list-commands tool:", error);
        throw new Error("Failed to list commands and fetch documentation.");
      }
    }
  );

  server.tool(
    "execute-command",
    "Execute on SQLite Cloud only commands listed in the `list-commands` tool. You can use the `list-commands` tool to see the available commands.",
    {
      command: z.string().describe("SQLite Cloud available command to execute"),
    },
    async ({ command }) => {
      const results = await getDatabase(connectionString).sql(command);
      return { content: [{ type: "text", text: JSON.stringify(results) }] };
    }
  );

  server.tool(
    "list-analyzer",
    "Returns a rowset with the slowest queries performed on the connected server. Supports filtering with GROUPID, DATABASE, GROUPED, and NODE options.",
    {
      groupId: z.string().optional().describe("Group ID to filter the results"),
      database: z.string().optional().describe("Database name to filter the results"),
      grouped: z.boolean().optional().describe("Whether to group the slowest queries"),
      node: z.string().optional().describe("Node ID to execute the command on a specific cluster node")
    },
    async ({ groupId, database, grouped, node }) => {
      let query = "LIST ANALYZER";
      if (groupId) query += ` GROUPID ${groupId}`;
      if (database) query += ` DATABASE ${database}`;
      if (grouped) query += " GROUPED";
      if (node) query += ` NODE ${node}`;

      const results = await getDatabase(connectionString).sql(query);
      return { content: [{ type: "text", text: JSON.stringify(results) }] };
    }
  );

  server.tool(
    "analyzer-plan-id",
    "Gathers information about the indexes used in the query plan of a query execution.",
    {
      queryId: z.string().describe("Query ID to analyze"),
      node: z.string().optional().describe("SQLite Cloud Node ID to execute the command on a specific cluster node")
    },
    async ({ queryId, node }) => {
      let query = `ANALYZER PLAN ID ${queryId}`;
      if (node) query += ` NODE ${node}`;

      const results = await getDatabase(connectionString).sql(query);
      return { content: [{ type: "text", text: JSON.stringify(results) }] };
    }
  );

  server.tool(
    "analyzer-reset",
    "Resets the statistics about a specific query, group of queries, or database.",
    {
      queryId: z.string().optional().describe("Query ID to reset"),
      groupId: z.string().optional().describe("Group ID to reset"),
      database: z.string().optional().describe("Database name to reset"),
      all: z.boolean().optional().describe("Whether to reset all statistics"),
      node: z.string().optional().describe("SQLite Cloud Node ID to execute the command on a specific cluster node")
    },
    async ({ queryId, groupId, database, all, node }) => {
      let query = "ANALYZER RESET";
      if (queryId) query += ` ID ${queryId}`;
      if (groupId) query += ` GROUPID ${groupId}`;
      if (database) query += ` DATABASE ${database}`;
      if (all) query += " ALL";
      if (node) query += ` NODE ${node}`;

      const results = await getDatabase(connectionString).sql(query);
      return { content: [{ type: "text", text: JSON.stringify(results) }] };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // console.info("SQLite Cloud MCP Server running on stdio");
}

main().catch((error) => {
  // console.error("Fatal error in main():", error);
  process.exit(1);
});
