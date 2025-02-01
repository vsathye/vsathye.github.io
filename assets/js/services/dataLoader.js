class DataLoader {
    constructor() {
        this.governmentsData = null;
        this.interactionsData = null;
        
        // Embed the data directly
        this.rawGovernments = `id,name,type,start_year,end_year,latitude,longitude,description
ROM001,Roman Empire,EMPIRE,-27,476,41.9028,12.4964,"The Roman Empire at its height, ruled by Augustus Caesar around year 0"
PAR001,Parthian Empire,EMPIRE,-247,224,33.0937,44.1446,"The Parthian Empire, major rival of Rome in the east"
KUS001,Kushan Empire,EMPIRE,-30,375,34.5553,69.2075,"The Kushan Empire, controlling much of Central and South Asia"
XIN001,Xin Dynasty,EMPIRE,-9,23,34.3416,108.9398,"The Xin Dynasty under Wang Mang in China"
NAB001,Nabataean Kingdom,KINGDOM,-168,106,30.3285,35.4444,"The Nabataean Kingdom, centered on its capital Petra"
PON001,Kingdom of Pontus,KINGDOM,-291,62,41.0214,40.5238,"The Kingdom of Pontus in Asia Minor"
AXU001,Kingdom of Axum,KINGDOM,-100,960,14.1319,38.7168,"The Kingdom of Axum in modern-day Ethiopia"
CHE001,Chera Dynasty,KINGDOM,-300,1102,10.8505,76.2711,"The Chera Dynasty in southern India"
ATH001,Athens,CITY-STATE,-5000,0,37.9838,23.7275,"The city-state of Athens, center of Greek culture"
SPA001,Sparta,CITY-STATE,-900,0,37.0742,22.4309,"The militaristic city-state of Sparta"
COR001,Corinth,CITY-STATE,-800,0,37.9061,22.8787,"The wealthy city-state of Corinth"
GAU001,Gallic Tribes,TRIBE,-600,50,48.8566,2.3522,"Various Gallic tribes in modern-day France"
GER001,Germanic Tribes,TRIBE,-600,500,52.5200,13.4050,"Germanic tribes east of the Rhine"
BRI001,British Tribes,TRIBE,-800,43,51.5074,-0.1278,"Celtic tribes in Britain before Roman conquest"`;

this.rawInteractions = `id,source_id,target_id,type,year,description
INT001,ROM001,PAR001,WAR,-1,"Battle of Carrhae aftermath, continued Roman-Parthian tensions"
INT002,ROM001,GAU001,WAR,0,"Ongoing Roman campaigns in Gaul after Caesar's conquest"
INT003,ROM001,GER001,WAR,0,"Roman conflicts with Germanic tribes across the Rhine"
INT004,ROM001,NAB001,TRADE,0,"Active trade routes between Rome and Petra"
INT005,PAR001,KUS001,TRADE,0,"Silk Road trade between Parthia and Kushan Empire"
INT006,ROM001,XIN001,TRADE,0,"Indirect silk trade through intermediaries"
INT007,KUS001,CHE001,TRADE,0,"Trade routes between Central Asia and South India"
INT008,NAB001,AXU001,TRADE,0,"Red Sea trade routes connecting Arabia and East Africa"
INT009,ROM001,ATH001,DIPLOMACY,0,"Roman political influence over Athens"
INT010,ROM001,SPA001,DIPLOMACY,0,"Roman diplomatic relations with Sparta"
INT011,ROM001,COR001,DIPLOMACY,0,"Roman oversight of Corinth as provincial capital"
INT012,PAR001,KUS001,DIPLOMACY,0,"Diplomatic relations along the Silk Road"
INT013,XIN001,KUS001,ALLIANCE,0,"Alliance between Xin Dynasty and Kushan Empire"
INT014,NAB001,ROM001,TRIBUTE,0,"Nabataean client kingdom paying tribute to Rome"
INT015,PON001,ROM001,WAR,-1,"Aftermath of Pontic Wars and Roman control"
INT016,ROM001,BRI001,WAR,0,"Early Roman expeditions to Britain"
INT017,ROM001,GER001,WAR,9,"Roman campaign of revenge for Teutoburg Forest disaster"
INT018,ROM001,PAR001,DIPLOMACY,1,"Peace treaty negotiation between Augustus and Phraates V"
INT019,ROM001,XIN001,TRADE,2,"Increased silk trade volume through intermediaries"
INT020,KUS001,PAR001,WAR,5,"Border skirmishes in Bactria"
INT021,ROM001,NAB001,DIPLOMACY,6,"Renewal of Roman protectorate status"
INT022,ROM001,GER001,WAR,14,"Germanicus' campaigns against Germanic tribes"
INT023,ROM001,PAR001,DIPLOMACY,18,"Agreement on Armenian succession"
INT024,ROM001,ATH001,TRIBUTE,20,"Increased tribute demands under Tiberius"
INT025,PAR001,KUS001,TRADE,22,"Peak of Silk Road trade activity"
INT026,ROM001,BRI001,DIPLOMACY,25,"Diplomatic mission to British tribes"
INT027,XIN001,KUS001,TRADE,28,"Renewed trade agreements after Wang Mang's fall"
INT028,ROM001,NAB001,TRADE,30,"Increased spice trade through Nabataean ports"
INT029,ROM001,PAR001,WAR,35,"Conflict over Armenian succession"
INT030,KUS001,CHE001,ALLIANCE,36,"Military alliance against common threats"
INT031,ROM001,GER001,WAR,40,"Campaigns of Galba in Germania"
INT032,ROM001,BRI001,WAR,43,"Claudius' invasion of Britain"
INT033,ROM001,PAR001,DIPLOMACY,45,"Treaty regarding Mesopotamian borders"
INT034,NAB001,AXU001,TRADE,47,"Expanded Red Sea trade network"
INT035,ROM001,PAR001,WAR,50,"Conflicts over buffer states"
INT036,KUS001,PAR001,TRADE,52,"New Silk Road route agreements"
INT037,ROM001,BRI001,WAR,55,"Expansion of Roman control in Britain"
INT038,ROM001,ATH001,DIPLOMACY,57,"Nero's proclamation of Greek freedom"
INT039,ROM001,NAB001,TRIBUTE,60,"Increased tribute demands under Nero"
INT040,PAR001,KUS001,ALLIANCE,62,"Alliance against nomadic threats"
INT041,ROM001,PAR001,DIPLOMACY,63,"Corbulo's Armenian settlement"
INT042,ROM001,GER001,WAR,65,"Suppression of Germanic uprisings"
INT043,ROM001,COR001,TRIBUTE,67,"New taxation system implemented"
INT044,NAB001,AXU001,ALLIANCE,68,"Joint naval operations in Red Sea"
INT045,ROM001,PAR001,WAR,70,"Border tensions in Syria-Mesopotamia"`;
    }

    async loadData() {
        try {
            // Load and parse both datasets
            const [governments, interactions] = await Promise.all([
                this.loadGovernments(),
                this.loadInteractions()
            ]);
            
            this.governmentsData = governments;
            this.interactionsData = interactions;
            
            return {
                governments: this.governmentsData,
                interactions: this.interactionsData
            };
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    async loadGovernments() {
        return new Promise((resolve, reject) => {
            Papa.parse(this.rawGovernments, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        reject(new Error('Error parsing governments data'));
                        return;
                    }
                    const validData = this.validateGovernmentData(results.data);
                    resolve(validData);
                },
                error: (error) => reject(error)
            });
        });
    }

    async loadInteractions() {
        return new Promise((resolve, reject) => {
            Papa.parse(this.rawInteractions, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        reject(new Error('Error parsing interactions data'));
                        return;
                    }
                    const validData = this.validateInteractionData(results.data);
                    resolve(validData);
                },
                error: (error) => reject(error)
            });
        });
    }

    validateGovernmentData(data) {
        return data.filter(item => {
            return (
                item.id &&
                item.name &&
                item.type &&
                typeof item.start_year === 'number' &&
                typeof item.end_year === 'number' &&
                typeof item.latitude === 'number' &&
                typeof item.longitude === 'number'
            );
        }).map(gov => ({
            id: gov.id,
            name: gov.name,
            type: gov.type,
            startYear: gov.start_year,
            endYear: gov.end_year,
            latitude: gov.latitude,
            longitude: gov.longitude,
            description: gov.description || ''
        }));
    }

    validateInteractionData(data) {
        return data.filter(item => {
            return (
                item.id &&
                item.source_id &&
                item.target_id &&
                item.type &&
                typeof item.year === 'number'
            );
        }).map(int => ({
            id: int.id,
            sourceId: int.source_id,
            targetId: int.target_id,
            type: int.type,
            year: int.year,
            description: int.description || ''
        }));
    }

    filterDataByYear(year) {
        if (!this.governmentsData || !this.interactionsData) {
            return null;
        }

        const governments = this.governmentsData.filter(gov => 
            gov.startYear <= year && gov.endYear >= year
        );

        const governmentIds = new Set(governments.map(gov => gov.id));
        const interactions = this.interactionsData.filter(int => {
            // Check if interaction occurred in this year
            if (int.year !== year) {
                return false;
            }
            
            // Check if both source and target governments exist in this year
            return governmentIds.has(int.sourceId) && governmentIds.has(int.targetId);
        }).map(int => {
            // Enrich interaction data with government details
            const source = governments.find(gov => gov.id === int.sourceId);
            const target = governments.find(gov => gov.id === int.targetId);
            
            return {
                id: int.id,
                type: int.type,
                year: int.year,
                description: int.description,
                source,
                target
            };
        });

        return {
            governments,
            interactions
        };
    }
}

// Make it globally available
window.DataLoader = DataLoader;