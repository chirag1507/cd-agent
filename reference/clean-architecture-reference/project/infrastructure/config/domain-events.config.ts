/**
 * Configuration for domain events infrastructure.
 * 
 * This configuration centralizes all domain event related settings
 * and provides validation for required environment variables.
 */
export interface DomainEventsConfig {
  sqs: {
    region: string;
    queueUrl: string;
    endpoint?: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
      sessionToken?: string;
    };
  };
}

/**
 * Load domain events configuration from environment variables
 */
export function loadDomainEventsConfig(): DomainEventsConfig {
  const requiredEnvVars = ['DOMAIN_EVENTS_QUEUE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for domain events: ${missingVars.join(', ')}`
    );
  }

  return {
    sqs: {
      region: process.env.AWS_REGION || 'us-east-1',
      queueUrl: process.env.DOMAIN_EVENTS_QUEUE_URL!,
      endpoint: process.env.AWS_ENDPOINT_URL, // For LocalStack development
      credentials: process.env.AWS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        sessionToken: process.env.AWS_SESSION_TOKEN
      } : undefined
    }
  };
}

/**
 * Validate domain events configuration
 */
export function validateDomainEventsConfig(config: DomainEventsConfig): void {
  if (!config.sqs.queueUrl) {
    throw new Error('SQS queue URL is required for domain events');
  }

  if (!config.sqs.region) {
    throw new Error('AWS region is required for domain events');
  }

  // Validate queue URL format (basic validation)
  const queueUrlPattern = /^https:\/\/sqs\.[a-z0-9-]+\.amazonaws\.com\/\d+\/[a-zA-Z0-9_-]+(.fifo)?$/;
  const isLocalStack = config.sqs.endpoint && config.sqs.endpoint.includes('localhost');
  
  if (!isLocalStack && !queueUrlPattern.test(config.sqs.queueUrl)) {
    console.warn('SQS queue URL format may be invalid. Expected format: https://sqs.region.amazonaws.com/account-id/queue-name');
  }
}
