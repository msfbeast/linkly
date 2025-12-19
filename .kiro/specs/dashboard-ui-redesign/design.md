# Design Document: Dashboard UI Redesign

## Overview

This design document outlines the architecture and implementation approach for redesigning the Gather AI dashboard with a modern dark theme visual style. The redesign introduces a new navigation system, color-coded link performance cards, multiple chart types (bar, donut, radar), and a priority links list, all while maintaining the core link shortener functionality.

## Architecture

The redesign follows a component-based architecture using React with TypeScript. The existing application structure will be preserved while replacing/updating UI components.

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Container                            │
├──────┬──────────────────────────────────────────────────────────┤
│      │                    Top Navigation                         │
│ Icon │  [Logo] [Overview] [Links] [Analytics] [Settings]  [Clicks] [+ New Link] │
│ Side │──────────────────────────────────────────────────────────│
│ bar  │                                                           │
│      │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│      │  │ Link 1  │ │ Link 2  │ │ Link 3  │ │ Link 4  │        │
│      │  │ (Cyan)  │ │(Yellow) │ │ (Coral) │ │ (Dark)  │        │
│      │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│      │                                                           │
│      │  ┌─────────────────────────┐ ┌─────────────────┐        │
│      │  │   Click Forecast        │ │  Traffic Source │        │
│      │  │   (Bar Chart)           │ │  (Donut Chart)  │        │
│      │  └─────────────────────────┘ └─────────────────┘        │
│      │                                                           │
│      │  ┌─────────────────────────┐ ┌─────────────────┐        │
│      │  │    Link Health          │ │  Priority Links │        │
│      │  │   (Radar Chart)         │ │     (List)      │        │
│      │  └─────────────────────────┘ └─────────────────┘        │
└──────┴──────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### New Components

#### 1. TopNavigation
Top horizontal navigation bar with logo, tabs, click count display, and action button.

```typescript
interface TopNavigationProps {
  activeTab: 'overview' | 'links' | 'analytics' | 'settings';
  onTabChange: (tab: string) => void;
  totalClicks: number;
  clickChange: number; // percentage change
}
```

#### 2. IconSidebar
Slim vertical sidebar with icon-only navigation.

```typescript
interface IconSidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}
```

#### 3. LinkPerformanceCard
Color-coded card displaying link performance information.

```typescript
interface LinkPerformanceCardProps {
  category: 'social' | 'marketing' | 'product' | 'other';
  title: string;
  shortCode: string;
  createdAt: string;
  clicks: number;
  onMenuClick: () => void;
}
```

#### 4. ClickForecastChart
Bar chart showing forecast vs actual clicks.

```typescript
interface ClickForecastChartProps {
  data: {
    day: string;
    forecast: number;
    actual: number;
  }[];
}
```

#### 5. TrafficSourceChart
Donut chart with center total display.

```typescript
interface TrafficSourceChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  total: number;
}
```

#### 6. LinkHealthChart
Radar/spider chart for link performance metrics.

```typescript
interface LinkHealthChartProps {
  data: {
    metric: string;
    value: number; // 0-100
  }[];
}
```

#### 7. PriorityLinksList
List component for displaying links needing attention.

```typescript
interface PriorityLink {
  id: string;
  title: string;
  shortCode: string;
  lastClickedAt: string;
  status: 'active' | 'expiring' | 'low-ctr';
  checked: boolean;
}

interface PriorityLinksListProps {
  links: PriorityLink[];
  onLinkToggle: (id: string) => void;
  onViewAll: () => void;
}
```

### Modified Components

#### Dashboard.tsx
Complete redesign to use new layout and components.

#### Sidebar.tsx → IconSidebar.tsx
Transform from full sidebar to slim icon-only sidebar.

## Data Models

### Extended LinkData
Add category field to existing LinkData type:
```typescript
interface LinkData {
  // ... existing fields
  category?: 'social' | 'marketing' | 'product' | 'other';
}
```

### ChartData Types
```typescript
interface ClickForecastDataPoint {
  day: string;
  forecast: number;
  actual: number;
}

interface TrafficSourceDataPoint {
  name: string;
  value: number;
  color: string;
}

interface LinkHealthDataPoint {
  metric: string;
  value: number;
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the acceptance criteria analysis, the following correctness properties have been identified:

### Property 1: Tab State Management
*For any* navigation tab click, the clicked tab should become the active tab and all other tabs should be inactive.
**Validates: Requirements 1.2**

### Property 2: Link Card Count Limiting
*For any* array of links, the dashboard should display at most 4 link performance cards, selecting the top performers by click count.
**Validates: Requirements 2.1**

### Property 3: Link Card Rendering Completeness
*For any* link data object, the rendered LinkPerformanceCard component should display the category label, title, creation date, and click count.
**Validates: Requirements 2.2**

### Property 4: Category Color Mapping Consistency
*For any* category type (social, marketing, product, other, active, expiring, low-ctr, direct, referral), the assigned color should match the predefined color mapping and remain consistent across all usages.
**Validates: Requirements 2.3, 4.4, 6.3**

### Property 5: Click Chart Dual Series
*For any* click forecast data array, the ClickForecastChart component should render exactly two data series (forecast and actual) with distinct visual styling.
**Validates: Requirements 3.2**

### Property 6: Traffic Source Total Calculation
*For any* traffic source data array, the total displayed in the donut chart center should equal the sum of all individual source values.
**Validates: Requirements 4.2**

### Property 7: Priority Link Rendering Completeness
*For any* priority link data object, the rendered list item should display a checkbox, title, short code, last click time, and status tag.
**Validates: Requirements 6.2**

## Error Handling

### Data Loading States
- Display skeleton loaders while data is being fetched
- Show empty state messages when no links exist
- Handle missing optional fields gracefully (e.g., missing click history)

### Chart Error Handling
- Display "No data available" message when chart data is empty
- Handle invalid data gracefully without crashing
- Provide fallback values for missing data points

### Component Error Boundaries
- Wrap chart components in error boundaries to prevent full page crashes
- Display user-friendly error messages when components fail to render

## Testing Strategy

### Unit Testing
Unit tests will verify specific component behaviors and edge cases:
- TopNavigation renders all required elements
- LinkPerformanceCard displays correct content for each category type
- Charts render with sample data
- Priority links list handles empty state

### Property-Based Testing
Property-based tests will use **fast-check** library to verify universal properties:
- Each correctness property will have a corresponding property-based test
- Tests will run minimum 100 iterations with randomly generated data
- Tests will be tagged with format: `**Feature: dashboard-ui-redesign, Property {number}: {property_text}**`

### Integration Testing
- Verify navigation state changes propagate correctly
- Test data flow from parent to child components
- Verify chart interactions work as expected

### Visual Testing
- Manual verification of color schemes and styling
- Responsive layout testing across breakpoints
- Dark theme consistency checks
