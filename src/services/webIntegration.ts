import logger from '../utils/logger';

/**
 * Service to notify milpac-web of completed image generation
 */
export class WebIntegrationService {
  private static readonly REQUEST_TIMEOUT = 10000; // 10 seconds

  /**
   * Notify milpac-web of completed image generation
   * Updates member record with image path after successful generation
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
      const apiKey = process.env.GENERATOR_API_KEY;

      // Check if API key is configured
      if (!apiKey) {
        logger.warn('GENERATOR_API_KEY not configured - skipping web notification', { memberID });
        return false;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      try {
        const response = await fetch(`${webUrl}/api/generator/image-update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            memberID,
            imagePath: imageUrl,
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
