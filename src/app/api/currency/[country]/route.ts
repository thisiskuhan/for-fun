import { NextRequest, NextResponse } from 'next/server';
import { httpRequestsTotal, httpRequestDuration, apiCallsByCountry, apiErrors, recordApiMetrics } from '@/lib/metrics';
import { log } from '@/lib/logger';

// Sample currency data for countries
const currencyData: Record<string, { currency: string; symbol: string; value: string }> = {
  'usa': { currency: 'US Dollar', symbol: 'USD', value: '1.00' },
  'united states': { currency: 'US Dollar', symbol: 'USD', value: '1.00' },
  'uk': { currency: 'British Pound', symbol: 'GBP', value: '0.79' },
  'united kingdom': { currency: 'British Pound', symbol: 'GBP', value: '0.79' },
  'japan': { currency: 'Japanese Yen', symbol: 'JPY', value: '149.50' },
  'india': { currency: 'Indian Rupee', symbol: 'INR', value: '83.12' },
  'germany': { currency: 'Euro', symbol: 'EUR', value: '0.92' },
  'france': { currency: 'Euro', symbol: 'EUR', value: '0.92' },
  'canada': { currency: 'Canadian Dollar', symbol: 'CAD', value: '1.36' },
  'australia': { currency: 'Australian Dollar', symbol: 'AUD', value: '1.54' },
  'china': { currency: 'Chinese Yuan', symbol: 'CNY', value: '7.14' },
  'brazil': { currency: 'Brazilian Real', symbol: 'BRL', value: '4.97' },
  'mexico': { currency: 'Mexican Peso', symbol: 'MXN', value: '17.15' },
  'south korea': { currency: 'South Korean Won', symbol: 'KRW', value: '1298.50' },
  'russia': { currency: 'Russian Ruble', symbol: 'RUB', value: '89.50' },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  const startTime = Date.now();
  const { country } = await params;
  const countryKey = country.toLowerCase().replace(/-/g, ' ');
  const route = '/api/currency';
  
  const data = currencyData[countryKey];
  
  if (!data) {
    const duration = (Date.now() - startTime) / 1000;
    
    // Record local metrics
    httpRequestsTotal.inc({ method: 'GET', route, status_code: '404', country: countryKey });
    httpRequestDuration.observe({ method: 'GET', route, status_code: '404' }, duration);
    apiErrors.inc({ route, error_type: 'not_found' });
    
    // Push to Grafana Cloud
    recordApiMetrics({ method: 'GET', route, statusCode: 404, duration, country: countryKey });
    
    // Log the request
    log.apiRequest({ method: 'GET', route: `${route}/${country}`, country: countryKey, statusCode: 404, duration, request });

    return NextResponse.json(
      { error: 'Country not found', message: `Currency data for "${country}" is not available` },
      { status: 404 }
    );
  }

  const duration = (Date.now() - startTime) / 1000;
  
  // Record local metrics
  httpRequestsTotal.inc({ method: 'GET', route, status_code: '200', country: countryKey });
  httpRequestDuration.observe({ method: 'GET', route, status_code: '200' }, duration);
  apiCallsByCountry.inc({ country: countryKey, endpoint: 'currency' });
  
  // Push to Grafana Cloud
  recordApiMetrics({ method: 'GET', route, statusCode: 200, duration, country: countryKey });
  
  // Log the request
  log.apiRequest({ method: 'GET', route: `${route}/${country}`, country: countryKey, statusCode: 200, duration, request });

  return NextResponse.json({
    country: country,
    currency: data.currency,
    symbol: data.symbol,
    valueAgainstUSD: data.value,
    date: new Date().toISOString().split('T')[0],
  });
}
