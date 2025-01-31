# API Documentation

## Overview
This document outlines the internal JavaScript API structure of the Historical World Map application. The application is built using vanilla JavaScript with D3.js for visualization.

## Core Components

### Map Component (Map.js)
```javascript
class Map {
  constructor(containerId)
  initialize()
  updateView(year)
  addNode(government)
  addEdge(interaction)
  clear()
}
```

### Node Component (Node.js)
```javascript
class Node {
  constructor(government)
  render()
  update(data)
  highlight()
  unhighlight()
}
```

### Edge Component (Edge.js)
```javascript
class Edge {
  constructor(interaction)
  render()
  update(data)
  highlight()
  unhighlight()
}
```

## Services

### Data Loader (dataLoader.js)
```javascript
class DataLoader {
  async loadGovernments()
  async loadInteractions()
  async loadDataForYear(year)
  validateData(data)
}
```

### State Manager (stateManager.js)
```javascript
class StateManager {
  updateYear(year)
  updateSelectedEntity(entity)
  getVisibleGovernments()
  getVisibleInteractions()
}
```

## Utility Functions

### Date Utilities (dateUtils.js)
```javascript
formatYear(year)          // Converts year to BC/AD format
validateYear(year)        // Checks if year is within valid range
getYearRange(start, end) // Gets array of years between start and end
```

### Geographic Utilities (geoUtils.js)
```javascript
calculateDistance(lat1, lon1, lat2, lon2)
isPointVisible(lat, lon, bounds)
projectCoordinates(lat, lon)
```

### Data Utilities (dataUtils.js)
```javascript
filterDataByYear(data, year)
validateGovernment(government)
validateInteraction(interaction)
```

## Event System

The application uses a custom event system for component communication:

### Events
- `yearChanged`: Fired when the timeline selection changes
- `entitySelected`: Fired when a government or interaction is selected
- `dataLoaded`: Fired when data is successfully loaded
- `viewportChanged`: Fired when the map viewport changes

### Usage
```javascript
// Subscribe to events
EventSystem.subscribe('yearChanged', callback)

// Publish events
EventSystem.publish('yearChanged', { year: 2000 })
```

## State Management

The application maintains state using the StateManager service:

### State Object Structure
```javascript
{
  currentYear: number,
  selectedEntity: {
    type: 'government' | 'interaction',
    id: string
  },
  viewport: {
    center: [lat, lon],
    zoom: number
  }
}
```

## Error Handling

The application implements a centralized error handling system:

```javascript
ErrorHandler.handle(error, context)
ErrorHandler.log(message, level)
```

## Configuration

### Map Configuration (mapConfig.js)
```javascript
{
  initialView: {
    center: [lat, lon],
    zoom: number
  },
  styles: {
    governments: {
      EMPIRE: { ... },
      CITY_STATE: { ... },
      TRIBE: { ... },
      KINGDOM: { ... }
    },
    interactions: {
      WAR: { ... },
      TRADE: { ... },
      DIPLOMACY: { ... }
    }
  }
}
```

### Constants (constants.js)
```javascript
{
  YEAR_RANGE: {
    MIN: -5000,
    MAX: 2025
  },
  GOVERNMENT_TYPES: [...],
  INTERACTION_TYPES: [...]
}
```