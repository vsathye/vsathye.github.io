const MAP_CONFIG = {
    // Initial map view settings
    initialView: {
        center: [30, 20],  // Centered roughly on Mediterranean
        zoom: 3
    },

    // Map style settings
    style: {
        width: '100%',
        height: '70vh',
        background: '#f8f9fa'
    },

    // Projection settings
    projection: {
        type: 'equirectangular',
        scale: 200
    },

    // Interactive features
    features: {
        zoom: {
            min: 1,
            max: 8,
            scaleExtent: [1, 8]
        },
        pan: {
            bounds: {
                x: [-180, 180],
                y: [-90, 90]
            }
        }
    }
};