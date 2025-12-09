import winston from 'winston';
import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

// Loki transport configuration
// For Grafana Cloud, logs will be pushed via the /loki/api/v1/push endpoint
const lokiConfig = {
  host: process.env.LOKI_HOST || 'http://localhost:3100',
  username: process.env.LOKI_USERNAME || '',
  password: process.env.LOKI_PASSWORD || '',
};

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
  defaultMeta: { 
    service: 'country-info-api',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport for local development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Helper to extract detailed request information
export function extractRequestDetails(request: NextRequest) {
  const headers = request.headers;
  
  // IP Address - check various headers (works on Vercel, Cloudflare, etc.)
  const ip = 
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||  // Cloudflare
    'unknown';

  // Geo data (Vercel provides these automatically)
  const geo = {
    country: headers.get('x-vercel-ip-country') || undefined,
    countryRegion: headers.get('x-vercel-ip-country-region') || undefined,
    city: headers.get('x-vercel-ip-city') || undefined,
    latitude: headers.get('x-vercel-ip-latitude') || undefined,
    longitude: headers.get('x-vercel-ip-longitude') || undefined,
  };

  // Request details
  const requestDetails = {
    requestId: headers.get('x-request-id') || randomUUID(),
    ip,
    userAgent: headers.get('user-agent') || undefined,
    referer: headers.get('referer') || undefined,
    origin: headers.get('origin') || undefined,
    host: headers.get('host') || undefined,
    contentType: headers.get('content-type') || undefined,
    acceptLanguage: headers.get('accept-language') || undefined,
    geo: Object.values(geo).some(v => v) ? geo : undefined, // Only include if has data
  };

  // Get query parameters
  const url = new URL(request.url);
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  return {
    ...requestDetails,
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    path: url.pathname,
  };
}

// Helper function to push logs to Loki
export async function pushToLoki(logEntry: {
  level: string;
  message: string;
  labels?: Record<string, string>;
  metadata?: Record<string, unknown>;
}) {
  if (!lokiConfig.host || lokiConfig.host === 'http://localhost:3100') {
    // Skip Loki push in development without config
    return;
  }

  const timestamp = (Date.now() * 1000000).toString(); // Loki expects nanoseconds
  
  const labels = {
    service: 'country-info-api',
    level: logEntry.level,
    environment: process.env.NODE_ENV || 'development',
    ...logEntry.labels,
  };

  const payload = {
    streams: [
      {
        stream: labels,
        values: [
          [
            timestamp,
            JSON.stringify({
              message: logEntry.message,
              ...logEntry.metadata,
            }),
          ],
        ],
      },
    ],
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add basic auth for Grafana Cloud
    if (lokiConfig.username && lokiConfig.password) {
      headers['Authorization'] = 'Basic ' + 
        Buffer.from(`${lokiConfig.username}:${lokiConfig.password}`).toString('base64');
    }

    await fetch(`${lokiConfig.host}/loki/api/v1/push`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Failed to push logs to Loki:', error);
  }
}

// Convenience logging functions
export const log = {
  info: (message: string, metadata?: Record<string, unknown>, labels?: Record<string, string>) => {
    logger.info(message, metadata);
    pushToLoki({ level: 'info', message, metadata, labels });
  },
  
  warn: (message: string, metadata?: Record<string, unknown>, labels?: Record<string, string>) => {
    logger.warn(message, metadata);
    pushToLoki({ level: 'warn', message, metadata, labels });
  },
  
  error: (message: string, metadata?: Record<string, unknown>, labels?: Record<string, string>) => {
    logger.error(message, metadata);
    pushToLoki({ level: 'error', message, metadata, labels });
  },
  
  debug: (message: string, metadata?: Record<string, unknown>, labels?: Record<string, string>) => {
    logger.debug(message, metadata);
    pushToLoki({ level: 'debug', message, metadata, labels });
  },

  // Enhanced API request logging with full details
  apiRequest: (data: {
    method: string;
    route: string;
    country: string;
    statusCode: number;
    duration: number;
    request: NextRequest;
  }) => {
    const requestDetails = extractRequestDetails(data.request);
    
    const message = `API Request: ${data.method} ${data.route}`;
    const metadata = {
      method: data.method,
      route: data.route,
      country: data.country,
      statusCode: data.statusCode,
      duration: data.duration,
      durationMs: Math.round(data.duration * 1000),
      timestamp: new Date().toISOString(),
      ...requestDetails,
    };
    
    const labels = {
      route: data.route,
      country: data.country,
      status_code: data.statusCode.toString(),
      ip: requestDetails.ip,
    };
    
    logger.info(message, metadata);
    pushToLoki({ level: 'info', message, metadata, labels });
  },
};
