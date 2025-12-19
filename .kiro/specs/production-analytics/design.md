# Design Document: Production Analytics

## Overview

This design transforms Gather from a demo application with localStorage and placeholder data into a production-ready analytics platform. The architecture introduces a backend service layer that handles persistent storage, server-side click tracking with accurate geolocation, and real-time data aggregation.

The design prioritizes:
- **Reliability**: Persistent storage with retry logic and error handling
- **Accuracy**: Server-side tracking for precise device/OS/country detection
- **Scalability**: Abstracted storage interface to support multiple backends
- **Maintainability**: Clear separation between UI, services, and data layers

## Architecture

```mermaid
graph TB
    subgraph Frontend
        UI[React Dashboard]
        Charts[Chart Components]
        Services[Service Layer]
    end
    
    subgraph Backend Options
        Supabase[Supabase]
        Firebase[Firebase]
        CustomAPI[Custom API]
    end
    
    subgraph External Services
        GeoIP[IP Geolocation API]
    end
    
    UI --> Services
    Charts --> Services
    Services --> |Storage Adapter| Supabase
    Services --> |Storage Adapter| Firebase
    Services --> |Storage Adapter| CustomAPI
    Services --> GeoIP
    
    Visitor[Link Visitor] --> |Click| Services
    Services --> |Record Event| Backend Options
    Services --> |Redirect| Visitor
```

## Components and Interfaces

### 1. Storage Adapter Interface

An abstraction layer that allows swapping between different storage backends (Supabase, Firebase, custom API) without changing application code.

```typescript
interface StorageAdapter {
  // Links
  getLinks(): Promise<LinkData[]>;
  getLink(id: string): Promise<LinkData | null>;
  getLinkByCode(shortCode: string): Promise<LinkData | null>;
  createLink(link: Omit<LinkData, 'id'>): Promise<LinkData>;
  updateLink(id: string, updates: Partial<LinkData>): Promise<LinkData>;
  deleteLink(id: string): Promise<void>;
  
  // Click Events
  recordClick(linkId: string, event: ClickEventInput): Promise<void>;
  getClickEvents(linkId: string, options?: QueryOptions): Promise<ClickEvent[]>;
  getAggregatedClicks(linkId: string, groupBy: 'day' | 'week' | 'month'): Promise<AggregatedClickData[]>;
  
  // Bulk Operations
  exportAllData(): Promise<ExportData>;
}

interface QueryOptions {
  startDate?: number;
  endDate?: number;
  limit?: number;
  offset?: number;
}

interface ClickEventInput {
  timestamp: number;
  referrer: string;
  userAgent: string;
  ipAddress: string;
}

interface AggregatedClickData {
  period: string;
  clicks: number;
  uniqueVisitors: number;
  topReferrers: { name: string; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
  countryBreakdown: { country: string; count: number }[];
}

interface ExportData {
  links: LinkData[];
  clickEvents: ClickEvent[];
  exportedAt: number;
}
```

### 2. Analytics Service

Handles data aggregation, transformation, and business logic for analytics display.

```typescript
interface AnalyticsService {
  // Aggregation
  getClickForecastData(links: LinkData[], dateRange: DateRange): ClickForecastDataPoint[];
  getTrafficSourceData(links: LinkData[], dateRange: DateRange): TrafficSourceDataPoint[];
  getLinkHealthData(links: LinkData[]): LinkHealthDataPoint[];
  
  // Filtering
  filterByDateRange(events: ClickEvent[], range: DateRange): ClickEvent[];
  
  // Export
  generateCSVExport(data: ExportData): string;
  downloadCSV(content: string, filename: string): void;
}

type DateRange = '7d' | '30d' | '90d' | 'all';
```

### 3. Click Tracking Service

Handles the server-side click recording flow with device detection and geolocation.

```typescript
interface ClickTrackingService {
  // Record a click with full metadata extraction
  trackClick(shortCode: string, request: ClickRequest): Promise<RedirectResult>;
  
  // Device/OS detection from user agent
  parseUserAgent(userAgent: string): { device: DeviceType; os: OSType };
  
  // IP-based geolocation
  getCountryFromIP(ipAddress: string): Promise<string>;
}

interface ClickRequest {
  userAgent: string;
  referrer: string;
  ipAddress: string;
}

interface RedirectResult {
  success: boolean;
  redirectUrl: string;
  error?: string;
}
```

### 4. Retry Service

Handles network failures with exponential backoff.

```typescript
interface RetryService {
  execute<T>(
    operation: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T>;
}

interface RetryOptions {
  maxRetries: number;      // default: 3
  baseDelayMs: number;     // default: 1000
  maxDelayMs: number;      // default: 10000
  onRetry?: (attempt: number, error: Error) => void;
}
```

## Data Models

### Updated LinkData (no changes to structure, but storage location changes)

```typescript
interface LinkData {
  id: string;
  originalUrl: string;
  shortCode: string;
  title: string;
  description?: string;
  tags: string[];
  createdAt: number;
  category?: LinkCategory;
  
  // Analytics - now populated from real data
  clicks: number;
  lastClickedAt?: number;
  clickHistory: ClickEvent[];  // May be paginated for high-traffic links

  // Advanced Config (unchanged)
  smartRedirects?: SmartRedirects;
  geoRedirects?: Record<string, string>;
  expirationDate?: number | null;
  maxClicks?: number | null;
  password?: string | null;
  qrCodeData?: string;
  aiAnalysis?: AIAnalysis;
}
```

### ClickEvent (enhanced for production)

```typescript
interface ClickEvent {
  id: string;              // Unique event ID for deduplication
  linkId: string;          // Foreign key to LinkData
  timestamp: number;
  referrer: string;
  device: 'Mobile' | 'Desktop' | 'Tablet' | 'Other';
  os: 'iOS' | 'Android' | 'Windows' | 'MacOS' | 'Linux' | 'Other';
  country: string;
  
  // Raw data for reprocessing if needed
  rawUserAgent?: string;
  rawIpAddress?: string;   // Hashed or anonymized for privacy
}
```

### Database Schema (Supabase/PostgreSQL)

```sql
-- Links table
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_url TEXT NOT NULL,
  short_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Advanced config stored as JSONB
  smart_redirects JSONB,
  geo_redirects JSONB,
  expiration_date TIMESTAMPTZ,
  max_clicks INTEGER,
  password_hash VARCHAR(255),
  qr_code_data TEXT,
  ai_analysis JSONB
);

-- Click events table (partitioned by month for performance)
CREATE TABLE click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  referrer TEXT,
  device VARCHAR(20),
  os VARCHAR(20),
  country VARCHAR(3),
  raw_user_agent TEXT,
  ip_hash VARCHAR(64)  -- SHA-256 hash for privacy
);

-- Indexes for common queries
CREATE INDEX idx_click_events_link_id ON click_events(link_id);
CREATE INDEX idx_click_events_timestamp ON click_events(timestamp);
CREATE INDEX idx_links_short_code ON links(short_code);

-- Materialized view for aggregated stats (refreshed periodically)
CREATE MATERIALIZED VIEW link_stats AS
SELECT 
  link_id,
  COUNT(*) as total_clicks,
  MAX(timestamp) as last_clicked_at,
  COUNT(DISTINCT ip_hash) as unique_visitors
FROM click_events
GROUP BY link_id;
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the acceptance criteria, the following redundancies were identified:
- Requirements 1.5 and 1.6 can be combined into a single round-trip property for serialization
- Requirements 3.1, 3.3, 3.4 all relate to removing demo data - consolidated into verification that no synthetic data exists
- Requirements 5.2 and 5.3 can be combined into a single CSV content validation property

### Properties

**Property 1: Link data round-trip consistency**
*For any* valid LinkData object, serializing to JSON and then parsing back SHALL produce an equivalent LinkData object with all fields preserved.
**Validates: Requirements 1.5, 1.6**

**Property 2: Storage persistence**
*For any* valid LinkData object, after calling createLink, calling getLink with the returned ID SHALL return an equivalent LinkData object.
**Validates: Requirements 1.1**

**Property 3: Retry behavior on failure**
*For any* operation that fails, the retry service SHALL attempt the operation up to maxRetries times before throwing, with delays following exponential backoff pattern.
**Validates: Requirements 1.4, 6.1**

**Property 4: Click event completeness**
*For any* click tracking request with valid userAgent, referrer, and ipAddress, the recorded ClickEvent SHALL contain non-null values for timestamp, referrer, device, os, and country fields.
**Validates: Requirements 2.1, 2.2**

**Property 5: User agent parsing validity**
*For any* user agent string, parseUserAgent SHALL return a device value that is one of 'Mobile', 'Desktop', 'Tablet', or 'Other', and an os value that is one of 'iOS', 'Android', 'Windows', 'MacOS', 'Linux', or 'Other'.
**Validates: Requirements 2.3, 2.6**

**Property 6: Geolocation fallback**
*For any* IP address where geolocation lookup fails, getCountryFromIP SHALL return "Unknown" rather than throwing an error.
**Validates: Requirements 2.5**

**Property 7: Empty data produces zero values**
*For any* empty array of links or click events, aggregation functions SHALL return data structures with zero values for all numeric fields rather than empty arrays.
**Validates: Requirements 3.2, 4.5**

**Property 8: Date range filtering correctness**
*For any* array of ClickEvents and a date range, filterByDateRange SHALL return only events where timestamp falls within the specified range, and the result SHALL be a subset of the input.
**Validates: Requirements 4.4**

**Property 9: Traffic source categorization completeness**
*For any* referrer string, the categorization function SHALL assign exactly one category from {Direct, Social, Referral}.
**Validates: Requirements 4.2**

**Property 10: Click aggregation by day preserves total**
*For any* array of ClickEvents, the sum of clicks across all days in the aggregated result SHALL equal the total number of input events.
**Validates: Requirements 4.1**

**Property 11: CSV export contains all required fields**
*For any* ExportData with links and click events, the generated CSV SHALL contain columns for title, originalUrl, shortCode, createdAt, clicks, and for each click event: timestamp, referrer, device, os, country.
**Validates: Requirements 5.1, 5.2, 5.3**

**Property 12: Click event validation rejects invalid data**
*For any* ClickEventInput with missing or invalid required fields (empty linkId, negative timestamp), validation SHALL reject the event.
**Validates: Requirements 6.3**

**Property 13: Deduplication by timestamp and linkId**
*For any* array of ClickEvents containing duplicates (same linkId and timestamp), deduplication SHALL return an array with no duplicates, and the length SHALL be less than or equal to the input length.
**Validates: Requirements 6.4**

## Error Handling

### Network Failures
- All storage operations use the RetryService with exponential backoff
- Default: 3 retries, starting at 1 second delay, max 10 second delay
- After max retries, surface error to UI with user-friendly message

### Geolocation Failures
- Geolocation is non-critical; failures default to "Unknown" country
- Log failures for monitoring but don't block click recording

### Validation Errors
- Invalid link data: Return validation error with specific field failures
- Invalid click events: Log and discard, don't fail the redirect

### Storage Unavailability
- Queue failed writes for retry when connection restored
- Show offline indicator in UI
- Allow read from cache if available

## Testing Strategy

### Unit Testing
- Test individual service methods in isolation
- Mock storage adapter for service tests
- Test user agent parsing with known UA strings
- Test referrer categorization with sample URLs

### Property-Based Testing
Using `fast-check` library for TypeScript property-based testing.

Each property test will:
- Run minimum 100 iterations
- Use smart generators constrained to valid input space
- Be tagged with the property number and requirements reference

**Generator Strategy:**
- `LinkData` generator: Valid URLs, non-empty titles, valid timestamps
- `ClickEvent` generator: Valid device/OS enums, realistic timestamps, varied referrers
- `UserAgent` generator: Mix of real UA strings and edge cases
- `DateRange` generator: Valid start/end pairs within reasonable bounds

### Integration Testing
- Test full flow: create link → track click → view analytics
- Test storage adapter implementations against real backends
- Test CSV export produces valid, parseable files

### Test Organization
```
services/
  __tests__/
    storageAdapter.test.ts      # Unit tests
    storageAdapter.property.ts  # Property tests
    analyticsService.test.ts
    analyticsService.property.ts
    clickTracking.test.ts
    clickTracking.property.ts
    retryService.test.ts
    retryService.property.ts
    csvExport.test.ts
    csvExport.property.ts
```
