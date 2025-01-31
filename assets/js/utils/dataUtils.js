import { TIME, GOVERNMENT_TYPES, INTERACTION_TYPES } from '../config/constants';

/**
 * Data Validation Functions
 */
export const validate = {
    /**
     * Validate government data schema
     * @param {Object} data Government data object
     * @returns {boolean} Validation result
     */
    government: (data) => {
        if (!data) return false;
        
        const requiredFields = ['id', 'name', 'type', 'startYear', 'endYear', 'latitude', 'longitude'];
        const hasAllFields = requiredFields.every(field => data.hasOwnProperty(field));
        
        return hasAllFields && 
               Object.keys(GOVERNMENT_TYPES).includes(data.type.toUpperCase()) &&
               validate.timeRange(data.startYear, data.endYear) &&
               validate.coordinates(data.latitude, data.longitude);
    },

    /**
     * Validate interaction data schema
     * @param {Object} data Interaction data object
     * @returns {boolean} Validation result
     */
    interaction: (data) => {
        if (!data) return false;
        
        const requiredFields = ['id', 'type', 'sourceId', 'targetId', 'startYear', 'endYear'];
        const hasAllFields = requiredFields.every(field => data.hasOwnProperty(field));
        
        return hasAllFields &&
               Object.keys(INTERACTION_TYPES).includes(data.type.toUpperCase()) &&
               validate.timeRange(data.startYear, data.endYear);
    },

    /**
     * Validate time range
     * @param {number} start Start year
     * @param {number} end End year
     * @returns {boolean} Validation result
     */
    timeRange: (start, end) => {
        return typeof start === 'number' &&
               typeof end === 'number' &&
               start <= end &&
               start >= TIME.START_YEAR &&
               end <= TIME.END_YEAR;
    },

    /**
     * Validate coordinates
     * @param {number} lat Latitude
     * @param {number} lng Longitude
     * @returns {boolean} Validation result
     */
    coordinates: (lat, lng) => {
        return typeof lat === 'number' &&
               typeof lng === 'number' &&
               lat >= -90 && lat <= 90 &&
               lng >= -180 && lng <= 180;
    }
};

/**
 * Data Transformation Functions
 */
export const transform = {
    /**
     * Format year for display
     * @param {number} year Year number
     * @returns {string} Formatted year string
     */
    formatYear: (year) => {
        const absYear = Math.abs(year);
        return year < 0 ? `${absYear} BC` : `${absYear} AD`;
    },

    /**
     * Parse year string to number
     * @param {string} yearStr Year string
     * @returns {number} Year number
     */
    parseYear: (yearStr) => {
        const [year, era] = yearStr.split(' ');
        return era === 'BC' ? -parseInt(year) : parseInt(year);
    },

    /**
     * Normalize government data
     * @param {Object} data Raw government data
     * @returns {Object} Normalized data
     */
    normalizeGovernment: (data) => {
        return {
            ...data,
            type: data.type.toUpperCase(),
            startYear: transform.parseYear(data.startYear),
            endYear: transform.parseYear(data.endYear),
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude)
        };
    },

    /**
     * Normalize interaction data
     * @param {Object} data Raw interaction data
     * @returns {Object} Normalized data
     */
    normalizeInteraction: (data) => {
        return {
            ...data,
            type: data.type.toUpperCase(),
            startYear: transform.parseYear(data.startYear),
            endYear: transform.parseYear(data.endYear)
        };
    }
};

/**
 * Data Filtering Functions
 */
export const filter = {
    /**
     * Filter data by time period
     * @param {Array} data Data array
     * @param {number} year Target year
     * @returns {Array} Filtered data
     */
    byYear: (data, year) => {
        return data.filter(item =>
            item.startYear <= year && item.endYear >= year
        );
    },

    /**
     * Filter governments by type
     * @param {Array} data Government data array
     * @param {Array} types Government types to include
     * @returns {Array} Filtered data
     */
    byGovernmentType: (data, types) => {
        return data.filter(item =>
            types.includes(item.type.toUpperCase())
        );
    },

    /**
     * Filter interactions by type
     * @param {Array} data Interaction data array
     * @param {Array} types Interaction types to include
     * @returns {Array} Filtered data
     */
    byInteractionType: (data, types) => {
        return data.filter(item =>
            types.includes(item.type.toUpperCase())
        );
    },

    /**
     * Create a filter chain
     * @param {Array} data Initial data array
     * @returns {Object} Filter chain object
     */
    chain: (data) => {
        let currentData = [...data];
        
        return {
            byYear: (year) => {
                currentData = filter.byYear(currentData, year);
                return this;
            },
            byGovernmentType: (types) => {
                currentData = filter.byGovernmentType(currentData, types);
                return this;
            },
            byInteractionType: (types) => {
                currentData = filter.byInteractionType(currentData, types);
                return this;
            },
            value: () => currentData
        };
    }
};

/**
 * Data Aggregation Functions
 */
export const aggregate = {
    /**
     * Group data by time periods
     * @param {Array} data Data array
     * @param {number} interval Time interval in years
     * @returns {Object} Grouped data
     */
    byTimePeriod: (data, interval) => {
        const groups = {};
        data.forEach(item => {
            const periodStart = Math.floor(item.startYear / interval) * interval;
            if (!groups[periodStart]) {
                groups[periodStart] = [];
            }
            groups[periodStart].push(item);
        });
        return groups;
    },

    /**
     * Group data by type
     * @param {Array} data Data array
     * @returns {Object} Grouped data
     */
    byType: (data) => {
        return data.reduce((groups, item) => {
            const type = item.type.toUpperCase();
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(item);
            return groups;
        }, {});
    },

    /**
     * Calculate summary statistics
     * @param {Array} data Data array
     * @returns {Object} Summary statistics
     */
    calculateSummary: (data) => {
        const govTypes = aggregate.byType(data);
        return {
            total: data.length,
            byType: Object.entries(govTypes).reduce((summary, [type, items]) => {
                summary[type] = items.length;
                return summary;
            }, {}),
            timeSpan: {
                start: Math.min(...data.map(item => item.startYear)),
                end: Math.max(...data.map(item => item.endYear))
            }
        };
    }
};

/**
 * Search Utilities
 */
export const search = {
    /**
     * Create search index
     * @param {Array} data Data array
     * @returns {Object} Search index
     */
    createIndex: (data) => {
        const index = new Map();
        data.forEach(item => {
            const tokens = search.tokenize(item.name);
            tokens.forEach(token => {
                if (!index.has(token)) {
                    index.set(token, new Set());
                }
                index.get(token).add(item.id);
            });
        });
        return index;
    },

    /**
     * Tokenize text for search
     * @param {string} text Input text
     * @returns {Array} Tokens
     */
    tokenize: (text) => {
        return text.toLowerCase()
                  .replace(/[^\w\s]/g, '')
                  .split(/\s+/)
                  .filter(token => token.length > 2);
    },

    /**
     * Perform fuzzy search
     * @param {string} query Search query
     * @param {Array} data Data array
     * @param {Object} options Search options
     * @returns {Array} Search results
     */
    fuzzySearch: (query, data, options = {}) => {
        const {
            threshold = 0.6,
            limit = 10
        } = options;

        const queryTokens = search.tokenize(query);
        return data
            .map(item => ({
                item,
                score: search.calculateScore(queryTokens, item.name)
            }))
            .filter(result => result.score >= threshold)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(result => result.item);
    },

    /**
     * Calculate fuzzy match score
     * @param {Array} queryTokens Query tokens
     * @param {string} text Target text
     * @returns {number} Match score
     */
    calculateScore: (queryTokens, text) => {
        const textTokens = search.tokenize(text);
        let totalScore = 0;

        queryTokens.forEach(queryToken => {
            const tokenScores = textTokens.map(textToken => 
                search.levenshteinDistance(queryToken, textToken)
            );
            totalScore += Math.max(...tokenScores);
        });

        return totalScore / queryTokens.length;
    },

    /**
     * Calculate Levenshtein distance
     * @param {string} str1 First string
     * @param {string} str2 Second string
     * @returns {number} Normalized distance
     */
    levenshteinDistance: (str1, str2) => {
        const track = Array(str2.length + 1).fill(null).map(() =>
            Array(str1.length + 1).fill(null)
        );

        for(let i = 0; i <= str1.length; i++) track[0][i] = i;
        for(let j = 0; j <= str2.length; j++) track[j][0] = j;

        for(let j = 1; j <= str2.length; j++) {
            for(let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                track[j][i] = Math.min(
                    track[j][i - 1] + 1,
                    track[j - 1][i] + 1,
                    track[j - 1][i - 1] + indicator
                );
            }
        }

        return 1 - (track[str2.length][str1.length] / Math.max(str1.length, str2.length));
    }
};

/**
 * Memory Management Utilities
 */
export const memory = {
    /**
     * Create data chunks
     * @param {Array} data Data array
     * @param {number} size Chunk size
     * @returns {Array} Array of chunks
     */
    chunk: (data, size) => {
        const chunks = [];
        for (let i = 0; i < data.length; i += size) {
            chunks.push(data.slice(i, i + size));
        }
        return chunks;
    },

    /**
     * Clear object references
     * @param {Object} obj Target object
     */
    clearReferences: (obj) => {
        Object.keys(obj).forEach(key => {
            obj[key] = null;
        });
    }
};

/**
 * Performance Utilities
 */
export const performance = {
    /**
     * Create memoized function
     * @param {Function} fn Function to memoize
     * @returns {Function} Memoized function
     */
    memoize: (fn) => {
        const cache = new Map();
        return (...args) => {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = fn(...args);
            cache.set(key, result);
            return result;
        };
    },

    /**
     * Process data in batches
     * @param {Array} items Items to process
     * @param {Function} processor Processing function
     * @param {number} batchSize Batch size
     * @returns {Promise} Processing promise
     */
    processBatch: async (items, processor, batchSize = 100) => {
        const chunks = memory.chunk(items, batchSize);
        const results = [];

        for (const chunk of chunks) {
            const chunkResults = await Promise.all(
                chunk.map(item => processor(item))
            );
            results.push(...chunkResults);
        }

        return results;
    }
};

export default {
    validate,
    transform,
    filter,
    aggregate,
    search,
    memory,
    performance
};