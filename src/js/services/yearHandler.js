import { writeInteraction } from '../utils/mapUtils.js';

export function yearChangeHandler(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const year = parseInt(e.target.value);
        if (isNaN(year) || year < yearConfig.min || year > yearConfig.max) {
            yearInput.style.borderColor = 'red';
            return;
        }
        yearInput.style.borderColor = '';
        clearMap(map);
        setTimeout(() => writeInteraction(map, year, visibleInteractionTypes), 100);
    }
}