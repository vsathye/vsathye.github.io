import { clearMap } from '../utils/mapUtils.js';

export class Legend {
    constructor(map, interactionCategories, interactionColors) {
        this.map = map;
        this.visibleInteractionTypes = new Set(Object.keys(interactionColors));
        this.interactionColors = interactionColors;
        this.element = document.getElementById('legend');
        this.content = this.element.querySelector('.legend-content');
        this.header = this.element.querySelector('.legend-header');
        this.expandIcon = this.element.querySelector('.expand-icon');
        
        this.initializeLegend(interactionCategories);
        this.bindEvents();
    }

    initializeLegend(interactionCategories) {
        // Clear any existing content
        const categoryDivs = this.element.querySelectorAll('.interaction-category');
        categoryDivs.forEach(div => {
            while (div.lastChild && div.lastChild.tagName !== 'H4') {
                div.removeChild(div.lastChild);
            }
        });

        // Populate legend content
        Object.values(interactionCategories).forEach(category => {
            const categoryDiv = this.element.querySelector(`[data-category="${category.title}"]`);
            if (categoryDiv) {
                this.populateCategory(categoryDiv, category);
            }
        });
    }

    populateCategory(categoryDiv, category) {
        category.types.forEach(type => {
            const typeDiv = document.createElement('div');
            typeDiv.className = 'interaction-type';
            
            const color = this.interactionColors[type];
            const displayName = this.formatTypeName(type);
            
            typeDiv.innerHTML = `
                <input type="checkbox" 
                       class="interaction-checkbox" 
                       data-interaction-type="${type}" 
                       ${this.visibleInteractionTypes.has(type) ? 'checked' : ''}>
                <div class="interaction-line" style="background-color: ${color}"></div>
                <span>${displayName}</span>
            `;
            
            categoryDiv.appendChild(typeDiv);
        });
    }

    formatTypeName(type) {
        return type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    bindEvents() {
        // Toggle legend expansion
        this.header.addEventListener('click', () => this.toggleExpansion());
        
        // Handle interaction visibility toggling
        this.element.addEventListener('change', (e) => this.handleInteractionToggle(e));
    }

    toggleExpansion() {
        this.content.classList.toggle('expanded');
        this.expandIcon.textContent = this.content.classList.contains('expanded') ? '▼' : '▶';
    }

    handleInteractionToggle(e) {
        if (!e.target.classList.contains('interaction-checkbox')) {
            return;
        }

        const interactionType = e.target.dataset.interactionType;
        const isVisible = e.target.checked;

        this.updateInteractionVisibility(interactionType, isVisible);
        this.updateMapLayers(interactionType, isVisible);
    }

    updateInteractionVisibility(interactionType, isVisible) {
        if (isVisible) {
            this.visibleInteractionTypes.add(interactionType);
        } else {
            this.visibleInteractionTypes.delete(interactionType);
        }
        
        if (this.onVisibilityChange) {
            this.onVisibilityChange(Array.from(this.visibleInteractionTypes));
        }
    }

    updateMapLayers(interactionType, isVisible) {
        const style = this.map.getStyle();
        if (!style || !style.sources) return;

        Object.keys(style.sources).forEach(sourceId => {
            if (!sourceId.startsWith('interaction-')) return;

            const layerId = `${sourceId}-line`;
            if (!this.map.getLayer(layerId)) return;

            const source = this.map.getSource(sourceId);
            if (!source || !source._data || !source._data.features || !source._data.features.length) return;

            const properties = source._data.features[0].properties;
            if (properties.type === interactionType) {
                this.map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
            }
        });
    }

    getVisibleInteractionTypes() {
        return Array.from(this.visibleInteractionTypes);
    }

    setVisibleInteractionTypes(types) {
        this.visibleInteractionTypes = new Set(types);
        
        // Update checkboxes to match
        const checkboxes = this.element.querySelectorAll('.interaction-checkbox');
        checkboxes.forEach(checkbox => {
            const type = checkbox.dataset.interactionType;
            checkbox.checked = this.visibleInteractionTypes.has(type);
        });

        // Update map layers
        types.forEach(type => {
            this.updateMapLayers(type, this.visibleInteractionTypes.has(type));
        });
    }

    reset() {
        // Reset to default state
        const allTypes = Object.keys(this.interactionColors);
        this.setVisibleInteractionTypes(allTypes);
        this.content.classList.remove('expanded');
        this.expandIcon.textContent = '▶';
    }

    // Method to update colors if needed
    updateInteractionColor(type, newColor) {
        if (this.interactionColors[type]) {
            this.interactionColors[type] = newColor;
            const lineElement = this.element.querySelector(
                `.interaction-type[data-interaction-type="${type}"] .interaction-line`
            );
            if (lineElement) {
                lineElement.style.backgroundColor = newColor;
            }
        }
    }
}