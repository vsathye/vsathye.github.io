import { TIME, EVENTS } from '../config/constants';
import dataLoader from './dataLoader';

class StateManager {
    constructor() {
        // Core application state
        this.state = {
            time: {
                currentYear: TIME.START_YEAR,
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

        // State history for undo/redo
        this.history = {
            past: [],
            future: [],
            maxSize: 50 // Maximum number of states to keep
        };

        // Subscribers for state changes
        this.subscribers = new Map();

        // Debounce and throttle timers
        this.timers = {
            save: null,
            update: null,
            debounceDelay: 300,
            throttleDelay: 100
        };

        // Debug mode flag
        this.debugMode = process.env.NODE_ENV === 'development';

        // Initialize state
        this.init();
    }

    /**
     * Initialize state manager
     */
    async init() {
        this.loadPersistedState();
        this.setupEventListeners();
        
        // Initial data load
        try {
            await this.loadData();
        } catch (error) {
            this.updateState({
                data: { ...this.state.data, error: error.message }
            });
        }
    }

    /**
     * Load data for the current time period
     */
    async loadData() {
        this.updateState({
            data: { ...this.state.data, loading: true, error: null }
        });

        try {
            const yearData = await dataLoader.getDataForYear(this.state.time.currentYear);
            
            this.updateState({
                data: {
                    ...this.state.data,
                    loading: false,
                    visibleGovernments: new Set(yearData.governments.map(g => g.id)),
                    visibleInteractions: new Set(yearData.interactions.map(i => i.id))
                }
            });
        } catch (error) {
            this.updateState({
                data: { ...this.state.data, loading: false, error: error.message }
            });
            throw error;
        }
    }

    /**
     * Update application state
     * @param {Object} updates State updates
     * @param {Object} options Update options
     */
    updateState(updates, options = {}) {
        const { 
            recordHistory = true,
            debounce = false,
            throttle = false
        } = options;

        // Handle debouncing
        if (debounce) {
            clearTimeout(this.timers.update);
            this.timers.update = setTimeout(() => {
                this.updateState(updates, { ...options, debounce: false });
            }, this.timers.debounceDelay);
            return;
        }

        // Handle throttling
        if (throttle && this.timers.update) {
            return;
        }

        // Record current state in history if needed
        if (recordHistory) {
            this.recordStateChange();
        }

        // Create new state
        const newState = this.mergeState(this.state, updates);

        // Validate state changes
        if (!this.validateStateChange(newState)) {
            throw new Error('Invalid state change');
        }

        // Update state
        this.state = newState;

        // Debug logging
        if (this.debugMode) {
            this.logStateChange(updates);
        }

        // Notify subscribers
        this.notifySubscribers(updates);

        // Persist state
        this.persistState();

        // Set throttle timer if needed
        if (throttle) {
            this.timers.update = setTimeout(() => {
                this.timers.update = null;
            }, this.timers.throttleDelay);
        }
    }

    /**
     * Merge updates with current state
     * @param {Object} currentState Current state
     * @param {Object} updates Updates to apply
     * @returns {Object} New state
     */
    mergeState(currentState, updates) {
        const newState = { ...currentState };
        
        Object.entries(updates).forEach(([key, value]) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                newState[key] = this.mergeState(currentState[key] || {}, value);
            } else {
                newState[key] = value;
            }
        });

        return newState;
    }

    /**
     * Validate state changes
     * @param {Object} newState Proposed new state
     * @returns {boolean} Validation result
     */
    validateStateChange(newState) {
        // Validate time
        if (newState.time.currentYear < TIME.START_YEAR || 
            newState.time.currentYear > TIME.END_YEAR) {
            return false;
        }

        // Validate coordinates
        if (newState.ui.center[0] < -90 || newState.ui.center[0] > 90 ||
            newState.ui.center[1] < -180 || newState.ui.center[1] > 180) {
            return false;
        }

        // Validate zoom
        if (newState.ui.zoom < 1 || newState.ui.zoom > 20) {
            return false;
        }

        return true;
    }

    /**
     * Subscribe to state changes
     * @param {string} componentId Component identifier
     * @param {Function} callback Callback function
     * @param {Array} dependencies State dependencies to watch
     */
    subscribe(componentId, callback, dependencies = null) {
        this.subscribers.set(componentId, { callback, dependencies });
    }

    /**
     * Unsubscribe from state changes
     * @param {string} componentId Component identifier
     */
    unsubscribe(componentId) {
        this.subscribers.delete(componentId);
    }

    /**
     * Notify subscribers of state changes
     * @param {Object} updates State updates
     */
    notifySubscribers(updates) {
        this.subscribers.forEach(({ callback, dependencies }, componentId) => {
            // If no dependencies specified, always notify
            if (!dependencies) {
                callback(this.state);
                return;
            }

            // Check if any dependencies were updated
            const shouldUpdate = dependencies.some(dep => {
                const path = dep.split('.');
                return path.some((key, index) => {
                    const updatePath = path.slice(0, index + 1).join('.');
                    return updates.hasOwnProperty(updatePath);
                });
            });

            if (shouldUpdate) {
                callback(this.state);
            }
        });
    }

    /**
     * Record state change in history
     */
    recordStateChange() {
        this.history.past.push(JSON.stringify(this.state));
        this.history.future = []; // Clear redo history

        // Maintain history size limit
        if (this.history.past.length > this.history.maxSize) {
            this.history.past.shift();
        }
    }

    /**
     * Undo last state change
     */
    undo() {
        if (this.history.past.length === 0) return;

        const current = JSON.stringify(this.state);
        const previous = this.history.past.pop();

        this.history.future.push(current);
        this.state = JSON.parse(previous);
        this.notifySubscribers(this.state);
    }

    /**
     * Redo last undone state change
     */
    redo() {
        if (this.history.future.length === 0) return;

        const current = JSON.stringify(this.state);
        const next = this.history.future.pop();

        this.history.past.push(current);
        this.state = JSON.parse(next);
        this.notifySubscribers(this.state);
    }

    /**
     * Create state snapshot
     * @returns {Object} State snapshot
     */
    createSnapshot() {
        return {
            state: JSON.stringify(this.state),
            timestamp: Date.now()
        };
    }

    /**
     * Restore state from snapshot
     * @param {Object} snapshot State snapshot
     */
    restoreSnapshot(snapshot) {
        if (!snapshot || !snapshot.state) return;

        try {
            const restoredState = JSON.parse(snapshot.state);
            this.updateState(restoredState, { recordHistory: false });
        } catch (error) {
            console.error('Failed to restore state snapshot:', error);
        }
    }

    /**
     * Load persisted state
     */
    loadPersistedState() {
        try {
            const saved = localStorage.getItem('appState');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.updateState(parsed, { recordHistory: false });
            }
        } catch (error) {
            console.warn('Failed to load persisted state:', error);
        }
    }

    /**
     * Persist current state
     */
    persistState() {
        clearTimeout(this.timers.save);
        this.timers.save = setTimeout(() => {
            try {
                localStorage.setItem('appState', JSON.stringify(this.state));
            } catch (error) {
                console.warn('Failed to persist state:', error);
            }
        }, this.timers.debounceDelay);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for time changes
        window.addEventListener(EVENTS.TIME.YEAR_CHANGED, async (e) => {
            const { year } = e.detail;
            await this.setYear(year);
        });

        // Listen for selection changes
        window.addEventListener(EVENTS.MAP.SELECTION_CHANGED, (e) => {
            const { governments, interactions } = e.detail;
            this.updateState({
                selection: { governments: new Set(governments), interactions: new Set(interactions) }
            });
        });

        // Handle window unload
        window.addEventListener('beforeunload', () => {
            this.persistState();
        });
    }

    /**
     * Set current year and load corresponding data
     * @param {number} year Target year
     */
    async setYear(year) {
        if (year < TIME.START_YEAR || year > TIME.END_YEAR) return;

        this.updateState({
            time: { ...this.state.time, currentYear: year }
        });

        await this.loadData();
    }

    /**
     * Log state change for debugging
     * @param {Object} updates State updates
     */
    logStateChange(updates) {
        console.group('State Update');
        console.log('Previous State:', this.state);
        console.log('Updates:', updates);
        console.log('New State:', this.mergeState(this.state, updates));
        console.groupEnd();
    }
}

export default new StateManager();