// Initialize state manager with defaults
const state = {
    time: {
        currentYear: window.dateUtils.TIME.START_YEAR,
        period: null,
        isPlaying: false,
        playbackSpeed: 1
    },
    selection: {
        governments: new Set(),
        interactions: new Set()
    },
    filters: {
        governments: new Set(),
        interactions: new Set()
    },
    ui: {
        zoom: 4,
        center: [20, 30],
        activeModals: new Set(),
        legend: {
            visible: true,
            expanded: true
        },
        controls: {
            visible: true
        }
    },
    data: {
        loading: false,
        error: null,
        visibleGovernments: new Set(),
        visibleInteractions: new Set()
    }
};

// History management
const history = {
    past: [],
    future: [],
    maxSize: 50
};

// Subscribers for state changes
const subscribers = new Map();

// Timers for debouncing and throttling
const timers = {
    save: null,
    update: null,
    debounceDelay: 300,
    throttleDelay: 100
};

// Debug mode flag
const debugMode = false;

const stateManager = {
    // Core state management
    getState: () => ({ ...state }),
    
    async init() {
        stateManager.loadPersistedState();
        stateManager.setupEventListeners();
        
        try {
            await stateManager.loadData();
        } catch (error) {
            stateManager.updateState({
                data: { ...state.data, error: error.message }
            });
        }
    },

    async loadData() {
        stateManager.updateState({
            data: { ...state.data, loading: true, error: null }
        });

        try {
            const yearData = await window.dataLoader.getDataForYear(state.time.currentYear);
            
            stateManager.updateState({
                data: {
                    ...state.data,
                    loading: false,
                    visibleGovernments: new Set(yearData.governments.map(g => g.id)),
                    visibleInteractions: new Set(yearData.interactions.map(i => i.id))
                }
            });
        } catch (error) {
            stateManager.updateState({
                data: { ...state.data, loading: false, error: error.message }
            });
            throw error;
        }
    },

    updateState(updates, options = {}) {
        const { 
            recordHistory = true,
            debounce = false,
            throttle = false
        } = options;

        if (debounce) {
            clearTimeout(timers.update);
            timers.update = setTimeout(() => {
                stateManager.updateState(updates, { ...options, debounce: false });
            }, timers.debounceDelay);
            return;
        }

        if (throttle && timers.update) {
            return;
        }

        if (recordHistory) {
            stateManager.recordStateChange();
        }

        const newState = stateManager.mergeState(state, updates);

        if (!stateManager.validateStateChange(newState)) {
            throw new Error('Invalid state change');
        }

        Object.assign(state, newState);

        if (debugMode) {
            stateManager.logStateChange(updates);
        }

        stateManager.notifySubscribers(updates);
        stateManager.persistState();

        if (throttle) {
            timers.update = setTimeout(() => {
                timers.update = null;
            }, timers.throttleDelay);
        }
    },

    mergeState(currentState, updates) {
        const newState = { ...currentState };
        
        Object.entries(updates).forEach(([key, value]) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                newState[key] = stateManager.mergeState(currentState[key] || {}, value);
            } else {
                newState[key] = value;
            }
        });

        return newState;
    },

    validateStateChange(newState) {
        if (newState.time.currentYear < window.dateUtils.TIME.START_YEAR || 
            newState.time.currentYear > window.dateUtils.TIME.END_YEAR) {
            return false;
        }

        if (newState.ui.center[0] < -90 || newState.ui.center[0] > 90 ||
            newState.ui.center[1] < -180 || newState.ui.center[1] > 180) {
            return false;
        }

        if (newState.ui.zoom < 1 || newState.ui.zoom > 20) {
            return false;
        }

        return true;
    },

    // Subscription management
    subscribe(componentId, callback, dependencies = null) {
        subscribers.set(componentId, { callback, dependencies });
    },

    unsubscribe(componentId) {
        subscribers.delete(componentId);
    },

    notifySubscribers(updates) {
        subscribers.forEach(({ callback, dependencies }, componentId) => {
            if (!dependencies) {
                callback(state);
                return;
            }

            const shouldUpdate = dependencies.some(dep => {
                const path = dep.split('.');
                return path.some((key, index) => {
                    const updatePath = path.slice(0, index + 1).join('.');
                    return updates.hasOwnProperty(updatePath);
                });
            });

            if (shouldUpdate) {
                callback(state);
            }
        });
    },

    // History management
    recordStateChange() {
        history.past.push(JSON.stringify(state));
        history.future = [];

        if (history.past.length > history.maxSize) {
            history.past.shift();
        }
    },

    undo() {
        if (history.past.length === 0) return;

        const current = JSON.stringify(state);
        const previous = history.past.pop();

        history.future.push(current);
        Object.assign(state, JSON.parse(previous));
        stateManager.notifySubscribers(state);
    },

    redo() {
        if (history.future.length === 0) return;

        const current = JSON.stringify(state);
        const next = history.future.pop();

        history.past.push(current);
        Object.assign(state, JSON.parse(next));
        stateManager.notifySubscribers(state);
    },

    // Snapshot management
    createSnapshot() {
        return {
            state: JSON.stringify(state),
            timestamp: Date.now()
        };
    },

    restoreSnapshot(snapshot) {
        if (!snapshot || !snapshot.state) return;

        try {
            const restoredState = JSON.parse(snapshot.state);
            stateManager.updateState(restoredState, { recordHistory: false });
        } catch (error) {
            console.error('Failed to restore state snapshot:', error);
        }
    },

    // Persistence
    loadPersistedState() {
        try {
            const saved = localStorage.getItem('appState');
            if (saved) {
                const parsed = JSON.parse(saved);
                stateManager.updateState(parsed, { recordHistory: false });
            }
        } catch (error) {
            console.warn('Failed to load persisted state:', error);
        }
    },

    persistState() {
        clearTimeout(timers.save);
        timers.save = setTimeout(() => {
            try {
                localStorage.setItem('appState', JSON.stringify(state));
            } catch (error) {
                console.warn('Failed to persist state:', error);
            }
        }, timers.debounceDelay);
    },

    // Event handling
    setupEventListeners() {
        window.addEventListener('yearChanged', async (e) => {
            const { year } = e.detail;
            await stateManager.setYear(year);
        });

        window.addEventListener('selectionChanged', (e) => {
            const { governments, interactions } = e.detail;
            stateManager.updateState({
                selection: { governments: new Set(governments), interactions: new Set(interactions) }
            });
        });

        window.addEventListener('beforeunload', () => {
            stateManager.persistState();
        });
    },

    async setYear(year) {
        if (year < window.dateUtils.TIME.START_YEAR || year > window.dateUtils.TIME.END_YEAR) return;

        stateManager.updateState({
            time: { ...state.time, currentYear: year }
        });

        await stateManager.loadData();
    },

    logStateChange(updates) {
        console.group('State Update');
        console.log('Previous State:', state);
        console.log('Updates:', updates);
        console.log('New State:', stateManager.mergeState(state, updates));
        console.groupEnd();
    }
};

// Make stateManager globally available
window.stateManager = stateManager;

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    stateManager.init();
});