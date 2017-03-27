import * as gamedata from './gamedata';
import * as views from './views';
import { Event, Property } from './event';

let definitions = gamedata.definitions;
let thingRow = views.thingRow;

var resetButton = document.getElementById("resetButton");
var myText = document.getElementById("helloText");

resetButton.addEventListener('click', resetEverything, false);

// TODO:
// - make game editable from inside the game
//   - hook up events for anything missing them
//   - switching to a more explicit component architecture

// - make code consistenty pass around entity object instead of thingName string
// - refactor PurchaseCost
// - change Inventory to a class
// - make reset reset everything including things now unknown
// - make game save less often - 5 times per second is too much!

// - make Clicks actually let do multibuy
// - display income
// - floating text that highlights progress (with accumulation?)
// - give shoutouts to people who have helped - special thanks to Oppositions for that suggestion
//   - thesamelabel for helping me get flex working
//   - mistamadd001 suggested keg capacities with microbreweries
// - make achievements for karbz0ne
// - work on simulating the game so I know how long things take
// - auto-generating game definitions
// - fractional income support - instead do formatters
// - enforce display ordering so reloading the page doesn't change the order
// - highlights when a button is hovered

interface ThingSaveData {
    Count: number;
    IsRevealed: boolean;
    IsCapShown: boolean;
}

interface SaveData {
    Stuff: { [index: string]: ThingSaveData };
};

var saveData: SaveData;

type NumberMap = {
    [thingName: string]: number;
};

// export interface ThingTypeData {
//     name: string;
//     display?: string; // things without display are never shown
//     title?: string; // tooltip display
//     cost?: NumberMap;
//     capacity: number;
//     income?: NumberMap;
//     capacityEffect?: NumberMap;
//     costRatio?: number;
//     zeroAtCapacity?: boolean;
//     incomeWhenZeroed?: NumberMap;
//     progressThing?: string; // value is name of thing to show percentage of
// }

let requiredFields = {
    name: '',
    capacity: 0,
};

let optionalFields = {
    display: '',
    title: '',
    cost: <NumberMap>{},
    income: <NumberMap>{},
    capacityEffect: <NumberMap>{},
    costRatio: 0,
    zeroAtCapacity: false,
    incomeWhenZeroed: <NumberMap>{},
    progressThing: '',
};

export type ThingTypeData = Identity<
    Partial<typeof optionalFields> &
    typeof requiredFields
>;

// let foo2 = {
//     ProgressThing: '',
// };
// let foo3 = Object.assign(foo2, foo);


var keys = <{<T, U extends keyof T>(obj: T): U[]}><any>Object.keys;
// let fooKeys = keys(foo);

type Identity<T> = {
    [P in keyof T]: T[P];
};
type Propertied<T> = {
    [P in keyof T]: Property<T[P]>
}

function propertize<T>(obj: T): Propertied<T> {
    return keys(obj).reduce(
        (o, k) => (o[k] = Property(obj[k]), o),
        <Propertied<T>>{}
    );
}
// let propertied = propertize(foo);

type ThingType = Propertied<ThingTypeData>;

// class ThingType {
//     public GetName() {
//         return this.name;
//     }

//     private name: string;

//     public Display: Property<string>;
//     public Title: Property<string>;
//     public Cost: Property<NumberMap>;
//     public Capacity: Property<number>;
//     public Income: Property<NumberMap>;
//     public CapacityEffect: Property<NumberMap>;
//     public CostRatio: Property<number>;
//     public ZeroAtCapacity: Property<boolean>;
//     public IncomeWhenZeroed: Property<NumberMap>;
//     public ProgressThing: Property<string>;

//     constructor(tt: ThingTypeData) {
//         keys(tt).forEach(key => this[key] = tt[key]);
//         this.name = tt.name;
//         this.Display = Property(tt.display);
//         this.Title = Property(tt.title);
//         this.Cost = Property(tt.cost);
//         this.Capacity = Property(tt.capacity);
//         this.Income = Property(tt.income);
//         this.CapacityEffect = Property(tt.capacityEffect);
//         this.CostRatio = Property(tt.costRatio);
//         this.ZeroAtCapacity = Property(tt.zeroAtCapacity);
//         this.IncomeWhenZeroed = Property(tt.incomeWhenZeroed);
//         this.ProgressThing = Property(tt.progressThing);
//     }
// }

class ThingViewModelCollection {
    private viewModels: { [thingName: string]: ThingViewModel } = {};

    public AddEntities(entities: ThingType[]) {
        entities.forEach(entity => {
            var thingName = entity.name();

            if (game.Model(thingName).Revealed()) {
                this.viewModels[thingName] = new ThingViewModel(entity);
            }

            game.Model(thingName).Revealed.register(revealed => {
                if (!revealed || this.viewModels[thingName]) {
                    return;
                }

                this.viewModels[thingName] = new ThingViewModel(entity);
            });
        });
    }

    public GetViewModels() {
        return Object.keys(this.viewModels).map(key => this.viewModels[key]);
    }

    public GetViewModel(entity: ThingType) {
        return this.viewModels[entity.name()];
    }
}

export class ThingViewModel {
    public DisplayText: Property<string>;
    public Progress: Property<number>;

    public Count: Property<number>;
    public CapacityShown: Property<boolean>;
    public Capacity: Property<number>;

    public ButtonText: Property<string>;
    public ButtonEnabled: Property<boolean>;
    public ButtonTitle: Property<string>;

    public Buy = () => this.model.Buy();

    constructor(private thingType: ThingType) {
        this.thingName = this.thingType.name();
        this.model = game.Model(this.thingName);

        // fill in initial values
        this.DisplayText = Property(this.thingType.display());
        this.Progress = Property(this.calculateProgress());

        this.Count = Property(this.model.Count());
        this.CapacityShown = Property(this.model.CapacityRevealed());
        this.Capacity = Property(this.model.Capacity());

        this.ButtonText = Property(this.calculateButtonText());
        this.ButtonEnabled = Property(this.model.Purchasable());
        this.ButtonTitle = Property(this.thingType.title());

        this.setupEvents();
    }

    setupProgressEvent() {
        // unregister previous count tracking event
        if (this.progressUnreg) {
            this.progressUnreg();
            this.progressUnreg = null;
        }

        // register new one if need
        var progressThing = this.thingType.progressThing();
        if (progressThing) {
            var progresModel = game.Model(progressThing);
            this.progressUnreg = progresModel.Count.register(() => this.Progress(this.calculateProgress()));
            this.Progress(this.calculateProgress());
        }
    }

    setupButtonTextEvents() {
        if (this.costUnregs) {
            this.costUnregs.forEach(unreg => unreg());
            this.costUnregs = [];
        }

        var u = (callback: () => void) => this.costUnregs.push(callback);

        // change of name to anything in the cost of the entity
        var cost = this.thingType.cost();
        if (cost) {
            Object.keys(cost).forEach(costName => {
                u(entityByName[costName].display.register(() => this.calculateButtonText()));
            });
        }

        u(this.thingType.cost.register(() => this.setupButtonTextEvents()));
    }

    setupEvents() {
        var u = (callback: () => void) => this.unregs.push(callback);

        // set up events so properties update correctly
        u(this.thingType.display.register(newName => {
            this.DisplayText(newName);
            this.ButtonText(this.calculateButtonText());
        }));

        this.setupProgressEvent();

        u(this.model.Count.register(() => {
            this.Count(() => this.model.Count());
        }));

        u(this.model.Price.register(() => {
            this.ButtonText(this.calculateButtonText());
        }));

        u(this.model.CapacityRevealed.register(reveal => this.CapacityShown(reveal)));
        u(this.model.Capacity.register(newCapacity => this.Capacity(newCapacity)));

        u(this.model.Purchasable.register(enabled => this.ButtonEnabled(enabled)));
        u(this.thingType.title.register(newTitle => this.ButtonTitle(newTitle)));
    }

    calculateProgress(): number {
        var progressThing = this.thingType.progressThing();
        if (!progressThing) {
            return 0;
        }

        if (this.model.Count() === this.model.Capacity()) {
            return 0;
        }

        var progressModel = game.Model(progressThing);

        return progressModel.Count() / progressModel.Capacity();
    }

    calculateButtonText(): string {
        var price = this.model.Price();
        var costString = Object.keys(price).map(thingName =>
            price[thingName] + ' ' + entityByName[thingName].display()
            ).join(', ');

        if (!costString) {
            costString = "FREE!";
        }

        return 'Buy a ' + this.thingType.display() + ' for ' + costString;
    }

    private model: ThingModel;
    private thingName: string;
    private unregs: { (): void }[] = [];
    private progressUnreg: { (): void };
    private costUnregs: { (): void }[] = [];
}

class GameState {
    constructor() {
        this.entities = [];
        this.thingNames = [];
        this.entityLookup = {};

        this.models = [];
        this.modelLookup = {};

        this.gameEvent = Event<void>();
    }

    public GetEntities() { return this.entities; }
    public GetThingNames() { return this.thingNames; }
    public GetEntity(thingName: string) { return this.entityLookup[thingName]; }

    public GetThingModels() { return this.models; }
    public Model(thingName: string) { return this.modelLookup[thingName]; }

    public GetEvent() {
        return this.gameEvent;
    }

    public addEntities(entities: ThingType[], saveData: SaveData) {
        var initialize = () => { };

        entities.forEach(entity => {
            this.entities.push(entity);

            var thingName = entity.name();

            this.thingNames.push(thingName);
            this.entityLookup[thingName] = entity;

            var model = new ThingModel(entity, saveData.Stuff[thingName], this);
            this.models.push(model);
            this.modelLookup[thingName] = model;

            var lastInitialize = initialize;
            initialize = () => {
                model.Initialize();
                lastInitialize();
            }
        });

        initialize();

        this.gameEvent.fire(callback => callback());
    }

    private entities: ThingType[];
    private thingNames: string[];
    private entityLookup: {
        [thingName: string]: ThingType;
    }

    private models: ThingModel[];
    private modelLookup: {
        [thingName: string]: ThingModel;
    }

    private gameEvent: Event<void>;
}

class ThingModel {
    constructor(
        public Type: ThingType,
        saveData: ThingSaveData,
        private gameState: GameState
    ) {
        this.thingName = this.Type.name();

        this.createProperties(saveData);

        this.saveEvents();
    }

    // should be called only once all models are created
    public Initialize() {
        this.components = [
            new CostComponent(this, this.gameState),
            new CapacityComponent(this, this.gameState),
        ];

        this.Revealed(this.shouldReveal());
    }

    public Reset() {
        this.everRevealed = false;
        this.Revealed(false);
        this.Count(0);
        this.CapacityRevealed(false);
    }

    // Can be shown to the user
    public Revealed: Property<boolean>;
    everRevealed: boolean;

    // Purchase can be attempted
    public Purchasable: Property<boolean>;
    public CanAfford: Property<boolean>;
    public AtCapacity: Property<boolean>;

    // Capacity can be shown to the user
    public CapacityRevealed: Property<boolean>;

    // how many we have and how many we can have
    // -1 capacity mean infinite capacity
    public Count: Property<number>;
    public Capacity: Property<number>;

    // the price of buying one additional thing of this type
    public Price: Property<NumberMap>;

    // Purchase one of this type
    public Buy() {
        var price = this.Price();

        if (!this.Purchasable()) {
            return;
        }

        Object.keys(price).forEach(thingName => {
            var count = game.Model(thingName).Count;
            var current = count();
            count(current - price[thingName]);
        });

        this.Count(this.Count() + 1);
    }

    createProperties(saveData: ThingSaveData) {
        // values from the game save
        this.everRevealed = saveData.IsRevealed;
        this.Revealed = Property(saveData.IsRevealed);
        this.Revealed.register(reveal => this.everRevealed = this.everRevealed || reveal);

        this.CapacityRevealed = Property(saveData.IsCapShown);
        this.Count = Property(saveData.Count);

        // derivative values
        this.CanAfford =  Property(true);
        this.AtCapacity = Property(false);

        this.Capacity = Property(-1);
        this.Price = Property<NumberMap>({});

        // calculated properties
        this.Purchasable = Property(false);
        var updatePurchasable = () => this.Purchasable(
            this.CanAfford() && !this.AtCapacity()
        );

        this.CanAfford.register(updatePurchasable);
        this.AtCapacity.register(updatePurchasable);

        var updateRevealed = () => this.Revealed(this.shouldReveal());

        // show if we have any, or can buy any
        this.Count.register(updateRevealed);
        this.Purchasable.register(updateRevealed);
    }

    shouldReveal() {
        // don't show things without display names
        if (!entityByName[this.thingName].display()) {
            return false;
        }

        if (this.everRevealed) {
            return true;
        }

        return this.Count() > 0 || this.Purchasable();
    }

    saveEvents() {
        this.CapacityRevealed.register(reveal => saveData.Stuff[this.thingName].IsCapShown = reveal);
        this.Revealed.register(reveal => saveData.Stuff[this.thingName].IsRevealed = reveal);
        this.Count.register(count => saveData.Stuff[this.thingName].Count = count);
    }

    private thingName: string;
    private components: Component[];
}

class Component {
    constructor(protected model: ThingModel, protected gameState: GameState) {
        this.type = this.model.Type;
    }

    Dispose() { }

    protected type: ThingType;
}

class CostComponent extends Component {
    constructor(protected model: ThingModel, protected gameState: GameState) {
        super(model, gameState);

        this.refresh();
        this.updateCost();

        var unreg = this.model.Count.register(() => this.updateCost());
        var unreg2 = gameState.GetEvent().register(() => {
            this.refresh();
            this.updateCost();
        });

        this.cleanupComponent = () => {
            unreg();
            unreg2();
        }
    }

    // call this when you're getting rid of this component
    public Dispose() {
        this.cleanupComponent();
        this.refreshCleanup();
    }

    private refresh() {
        var unregs: { (): void; }[] = [];
        var u = (unreg: { (): void; }) => unregs.push(unreg);

        var cost = this.type.cost();
        if (cost) {
            Object.keys(cost).forEach(affected =>
                u(this.gameState.Model(affected).Count
                .register(() => this.updateAffordability())));
        }

        // remove old callbacks
        this.refreshCleanup();
        this.refreshCleanup = () => unregs.forEach(unreg => unreg());
    }

    private updateCost() {
        var cost = this.type.cost();
        if (!cost) {
            return {};
        }

        var ratio = this.type.costRatio();
        if (ratio === 0) {
            this.model.Price(cost);
            return;
        }

        if (!ratio) {
            ratio = 1.15;
        }

        var currentPrice = <NumberMap>{};
        var count = this.model.Count();
        var multiplier = Math.pow(ratio, count);

        Object.keys(cost).forEach(thingName => {
            currentPrice[thingName] = Math.floor(cost[thingName] * multiplier);
        });

        this.model.Price(currentPrice);

        this.updateAffordability();
    }

    private updateAffordability() {
        var price = this.model.Price();

        var canAfford = true;
        if (price) {
            canAfford = Object.keys(price).every(thingName =>
                game.Model(thingName).Count() >= price[thingName]
                );
        }

        this.model.CanAfford(canAfford);
    }

    private cleanupComponent: () => void;
    private refreshCleanup: () => void = () => { };
}

class CapacityComponent extends Component {

    constructor(protected model: ThingModel, protected gameState: GameState) {
        super(model, gameState);

        this.refresh();
        this.updateCapacity();

        var unreg = this.model.Count.register((curr, prev) => this.onCountChange(curr, prev));
        var unreg2 = gameState.GetEvent().register(() => this.refresh());

        this.cleanupComponent = () => {
            unreg();
            unreg2();
        }
    }

    // call this when you're getting rid of this component
    public Dispose() {
        this.cleanupComponent();
        this.refreshCleanup();
    }

    private refresh() {
        var effectTable: { [thingName: string]: number } = {};

        this.gameState.GetEntities().forEach(entity => {
            var effects = entity.capacityEffect();
            if (!effects) {
                return;
            }

            var effect = effects[this.type.name()];
            if (effect) {
                effectTable[entity.name()] = effect;
            }
        });

        var initial = this.type.capacity();
        var affecting = Object.keys(effectTable);

        this.calculateCapacity = () => affecting.reduce(
            (sum, affecting) => sum
                + this.gameState.Model(affecting).Count()
                * effectTable[affecting],
            initial
            );

        this.calculateCapacityRevealed = () => this.model.Count() > this.model.Capacity();

        var unregs: { (): void; }[] = [];
        var u = (unreg: { (): void; }) => unregs.push(unreg);

        affecting.forEach(affected =>
            u(this.gameState.Model(affected).Count.register(() => this.updateCapacity())));

        // remove old callbacks
        this.refreshCleanup();
        this.refreshCleanup = () => unregs.forEach(unreg => unreg());
    }

    private updateCapacity() {
        var capacity = this.calculateCapacity();
        this.model.Capacity(capacity);
        this.updateCapacityRevealed();
    }

    // called when the count of our owner changes
    private onCountChange(current: number, previous: number) {
        var capacity = this.model.Capacity();
        if (capacity === -1) {
            return;
        }

        // check if we're over capacity
        var countProp = this.model.Count;
        var count = countProp();
        if (count >= capacity) {
            // check if we're a special zero-at-capacity type
            if (this.type.zeroAtCapacity()) {
                var timesOver = Math.floor(count / capacity);

                countProp(current - timesOver * capacity);
                var income = this.type.incomeWhenZeroed();
                if (income) {
                    Object.keys(income).forEach(earnedThing => {
                        var earnedCount = game.Model(earnedThing).Count;
                        earnedCount(earnedCount() + income[earnedThing] * timesOver);
                    });
                }
            }
            else {
                countProp(capacity);
            }
        }

        this.updateCapacityRevealed();
    }

    private updateCapacityRevealed() {
        var capacity = this.model.Capacity();
        if (capacity === -1) {
            this.model.AtCapacity(false);
            this.model.CapacityRevealed(false);
            return;
        }

        var atCapacity = this.model.Count() >= capacity;
        this.model.AtCapacity(atCapacity);

        if (atCapacity) {
            this.model.CapacityRevealed(true);
        }
    }

    private calculateCapacity: () => number;
    private calculateCapacityRevealed: () => boolean;
    private cleanupComponent: () => void;
    private refreshCleanup: () => void = () => { };
}

function createElementsForEntity(thingName: string) {
    var model = game.Model(thingName);
    if (model.Revealed()) {
        createThingRow(thingName);
    }

    var create = (reveal: boolean, previous: boolean) => {
        if (reveal && !previous) {
            createThingRow(thingName);
        }
    }

    model.Revealed.register(create);
}

declare var m:any;

function createThingRow(thingName: string) {
    var outerDiv = document.createElement('div');
    outerDiv.className = 'row';
    outerDiv.style.display = 'flex';
    outerDiv.style.alignItems = 'center';

    var inv = document.getElementById('inventory');

    var newDiv = document.createElement('div');
    inv.appendChild(newDiv);

    var entity = entityByName[thingName];

    var toUnload: { (): void; }[] = [];

    (<any>m).mount(newDiv, {
        controller: () => ({
            onunload: (e: { (): void; }) => toUnload.forEach(u => u())
        }),
        view: () => thingRow.view(thingViewModels.GetViewModel(entity))
    });

    var redraw = () => m.redraw();
    var u = (unreg: { (): void; }) => toUnload.push(unreg);

    var vm = thingViewModels.GetViewModel(entity);

    u(vm.ButtonEnabled.register(redraw));
    u(vm.ButtonText.register(redraw));
    u(vm.ButtonTitle.register(redraw));
    u(vm.Capacity.register(redraw));
    u(vm.CapacityShown.register(redraw));
    u(vm.Count.register(redraw));
    u(vm.DisplayText.register(redraw));
    u(vm.Progress.register(redraw));

    var unregReveal: () => void;
    unregReveal = game.Model(thingName).Revealed.register(revealed => {
        if (revealed) {
            return;
        }

        m.mount(newDiv, null);
        unregReveal();
    });
}

function resetEverything() {
    game.GetThingModels().forEach(model => model.Reset());

    initializeSaveData();
    save();
}

function save() {
    localStorage['SaveData'] = JSON.stringify(saveData);
}

function initializeSaveData() {
    if (!saveData) {
        saveData = <SaveData>{};
    }

    var stuff = saveData.Stuff;
    if (!stuff) {
        stuff = saveData.Stuff = {};
    }

    Object.keys(entityByName).forEach(thingName => {
        if (!stuff[thingName]) {
            stuff[thingName] = {
                Count: 0,
                IsRevealed: false,
                IsCapShown: false,
            };
        }
    });
}

function onInterval() {
    Object.keys(entityByName).forEach(thingName => {
        var model = game.Model(thingName);
        var type = model.Type;
        var income = type.income();
        var count = game.Model(thingName).Count();
        if (income && count) {
            Object.keys(income).forEach(earnedName => {
                var countProp = game.Model(earnedName).Count;
                countProp(countProp() + income[earnedName] * count);
            });
        }
    });

    save();
}

function onLoad() {
    try {
        saveData = JSON.parse(localStorage['SaveData']);
    }
    catch (e) { }

    var entities = definitions.map(thingType => propertize(thingType));
    addNewEntities(entities);

    setInterval(onInterval, 200);
}

function addNewEntities(entities: ThingType[]) {
    entities.forEach(entity => entityByName[entity.name()] = entity);
    initializeSaveData();
    game.addEntities(entities, saveData);
    thingViewModels.AddEntities(entities);
    entities.forEach(entity => createElementsForEntity(entity.name()));

    Object.keys(entityByName).forEach(thingName => things[entityByName[thingName].display()] = entityByName[thingName]);
}

// i think i need something that will fire when the page finished loading
window.onload = onLoad;
var entityByName: { [index: string]: ThingType } = {};
var thingViewModels = new ThingViewModelCollection();
var game = new GameState();

// for debugging
var things: { [index: string]: ThingType } = {};
var nextId = 1;

function Add(display: string) {
    var newThingType = {
        name: '',
        capacity: -1,
        cost: {
            'tt-Point': 10,
        },
        income: {
            'tt-Point': 1,
        },
    };

    newThingType['name'] = 'tt-Custom' + nextId++;
    newThingType['display'] = display;

    addNewEntities([propertize(newThingType)]);
}

function ReAddAll() {
    var oldNames = definitions.map(thingType => thingType.name);

    var newDefs = definitions.map(thingType => {
        var originalName = thingType.name;

        var json = JSON.stringify(thingType)

        oldNames.forEach(oldName => {
            var re = new RegExp('"' + oldName + '"', 'g');
            json = json.replace(re, '"' + oldName + 'Again"');
        });

        return <ThingTypeData>JSON.parse(json);
    });
    var entities = newDefs.map(thingType => propertize(thingType));
    addNewEntities(entities);

    definitions = newDefs;
}