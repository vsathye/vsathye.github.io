import { EVENTS, PATHS, ERRORS, TIME } from '../config/constants';
import Papa from 'papaparse';

class DataLoader {
    constructor() {
        // Initialize caches
        this.cache = {
            governments: new Map(),
            interactions: new Map(),
            timeChunks: new Map()
        };

        // Initialize indexes
        this.indexes = {
            governments: null,
            interactions: null,
            timeRanges: null
        };

        this.isLoading = false;
        this.progressCallbacks = new Set();
        this.errorCallbacks = new Set();
    }

    /**
     * Load all required data
     * @param {Object} options Loading options
     * @returns {Promise} Resolves when all data is loaded
     */
    async loadData(options = {}) {
        try {
            this.isLoading = true;
            this.notifyProgress({ type: 'start', progress: 0 });

            // Load governments and interactions in parallel
            const [governments, interactions] = await Promise.all([
                this.loadGovernments(),
                this.loadInteractions()
            ]);

            // Process and validate the data
            const processedData = await this.processData(governments, interactions);

            // Build indexes
            await this.buildIndexes(processedData);

            // Cache the processed data
            this.cacheData(processedData);

            this.notifyProgress({ type: 'complete', progress: 100 });
            this.isLoading = false;

            return processedData;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Load and parse governments CSV
     * @returns {Promise<Array>} Parsed government data
     */
    async loadGovernments() {
        try {
            const response = await window.fs.readFile(PATHS.DATA.GOVERNMENTS, { encoding: 'utf8' });
            
            return new Promise((resolve, reject) => {
                Papa.parse(response, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        if (results.errors.length > 0) {
                            reject(new Error('Error parsing governments CSV'));
                            return;
                        }
                        resolve(this.validateGovernmentData(results.data));
                    },
                    error: (error) => reject(error)
                });
            });
        } catch (error) {
            throw new Error(`Failed to load governments data: ${error.message}`);
        }
    }

    /**
     * Load and parse interactions CSV
     * @returns {Promise<Array>} Parsed interaction data
     */
    async loadInteractions() {
        try {
            const response = await window.fs.readFile(PATHS.DATA.INTERACTIONS, { encoding: 'utf8' });
            
            return new Promise((resolve, reject) => {
                Papa.parse(response, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        if (results.errors.length > 0) {
                            reject(new Error('Error parsing interactions CSV'));
                            return;
                        }
                        resolve(this.validateInteractionData(results.data));
                    },
                    error: (error) => reject(error)
                });
            });
        } catch (error) {
            throw new Error(`Failed to load interactions data: ${error.message}`);
        }
    }

    /**
     * Validate government data
     * @param {Array} data Raw government data
     * @returns {Array} Validated data
     */
    validateGovernmentData(data) {
        return data.filter(item => {
            // Required fields
            const hasRequired = item.id && item.name && item.type && 
                              item.startYear && item.endYear &&
                              item.latitude && item.longitude;
            
            // Valid time range
            const validTime = item.startYear <= item.endYear &&
                            item.startYear >= TIME.START_YEAR &&
                            item.endYear <= TIME.END_YEAR;
            
            // Valid coordinates
            const validCoords = item.latitude >= -90 && item.latitude <= 90 &&
                              item.longitude >= -180 && item.longitude <= 180;
            
            return hasRequired && validTime && validCoords;
        });
    }

    /**
     * Validate interaction data
     * @param {Array} data Raw interaction data
     * @returns {Array} Validated data
     */
    validateInteractionData(data) {
        return data.filter(item => {
            // Required fields
            const hasRequired = item.id && item.type && 
                              item.sourceId && item.targetId &&
                              item.startYear && item.endYear;
            
            // Valid time range
            const validTime = item.startYear <= item.endYear &&
                            item.startYear >= TIME.START_YEAR &&
                            item.endYear <= TIME.END_YEAR;
            
            return hasRequired && validTime;
        });
    }

    /**
     * Process and transform raw data
     * @param {Array} governments Government data
     * @param {Array} interactions Interaction data
     * @returns {Object} Processed data
     */
    async processData(governments, interactions) {
        // Convert years from numbers to consistent format
        const processedGovs = governments.map(gov => ({
            ...gov,
            startYear: this.normalizeYear(gov.startYear),
            endYear: this.normalizeYear(gov.endYear)
        }));

        const processedInts = interactions.map(int => ({
            ...int,
            startYear: this.normalizeYear(int.startYear),
            endYear: this.normalizeYear(int.endYear)
        }));

        // Split data into time chunks for efficient loading
        const timeChunks = await this.createTimeChunks(processedGovs, processedInts);

        return {
            governments: processedGovs,
            interactions: processedInts,
            timeChunks
        };
    }

    /**
     * Normalize year format
     * @param {number} year Raw year
     * @returns {string} Formatted year
     */
    normalizeYear(year) {
        const absYear = Math.abs(year);
        const suffix = year < 0 ? ' BC' : ' AD';
        return `${absYear}${suffix}`;
    }

    /**
     * Create time-based chunks of data
     * @param {Array} governments Government data
     * @param {Array} interactions Interaction data
     * @returns {Object} Time chunked data
     */
    async createTimeChunks(governments, interactions) {
        const chunks = {};
        const chunkSize = 100; // Years per chunk

        for (let year = TIME.START_YEAR; year <= TIME.END_YEAR; year += chunkSize) {
            const chunkEnd = year + chunkSize;
            chunks[year] = {
                governments: governments.filter(gov => 
                    this.yearToNumber(gov.startYear) <= chunkEnd &&
                    this.yearToNumber(gov.endYear) >= year
                ),
                interactions: interactions.filter(int =>
                    this.yearToNumber(int.startYear) <= chunkEnd &&
                    this.yearToNumber(int.endYear) >= year
                )
            };
        }

        return chunks;
    }

    /**
     * Convert year string back to number
     * @param {string} yearStr Year string (e.g., "500 BC")
     * @returns {number} Year number
     */
    yearToNumber(yearStr) {
        const [year, era] = yearStr.split(' ');
        return era === 'BC' ? -parseInt(year) : parseInt(year);
    }

    /**
     * Build search and lookup indexes
     * @param {Object} data Processed data
     */
    async buildIndexes(data) {
        // Build government index
        this.indexes.governments = new Map(
            data.governments.map(gov => [gov.id, gov])
        );

        // Build interaction index
        this.indexes.interactions = new Map(
            data.interactions.map(int => [int.id, int])
        );

        // Build time range index
        this.indexes.timeRanges = new Map();
        for (const gov of data.governments) {
            const startYear = this.yearToNumber(gov.startYear);
            const endYear = this.yearToNumber(gov.endYear);
            for (let year = startYear; year <= endYear; year++) {
                if (!this.indexes.timeRanges.has(year)) {
                    this.indexes.timeRanges.set(year, new Set());
                }
                this.indexes.timeRanges.get(year).add(gov.id);
            }
        }
    }

    /**
     * Cache processed data
     * @param {Object} data Processed data
     */
    cacheData(data) {
        // Cache in memory
        this.cache.governments = new Map(
            data.governments.map(gov => [gov.id, gov])
        );
        this.cache.interactions = new Map(
            data.interactions.map(int => [int.id, int])
        );
        this.cache.timeChunks = new Map(
            Object.entries(data.timeChunks)
        );

        // Cache in localStorage if available
        try {
            localStorage.setItem('lastUpdate', Date.now().toString());
            localStorage.setItem('dataVersion', '1.0');
        } catch (error) {
            console.warn('LocalStorage not available:', error);
        }
    }

    /**
     * Get data for a specific year
     * @param {number} year Target year
     * @returns {Object} Year-specific data
     */
    getDataForYear(year) {
        // Find the appropriate chunk
        const chunkSize = 100;
        const chunkStart = Math.floor(year / chunkSize) * chunkSize;
        const chunk = this.cache.timeChunks.get(chunkStart);

        if (!chunk) return null;

        return {
            governments: chunk.governments.filter(gov =>
                this.yearToNumber(gov.startYear) <= year &&
                this.yearToNumber(gov.endYear) >= year
            ),
            interactions: chunk.interactions.filter(int =>
                this.yearToNumber(int.startYear) <= year &&
                this.yearToNumber(int.endYear) >= year
            )
        };
    }

    /**
     * Register progress callback
     * @param {Function} callback Progress callback function
     */
    onProgress(callback) {
        this.progressCallbacks.add(callback);
    }

    /**
     * Register error callback
     * @param {Function} callback Error callback function
     */
    onError(callback) {
        this.errorCallbacks.add(callback);
    }

    /**
     * Notify progress listeners
     * @param {Object} progress Progress information
     */
    notifyProgress(progress) {
        this.progressCallbacks.forEach(callback => callback(progress));
    }

    /**
     * Handle loading errors
     * @param {Error} error Error object
     */
    handleError(error) {
        this.isLoading = false;
        this.errorCallbacks.forEach(callback => callback(error));
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        this.cache.governments.clear();
        this.cache.interactions.clear();
        this.cache.timeChunks.clear();
        this.indexes.governments = null;
        this.indexes.interactions = null;
        this.indexes.timeRanges = null;

        try {
            localStorage.removeItem('lastUpdate');
            localStorage.removeItem('dataVersion');
        } catch (error) {
            console.warn('LocalStorage not available:', error);
        }
    }
}

export default new DataLoader();