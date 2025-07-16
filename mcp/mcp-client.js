const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');

class MCPClientHelper {
    constructor() {
        this.client = null;
        this.transport = null;
        this.serverInfo = null;
        this.isConnected = false;
    }

    async connect(command, args = [], customEnv = {}) {
        try {
            // Parse command, handle cases like "npx package"
            let finalCommand, finalArgs;
            if (command.includes(" ")) {
                const parts = command.split(" ");
                finalCommand = parts[0];
                finalArgs = [...parts.slice(1), ...args];
            } else {
                finalCommand = command;
                finalArgs = args;
            }

            // Merge environment variables
            const env = { ...process.env, ...customEnv };

            // Create transport
            this.transport = new StdioClientTransport({
                command: finalCommand,
                args: finalArgs,
                env: env,
            });

            // Create client
            this.client = new Client({
                name: "node-red-make-iot-smart",
                version: "1.0.0",
            });

            // Connect to server
            await this.client.connect(this.transport);

            // Get server information
            this.serverInfo = await this.client.listTools();
            this.isConnected = true;

            return true;
        } catch (error) {
            console.error('MCP connection failed:', error);
            this.isConnected = false;
            return false;
        }
    }

    isClientConnected() {
        return this.isConnected && this.client;
    }

    async getServerInfo() {
        if (!this.serverInfo) {
            this.serverInfo = await this.client.listTools();
        }
        return this.serverInfo;
    }

    async callTool(toolName, toolArgs) {
        if (!this.isClientConnected()) {
            throw new Error('MCP client not connected');
        }

        try {
            const result = await this.client.callTool({
                name: toolName,
                arguments: toolArgs
            });
            return result;
        } catch (error) {
            throw new Error(`MCP tool call failed: ${error.message}`);
        }
    }

    async disconnect() {
        if (this.transport) {
            await this.transport.close();
            this.transport = null;
        }
        this.client = null;
        this.serverInfo = null;
        this.isConnected = false;
    }
}

module.exports = MCPClientHelper;