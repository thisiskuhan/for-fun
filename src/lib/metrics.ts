import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

// Grafana Cloud OTLP configuration
const grafanaConfig = {
  metricsUrl: process.env.GRAFANA_METRICS_URL || 'https://otlp-gateway-prod-ap-south-1.grafana.net/otlp/v1/metrics',
  username: process.env.GRAFANA_USERNAME || '1464513',
  apiKey: process.env.GRAFANA_API_KEY || '',
};

// Create a custom registry
export const registry = new Registry();

// Add default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register: registry });

// Custom metrics for API tracking
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'country'],
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [registry],
});

export const apiCallsByCountry = new Counter({
  name: 'api_calls_by_country_total',
  help: 'Total API calls per country',
  labelNames: ['country', 'endpoint'],
  registers: [registry],
});

export const apiErrors = new Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['route', 'error_type'],
  registers: [registry],
});

// Push metrics to Grafana Cloud using OTLP format
export async function pushMetricsToGrafana(metricData: {
  name: string;
  value: number;
  labels?: Record<string, string>;
  type?: 'counter' | 'gauge';
}) {
  if (!grafanaConfig.apiKey) {
    // Skip if no API key configured
    return;
  }

  const timeUnixNano = Date.now() * 1000000; // Convert to nanoseconds

  const attributes = Object.entries(metricData.labels || {}).map(([key, value]) => ({
    key,
    value: { stringValue: value },
  }));

  // Add service name attribute
  attributes.push({
    key: 'service',
    value: { stringValue: 'country-info-api' },
  });

  const payload = {
    resourceMetrics: [
      {
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'country-info-api' } },
            { key: 'environment', value: { stringValue: process.env.NODE_ENV || 'development' } },
          ],
        },
        scopeMetrics: [
          {
            scope: { name: 'country-info-api' },
            metrics: [
              {
                name: metricData.name,
                unit: metricData.type === 'counter' ? '1' : 's',
                description: '',
                ...(metricData.type === 'gauge'
                  ? {
                      gauge: {
                        dataPoints: [
                          {
                            asDouble: metricData.value,
                            timeUnixNano,
                            attributes,
                          },
                        ],
                      },
                    }
                  : {
                      sum: {
                        dataPoints: [
                          {
                            asDouble: metricData.value,
                            timeUnixNano,
                            attributes,
                          },
                        ],
                        aggregationTemporality: 2, // CUMULATIVE
                        isMonotonic: true,
                      },
                    }),
              },
            ],
          },
        ],
      },
    ],
  };

  try {
    const auth = Buffer.from(`${grafanaConfig.username}:${grafanaConfig.apiKey}`).toString('base64');
    
    await fetch(grafanaConfig.metricsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to push metrics to Grafana:', error);
  }
}

// Helper to push common API metrics
export async function recordApiMetrics(data: {
  method: string;
  route: string;
  statusCode: number;
  duration: number;
  country: string;
}) {
  // Push request count
  pushMetricsToGrafana({
    name: 'http_requests_total',
    value: 1,
    type: 'counter',
    labels: {
      method: data.method,
      route: data.route,
      status_code: data.statusCode.toString(),
      country: data.country,
    },
  });

  // Push duration
  pushMetricsToGrafana({
    name: 'http_request_duration_seconds',
    value: data.duration,
    type: 'gauge',
    labels: {
      method: data.method,
      route: data.route,
      status_code: data.statusCode.toString(),
    },
  });

  // Push country-specific counter
  pushMetricsToGrafana({
    name: 'api_calls_by_country',
    value: 1,
    type: 'counter',
    labels: {
      country: data.country,
      endpoint: data.route,
    },
  });
}
