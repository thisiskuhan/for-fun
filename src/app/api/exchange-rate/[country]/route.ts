import { NextRequest, NextResponse } from 'next/server';
import { httpRequestsTotal, httpRequestDuration, apiCallsByCountry, apiErrors, recordApiMetrics } from '@/lib/metrics';
import { log } from '@/lib/logger';

// INR conversion rates for different currencies (rates as of sample data)
// This represents how much 1 unit of each currency is worth in INR
const inrConversionRates: Record<string, number> = {
  'USD': 83.12,
  'GBP': 105.50,
  'JPY': 0.56,
  'INR': 1.00,
  'EUR': 90.25,
  'CAD': 61.20,
  'AUD': 54.00,
  'CNY': 11.65,
  'BRL': 16.75,
  'MXN': 4.85,
  'KRW': 0.064,
  'RUB': 0.93,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  const startTime = Date.now();
  const { country } = await params;
  const countryKey = country.toLowerCase().replace(/-/g, ' ');
  const route = '/api/exchange-rate';

  try {
    // Step 1: Call our own currency API to get the currency for this country
    const baseUrl = request.nextUrl.origin;
    const currencyApiUrl = `${baseUrl}/api/currency/${encodeURIComponent(country)}`;
    
    log.info('Calling internal currency API', {
      country: countryKey,
      internalApiUrl: currencyApiUrl,
      step: 'fetching_currency',
    });

    const currencyResponse = await fetch(currencyApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Pass along request ID for tracing
        'x-request-id': request.headers.get('x-request-id') || crypto.randomUUID(),
      },
    });

    if (!currencyResponse.ok) {
      const duration = (Date.now() - startTime) / 1000;
      const errorData = await currencyResponse.json();
      
      // Record metrics for failed dependency
      httpRequestsTotal.inc({ method: 'GET', route, status_code: '404', country: countryKey });
      httpRequestDuration.observe({ method: 'GET', route, status_code: '404' }, duration);
      apiErrors.inc({ route, error_type: 'dependency_not_found' });
      recordApiMetrics({ method: 'GET', route, statusCode: 404, duration, country: countryKey });
      log.apiRequest({ method: 'GET', route: `${route}/${country}`, country: countryKey, statusCode: 404, duration, request });

      return NextResponse.json(
        { 
          error: 'Country not found', 
          message: `Could not find currency for "${country}"`,
          details: errorData,
          dependencyApi: '/api/currency',
        },
        { status: 404 }
      );
    }

    const currencyData = await currencyResponse.json();
    const currencySymbol = currencyData.symbol;

    log.info('Currency API response received', {
      country: countryKey,
      currency: currencyData.currency,
      symbol: currencySymbol,
      step: 'currency_fetched',
    });

    // Step 2: Get INR conversion rate for this currency
    const inrRate = inrConversionRates[currencySymbol];

    if (!inrRate) {
      const duration = (Date.now() - startTime) / 1000;
      
      httpRequestsTotal.inc({ method: 'GET', route, status_code: '404', country: countryKey });
      httpRequestDuration.observe({ method: 'GET', route, status_code: '404' }, duration);
      apiErrors.inc({ route, error_type: 'conversion_rate_not_found' });
      recordApiMetrics({ method: 'GET', route, statusCode: 404, duration, country: countryKey });
      log.apiRequest({ method: 'GET', route: `${route}/${country}`, country: countryKey, statusCode: 404, duration, request });

      return NextResponse.json(
        { 
          error: 'Conversion rate not available', 
          message: `INR conversion rate for ${currencySymbol} is not available`,
          currency: currencyData,
        },
        { status: 404 }
      );
    }

    const duration = (Date.now() - startTime) / 1000;

    // Record success metrics
    httpRequestsTotal.inc({ method: 'GET', route, status_code: '200', country: countryKey });
    httpRequestDuration.observe({ method: 'GET', route, status_code: '200' }, duration);
    apiCallsByCountry.inc({ country: countryKey, endpoint: 'exchange-rate' });
    recordApiMetrics({ method: 'GET', route, statusCode: 200, duration, country: countryKey });
    log.apiRequest({ method: 'GET', route: `${route}/${country}`, country: countryKey, statusCode: 200, duration, request });

    log.info('Exchange rate calculation complete', {
      country: countryKey,
      fromCurrency: currencySymbol,
      toCurrency: 'INR',
      rate: inrRate,
      duration,
    });

    return NextResponse.json({
      country: country,
      currency: {
        name: currencyData.currency,
        symbol: currencySymbol,
      },
      exchangeRate: {
        from: currencySymbol,
        to: 'INR',
        rate: inrRate,
        description: `1 ${currencySymbol} = ₹${inrRate.toFixed(2)} INR`,
      },
      example: {
        amount: 100,
        converted: parseFloat((100 * inrRate).toFixed(2)),
        description: `100 ${currencySymbol} = ₹${(100 * inrRate).toFixed(2)} INR`,
      },
      metadata: {
        dependencyApi: '/api/currency',
        processingTimeMs: Math.round(duration * 1000),
      },
    });

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    
    httpRequestsTotal.inc({ method: 'GET', route, status_code: '500', country: countryKey });
    httpRequestDuration.observe({ method: 'GET', route, status_code: '500' }, duration);
    apiErrors.inc({ route, error_type: 'internal_error' });
    recordApiMetrics({ method: 'GET', route, statusCode: 500, duration, country: countryKey });
    
    log.error('Exchange rate API error', {
      country: countryKey,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    log.apiRequest({ method: 'GET', route: `${route}/${country}`, country: countryKey, statusCode: 500, duration, request });

    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: 'Failed to fetch exchange rate',
      },
      { status: 500 }
    );
  }
}
