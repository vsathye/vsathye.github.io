class Legend {
    constructor(mapInstance) {
        this.map = mapInstance;
        this.expanded = true;
        this.currentTimeRange = null;
        
        // Define government types and their symbols
        this.governmentTypes = {
            Empire: {
                symbol: '⬡', // Hexagon
                description: 'Large territorial state with multiple peoples/cultures'
            },
            'City-state': {
                symbol: '◆', // Diamond
                description: 'Independent city with surrounding territory'
            },
            Tribe: {
                symbol: '▲', // Triangle
                description: 'Clan or tribal based society'
            },
            Kingdom: {
                symbol: '■', // Square
                description: 'Monarchical state with single ruling dynasty'
            }
        };
        
        // Define interaction types and their colors
        this.interactionTypes = {
            war: {
                color: '#FF4444',
                description: 'Military conflicts and battles'
            },
            trade: {
                color: '#44FF44',
                description: 'Commercial and economic relationships'
            },
            diplomacy: {
                color: '#4444FF',
                description: 'Political alliances and negotiations'
            }
        };
        
        this.init();
    }

    init() {
        this.createLegendContainer();
        this.createHeader();
        this.createSections();
        this.setupEventListeners();
        this.setupAccessibility();
    }

    createLegendContainer() {
        this.container = document.createElement('div');
        this.container.className = 'map-legend';
        this.container.setAttribute('role', 'complementary');
        this.container.setAttribute('aria-label', 'Map Legend');
        document.querySelector('#map-container').appendChild(this.container);
    }

    createHeader() {
        const header = document.createElement('div');
        header.className = 'legend-header';
        
        // Title and toggle button
        const title = document.createElement('h3');
        title.textContent = 'Legend';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = this.expanded ? '−' : '+';
        toggleBtn.setAttribute('aria-label', this.expanded ? 'Collapse legend' : 'Expand legend');
        toggleBtn.addEventListener('click', () => this.toggleLegend());
        
        header.appendChild(title);
        header.appendChild(toggleBtn);
        this.container.appendChild(header);
    }

    createSections() {
        this.content = document.createElement('div');
        this.content.className = 'legend-content';
        
        // Government Types Section
        const govSection = this.createSection('Government Types');
        Object.entries(this.governmentTypes).forEach(([type, info]) => {
            const item = this.createLegendItem(
                info.symbol,
                type,
                info.description,
                null,
                () => this.toggleFilter('government', type)
            );
            govSection.appendChild(item);
        });
        
        // Interaction Types Section
        const intSection = this.createSection('Interaction Types');
        Object.entries(this.interactionTypes).forEach(([type, info]) => {
            const item = this.createLegendItem(
                '━━',
                type,
                info.description,
                info.color,
                () => this.toggleFilter('interaction', type)
            );
            intSection.appendChild(item);
        });
        
        this.content.appendChild(govSection);
        this.content.appendChild(intSection);
        this.container.appendChild(this.content);
        
        // Add search if many items
        if (Object.keys(this.governmentTypes).length + Object.keys(this.interactionTypes).length > 10) {
            this.addSearch();
        }
    }

    createSection(title) {
        const section = document.createElement('div');
        section.className = 'legend-section';
        
        const header = document.createElement('h4');
        header.textContent = title;
        
        const content = document.createElement('div');
        content.className = 'section-content';
        
        section.appendChild(header);
        section.appendChild(content);
        
        // Make section collapsible
        header.addEventListener('click', () => {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
            header.setAttribute('aria-expanded', content.style.display === 'block');
        });
        
        return section;
    }

    createLegendItem(symbol, label, description, color = null, onClick = null) {
        const item = document.createElement('div');
        item.className = 'legend-item';
        
        const symbolEl = document.createElement('span');
        symbolEl.className = 'legend-symbol';
        symbolEl.textContent = symbol;
        if (color) symbolEl.style.color = color;
        
        const labelEl = document.createElement('span');
        labelEl.className = 'legend-label';
        labelEl.textContent = label;
        
        const descEl = document.createElement('span');
        descEl.className = 'legend-description';
        descEl.textContent = description;
        
        item.appendChild(symbolEl);
        item.appendChild(labelEl);
        item.appendChild(descEl);
        
        if (onClick) {
            item.addEventListener('click', onClick);
            item.style.cursor = 'pointer';
        }
        
        // Make touch-friendly
        item.style.minHeight = '44px';
        item.style.padding = '8px';
        
        return item;
    }

    addSearch() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'legend-search';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search legend...';
        searchInput.setAttribute('aria-label', 'Search legend items');
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            this.filterLegendItems(searchTerm);
        });
        
        searchContainer.appendChild(searchInput);
        this.container.insertBefore(searchContainer, this.content);
    }

    filterLegendItems(searchTerm) {
        const items = this.content.querySelectorAll('.legend-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
        });
    }

    toggleLegend() {
        this.expanded = !this.expanded;
        this.content.style.display = this.expanded ? 'block' : 'none';
        
        const toggleBtn = this.container.querySelector('.legend-header button');
        toggleBtn.innerHTML = this.expanded ? '−' : '+';
        toggleBtn.setAttribute('aria-label', this.expanded ? 'Collapse legend' : 'Expand legend');
    }

    toggleFilter(type, value) {
        // Notify map component about filter change
        this.map.toggleFilter(type, value);
        
        // Update visual state in legend
        const items = this.content.querySelectorAll('.legend-item');
        items.forEach(item => {
            if (item.querySelector('.legend-label').textContent === value) {
                item.classList.toggle('filtered');
            }
        });
    }

    setupEventListeners() {
        // Handle map time period changes
        this.map.on('timeChange', (timeRange) => {
            this.currentTimeRange = timeRange;
            this.updateVisibility();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.updatePosition();
        });
    }

    updateVisibility() {
        // Show/hide legend items based on what's visible in the current time period
        const items = this.content.querySelectorAll('.legend-item');
        items.forEach(item => {
            const type = item.querySelector('.legend-label').textContent;
            const visible = this.map.isTypeVisibleInTimeRange(type, this.currentTimeRange);
            item.style.opacity = visible ? '1' : '0.5';
        });
    }

    updatePosition() {
        // Adjust legend position based on screen size
        if (window.innerWidth < 768) {
            this.container.style.position = 'fixed';
            this.container.style.bottom = '0';
            this.container.style.left = '0';
            this.container.style.right = '0';
            this.container.style.maxHeight = '30vh';
        } else {
            this.container.style.position = 'absolute';
            this.container.style.top = '10px';
            this.container.style.right = '10px';
            this.container.style.maxHeight = '80vh';
        }
    }

    setupAccessibility() {
        // Setup keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.toggleLegend();
            }
        });
        
        // Add ARIA labels and roles
        const sections = this.container.querySelectorAll('.legend-section');
        sections.forEach(section => {
            const header = section.querySelector('h4');
            const content = section.querySelector('.section-content');
            
            header.setAttribute('role', 'button');
            header.setAttribute('aria-expanded', 'true');
            content.setAttribute('role', 'region');
            content.setAttribute('aria-labelledby', header.id);
        });
    }
}

window.Legend = Legend;