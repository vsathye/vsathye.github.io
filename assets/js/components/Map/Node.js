/**
 * Node.js
 * Represents and manages government nodes on the map
 */

class Node {
    constructor(properties) {
        this.properties = properties;
        this.element = null;
        this.position = { x: properties.longitude, y: properties.latitude };
        this.isVisible = true;
    }

    /**
     * Initialize the node SVG element on the map
     * @param {SVGElement} container - The SVG container to add the node to
     */
    initialize(container) {
        this.element = document.createElementNS("http://www.w3.org/2000/svg", this.getShapeElement());
        this.element.classList.add('map-node');
        this.element.classList.add(`node-type-${this.properties.type.toLowerCase()}`);
        
        // Set initial attributes
        this.updatePosition();
        this.updateStyle();
        
        // Add hover effect
        this.element.addEventListener('mouseenter', () => this.onHover(true));
        this.element.addEventListener('mouseleave', () => this.onHover(false));
        
        // Add click handler for the modal
        this.element.addEventListener('click', () => this.showModal());
        
        // Add to container
        container.appendChild(this.element);
    }

    /**
     * Get the appropriate SVG element based on government type
     * @returns {string} - SVG element type
     */
    getShapeElement() {
        const shapes = {
            'Empire': 'rect',     // Rectangle for empires
            'City-state': 'circle', // Circle for city-states
            'Tribe': 'polygon',    // Triangle for tribes
            'Kingdom': 'path'      // Crown-like shape for kingdoms
        };
        return shapes[this.properties.type] || 'circle';
    }

    /**
     * Update the node's position on the map
     */
    updatePosition() {
        if (!this.element) return;

        switch(this.properties.type) {
            case 'Empire':
                // Rectangle 20x20
                this.element.setAttribute('x', this.position.x - 10);
                this.element.setAttribute('y', this.position.y - 10);
                this.element.setAttribute('width', '20');
                this.element.setAttribute('height', '20');
                break;
            
            case 'City-state':
                // Circle with radius 8
                this.element.setAttribute('cx', this.position.x);
                this.element.setAttribute('cy', this.position.y);
                this.element.setAttribute('r', '8');
                break;
            
            case 'Tribe':
                // Triangle
                const trianglePoints = `${this.position.x},${this.position.y - 10} ${this.position.x - 8.66},${this.position.y + 5} ${this.position.x + 8.66},${this.position.y + 5}`;
                this.element.setAttribute('points', trianglePoints);
                break;
            
            case 'Kingdom':
                // Stylized crown shape
                const crownPath = `M ${this.position.x - 10} ${this.position.y + 5}
                                 L ${this.position.x - 5} ${this.position.y - 5}
                                 L ${this.position.x} ${this.position.y + 5}
                                 L ${this.position.x + 5} ${this.position.y - 5}
                                 L ${this.position.x + 10} ${this.position.y + 5}`;
                this.element.setAttribute('d', crownPath);
                break;
        }
    }

    /**
     * Update the node's style based on government type and state
     */
    updateStyle() {
        if (!this.element) return;

        // Set base styles based on government type
        const styles = {
            'Empire': {
                fill: '#8B0000',
                stroke: '#4B0000'
            },
            'City-state': {
                fill: '#4169E1',
                stroke: '#214070'
            },
            'Tribe': {
                fill: '#228B22',
                stroke: '#006400'
            },
            'Kingdom': {
                fill: '#DAA520',
                stroke: '#8B6914'
            }
        };

        const style = styles[this.properties.type] || { fill: '#808080', stroke: '#404040' };
        
        this.element.style.fill = style.fill;
        this.element.style.stroke = style.stroke;
        this.element.style.strokeWidth = '2';
    }

    /**
     * Handle hover effects
     * @param {boolean} isHovered - Whether the node is being hovered over
     */
    onHover(isHovered) {
        if (!this.element) return;

        if (isHovered) {
            this.element.style.strokeWidth = '3';
            // Show tooltip with basic info
            this.showTooltip();
        } else {
            this.element.style.strokeWidth = '2';
            // Hide tooltip
            this.hideTooltip();
        }
    }

    /**
     * Show tooltip with basic government information
     */
    showTooltip() {
        const tooltip = document.createElement('div');
        tooltip.classList.add('node-tooltip');
        tooltip.innerHTML = `
            <strong>${this.properties.name}</strong>
            <br>
            ${this.properties.type}
        `;
        
        // Position tooltip near node
        const bounds = this.element.getBoundingClientRect();
        tooltip.style.left = `${bounds.right + 10}px`;
        tooltip.style.top = `${bounds.top}px`;
        
        document.body.appendChild(tooltip);
        this.tooltip = tooltip;
    }

    /**
     * Hide the tooltip
     */
    hideTooltip() {
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.remove();
        }
        this.tooltip = null;
    }

    /**
     * Show modal with detailed government information
     */
    showModal() {
        const modal = new Modal({
            title: this.properties.name,
            content: `
                <div class="government-details">
                    <p><strong>Type:</strong> ${this.properties.type}</p>
                    <p><strong>Period:</strong> ${this.properties.startDate} to ${this.properties.endDate}</p>
                    <p><strong>Capital:</strong> ${this.properties.capital}</p>
                    <p><strong>Population:</strong> ${this.properties.population?.toLocaleString() || 'Unknown'}</p>
                    <p><strong>Description:</strong> ${this.properties.description}</p>
                </div>
            `
        });
        
        modal.show();
    }

    /**
     * Get the current position of the node
     * @returns {Object} - {x, y} coordinates
     */
    getPosition() {
        return this.position;
    }

    /**
     * Set node visibility
     * @param {boolean} visible - Whether the node should be visible
     */
    setVisibility(visible) {
        this.isVisible = visible;
        if (this.element) {
            this.element.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * Check if government exists within given time range
     * @param {Date} date - The date to check against
     * @returns {boolean} - Whether the government should exist at this time
     */
    existsAtDate(date) {
        const startDate = new Date(this.properties.startDate);
        const endDate = new Date(this.properties.endDate);
        return date >= startDate && date <= endDate;
    }

    /**
     * Clean up node (remove from DOM, clear listeners)
     */
    destroy() {
        this.hideTooltip();
        if (this.element && this.element.parentNode) {
            this.element.remove();
        }
        this.element = null;
    }
}

function createNode(data) {
    return new Node({
        type: data.type,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        capital: data.capital,
        population: data.population,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
    });
}
// // Node factory function for creating nodes from data
// export const createNode = (data) => {
//     return new Node({
//         type: data.type,
//         name: data.name,
//         startDate: data.startDate,
//         endDate: data.endDate,
//         capital: data.capital,
//         population: data.population,
//         description: data.description,
//         latitude: data.latitude,
//         longitude: data.longitude,
//         // Add any additional properties from data
//     });
// };

// export default Node;
window.Node = Node;
window.createNode = createNode;