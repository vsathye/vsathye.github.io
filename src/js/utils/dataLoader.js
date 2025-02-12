export async function loadEntityData(entityName, year) {
    try {
        // Input validation
        if (!entityName || typeof entityName !== 'string') {
            console.error('Invalid entityName:', entityName);
            throw new Error(`Invalid entityName provided: ${entityName}`);
        }

        if (!year || typeof year !== 'number') {
            console.error('Invalid year:', year);
            throw new Error(`Invalid year provided: ${year}`);
        }

        // Format the entity name for the file path
        const formattedName = entityName.toLowerCase().replace(/\s+/g, '_');
        console.log(`Loading data for entity: ${formattedName}, year: ${year}`);

        // Fetch the CSV file
        const response = await fetch(`data/${formattedName}.csv`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();

        // Parse CSV data using PapaParse
        const parseResult = Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });

        if (parseResult.errors && parseResult.errors.length > 0) {
            console.error('CSV parsing errors:', parseResult.errors);
        }

        const parsedData = parseResult.data;
        console.log('Parsed data:', parsedData);

        if (!parsedData || parsedData.length === 0) {
            throw new Error(`No data found for ${entityName}`);
        }

        // Find the entry closest to the requested year
        const sortedData = parsedData
            .map(row => ({
                ...row,
                yearDiff: Math.abs(row.year - year)
            }))
            .sort((a, b) => a.yearDiff - b.yearDiff);

        // Get the closest year's data
        const closestData = sortedData[0];
        console.log('Closest data found:', closestData);

        // Validate required fields
        if (!closestData.coordinates || !closestData.center) {
            throw new Error(`Missing required fields for ${entityName}`);
        }

        // Parse coordinates and center from strings to arrays
        try {
            const coordinates = JSON.parse(closestData.coordinates);
            const center = JSON.parse(closestData.center);

            // Return formatted data
            return {
                name: closestData.name || entityName,
                year: closestData.year,
                type: closestData.type || 'unknown',
                color: closestData.color || '#808080',
                coordinates: coordinates,
                center: center
            };
        } catch (parseError) {
            console.error('Error parsing coordinates or center:', parseError);
            throw new Error(`Invalid coordinate data for ${entityName}`);
        }
    } catch (error) {
        console.error(`Error loading data for ${entityName}:`, error);
        return null;
    }
}

export async function fetchAllData(entityName, year) {
    const [worldResponse, entityData] = await Promise.all([
        fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson'),
        loadEntityData(entityName, year)
    ]);

    const worldData = await worldResponse.json();
    return { worldData, entityData };
}