import { config } from '../src/config';

describe('Config', () => {
  it('should load environment variables', () => {
    expect(config.PORT).toBeDefined();
    expect(config.WEBHOOK_API_KEY).toBeDefined();
    expect(config.MONGO_URL).toBeDefined();
    expect(config.REDIS_URL).toBeDefined();
  });

  it('should have correct default values', () => {
    expect(config.PORT).toBe(42070);
    expect(config.IMAGE_WIDTH).toBe(1398);
    expect(config.IMAGE_HEIGHT).toBe(1000);
    expect(config.MAX_RETRIES).toBe(5);
  });
});
