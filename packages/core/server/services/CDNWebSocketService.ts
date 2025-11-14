/**
 * CDN WebSocket Client Service
 * Maintains persistent WebSocket connection to CDN server
 * Receives real-time upload events and creates database records
 */

import { db } from "../db";
import { logger } from "../utils/logger";
import { assets } from "../db/schema";
import { eq } from "drizzle-orm";

interface UploadEvent {
  type: "asset-upload";
  assetId: string;
  directory: string;
  files: Array<{
    name: string;
    size: number;
    relativePath: string;
    cdnUrl: string;
  }>;
  uploadedAt: string;
  uploadedBy: string | null;
}

export class CDNWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private heartbeatInterval: Timer | null = null;
  private isConnecting = false;

  constructor(
    private cdnWsUrl: string,
    private apiKey: string,
  ) {}

  /**
   * Initialize WebSocket connection to CDN
   */
  async connect(): Promise<void> {
    if (
      this.isConnecting ||
      (this.ws && this.ws.readyState === WebSocket.OPEN)
    ) {
      logger.info(
        { context: "CDN WebSocket" },
        "Already connected or connecting",
      );
      return;
    }

    this.isConnecting = true;

    try {
      logger.info(
        { context: "CDN WebSocket" },
        `Connecting to ${this.cdnWsUrl}...`,
      );

      // Create WebSocket connection with API key in query params
      const wsUrl = `${this.cdnWsUrl}?api_key=${encodeURIComponent(this.apiKey)}`;
      this.ws = new WebSocket(wsUrl);

      // Connection opened
      this.ws.onopen = () => {
        logger.info({ context: "CDN WebSocket" }, "Connected successfully");
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.startHeartbeat();
      };

      // Message received
      this.ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data as string);
          await this.handleMessage(message);
        } catch (error) {
          logger.error(
            "[CDN WebSocket] Error parsing message:",
            error instanceof Error ? error.message : String(error),
          );
        }
      };

      // Connection closed
      this.ws.onclose = (event) => {
        logger.info(
          `[CDN WebSocket] Connection closed (code: ${event.code}, reason: ${event.reason})`,
        );
        this.isConnecting = false;
        this.stopHeartbeat();
        this.attemptReconnect();
      };

      // Error occurred
      this.ws.onerror = (error) => {
        logger.error({ err: error }, "[CDN WebSocket] Connection error:");
        this.isConnecting = false;
      };
    } catch (error) {
      logger.error(
        "[CDN WebSocket] Failed to connect:",
        error instanceof Error ? error.message : String(error),
      );
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleMessage(message: any): Promise<void> {
    logger.info(
      { context: "CDN WebSocket", messageType: message.type },
      "Received message",
    );

    if (message.type === "connection") {
      logger.info(
        { context: "CDN WebSocket", message: message.message },
        "Connection message",
      );
      return;
    }

    if (message.type === "asset-upload") {
      await this.handleUploadEvent(message as UploadEvent);
      return;
    }

    // Handle echo/pong responses (CDN sends "echo" instead of "pong")
    if (message.type === "echo" || message.type === "pong") {
      logger.debug({ context: "CDN WebSocket" }, "Heartbeat response received");
      return;
    }

    // Handle other message types if needed
    logger.info(
      { context: "CDN WebSocket", messageType: message.type },
      "Unknown message type",
    );
  }

  /**
   * Handle asset upload event from CDN
   */
  private async handleUploadEvent(event: UploadEvent): Promise<void> {
    try {
      logger.info(
        `[CDN WebSocket] Processing upload event for asset ${event.assetId} (${event.files.length} files)`,
      );

      // Check if asset exists
      const existingAsset = await db.query.assets.findFirst({
        where: eq(assets.id, event.assetId),
      });

      if (!existingAsset) {
        logger.warn(
          `[CDN WebSocket] Asset ${event.assetId} not found in database - skipping`,
        );
        return;
      }

      // Build CDN URL (use the first file's URL as base, then extract base path)
      const firstFile = event.files[0];
      if (!firstFile) {
        logger.warn(
          `[CDN WebSocket] No files in upload event for asset ${event.assetId}`,
        );
        return;
      }

      // Extract base CDN URL (remove file-specific path)
      // Example: https://cdn.example.com/models/asset-123/model.glb -> https://cdn.example.com/models/asset-123
      const cdnUrl = firstFile.cdnUrl.substring(
        0,
        firstFile.cdnUrl.lastIndexOf("/"),
      );

      // Build cdnFiles array with all CDN URLs
      const cdnFiles: string[] = event.files.map((file) => file.cdnUrl);

      // Update asset with CDN information
      await db
        .update(assets)
        .set({
          cdnUrl,
          cdnFiles,
          publishedAt: new Date(event.uploadedAt),
        })
        .where(eq(assets.id, event.assetId));

      logger.info(
        `[CDN WebSocket] Updated asset ${event.assetId} with CDN URL: ${cdnUrl}`,
      );
    } catch (error) {
      logger.error(
        `[CDN WebSocket] Error handling upload event for asset ${event.assetId}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing interval

    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(
        `[CDN WebSocket] Max reconnect attempts (${this.maxReconnectAttempts}) reached - giving up`,
      );
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay,
    );

    logger.info(
      `[CDN WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Disconnect from CDN WebSocket
   */
  disconnect(): void {
    logger.info({ context: "CDN WebSocket" }, "Disconnecting...");
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
