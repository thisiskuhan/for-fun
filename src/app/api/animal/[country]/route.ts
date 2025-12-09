import { NextRequest, NextResponse } from 'next/server';
import { httpRequestsTotal, httpRequestDuration, apiCallsByCountry, apiErrors, recordApiMetrics } from '@/lib/metrics';
import { log } from '@/lib/logger';

const animalData: Record<string, { animal: string; scientificName: string }> = {
  'usa': { animal: 'Bald Eagle', scientificName: 'Haliaeetus leucocephalus' },
  'united states': { animal: 'Bald Eagle', scientificName: 'Haliaeetus leucocephalus' },
  'uk': { animal: 'Lion', scientificName: 'Panthera leo' },
  'united kingdom': { animal: 'Lion', scientificName: 'Panthera leo' },
  'japan': { animal: 'Green Pheasant', scientificName: 'Phasianus versicolor' },
  'india': { animal: 'Bengal Tiger', scientificName: 'Panthera tigris tigris' },
  'germany': { animal: 'Federal Eagle', scientificName: 'Aquila chrysaetos' },
  'france': { animal: 'Gallic Rooster', scientificName: 'Gallus gallus domesticus' },
  'canada': { animal: 'North American Beaver', scientificName: 'Castor canadensis' },
  'australia': { animal: 'Red Kangaroo', scientificName: 'Macropus rufus' },
  'china': { animal: 'Giant Panda', scientificName: 'Ailuropoda melanoleuca' },
  'brazil': { animal: 'Jaguar', scientificName: 'Panthera onca' },
  'mexico': { animal: 'Golden Eagle', scientificName: 'Aquila chrysaetos' },
  'south korea': { animal: 'Siberian Tiger', scientificName: 'Panthera tigris altaica' },
  'russia': { animal: 'Eurasian Brown Bear', scientificName: 'Ursus arctos arctos' },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  const startTime = Date.now();
  const { country } = await params;
  const countryKey = country.toLowerCase().replace(/-/g, ' ');
  const route = '/api/animal';
  
  const data = animalData[countryKey];
  
  if (!data) {
    const duration = (Date.now() - startTime) / 1000;
    httpRequestsTotal.inc({ method: 'GET', route, status_code: '404', country: countryKey });
    httpRequestDuration.observe({ method: 'GET', route, status_code: '404' }, duration);
    apiErrors.inc({ route, error_type: 'not_found' });
    recordApiMetrics({ method: 'GET', route, statusCode: 404, duration, country: countryKey });
    log.apiRequest({ method: 'GET', route: `${route}/${country}`, country: countryKey, statusCode: 404, duration, request });

    return NextResponse.json(
      { error: 'Country not found', message: `National animal data for "${country}" is not available` },
      { status: 404 }
    );
  }

  const duration = (Date.now() - startTime) / 1000;
  httpRequestsTotal.inc({ method: 'GET', route, status_code: '200', country: countryKey });
  httpRequestDuration.observe({ method: 'GET', route, status_code: '200' }, duration);
  apiCallsByCountry.inc({ country: countryKey, endpoint: 'animal' });
  recordApiMetrics({ method: 'GET', route, statusCode: 200, duration, country: countryKey });
  log.apiRequest({ method: 'GET', route: `${route}/${country}`, country: countryKey, statusCode: 200, duration, request });

  return NextResponse.json({
    country: country,
    nationalAnimal: data.animal,
    scientificName: data.scientificName,
  });
}
