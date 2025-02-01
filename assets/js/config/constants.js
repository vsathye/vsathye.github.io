// Time range for the application
export const TIME = {
    START_YEAR: -5000,  // 5000 BC
    END_YEAR: 2025,    // 2025 AD
    DEFAULT_YEAR: 0
};

// Government types and their visual properties
export const GOVERNMENT_TYPES = {
    EMPIRE: {
        size: 32,
        shape: 'circle',
        markerPath: '/assets/img/markers/empire.svg'
    },
    KINGDOM: {
        size: 24,
        shape: 'square',
        markerPath: '/assets/img/markers/kingdom.svg'
    },
    CITY_STATE: {
        size: 16,
        shape: 'circle',
        markerPath: '/assets/img/markers/city-state.svg'
    },
    TRIBE: {
        size: 20,
        shape: 'triangle',
        markerPath: '/assets/img/markers/tribe.svg'
    }
};

// Interaction types and their visual properties
export const INTERACTION_TYPES = {
    WAR: {
        color: '#FF0000',
        lineStyle: 'solid',
        iconPath: '/assets/img/icons/interactions/war.svg'
    },
    TRADE: {
        color: '#00FF00',
        lineStyle: 'dashed',
        iconPath: '/assets/img/icons/interactions/trade.svg'
    },
    DIPLOMACY: {
        color: '#0000FF',
        lineStyle: 'solid',
        iconPath: '/assets/img/icons/interactions/diplomacy.svg'
    },
    ALLIANCE: {
        color: '#800080',
        lineStyle: 'solid',
        iconPath: '/assets/img/icons/interactions/alliance.svg'
    },
    TRIBUTE: {
        color: '#FFD700',
        lineStyle: 'dotted',
        iconPath: '/assets/img/icons/interactions/tribute.svg'
    }
};

// Custom events
export const EVENTS = {
    TIME: {
        YEAR_CHANGED: 'yearChanged'
    },
    MAP: {
        SELECTION_CHANGED: 'selectionChanged'
    }
};