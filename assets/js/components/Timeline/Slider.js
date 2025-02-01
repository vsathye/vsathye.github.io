/**
 * TimeSlider - A timeline slider component for controlling historical map view
 */
class TimeSlider {
    constructor(container, onYearChange) {
        if (!(container instanceof HTMLElement)) {
            throw new Error('Container must be a valid HTML element');
        }
        
        this.container = container;
        this.onYearChange = onYearChange;
        
        // Configuration
        this.config = {
            startYear: -5000,  // 5000 BC
            endYear: 2025,     // 2025 AD
            stepSize: 1,       // 1 year steps
            initialYear: 0     // Start at year 0
        };

        this.currentYear = this.config.initialYear;
        this.isDragging = false;
        this.initialize();
    }

    initialize() {
        noUiSlider.create(this.container, {
            start: [this.config.initialYear],
            connect: true,
            range: {
                'min': this.config.startYear,
                'max': this.config.endYear
            },
            step: this.config.stepSize,  // Add this line to enforce whole number steps
            tooltips: true,
            format: {
                to: (value) => {
                    return this.formatYear(Math.round(value));  // Round the value before formatting
                },
                from: (value) => {
                    return parseInt(value);  // Parse as integer instead of float
                }
            }
        });

        // Add event listener for value changes
        this.container.noUiSlider.on('update', (values, handle) => {
            const year = parseInt(values[handle]);
            
            if (year !== this.currentYear) {
                this.currentYear = year;
                if (this.onYearChange) {
                    this.onYearChange(year);
                }
            }
        });

        // Add keyboard support
        this.container.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    yearToPosition(year) {
        const range = this.config.endYear - this.config.startYear;
        return ((year - this.config.startYear) / range) * 100;
    }

    positionToYear(position) {
        console.log(position)
        const range = this.config.endYear - this.config.startYear;
        const year = this.config.startYear + (range * (position / 100));
        return Math.round(year / this.config.stepSize) * this.config.stepSize;
    }

    formatYear(year) {
        if (year < 0) {
            return `${Math.abs(year)} BC`;
        } else if (year === 0) {
            return "0";
        } else {
            return `${year} AD`;
        }
    }

    handleKeyboard(event) {
        let newYear = this.currentYear;
        
        switch(event.key) {
            case 'ArrowLeft':
                newYear -= this.config.stepSize;
                break;
            case 'ArrowRight':
                newYear += this.config.stepSize;
                break;
            case 'Home':
                newYear = this.config.startYear;
                break;
            case 'End':
                newYear = this.config.endYear;
                break;
            default:
                return;
        }
        
        this.setYear(newYear);
        event.preventDefault();
    }

    setYear(year) {
        year = Math.max(this.config.startYear, 
                       Math.min(this.config.endYear, year));
        
        this.container.noUiSlider.set(this.yearToPosition(year));
    }

    getCurrentYear() {
        return this.currentYear;
    }

    destroy() {
        if (this.container.noUiSlider) {
            this.container.noUiSlider.destroy();
        }
    }
}

// Make it globally available instead of using ES6 export
window.TimeSlider = TimeSlider;