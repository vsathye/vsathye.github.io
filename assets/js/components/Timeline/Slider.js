/**
 * Slider.js
 * Timeline slider component for controlling the historical map view
 */

class TimelineSlider {
    constructor(containerId, config = {}) {
        this.container = document.getElementById(containerId);
        this.config = {
            startYear: config.startYear || -5000, // 5000 BC
            endYear: config.endYear || 2025,      // 2025 AD
            stepSize: config.stepSize || 1,       // Year step size
            initialYear: config.initialYear || 0,  // Default to year 0
            width: config.width || '100%',
            height: config.height || 100,
            ...config
        };

        this.callbacks = new Set();
        this.currentYear = this.config.initialYear;
        this.isDragging = false;
        
        this.initialize();
    }

    /**
     * Initialize the timeline slider component
     */
    initialize() {
        // Create container elements
        this.createElements();
        
        // Add labels and markers
        this.addTimelineMarkers();
        
        // Setup event handlers
        this.setupEventListeners();
        
        // Set initial position
        this.updateSliderPosition(this.yearToPosition(this.currentYear));
    }

    /**
     * Create the main timeline elements
     */
    createElements() {
        this.timeline = document.createElement('div');
        this.timeline.classList.add('timeline-container');
        
        // Create the track
        this.track = document.createElement('div');
        this.track.classList.add('timeline-track');
        
        // Create the slider handle
        this.handle = document.createElement('div');
        this.handle.classList.add('timeline-handle');
        
        // Create year display
        this.yearDisplay = document.createElement('div');
        this.yearDisplay.classList.add('timeline-year-display');
        
        // Create play/pause controls
        this.controls = document.createElement('div');
        this.controls.classList.add('timeline-controls');
        
        const playButton = document.createElement('button');
        playButton.innerHTML = '▶';
        playButton.onclick = () => this.togglePlayback();
        
        this.controls.appendChild(playButton);
        
        // Assemble elements
        this.track.appendChild(this.handle);
        this.timeline.appendChild(this.track);
        this.timeline.appendChild(this.yearDisplay);
        this.timeline.appendChild(this.controls);
        
        this.container.appendChild(this.timeline);
    }

    /**
     * Add timeline markers and labels
     */
    addTimelineMarkers() {
        const markers = document.createElement('div');
        markers.classList.add('timeline-markers');
        
        // Add major markers every 1000 years
        for (let year = this.config.startYear; year <= this.config.endYear; year += 1000) {
            const marker = document.createElement('div');
            marker.classList.add('timeline-marker');
            
            const label = document.createElement('span');
            label.classList.add('timeline-label');
            label.textContent = this.formatYear(year);
            
            // Position marker
            const position = this.yearToPosition(year);
            marker.style.left = `${position}%`;
            
            markers.appendChild(marker);
            markers.appendChild(label);
        }
        
        this.track.appendChild(markers);
    }

    /**
     * Setup event listeners for slider interaction
     */
    setupEventListeners() {
        // Mouse events for handle dragging
        this.handle.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            document.addEventListener('mousemove', this.handleDrag);
            document.addEventListener('mouseup', this.handleDragEnd);
        });

        // Click on track to jump to position
        this.track.addEventListener('click', (e) => {
            if (e.target === this.handle) return;
            
            const rect = this.track.getBoundingClientRect();
            const position = ((e.clientX - rect.left) / rect.width) * 100;
            this.updateSliderPosition(position);
        });

        // Keyboard navigation
        this.handle.addEventListener('keydown', (e) => {
            let newYear = this.currentYear;
            
            switch(e.key) {
                case 'ArrowLeft':
                    newYear -= this.config.stepSize;
                    break;
                case 'ArrowRight':
                    newYear += this.config.stepSize;
                    break;
                case 'Home':
                    newYear = this.config.startYear;
                    break;
                case 'End':
                    newYear = this.config.endYear;
                    break;
                default:
                    return;
            }
            
            this.setYear(newYear);
            e.preventDefault();
        });
    }

    /**
     * Handle drag movement
     * @param {MouseEvent} e - Mouse event
     */
    handleDrag = (e) => {
        if (!this.isDragging) return;
        
        const rect = this.track.getBoundingClientRect();
        const position = ((e.clientX - rect.left) / rect.width) * 100;
        this.updateSliderPosition(position);
    }

    /**
     * Handle end of drag
     */
    handleDragEnd = () => {
        this.isDragging = false;
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.handleDragEnd);
    }

    /**
     * Update slider position and trigger callbacks
     * @param {number} position - Position percentage (0-100)
     */
    updateSliderPosition(position) {
        // Clamp position between 0 and 100
        position = Math.max(0, Math.min(100, position));
        
        // Update handle position
        this.handle.style.left = `${position}%`;
        
        // Calculate year from position
        const newYear = this.positionToYear(position);
        
        if (newYear !== this.currentYear) {
            this.currentYear = newYear;
            this.updateYearDisplay();
            this.notifyCallbacks();
        }
    }

    /**
     * Convert year to slider position percentage
     * @param {number} year - Year to convert
     * @returns {number} - Position percentage (0-100)
     */
    yearToPosition(year) {
        const range = this.config.endYear - this.config.startYear;
        return ((year - this.config.startYear) / range) * 100;
    }

    /**
     * Convert slider position percentage to year
     * @param {number} position - Position percentage (0-100)
     * @returns {number} - Year
     */
    positionToYear(position) {
        const range = this.config.endYear - this.config.startYear;
        const year = this.config.startYear + (range * (position / 100));
        return Math.round(year / this.config.stepSize) * this.config.stepSize;
    }

    /**
     * Format year for display (handling BC/AD)
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
     * Update the year display
     */
    updateYearDisplay() {
        this.yearDisplay.textContent = this.formatYear(this.currentYear);
    }

    /**
     * Set the current year
     * @param {number} year - Year to set
     */
    setYear(year) {
        // Clamp year to valid range
        year = Math.max(this.config.startYear, 
                       Math.min(this.config.endYear, year));
        
        const position = this.yearToPosition(year);
        this.updateSliderPosition(position);
    }

    /**
     * Add a callback for year changes
     * @param {Function} callback - Callback function
     */
    onYearChange(callback) {
        this.callbacks.add(callback);
    }

    /**
     * Remove a year change callback
     * @param {Function} callback - Callback function to remove
     */
    removeCallback(callback) {
        this.callbacks.delete(callback);
    }

    /**
     * Notify all callbacks of year change
     */
    notifyCallbacks() {
        this.callbacks.forEach(callback => {
            callback(this.currentYear);
        });
    }

    /**
     * Toggle automatic playback
     */
    togglePlayback() {
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
            this.controls.querySelector('button').innerHTML = '▶';
        } else {
            this.playInterval = setInterval(() => {
                const newYear = this.currentYear + this.config.stepSize;
                if (newYear <= this.config.endYear) {
                    this.setYear(newYear);
                } else {
                    this.togglePlayback();
                }
            }, 100);
            this.controls.querySelector('button').innerHTML = '⏸';
        }
    }

    /**
     * Clean up the slider component
     */
    destroy() {
        // Clear playback interval if running
        if (this.playInterval) {
            clearInterval(this.playInterval);
        }

        // Remove event listeners
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.handleDragEnd);

        // Clear callbacks
        this.callbacks.clear();

        // Remove from DOM
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

export default TimelineSlider;