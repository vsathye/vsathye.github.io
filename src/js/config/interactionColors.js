const interactionColors = {
    alliance_formation: '#4CAF50',
    treaty_signing: '#4CAF50',
    diplomatic_marriage: '#4CAF50',
    vassalization: '#4CAF50',
    tributary_relationship: '#4CAF50',
    political_union: '#4CAF50',
    diplomatic_mission: '#4CAF50',
    mediation: '#4CAF50',
    territorial_exchange: '#4CAF50',

    full_scale_war: '#F44336',
    border_skirmish: '#F44336',
    naval_battle: '#F44336',
    siege: '#F44336',
    military_raid: '#F44336',
    military_occupation: '#F44336',
    military_alliance: '#F44336',
    military_support: '#F44336',
    rebellion_suppression: '#F44336',

    trade_agreement: '#FFC107',
    trade_route_establishment: '#FFC107',
    resource_exchange: '#FFC107',
    monetary_tribute: '#FFC107',
    economic_sanctions: '#FFC107',
    trade_monopoly: '#FFC107',
    joint_venture: '#FFC107',
    economic_alliance: '#FFC107',

    cultural_exchange: '#9C27B0',
    religious_spread: '#9C27B0',
    technological_transfer: '#9C27B0',
    artistic_influence: '#9C27B0',
    educational_exchange: '#9C27B0',
    population_migration: '#9C27B0',
    architectural_influence: '#9C27B0',
    language_adoption: '#9C27B0'
};

const interactionCategories = {
    diplomatic: {
        title: 'Diplomatic/Political',
        types: ['alliance_formation', 'treaty_signing', 'diplomatic_marriage', 'vassalization',
            'tributary_relationship', 'political_union', 'diplomatic_mission', 'mediation', 'territorial_exchange']
    },
    military: {
        title: 'Military/Conflict',
        types: ['full_scale_war', 'border_skirmish', 'naval_battle', 'siege', 'military_raid',
            'military_occupation', 'military_alliance', 'military_support', 'rebellion_suppression']
    },
    economic: {
        title: 'Economic',
        types: ['trade_agreement', 'trade_route_establishment', 'resource_exchange', 'monetary_tribute',
            'economic_sanctions', 'trade_monopoly', 'joint_venture', 'economic_alliance']
    },
    cultural: {
        title: 'Cultural',
        types: ['cultural_exchange', 'religious_spread', 'technological_transfer', 'artistic_influence',
            'educational_exchange', 'population_migration', 'architectural_influence', 'language_adoption']
    }
};

