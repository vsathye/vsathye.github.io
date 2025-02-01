const TIME = {
    START_YEAR: -5000,
    END_YEAR: 2025
};

const bcad = {
    toString: (year) => {
        if (!bcad.isValidYear(year)) return null;
        const absYear = Math.abs(year);
        return year < 0 ? `${absYear} BC` : `${absYear} AD`;
    },

    toNumber: (yearStr) => {
        const match = yearStr.match(/^(\d+)\s*(BC|AD)$/i);
        if (!match) return null;
        
        const [, yearNum, era] = match;
        const year = parseInt(yearNum);
        return era.toUpperCase() === 'BC' ? -year : year;
    },

    isValidYear: (year) => {
        return Number.isInteger(year) && 
               year >= TIME.START_YEAR && 
               year <= TIME.END_YEAR;
    },

    yearsBetween: (year1, year2) => {
        if (!bcad.isValidYear(year1) || !bcad.isValidYear(year2)) return null;
        return Math.abs(year2 - year1);
    }
};

const range = {
    create: (start, end) => {
        if (!bcad.isValidYear(start) || !bcad.isValidYear(end) || end < start) {
            return null;
        }
        return { start, end };
    },

    intersects: (range1, range2) => {
        return range1.start <= range2.end && range2.start <= range1.end;
    },

    intersection: (range1, range2) => {
        if (!range.intersects(range1, range2)) return null;
        return range.create(
            Math.max(range1.start, range2.start),
            Math.min(range1.end, range2.end)
        );
    },

    contains: (range, year) => {
        return year >= range.start && year <= range.end;
    },

    duration: (range) => {
        return range.end - range.start + 1;
    },

    toString: (range) => {
        return `${bcad.toString(range.start)} to ${bcad.toString(range.end)}`;
    }
};

const period = {
    getOverlapping: (periods, year) => {
        return periods.filter(p => range.contains(p, year));
    },

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

    groupByEra: (periods) => {
        return periods.reduce((groups, p) => {
            const era = p.start < 0 ? 'BC' : 'AD';
            if (!groups[era]) groups[era] = [];
            groups[era].push(p);
            return groups;
        }, {});
    }
};

const scale = {
    calculateDivisions: (start, end, targetDivisions = 10) => {
        const rangeSize = end - start;
        const roughInterval = rangeSize / targetDivisions;
        
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

    yearToPosition: (year, start, end, width) => {
        console.log(year)
        return ((year - start) / (end - start)) * width;
    },

    positionToYear: (position, start, end, width) => {
        console.log(position)
        const year = start + (position / width) * (end - start);
        return Math.round(year);
    },

    snapToInterval: (year, interval) => {
        return Math.round(year / interval) * interval;
    }
};

const label = {
    formatDivision: (year, interval) => {
        if (interval >= 1000) {
            return bcad.toString(year).replace(' AD', '').replace(' BC', ' BCE');
        }
        return bcad.toString(year);
    },

    getEraLabel: (start, end) => {
        if (start < 0 && end < 0) return 'BC';
        if (start >= 0 && end >= 0) return 'AD';
        return 'BC/AD';
    },

    formatDuration: (years) => {
        if (years < 100) return `${years} years`;
        const centuries = Math.floor(years / 100);
        return `${centuries} ${centuries === 1 ? 'century' : 'centuries'}`;
    }
};

// Make everything globally available through window
window.dateUtils = {
    TIME,
    bcad,
    range,
    period,
    scale,
    label
};