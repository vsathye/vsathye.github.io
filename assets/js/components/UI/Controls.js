class Controls {
    constructor(mapInstance, timelineInstance) {
        this.map = mapInstance;
        this.timeline = timelineInstance;
        this.fullscreen = false;
        this.filters = {
            governments: {
                Empire: true,
                'City-state': true,
                Tribe: true,
                Kingdom: true
            },
            interactions: {
                war: true,
                trade: true,
                diplomacy: true
            }
        };
        
        this.init();
    }

    init() {
        this.createControlContainer();
        this.setupZoomControls();
        this.setupTimeControls();
        this.setupFilterControls();
        this.setupSearchControl();
        this.setupViewControls();
        this.setupKeyboardShortcuts();
        this.setupTouchGestures();
    }

    createControlContainer() {
        this.container = document.createElement('div');
        this.container.className = 'map-controls';
        document.querySelector('#map-container').appendChild(this.container);
    }

    setupZoomControls() {
        const zoomContainer = document.createElement('div');
        zoomContainer.className = 'zoom-controls';
        
        const zoomIn = this.createButton('+', () => this.map.zoomIn());
        const zoomOut = this.createButton('-', () => this.map.zoomOut());
        
        zoomContainer.appendChild(zoomIn);
        zoomContainer.appendChild(zoomOut);
        this.container.appendChild(zoomContainer);
    }

    setupTimeControls() {
        const timeContainer = document.createElement('div');
        timeContainer.className = 'time-controls';
        
        // Quick selection buttons for major historical periods
        const periods = [
            { label: 'Ancient', year: -3000 },
            { label: 'Classical', year: -500 },
            { label: 'Medieval', year: 500 },
            { label: 'Modern', year: 1500 },
            { label: 'Present', year: 2025 }
        ];
        
        periods.forEach(period => {
            const btn = this.createButton(period.label, () => {
                this.timeline.setYear(period.year);
            });
            timeContainer.appendChild(btn);
        });
        
        this.container.appendChild(timeContainer);
    }

    setupFilterControls() {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-controls';
        
        // Government type filters
        const govFilters = document.createElement('div');
        govFilters.className = 'government-filters';
        Object.keys(this.filters.governments).forEach(type => {
            const checkbox = this.createCheckbox(type, checked => {
                this.filters.governments[type] = checked;
                this.map.updateFilters(this.filters);
            });
            govFilters.appendChild(checkbox);
        });
        
        // Interaction type filters
        const intFilters = document.createElement('div');
        intFilters.className = 'interaction-filters';
        Object.keys(this.filters.interactions).forEach(type => {
            const checkbox = this.createCheckbox(type, checked => {
                this.filters.interactions[type] = checked;
                this.map.updateFilters(this.filters);
            });
            intFilters.appendChild(checkbox);
        });
        
        filterContainer.appendChild(govFilters);
        filterContainer.appendChild(intFilters);
        this.container.appendChild(filterContainer);
    }

    setupSearchControl() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-control';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search governments...';
        
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.map.searchGovernments(e.target.value);
            }, 300);
        });
        
        searchContainer.appendChild(searchInput);
        this.container.appendChild(searchContainer);
    }

    setupViewControls() {
        const viewContainer = document.createElement('div');
        viewContainer.className = 'view-controls';
        
        // Reset view button
        const resetBtn = this.createButton('Reset View', () => {
            this.map.resetView();
            this.timeline.resetTime();
        });
        
        // Fullscreen toggle
        const fullscreenBtn = this.createButton('Fullscreen', () => this.toggleFullscreen());
        
        viewContainer.appendChild(resetBtn);
        viewContainer.appendChild(fullscreenBtn);
        this.container.appendChild(viewContainer);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case '+':
                case '=':
                    this.map.zoomIn();
                    break;
                case '-':
                    this.map.zoomOut();
                    break;
                case 'f':
                    if (e.ctrlKey) this.toggleFullscreen();
                    break;
                case 'r':
                    if (e.ctrlKey) this.map.resetView();
                    break;
                case 'ArrowLeft':
                    this.timeline.stepBack();
                    break;
                case 'ArrowRight':
                    this.timeline.stepForward();
                    break;
            }
        });
    }

    setupTouchGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 2) return; // Only handle pinch gestures
            
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dist = Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY
            );
            
            // Implement pinch-to-zoom logic here
            this.handlePinchZoom(dist);
        });
    }

    // Helper methods
    createButton(label, onClick) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.addEventListener('click', onClick);
        this.addTooltip(btn, label);
        return btn;
    }

    createCheckbox(label, onChange) {
        const container = document.createElement('div');
        container.className = 'checkbox-container';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.addEventListener('change', (e) => onChange(e.target.checked));
        
        const text = document.createElement('span');
        text.textContent = label;
        
        container.appendChild(checkbox);
        container.appendChild(text);
        this.addTooltip(container, `Toggle ${label} visibility`);
        return container;
    }

    addTooltip(element, text) {
        element.setAttribute('title', text);
        // Could be expanded to use a custom tooltip system
    }

    toggleFullscreen() {
        if (!this.fullscreen) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        this.fullscreen = !this.fullscreen;
    }

    handlePinchZoom(distance) {
        // Store the last distance to determine zoom in/out
        if (!this.lastPinchDistance) {
            this.lastPinchDistance = distance;
            return;
        }
        
        const delta = this.lastPinchDistance - distance;
        if (Math.abs(delta) > 10) { // Threshold to prevent tiny movements
            if (delta > 0) {
                this.map.zoomOut();
            } else {
                this.map.zoomIn();
            }
        }
        
        this.lastPinchDistance = distance;
    }
}

export default Controls;