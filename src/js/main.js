import { mapConfig } from './config/mapConfig.js';
import { interactionColors, interactionCategories } from './config/interactionColors.js';
import { yearConfig } from './config/yearConfig.js';
import { Legend } from './components/legend.js';
import { YearInput } from './components/yearInput.js';
import { loadEntityData, fetchAllData } from './utils/dataLoader.js';

export function initializeApp() {
    const map = new maplibregl.Map(mapConfig);
    
    // Initialize components
    const legend = new Legend(map, interactionCategories, interactionColors);
    const yearInput = new YearInput(map, yearConfig, legend.getVisibleInteractionTypes());
    
    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl());

    // Connect legend and year input
    legend.onVisibilityChange = (types) => {
        yearInput.setVisibleInteractionTypes(types);
    };
}