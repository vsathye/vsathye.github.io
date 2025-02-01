const validate = {
    government: (data) => {
        if (!data) return false;
        
        const requiredFields = ['id', 'name', 'type', 'startYear', 'endYear', 'latitude', 'longitude'];
        const hasAllFields = requiredFields.every(field => data.hasOwnProperty(field));
        
        return hasAllFields && 
               Object.keys(GOVERNMENT_TYPES).includes(data.type.toUpperCase()) &&
               validate.timeRange(data.startYear, data.endYear) &&
               validate.coordinates(data.latitude, data.longitude);
    },

    interaction: (data) => {
        if (!data) return false;
        
        const requiredFields = ['id', 'type', 'sourceId', 'targetId', 'startYear', 'endYear'];
        const hasAllFields = requiredFields.every(field => data.hasOwnProperty(field));
        
        return hasAllFields &&
               Object.keys(INTERACTION_TYPES).includes(data.type.toUpperCase()) &&
               validate.timeRange(data.startYear, data.endYear);
    },

    timeRange: (start, end) => {
        return typeof start === 'number' &&
               typeof end === 'number' &&
               start <= end &&
               start >= TIME.START_YEAR &&
               end <= TIME.END_YEAR;
    },

    coordinates: (lat, lng) => {
        return typeof lat === 'number' &&
               typeof lng === 'number' &&
               lat >= -90 && lat <= 90 &&
               lng >= -180 && lng <= 180;
    }
};

const transform = {
    formatYear: (year) => {
        const absYear = Math.abs(year);
        return year < 0 ? `${absYear} BC` : `${absYear} AD`;
    },

    parseYear: (yearStr) => {
        const [year, era] = yearStr.split(' ');
        return era === 'BC' ? -parseInt(year) : parseInt(year);
    },

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

    normalizeInteraction: (data) => {
        return {
            ...data,
            type: data.type.toUpperCase(),
            startYear: transform.parseYear(data.startYear),
            endYear: transform.parseYear(data.endYear)
        };
    }
};

const filter = {
    byYear: (data, year) => {
        return data.filter(item =>
            item.startYear <= year && item.endYear >= year
        );
    },

    byGovernmentType: (data, types) => {
        return data.filter(item =>
            types.includes(item.type.toUpperCase())
        );
    },

    byInteractionType: (data, types) => {
        return data.filter(item =>
            types.includes(item.type.toUpperCase())
        );
    },

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

const aggregate = {
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

const search = {
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

    tokenize: (text) => {
        return text.toLowerCase()
                  .replace(/[^\w\s]/g, '')
                  .split(/\s+/)
                  .filter(token => token.length > 2);
    },

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

const memory = {
    chunk: (data, size) => {
        const chunks = [];
        for (let i = 0; i < data.length; i += size) {
            chunks.push(data.slice(i, i + size));
        }
        return chunks;
    },

    clearReferences: (obj) => {
        Object.keys(obj).forEach(key => {
            obj[key] = null;
        });
    }
};

const performance = {
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

// Make everything globally available
window.dataUtils = {
    validate,
    transform,
    filter,
    aggregate,
    search,
    memory,
    performance
};