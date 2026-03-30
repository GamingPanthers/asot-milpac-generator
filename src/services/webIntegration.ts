import logger from '../utils/logger';

/**
 * Service to notify milpac-web of completed image generation
 */
export class WebIntegrationService {
  /**
   * Update member image in milpac-web after generation completes
   */
  static async notifyImageGeneration(
    memberID: string,
    imagePath: string
  ): Promise<boolean> {
    try {
      const webUrl = process.env.MILPAC_WEB_URL || 'http://localhost:3000';
      const apiKey = process.env.GENERATOR_API_KEY || '';

      if (!apiKey) {
        logger.warn('GENERATOR_API_KEY not configured, skipping web notification');
        return false;
      }

      const response = await fetch(`${webUrl}/api/generator/image-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          memberID,
          imagePath,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Failed to notify milpac-web of image generation', {
          memberID,
          status: response.status,
          error,
        });
        return false;
      }

      const result = await response.json();
      logger.info('Successfully notified milpac-web of image generation', {
        memberID,
        imagePath,
      });
      return true;
    } catch (error) {
      logger.error('Error notifying milpac-web', { memberID, error });
      return false;
    }
  }
}

export default WebIntegrationService;
