import { loadEntityData } from './dataLoader.js';
import { interactionColors } from '../config/interactionColors.js';

 // Main update function
 export async function writeEntity(map, entityName, year) {
    // Wait for map to be loaded
    if (!map.loaded()) {
        await new Promise(resolve => map.on('load', resolve));
    }

    const entityData = await loadEntityData(entityName, year);
    if (!entityData) return;

    // Create unique IDs for this entity
    const sourceId = `empire-${entityName}-${year}`;
    const fillLayerId = `empire-fill-${entityName}-${year}`;
    const borderLayerId = `empire-borders-${entityName}-${year}`;

    // Create GeoJSON for the empire
    const empireData = {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [entityData.coordinates]
            },
            properties: {
                name: entityData.name,
                type: entityData.type,
                year: entityData.year,
                isHistoricalEntity: true
            }
        }]
    };

    // Only remove if this specific entity already exists
    if (map.getSource(sourceId)) {
        map.removeLayer(borderLayerId);
        map.removeLayer(fillLayerId);
        map.removeSource(sourceId);
    }

    // Add new source and layers
    map.addSource(sourceId, {
        type: 'geojson',
        data: empireData
    });

    // Add fill layer for the empire
    map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        layout: {},
        paint: {
            'fill-color': entityData.color,
            'fill-opacity': 0.6
        }
    });

    // Add border layer for the empire
    map.addLayer({
        id: borderLayerId,
        type: 'line',
        source: sourceId,
        layout: {},
        paint: {
            'line-color': entityData.color,
            'line-width': 2,
            'line-opacity': 0.8
        }
    });

    // Add hover effect
    map.on('mouseenter', fillLayerId, () => {
        map.getCanvas().style.cursor = 'pointer';
        map.setPaintProperty(fillLayerId, 'fill-opacity', 0.8);
    });

    map.on('mouseleave', fillLayerId, () => {
        map.getCanvas().style.cursor = '';
        map.setPaintProperty(fillLayerId, 'fill-opacity', 0.6);
    });

    // Add click handler
    map.on('click', fillLayerId, (e) => {
        const properties = e.features[0].properties;
        new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
        <h3>${properties.name}</h3>
        <p>Type: ${properties.type}</p>
        <p>Year: ${properties.year}</p>
    `)
            .addTo(map);
    });

    // Return the IDs in case they're needed for later reference
    return {
        sourceId,
        fillLayerId,
        borderLayerId
    };
}

export async function writeInteraction(map, year, visibleInteractionTypes) {


    // Wait for map to be loaded
    if (!map.loaded()) {
        await new Promise(resolve => map.on('load', resolve));
    }

    try {
        // Fetch and parse the interactions CSV for the given year
        const response = await fetch(`data/interactions/${year}.csv`);
        if (!response.ok) {
            throw new Error(`No interaction data found for year ${year}`);
        }

        const csvText = await response.text();
        const parseResult = Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            transform: (value) => value.trim(),
            complete: function (results, file) {
                console.log("Parsing complete:", results);
            }
        });

        // Filter out rows with missing required fields
        const interactions = parseResult.data.filter(row =>
            row.src && row.dst && row.type && row.explanation
        );

        // Get unique set of entities from both source and destination
        const uniqueEntities = new Set();
        interactions.forEach(interaction => {
            uniqueEntities.add(interaction.src);
            uniqueEntities.add(interaction.dst);
        });

        console.log("Writing entities for the following:", Array.from(uniqueEntities));

        // Write all entities first
        const entityPromises = Array.from(uniqueEntities).map(entity =>
            writeEntity(map, entity, year)
        );

        // Wait for all entities to be written
        await Promise.all(entityPromises);
        console.log("All entities written, now drawing interactions");

        // Process each interaction
        for (const interaction of interactions) {
            // Modify the writeInteraction function to respect visibility settings
            // Add this check before creating each interaction line:

            if (!visibleInteractionTypes.has(interaction.type)) {
                continue;
            }
            const sourceId = `interaction-${interaction.src}-${interaction.dst}-${year}`;

            // Load source and destination entity data
            const sourceData = await loadEntityData(interaction.src, year);
            const destData = await loadEntityData(interaction.dst, year);

            if (!sourceData || !destData) {
                console.warn(`Missing entity data for interaction between ${interaction.src} and ${interaction.dst}`);
                continue;
            }

            // Get the interaction color based on type

            // Remove existing interaction line if it exists
            if (map.getSource(sourceId)) {
                map.removeLayer(`${sourceId}-line`);
                map.removeSource(sourceId);
            }

            // Create the line feature
            const lineFeature = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        sourceData.center,
                        destData.center
                    ]
                },
                properties: {
                    source: interaction.src,
                    destination: interaction.dst,
                    type: interaction.type,
                    explanation: interaction.explanation
                }
            };

            // Add the line source
            map.addSource(sourceId, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [lineFeature]
                }
            });
            const visible = visibleInteractionTypes.has(interaction.type);
            // Add the line layer
            map.addLayer({
                id: `${sourceId}-line`,
                type: 'line',
                source: sourceId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': interactionColors[interaction.type] || '#888888',
                    'line-width': 2,
                    'line-dasharray': [2, 2] // Creates a dashed line
                }
            });

            // Add click handler for the line
            map.on('click', `${sourceId}-line`, (e) => {
                const properties = e.features[0].properties;
                new maplibregl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(`
                <h3>${properties.source} → ${properties.destination}</h3>
                <p><strong>Type:</strong> ${properties.type}</p>
                <p>${properties.explanation}</p>
            `)
                    .addTo(map);
            });

            // Add hover effects
            map.on('mouseenter', `${sourceId}-line`, () => {
                map.getCanvas().style.cursor = 'pointer';
                map.setPaintProperty(`${sourceId}-line`, 'line-width', 4);
            });

            map.on('mouseleave', `${sourceId}-line`, () => {
                map.getCanvas().style.cursor = '';
                map.setPaintProperty(`${sourceId}-line`, 'line-width', 2);
            });
        }

        console.log("All interactions drawn");
    } catch (error) {
        console.error(`Error processing interactions for year ${year}:`, error);
    }
}

export async function clearMap(map) {
    // Get all source IDs
    const sources = map.getStyle().sources;

    // Iterate through all sources
    Object.keys(sources).forEach(sourceId => {
        // Skip the base world layer
        if (sourceId === 'world') return;

        // Get all layers that use this source
        const layers = map.getStyle().layers.filter(layer => layer.source === sourceId);

        // Remove each layer
        layers.forEach(layer => {
            if (map.getLayer(layer.id)) {
                map.removeLayer(layer.id);
            }
        });

        // Remove the source
        if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
        }
    });
}