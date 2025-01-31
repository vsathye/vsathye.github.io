/**
 * Edge.js
 * Represents and manages interaction edges between government nodes on the map
 */

class Edge {
    constructor(sourceNode, targetNode, properties) {
        this.sourceNode = sourceNode;
        this.targetNode = targetNode;
        this.properties = properties;
        this.element = null;
        this.isVisible = true;
    }

    /**
     * Initialize the edge SVG element on the map
     * @param {SVGElement} container - The SVG container to add the edge to
     */
    initialize(container) {
        // Create the edge line element
        this.element = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.element.classList.add('map-edge');
        
        // Set initial attributes
        this.updatePosition();
        this.updateStyle();
        
        // Add click handler for the modal
        this.element.addEventListener('click', () => this.showModal());
        
        // Add to container
        container.appendChild(this.element);
    }

    /**
     * Update the edge's position based on connected nodes
     */
    updatePosition() {
        if (!this.element) return;

        const sourcePos = this.sourceNode.getPosition();
        const targetPos = this.targetNode.getPosition();

        // Create path between nodes
        const path = `M ${sourcePos.x} ${sourcePos.y} L ${targetPos.x} ${targetPos.y}`;
        this.element.setAttribute('d', path);
    }

    /**
     * Update the edge's style based on interaction type
     */
    updateStyle() {
        if (!this.element) return;

        // Set color based on interaction type
        const colors = {
            'war': '#FF0000',
            'trade': '#00FF00',
            'diplomacy': '#0000FF',
            'alliance': '#FFFF00',
            'default': '#999999'
        };

        const color = colors[this.properties.interactionType] || colors.default;
        this.element.style.stroke = color;
        this.element.style.strokeWidth = '2';
    }

    /**
     * Show modal with detailed interaction information
     */
    showModal() {
        // Create and show modal with interaction details
        const modal = new Modal({
            title: `${this.properties.interactionType} Interaction`,
            content: `
                <div class="interaction-details">
                    <p><strong>Type:</strong> ${this.properties.interactionType}</p>
                    <p><strong>Date:</strong> ${this.properties.date}</p>
                    <p><strong>Between:</strong> ${this.sourceNode.properties.name} and ${this.targetNode.properties.name}</p>
                    <p><strong>Description:</strong> ${this.properties.description}</p>
                </div>
            `
        });
        
        modal.show();
    }

    /**
     * Set edge visibility
     * @param {boolean} visible - Whether the edge should be visible
     */
    setVisibility(visible) {
        this.isVisible = visible;
        if (this.element) {
            this.element.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * Check if edge exists within given time range
     * @param {Date} date - The date to check against
     * @returns {boolean} - Whether the edge should exist at this time
     */
    existsAtDate(date) {
        const interactionDate = new Date(this.properties.date);
        return interactionDate.getTime() === date.getTime();
    }

    /**
     * Clean up edge (remove from DOM, clear listeners)
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.remove();
        }
        this.element = null;
    }
}

// Edge factory function for creating edges from data
export const createEdge = (sourceNode, targetNode, data) => {
    return new Edge(sourceNode, targetNode, {
        interactionType: data.type,
        date: data.date,
        description: data.description,
        // Add any additional properties from data
    });
};

export default Edge;