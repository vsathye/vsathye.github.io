// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    const map = new Map('#map');
    
    // Initialize the timeline
    const slider = new Slider('#time-slider');
    
    // Initialize other components
    const legend = new Legend('#map-legend');
    const controls = new Controls('#map-controls');
    
    // Load initial data
    const dataLoader = new DataLoader();
    dataLoader.loadData().then(data => {
        // Update map with initial data
        map.render(data);
    });
});