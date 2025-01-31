class Map {
    constructor(containerId) {
        this.containerId = containerId;
        this.svg = null;
        this.g = null;
        this.width = 0;
        this.height = 0;
        this.projection = null;
    }

    initialize() {
        // Get container dimensions
        const container = document.getElementById(this.containerId);
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        // Create SVG
        this.svg = d3.select(`#${this.containerId}`)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);

        // Create map projection
        this.projection = d3.geoEquirectangular()
            .scale(MAP_CONFIG.projection.scale)
            .center(MAP_CONFIG.initialView.center)
            .translate([this.width / 2, this.height / 2]);

        // Create base group for map elements
        this.g = this.svg.append('g');

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent(MAP_CONFIG.features.zoom.scaleExtent)
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });

        this.svg.call(zoom);

        // Draw base map features (optional)
        this.drawBaseMap();
    }

    drawBaseMap() {
        // You can add code here to draw basic geographical features
        // like continents or water bodies if desired
    }

    addNode(government) {
        const pos = this.projection([government.longitude, government.latitude]);
        const config = GOVERNMENT_TYPES[government.type];

        this.g.append('use')
            .attr('href', config.markerPath)
            .attr('x', pos[0] - config.size / 2)
            .attr('y', pos[1] - config.size / 2)
            .attr('width', config.size)
            .attr('height', config.size)
            .attr('class', 'government-node')
            .attr('data-id', government.id);
    }

    addEdge(interaction) {
        const sourceGov = // Get source government data
        const targetGov = // Get target government data
        const config = INTERACTION_TYPES[interaction.type];

        const source = this.projection([sourceGov.longitude, sourceGov.latitude]);
        const target = this.projection([targetGov.longitude, targetGov.latitude]);

        this.g.append('line')
            .attr('x1', source[0])
            .attr('y1', source[1])
            .attr('x2', target[0])
            .attr('y2', target[1])
            .attr('stroke', config.color)
            .attr('stroke-width', 2)
            .attr('class', 'interaction-edge')
            .attr('data-id', interaction.id);
    }

    updateView(year) {
        // Clear existing nodes and edges
        this.g.selectAll('.government-node').remove();
        this.g.selectAll('.interaction-edge').remove();

        // Load and display data for the selected year
        // This will be implemented when we add the data loading service
    }
}

// Initialize map when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const map = new Map('map');
    map.initialize();
});