const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');

class TinymistBridge {
    constructor() {
        this.wss = new WebSocket.Server({ 
            port: 8080,
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        console.log('Tinymist bridge server running on ws://localhost:8080');
        this.setupServer();
    }

    setupServer() {
        this.wss.on('connection', (ws, req) => {
            console.log('New WebSocket connection from:', req.socket.remoteAddress);
            
            // Spawn Tinymist LSP process
            const tinymist = spawn('tinymist', ['lsp'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env }
            });

            let messageBuffer = '';
            let isInitialized = false;

            // Handle LSP stdout (responses from Tinymist)
            tinymist.stdout.on('data', (data) => {
                messageBuffer += data.toString();
                
                // Parse LSP messages (Content-Length header format)
                while (true) {
                    const headerEnd = messageBuffer.indexOf('\r\n\r\n');
                    if (headerEnd === -1) break;

                    const headerPart = messageBuffer.substring(0, headerEnd);
                    const contentLengthMatch = headerPart.match(/Content-Length: (\d+)/);
                    
                    if (!contentLengthMatch) {
                        messageBuffer = messageBuffer.substring(headerEnd + 4);
                        continue;
                    }

                    const contentLength = parseInt(contentLengthMatch[1]);
                    const messageStart = headerEnd + 4;
                    
                    if (messageBuffer.length < messageStart + contentLength) break;

                    const messageContent = messageBuffer.substring(messageStart, messageStart + contentLength);
                    messageBuffer = messageBuffer.substring(messageStart + contentLength);

                    try {
                        const message = JSON.parse(messageContent);
                        console.log('LSP -> Client:', message.method || `response(${message.id})`);
                        
                        // Forward to WebSocket client
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify(message));
                        }
                    } catch (error) {
                        console.error('Error parsing LSP message:', error);
                    }
                }
            });

            // Handle LSP stderr (logging/errors from Tinymist)
            tinymist.stderr.on('data', (data) => {
                console.log('Tinymist stderr:', data.toString());
            });

            // Handle WebSocket messages (from Monaco Editor)
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    console.log('Client -> LSP:', message.method || `request(${message.id})`);

                    // Send to Tinymist in LSP format
                    const messageStr = JSON.stringify(message);
                    const headers = `Content-Length: ${Buffer.byteLength(messageStr, 'utf8')}\r\n\r\n`;
                    
                    tinymist.stdin.write(headers + messageStr);

                    // Track initialization
                    if (message.method === 'initialize') {
                        isInitialized = true;
                    }
                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                }
            });

            // Handle connection close
            ws.on('close', () => {
                console.log('WebSocket connection closed');
                tinymist.kill('SIGTERM');
            });

            // Handle LSP process exit
            tinymist.on('exit', (code, signal) => {
                console.log(`Tinymist process exited with code ${code}, signal ${signal}`);
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            });

            // Handle LSP process error
            tinymist.on('error', (error) => {
                console.error('Tinymist process error:', error);
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            });
        });

        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    }
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the bridge server
const bridge = new TinymistBridge();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down bridge server...');
    bridge.wss.close(() => {
        console.log('Bridge server closed');
        process.exit(0);
    });
});
