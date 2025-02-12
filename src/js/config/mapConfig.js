// The initial map configuration
export const mapConfig = {
    container: 'map',
    style: {
        version: 8,
        sources: {
            'world': {
                type: 'geojson',
                data: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson'
            }
        },
        layers: [
            {
                id: 'background',
                type: 'background',
                paint: {
                    'background-color': '#a8d5e5'
                }
            },
            {
                id: 'land',
                type: 'fill',
                source: 'world',
                paint: {
                    'fill-color': '#e8e0d8',
                    'fill-outline-color': '#d3cbc4'
                }
            }
        ]
    },
    center: [12.5, 41.9], // Centered on Rome
    zoom: 4
};