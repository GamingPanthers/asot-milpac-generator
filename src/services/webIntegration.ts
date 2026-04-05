import logger from '../utils/logger';
import { config } from '../config';

/**
 * Service to notify milpac-web of completed image generation
 */
export class WebIntegrationService {
  private static readonly REQUEST_TIMEOUT = 10000; // 10 seconds

  /**
   * Notify milpac-web of completed image generation
   * Uses webhook authentication similar to incoming requests
   */
  static async notifyImageGeneration(
    memberID: string,
    imageUrl: string
  ): Promise<boolean> {
    try {
      // Validate input
      if (!memberID || typeof memberID !== 'string') {
        logger.warn('Invalid memberID for notification', { memberID });
        return false;
      }
      if (!imageUrl || typeof imageUrl !== 'string') {
        logger.warn('Invalid imageUrl for notification', { memberID, imageUrl });
        return false;
      }

      const webUrl = process.env.MILPAC_WEB_URL || 'http://localhost:3000';

      // Use webhook API key for authentication (same as incoming webhook)
      const authHeader = `Bearer ${config.WEBHOOK_API_KEY}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      try {
        const response = await fetch(`${webUrl}/api/milpac/${memberID}/image-generated`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            memberID,
            imageUrl,
            timestamp: new Date().toISOString(),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          logger.warn('Web service notification failed', {
            memberID,
            status: response.status,
            error: errorText.substring(0, 200),
          });
          return false;
        }

        logger.info('Successfully notified web service of image generation', { memberID });
        return true;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn('Web notification timeout', { memberID });
      } else {
        logger.warn('Error notifying web service', { memberID, error: error instanceof Error ? error.message : error });
      }
      return false;
    }
  }
}

export default WebIntegrationService;
