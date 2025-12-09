# Country Info API

A simple Next.js API application that provides country information with built-in Prometheus metrics and Loki logging.

## Features

- **3 REST APIs** for country information:
  - `/api/currency/[country]` - Returns currency symbol, value against USD, and date
  - `/api/animal/[country]` - Returns national animal and scientific name
  - `/api/capital/[country]` - Returns capital city and population

- **Interactive UI** - Test APIs directly from the home page

- **Monitoring & Observability**:
  - Prometheus metrics exposed at `/api/metrics`
  - Automatic metrics push to Grafana Cloud
  - Loki logging with detailed request tracking (IP, geo-location, headers, query params)

## Supported Countries

USA, UK, Japan, India, Germany, France, Canada, Australia, China, Brazil, Mexico, South Korea, Russia

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Copy `.env.example` to `.env.local` and add your Grafana Cloud credentials:
   ```bash
   cp .env.example .env.local
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** to see the interactive API tester.

## API Usage

### Currency API
```bash
curl http://localhost:3000/api/currency/japan
```

Response:
```json
{
  "country": "japan",
  "currency": {
    "symbol": "¥",
    "valueAgainstUSD": 149.5,
    "date": "2025-12-09"
  }
}
```

### Animal API
```bash
curl http://localhost:3000/api/animal/india
```

### Capital API
```bash
curl http://localhost:3000/api/capital/germany
```

## Monitoring

- **Metrics**: Access Prometheus metrics at `/api/metrics`
- **Grafana Cloud**: Metrics and logs are automatically pushed to Grafana Cloud when environment variables are configured

## Environment Variables

Required for Grafana Cloud integration:

- `GRAFANA_METRICS_URL` - OTLP metrics endpoint
- `GRAFANA_USERNAME` - Grafana Cloud metrics user ID
- `GRAFANA_API_KEY` - Grafana Cloud API token
- `LOKI_HOST` - Loki endpoint URL
- `LOKI_USERNAME` - Loki user ID
- `LOKI_PASSWORD` - Loki API token

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Import your repository to Vercel
2. Add environment variables from `.env.example`
3. Deploy!

## Tech Stack

- Next.js 16.0.8
- TypeScript
- Tailwind CSS
- Prometheus (prom-client)
- Winston Logger
- Grafana Cloud (Loki + Prometheus)
