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