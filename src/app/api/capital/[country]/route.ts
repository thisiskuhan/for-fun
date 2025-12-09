import { NextRequest, NextResponse } from 'next/server';
import { httpRequestsTotal, httpRequestDuration, apiCallsByCountry, apiErrors, recordApiMetrics } from '@/lib/metrics';
import { log } from '@/lib/logger';

const capitalData: Record<string, { capital: string; population: string }> = {
  'usa': { capital: 'Washington, D.C.', population: '689,545' },
  'united states': { capital: 'Washington, D.C.', population: '689,545' },
  'uk': { capital: 'London', population: '8,982,000' },
  'united kingdom': { capital: 'London', population: '8,982,000' },
  'japan': { capital: 'Tokyo', population: '13,960,000' },
  'india': { capital: 'New Delhi', population: '16,787,941' },
  'germany': { capital: 'Berlin', population: '3,645,000' },
  'france': { capital: 'Paris', population: '2,161,000' },
  'canada': { capital: 'Ottawa', population: '1,017,449' },
  'australia': { capital: 'Canberra', population: '453,558' },
  'china': { capital: 'Beijing', population: '21,540,000' },
  'brazil': { capital: 'Brasília', population: '3,039,444' },
  'mexico': { capital: 'Mexico City', population: '9,209,944' },
  'south korea': { capital: 'Seoul', population: '9,733,509' },
  'russia': { capital: 'Moscow', population: '12,506,468' },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  const startTime = Date.now();
  const { country } = await params;
  const countryKey = country.toLowerCase().replace(/-/g, ' ');
  const route = '/api/capital';
  
  const data = capitalData[countryKey];
  
  if (!data) {
    const duration = (Date.now() - startTime) / 1000;
    httpRequestsTotal.inc({ method: 'GET', route, status_code: '404', country: countryKey });
    httpRequestDuration.observe({ method: 'GET', route, status_code: '404' }, duration);
    apiErrors.inc({ route, error_type: 'not_found' });
    recordApiMetrics({ method: 'GET', route, statusCode: 404, duration, country: countryKey });
    log.apiRequest({ method: 'GET', route: `${route}/${country}`, country: countryKey, statusCode: 404, duration, request });

    return NextResponse.json(
      { error: 'Country not found', message: `Capital city data for "${country}" is not available` },
      { status: 404 }
    );
  }

  const duration = (Date.now() - startTime) / 1000;
  httpRequestsTotal.inc({ method: 'GET', route, status_code: '200', country: countryKey });
  httpRequestDuration.observe({ method: 'GET', route, status_code: '200' }, duration);
  apiCallsByCountry.inc({ country: countryKey, endpoint: 'capital' });
  recordApiMetrics({ method: 'GET', route, statusCode: 200, duration, country: countryKey });
  log.apiRequest({ method: 'GET', route: `${route}/${country}`, country: countryKey, statusCode: 200, duration, request });

  return NextResponse.json({
    country: country,
    capitalCity: data.capital,
    capitalPopulation: data.population,
  });
}
