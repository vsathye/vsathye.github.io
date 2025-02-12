import { clearMap, writeInteraction } from '../utils/mapUtils.js';

export class YearInput {
    constructor(map, yearConfig, visibleInteractionTypes) {
        this.map = map;
        this.yearConfig = yearConfig;
        this.visibleInteractionTypes = new Set(visibleInteractionTypes);
        this.initializeYearInput();
    }

    initializeYearInput() {
        const yearInput = document.getElementById('yearInput');
        yearInput.addEventListener('keydown', this.yearChangeHandler.bind(this));
    }

    yearChangeHandler(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const year = parseInt(e.target.value);
            if (isNaN(year) || year < this.yearConfig.min || year > this.yearConfig.max) {
                e.target.style.borderColor = 'red';
                return;
            }
            e.target.style.borderColor = '';
            clearMap(this.map);
            setTimeout(() => writeInteraction(this.map, year, this.visibleInteractionTypes), 100);
        }
    }

    setVisibleInteractionTypes(types) {
        this.visibleInteractionTypes = new Set(types);
    }
}