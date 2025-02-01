export class MapVisualization {
    constructor(container) {
        if (!(container instanceof HTMLElement)) {
            throw new Error('Container must be a valid HTML element');
        }
        
        this.container = container;
        this.svg = null;
        this.mapGroup = null;
        this.nodesGroup = null;
        this.edgesGroup = null;
        this.width = 0;
        this.height = 0;
        this.projection = null;
        this.tooltip = null;
        this.currentData = null;
        this.currentTransform = null;
        
        // Bind methods
        this.handleNodeClick = this.handleNodeClick.bind(this);
        this.handleEdgeClick = this.handleEdgeClick.bind(this);
        this.updateVisualization = this.updateVisualization.bind(this);
        this.handleResize = this.handleResize.bind(this);
        
        this.initialize();
    }

    initialize() {
        // Set up dimensions
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        // Create SVG
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('class', 'map-svg');

        

        // Create groups for different layers
        this.mapGroup = this.svg.append('g').attr('class', 'map-group');
        this.edgesGroup = this.mapGroup.append('g').attr('class', 'edges-group');
        this.nodesGroup = this.mapGroup.append('g').attr('class', 'nodes-group');

        // Set up projection
        this.projection = d3.geoEquirectangular()
            .scale((this.width / 2.5) / Math.PI)
            .center([0,0])
            .translate([this.width / 2, this.height / 2]);

        // Set up zoom behavior
        const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([[-this.width, -this.height], [this.width * 2, this.height * 2]])
        .on('zoom', (event) => {
            // Only allow dragging if zoomed in (k > 1)
            if (event.transform.k > 1) {
                this.mapGroup.style('pointer-events', 'all');
            } else {
                this.mapGroup.style('pointer-events', 'none');
                // Reset position if at minimum zoom
                if (event.transform.k === 1) {
                    event.transform.x = 0;
                    event.transform.y = 0;
                }
            }
            
            this.handleZoom(event);
        });

        this.svg.call(zoom);

        // Create tooltip
        this.tooltip = d3.select(this.container)
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('pointer-events', 'none');

        // Add resize handler
        window.addEventListener('resize', this.handleResize.bind(this));

        // Initialize base map (optional)
        this.initializeBaseMap();
    }
    handleZoom(event) {
        const transform = event.transform;
        const scale = 1 / transform.k;
        document.documentElement.style.setProperty('--node-scale', scale);
        
        // Apply the transform to the map group
        this.mapGroup.attr('transform', transform);
        
        // If there's current data, update the visualization
        if (this.currentData) {
            this.updateVisualization(this.currentData);
        }
    }

    async initializeBaseMap() {
        try {
            // Load world atlas data - landmasses only
            const worldData = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json');
            const land = topojson.feature(worldData, worldData.objects.land);
    
            // Use existing projection that was set up in initialize()
            const path = d3.geoPath().projection(this.projection);
    
            // Add base map group and render landmasses
            this.baseMapGroup = this.mapGroup.insert('g', ':first-child')
                .attr('class', 'base-map-group');
    
            // Add a background ocean color
            this.baseMapGroup.append('rect')
                .attr('width', this.width)
                .attr('height', this.height)
                .attr('fill', '#5ca9f7');  // Light color for ocean
    
            this.baseMapGroup.selectAll('path.land')
                .data(land.features)
                .enter()
                .append('path')
                .attr('class', 'land')
                .attr('d', path)
                .attr('fill', '#5c4c39')  // Light gray for landmasses
                .attr('stroke', 'none');   // No borders
    
            // Store path generator reference for later use
            this.baseMapPath = path;
    
        } catch (error) {
            console.error('Error initializing base map:', error);
            this.container.innerHTML += `
                <div class="error-message">
                    Failed to load base map. Please refresh the page.
                </div>
            `;
        }
    }

    getNodeSymbol(type) {
        const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--node-scale')) || 1;
        const baseSize = 200 * scale * 0.5;
        const smallSize = 150 * scale * 0.5;
        
        const symbols = {
            'EMPIRE': d3.symbol().type(d3.symbolSquare).size(baseSize),
            'KINGDOM': d3.symbol().type(d3.symbolTriangle).size(baseSize),
            'CITY-STATE': d3.symbol().type(d3.symbolCircle).size(smallSize),
            'TRIBE': d3.symbol().type(d3.symbolDiamond).size(smallSize)
        };
        return symbols[type] || symbols['CITY-STATE'];
    }

    getEdgeStyle(type) {
        // Define styles for different interaction types
        const styles = {
            'WAR': { color: '#ff0000', dasharray: '5,5' },
            'TRADE': { color: '#00ff00', dasharray: 'none' },
            'DIPLOMACY': { color: '#0000ff', dasharray: '10,3' }
        };
        return styles[type] || { color: '#999999', dasharray: 'none' }; // Default style
    }

    handleNodeClick(d, i) {
        // Create and show modal with government information
        const modalManager = new window.Modal();  // or just new Modal() if it's global
        modalManager.show({
            type: 'government',
            data: {
                name: d.name,
                type: d.type,
                startYear: d.startYear,
                endYear: d.endYear,
                description: d.description || 'No description available.',
                features: [],  // Add features if available
                rulers: []     // Add rulers if available
            }
        });
    }
    
    handleEdgeClick(d, i) {
        // Create and show modal with interaction information
        const modalManager = new window.Modal();  // or just new Modal() if it's global
        modalManager.show({
            type: 'interaction',
            data: {
                type: d.type,
                startYear: d.year,
                endYear: d.year,
                participants: [
                    { name: d.source.name, role: 'Source' },
                    { name: d.target.name, role: 'Target' }
                ],
                description: d.description || 'No description available.',
                outcomes: []   // Add outcomes if available
            }
        });
    }

    updateVisualization(data) {
        if (!data ) {
            console.error('No Data');
            return;
        }

        if (!data.governments ) {
            console.error('No Governments');
            return;
        }

        if (!data.interactions ) {
            console.error('No Interactions');
            return;
        }
        this.currentData = data;

        // Update nodes (governments)
        const nodes = this.nodesGroup
        .selectAll('.government-node')
        .data(data.governments, d => d.id);

        // Remove old nodes
        nodes.exit().remove();

        // Add new nodes
        const nodesEnter = nodes.enter()
            .append('path')
            .attr('class', 'government-node')
            .style('cursor', 'pointer');

        // Update all nodes
        this.nodesGroup
            .selectAll('.government-node')
            .attr('d', d => this.getNodeSymbol(d.type)())
            .attr('transform', d => {
                const pos = this.projection([d.longitude, d.latitude]);
                return pos ? `translate(${pos[0]},${pos[1]})` : '';
            })
            .attr('fill', d => d.color || '#666')
            .on('click', this.handleNodeClick)
            .on('mouseover', (event, d) => {
                // Existing tooltip code
                this.tooltip
                    .style('opacity', 1)
                    .html(`${d.name} (${d.type})`)
                    .style('left', (event.pageX) + 'px')
                    .style('top', (event.pageY) + 'px');
                
                // Add scaling animation
                d3.select(event.currentTarget)
                    .transition()
                    .duration(200)  // Animation duration in milliseconds
                    .attr('transform', d => {
                        const pos = this.projection([d.longitude, d.latitude]);
                        return pos ? `translate(${pos[0]},${pos[1]}) scale(3)` : 'scale(3)';
                    });
            })
            .on('mouseout', (event) => {
                // Existing tooltip code
                this.tooltip.style('opacity', 0);
                
                // Revert scaling
                d3.select(event.currentTarget)
                    .transition()
                    .duration(200)
                    .attr('transform', d => {
                        const pos = this.projection([d.longitude, d.latitude]);
                        return pos ? `translate(${pos[0]},${pos[1]})` : '';
                    });
            });

        // Update edges (interactions)
        const edges = this.edgesGroup
            .selectAll('.interaction-edge')
            .data(data.interactions, d => d.id);

        // Remove old edges
        edges.exit().remove();

        // Add new edges
        const edgesEnter = edges.enter()
            .append('line')
            .attr('class', 'interaction-edge')
            .style('cursor', 'pointer');

        // Update all edges
        this.edgesGroup
            .selectAll('.interaction-edge')
            .attr('x1', d => {
                const pos = this.projection([d.source.longitude, d.source.latitude]);
                return pos ? pos[0] : 0;
            })
            .attr('y1', d => {
                const pos = this.projection([d.source.longitude, d.source.latitude]);
                return pos ? pos[1] : 0;
            })
            .attr('x2', d => {
                const pos = this.projection([d.target.longitude, d.target.latitude]);
                return pos ? pos[0] : 0;
            })
            .attr('y2', d => {
                const pos = this.projection([d.target.longitude, d.target.latitude]);
                return pos ? pos[1] : 0;
            })
            .attr('stroke', d => this.getEdgeStyle(d.type).color)
            .attr('stroke-dasharray', d => this.getEdgeStyle(d.type).dasharray)
            .attr('stroke-width', 2)
            .on('click', this.handleEdgeClick)
            .on('mouseover', (event, d) => {
                this.tooltip
                    .style('opacity', 1)
                    .html(`${d.type}: ${d.source.name} ↔ ${d.target.name}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.style('opacity', 0);
            });
    }

    handleResize() {
        // Update width and height based on container
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
    
        // Update SVG dimensions
        this.svg
            .attr('width', this.width)
            .attr('height', this.height);
    
        // Update projection
        this.projection
            .scale((this.width / 2.5) / Math.PI)
            .translate([this.width / 2, this.height / 2]);
    
        // If there's a base map, update it
        if (this.baseMapGroup) {
            const path = d3.geoPath().projection(this.projection);
            this.baseMapGroup.selectAll('path.land')
                .attr('d', path);
        }
    
        // If there's current data, update the visualization
        if (this.currentData) {
            this.updateVisualization(this.currentData);
        }
    }

    // Public method to manually update the size
    resize() {
        this.handleResize();
    }

    // Public method to get the current projection
    getProjection() {
        return this.projection;
    }

    // Public method to clear the visualization
    clear() {
        this.nodesGroup.selectAll('*').remove();
        this.edgesGroup.selectAll('*').remove();
        this.currentData = null;
    }
}

window.MapVisualization = MapVisualization;