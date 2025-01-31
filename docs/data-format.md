# Data Format Documentation

## Overview
This document describes the data formats used in the Historical World Map application. The application uses both raw data files for storage and processed data files for optimized runtime performance.

## Raw Data
Raw data files contain the complete historical dataset in its original form. These files are stored in `assets/data/raw/`.

### Governments Data Format (governments.csv)
The governments.csv file contains information about all historical governments across all time periods.

#### Schema
```csv
id,name,type,start_year,end_year,latitude,longitude,description
```

#### Fields
- `id` (string): Unique identifier for the government
- `name` (string): Name of the government/empire/city-state
- `type` (enum): Type of government. Valid values:
  - EMPIRE
  - CITY_STATE
  - TRIBE
  - KINGDOM
- `start_year` (integer): Year when the government was established (negative for BC)
- `end_year` (integer): Year when the government ended (negative for BC)
- `latitude` (float): Geographical latitude of the government's capital/center
- `longitude` (float): Geographical longitude of the government's capital/center
- `description` (string): Brief description of the government

#### Example
```csv
EMP001,Roman Empire,EMPIRE,-27,476,41.9028,12.4964,"The Roman Empire was one of the largest empires of the ancient world"
```

### Interactions Data Format (interactions.csv)
The interactions.csv file contains information about all historical interactions between governments.

#### Schema
```csv
id,source_id,target_id,type,year,description
```

#### Fields
- `id` (string): Unique identifier for the interaction
- `source_id` (string): ID of the initiating government (references governments.id)
- `target_id` (string): ID of the receiving government (references governments.id)
- `type` (enum): Type of interaction. Valid values:
  - WAR
  - TRADE
  - DIPLOMACY
  - ALLIANCE
  - TRIBUTE
- `year` (integer): Year when the interaction occurred (negative for BC)
- `description` (string): Description of the interaction

#### Example
```csv
INT001,EMP001,EMP002,WAR,-216,"Battle of Cannae between Rome and Carthage"
```

## Processed Data
Processed data files are optimized versions of the raw data, structured for efficient runtime performance. These files are stored in `assets/data/processed/`.

### Time-Based Segmentation
Data is split into time periods for faster loading:
- `governments/`: Contains government data split by millennium
  - `-5000_to_-4000.json`
  - `-4000_to_-3000.json`
  - etc.
- `interactions/`: Contains interaction data split by century
  - `-500_to_-400.json`
  - `-400_to_-300.json`
  - etc.

### Processed Data Format (JSON)
```json
{
  "metadata": {
    "timeRange": {
      "start": -5000,
      "end": -4000
    },
    "recordCount": 150
  },
  "governments": [
    {
      "id": "EMP001",
      "name": "Roman Empire",
      "type": "EMPIRE",
      "coordinates": [41.9028, 12.4964],
      "description": "The Roman Empire was one of the largest empires",
      "graphData": {
        "radius": 30,
        "connections": ["EMP002", "EMP003"]
      }
    }
  ],
  "interactions": [
    {
      "id": "INT001",
      "source": "EMP001",
      "target": "EMP002",
      "type": "WAR",
      "year": -216,
      "description": "Battle of Cannae",
      "graphData": {
        "weight": 2,
        "distance": 1200
      }
    }
  ]
}
```

### Pre-computed Data
Processed files include additional pre-computed information:
- Graph metrics (node size, edge weights)
- Geographical calculations (distances, regions)
- Relationship networks
- Cached visualization data

### Benefits of Processed Data
1. Faster loading times by loading only relevant time periods
2. Reduced runtime calculations
3. Optimized for visualization
4. Better memory usage
5. Improved application performance

## Visual Representation
### Government Types
Each government type is represented by a different shape on the map:
- EMPIRE: Large circle
- KINGDOM: Square
- CITY_STATE: Small circle
- TRIBE: Triangle

### Interaction Types
Each interaction type is represented by a different colored edge:
- WAR: Red
- TRADE: Green
- DIPLOMACY: Blue
- ALLIANCE: Purple
- TRIBUTE: Yellow

## Data Processing Pipeline
1. Raw data is validated on upload
2. Processing scripts generate optimized JSON files
3. Data is split into appropriate time periods
4. Graph calculations are performed
5. Geographical optimizations are applied
6. Results are cached in processed directory
7. Invalid records are logged and skipped