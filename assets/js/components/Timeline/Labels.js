/**
 * Labels.js
 * Manages timeline labels and historical period markers
 */

class TimelineLabels {
    constructor(containerId, config = {}) {
        this.container = document.getElementById(containerId);
        this.config = {
            startYear: config.startYear || -5000,
            endYear: config.endYear || 2025,
            height: config.height || 80,
            ...config
        };

        // Historical periods to mark on the timeline
        this.historicalPeriods = [
            {
                name: "Stone Age",
                startYear: -5000,
                endYear: -3300,
                color: "#8B4513"
            },
            {
                name: "Bronze Age",
                startYear: -3300,
                endYear: -1200,
                color: "#CD853F"
            },
            {
                name: "Iron Age",
                startYear: -1200,
                endYear: -550,
                color: "#A0522D"
            },
            {
                name: "Classical Antiquity",
                startYear: -550,
                endYear: 476,
                color: "#6B8E23"
            },
            {
                name: "Middle Ages",
                startYear: 476,
                endYear: 1453,
                color: "#4682B4"
            },
            {
                name: "Renaissance",
                startYear: 1453,
                endYear: 1600,
                color: "#483D8B"
            },
            {
                name: "Early Modern Period",
                startYear: 1600,
                endYear: 1800,
                color: "#9370DB"
            },
            {
                name: "Modern Era",
                startYear: 1800,
                endYear: 1945,
                color: "#4169E1"
            },
            {
                name: "Contemporary History",
                startYear: 1945,
                endYear: 2025,
                color: "#1E90FF"
            }
        ];

        this.initialize();
    }

    /**
     * Initialize the labels component
     */
    initialize() {
        this.createContainer();
        this.addPeriodMarkers();
        this.addSignificantEvents();
    }

    /**
     * Create the main container for labels
     */
    createContainer() {
        this.labelsContainer = document.createElement('div');
        this.labelsContainer.classList.add('timeline-labels-container');
        this.container.appendChild(this.labelsContainer);
    }

    /**
     * Add historical period markers to the timeline
     */
    addPeriodMarkers() {
        const periodContainer = document.createElement('div');
        periodContainer.classList.add('historical-periods');

        this.historicalPeriods.forEach(period => {
            const periodElement = this.createPeriodElement(period);
            periodContainer.appendChild(periodElement);
        });

        this.labelsContainer.appendChild(periodContainer);
    }

    /**
     * Create an element for a historical period
     * @param {Object} period - Historical period data
     * @returns {HTMLElement} - Period element
     */
    createPeriodElement(period) {
        const element = document.createElement('div');
        element.classList.add('historical-period');

        // Calculate position and width as percentages
        const startPos = this.yearToPosition(period.startYear);
        const endPos = this.yearToPosition(period.endYear);
        const width = endPos - startPos;

        element.style.left = `${startPos}%`;
        element.style.width = `${width}%`;
        element.style.backgroundColor = period.color;

        // Add label
        const label = document.createElement('div');
        label.classList.add('period-label');
        label.textContent = period.name;
        
        // Add tooltip with date range
        element.title = `${this.formatYear(period.startYear)} - ${this.formatYear(period.endYear)}`;

        element.appendChild(label);
        return element;
    }

    /**
     * Add markers for significant historical events
     */
    addSignificantEvents() {
        const eventsContainer = document.createElement('div');
        eventsContainer.classList.add('significant-events');

        // Example significant events
        const significantEvents = [
            { year: -3000, name: "First Writing Systems" },
            { year: -2686, name: "Old Kingdom Egypt" },
            { year: -1600, name: "Mycenaean Greece" },
            { year: -753, name: "Founding of Rome" },
            { year: -550, name: "Persian Empire" },
            { year: -330, name: "Alexander's Empire" },
            { year: 0, name: "Year Zero" },
            { year: 476, name: "Fall of Rome" },
            { year: 622, name: "Rise of Islam" },
            { year: 1066, name: "Norman Conquest" },
            { year: 1453, name: "Fall of Constantinople" },
            { year: 1492, name: "Discovery of Americas" },
            { year: 1789, name: "French Revolution" },
            { year: 1914, name: "World War I" },
            { year: 1945, name: "World War II" },
            { year: 1991, name: "End of Cold War" }
        ];

        significantEvents.forEach(event => {
            const eventMarker = this.createEventMarker(event);
            eventsContainer.appendChild(eventMarker);
        });

        this.labelsContainer.appendChild(eventsContainer);
    }

    /**
     * Create a marker for a significant event
     * @param {Object} event - Event data
     * @returns {HTMLElement} - Event marker element
     */
    createEventMarker(event) {
        const marker = document.createElement('div');
        marker.classList.add('event-marker');
        
        const position = this.yearToPosition(event.year);
        marker.style.left = `${position}%`;

        // Create dot marker
        const dot = document.createElement('div');
        dot.classList.add('event-dot');

        // Create label
        const label = document.createElement('div');
        label.classList.add('event-label');
        label.textContent = event.name;

        // Add tooltip with year
        marker.title = `${this.formatYear(event.year)}: ${event.name}`;

        marker.appendChild(dot);
        marker.appendChild(label);
        return marker;
    }

    /**
     * Convert year to position percentage
     * @param {number} year - Year to convert
     * @returns {number} - Position percentage
     */
    yearToPosition(year) {
        const range = this.config.endYear - this.config.startYear;
        return ((year - this.config.startYear) / range) * 100;
    }

    /**
     * Format year for display
     * @param {number} year - Year to format
     * @returns {string} - Formatted year string
     */
    formatYear(year) {
        if (year < 0) {
            return `${Math.abs(year)} BC`;
        } else if (year === 0) {
            return "0";
        } else {
            return `${year} AD`;
        }
    }

    /**
     * Update labels visibility based on zoom level
     * @param {number} zoomLevel - Current zoom level
     */
    updateVisibility(zoomLevel) {
        const labels = this.labelsContainer.querySelectorAll('.period-label, .event-label');
        labels.forEach(label => {
            label.style.display = zoomLevel > 0.7 ? 'block' : 'none';
        });
    }

    /**
     * Clean up the labels component
     */
    destroy() {
        if (this.labelsContainer && this.labelsContainer.parentNode) {
            this.labelsContainer.remove();
        }
    }
}

export default TimelineLabels;