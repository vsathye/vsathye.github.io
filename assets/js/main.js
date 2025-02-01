// Main application logic
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize components
        const mapContainer = document.getElementById('map');
        const sliderContainer = document.getElementById('time-slider');
        
        if (!mapContainer || !sliderContainer) {
            throw new Error('Required DOM elements not found');
        }

        // Create instances with error checking
        if (typeof DataLoader === 'undefined') {
            throw new Error('DataLoader class not loaded');
        }
        const dataLoader = new DataLoader();

        if (typeof MapVisualization === 'undefined') {
            throw new Error('MapVisualization class not loaded');
        }
        const mapVis = new MapVisualization(mapContainer);

        if (typeof TimeSlider === 'undefined') {
            throw new Error('TimeSlider class not loaded');
        }
        const timeSlider = new TimeSlider(sliderContainer, async (year) => {
            if (!dataLoader.governmentsData || !dataLoader.interactionsData) {
                await dataLoader.loadData();
            }
            const filteredData = dataLoader.filterDataByYear(year);
            mapVis.updateVisualization(filteredData);
        });

        // Load initial data
        await dataLoader.loadData();
        
        // Update visualization with initial year data
        const initialYear = timeSlider.getCurrentYear();
        const filteredData = dataLoader.filterDataByYear(initialYear);
        mapVis.updateVisualization(filteredData);

    } catch (error) {
        console.error('Error initializing application:', error);
        // Add visible error message to the page
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '20px';
        errorDiv.textContent = `Application Error: ${error.message}`;
        document.body.prepend(errorDiv);
    }
});