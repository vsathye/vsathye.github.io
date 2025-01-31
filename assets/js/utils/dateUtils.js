import { TIME } from '../config/constants';

/**
 * BC/AD Date Handling
 */
export const bcad = {
    /**
     * Convert numeric year to BC/AD string
     * @param {number} year Numeric year (-5000 to 2025)
     * @returns {string} Formatted year string
     */
    toString: (year) => {
        if (!bcad.isValidYear(year)) return null;
        const absYear = Math.abs(year);
        return year < 0 ? `${absYear} BC` : `${absYear} AD`;
    },

    /**
     * Convert BC/AD string to numeric year
     * @param {string} yearStr Year string (e.g., "500 BC" or "500 AD")
     * @returns {number} Numeric year
     */
    toNumber: (yearStr) => {
        const match = yearStr.match(/^(\d+)\s*(BC|AD)$/i);
        if (!match) return null;
        
        const [, yearNum, era] = match;
        const year = parseInt(yearNum);
        return era.toUpperCase() === 'BC' ? -year : year;
    },

    /**
     * Check if year is within valid range
     * @param {number} year Year to check
     * @returns {boolean} Validity result
     */
    isValidYear: (year) => {
        return Number.isInteger(year) && 
               year >= TIME.START_YEAR && 
               year <= TIME.END_YEAR;
    },

    /**
     * Get absolute years between two dates
     * @param {number} year1 First year
     * @param {number} year2 Second year
     * @returns {number} Number of years
     */
    yearsBetween: (year1, year2) => {
        if (!bcad.isValidYear(year1) || !bcad.isValidYear(year2)) return null;
        return Math.abs(year2 - year1);
    }
};

/**
 * Date Range Operations
 */
export const range = {
    /**
     * Create a date range object
     * @param {number} start Start year
     * @param {number} end End year
     * @returns {Object} Range object
     */
    create: (start, end) => {
        if (!bcad.isValidYear(start) || !bcad.isValidYear(end) || end < start) {
            return null;
        }
        return { start, end };
    },

    /**
     * Check if two ranges intersect
     * @param {Object} range1 First range
     * @param {Object} range2 Second range
     * @returns {boolean} Intersection result
     */
    intersects: (range1, range2) => {
        return range1.start <= range2.end && range2.start <= range1.end;
    },

    /**
     * Get intersection of two ranges
     * @param {Object} range1 First range
     * @param {Object} range2 Second range
     * @returns {Object} Intersection range
     */
    intersection: (range1, range2) => {
        if (!range.intersects(range1, range2)) return null;
        return range.create(
            Math.max(range1.start, range2.start),
            Math.min(range1.end, range2.end)
        );
    },

    /**
     * Check if range contains a year
     * @param {Object} range Range to check
     * @param {number} year Year to test
     * @returns {boolean} Containment result
     */
    contains: (range, year) => {
        return year >= range.start && year <= range.end;
    },

    /**
     * Get duration of range
     * @param {Object} range Range to measure
     * @returns {number} Duration in years
     */
    duration: (range) => {
        return range.end - range.start + 1;
    },

    /**
     * Format range as string
     * @param {Object} range Range to format
     * @returns {string} Formatted range
     */
    toString: (range) => {
        return `${bcad.toString(range.start)} to ${bcad.toString(range.end)}`;
    }
};

/**
 * Timeline Period Utilities
 */
export const period = {
    /**
     * Get periods that overlap with a year
     * @param {Array} periods Array of period objects
     * @param {number} year Year to check
     * @returns {Array} Overlapping periods
     */
    getOverlapping: (periods, year) => {
        return periods.filter(p => range.contains(p, year));
    },

    /**
     * Merge overlapping periods
     * @param {Array} periods Array of period objects
     * @returns {Array} Merged periods
     */
    merge: (periods) => {
        if (periods.length === 0) return [];
        
        const sorted = [...periods].sort((a, b) => a.start - b.start);
        const merged = [sorted[0]];
        
        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const last = merged[merged.length - 1];
            
            if (current.start <= last.end) {
                last.end = Math.max(last.end, current.end);
            } else {
                merged.push(current);
            }
        }
        
        return merged;
    },

    /**
     * Group periods by era
     * @param {Array} periods Array of period objects
     * @returns {Object} Grouped periods
     */
    groupByEra: (periods) => {
        return periods.reduce((groups, p) => {
            const era = p.start < 0 ? 'BC' : 'AD';
            if (!groups[era]) groups[era] = [];
            groups[era].push(p);
            return groups;
        }, {});
    }
};

/**
 * Timeline Scale Utilities
 */
export const scale = {
    /**
     * Calculate appropriate scale divisions
     * @param {number} start Start year
     * @param {number} end End year
     * @param {number} targetDivisions Desired number of divisions
     * @returns {Array} Scale division points
     */
    calculateDivisions: (start, end, targetDivisions = 10) => {
        const range = end - start;
        const roughInterval = range / targetDivisions;
        
        // Common intervals (in years)
        const intervals = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
        const interval = intervals.find(i => i >= roughInterval) || intervals[intervals.length - 1];
        
        const divisions = [];
        let current = Math.ceil(start / interval) * interval;
        
        while (current <= end) {
            divisions.push(current);
            current += interval;
        }
        
        return divisions;
    },

    /**
     * Convert year to position on timeline
     * @param {number} year Year to convert
     * @param {number} start Timeline start year
     * @param {number} end Timeline end year
     * @param {number} width Timeline width
     * @returns {number} Position in pixels
     */
    yearToPosition: (year, start, end, width) => {
        return ((year - start) / (end - start)) * width;
    },

    /**
     * Convert position to nearest year
     * @param {number} position Position in pixels
     * @param {number} start Timeline start year
     * @param {number} end Timeline end year
     * @param {number} width Timeline width
     * @returns {number} Nearest year
     */
    positionToYear: (position, start, end, width) => {
        const year = start + (position / width) * (end - start);
        return Math.round(year);
    },

    /**
     * Snap year to nearest interval
     * @param {number} year Year to snap
     * @param {number} interval Snap interval
     * @returns {number} Snapped year
     */
    snapToInterval: (year, interval) => {
        return Math.round(year / interval) * interval;
    }
};

/**
 * Timeline Label Utilities
 */
export const label = {
    /**
     * Get appropriate label for scale division
     * @param {number} year Year to label
     * @param {number} interval Scale interval
     * @returns {string} Formatted label
     */
    formatDivision: (year, interval) => {
        // For large intervals, use shorter format
        if (interval >= 1000) {
            return bcad.toString(year).replace(' AD', '').replace(' BC', ' BCE');
        }
        return bcad.toString(year);
    },

    /**
     * Get era label for a range of years
     * @param {number} start Start year
     * @param {number} end End year
     * @returns {string} Era label
     */
    getEraLabel: (start, end) => {
        if (start < 0 && end < 0) return 'BC';
        if (start >= 0 && end >= 0) return 'AD';
        return 'BC/AD';
    },

    /**
     * Format duration
     * @param {number} years Number of years
     * @returns {string} Formatted duration
     */
    formatDuration: (years) => {
        if (years < 100) return `${years} years`;
        const centuries = Math.floor(years / 100);
        return `${centuries} ${centuries === 1 ? 'century' : 'centuries'}`;
    }
};

export default {
    bcad,
    range,
    period,
    scale,
    label
};