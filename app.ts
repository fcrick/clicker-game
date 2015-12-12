/// <reference path="mithril.d.ts"/>
/// <reference path="event.ts"/>
/// <reference path="gamedata.ts"/>
/// <reference path="views.ts"/>

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

interface NumberMap {
    [thingName: string]: number;
};

interface ThingTypeData {
    name: string;
    display?: string; // things without display are never shown
    title?: string; // tooltip display
    cost?: NumberMap;
    capacity: number;
    income?: NumberMap;
    capacityEffect?: NumberMap;
    costRatio?: number;
    zeroAtCapacity?: boolean;
    incomeWhenZeroed?: NumberMap;
    progressThing?: string; // value is name of thing to show percentage of
}

class ThingType {
    public GetName() {
        return this.name;
    }

    private name: string;

    public Display: Property<string>;
    public Title: Property<string>;
    public Cost: Property<NumberMap>;
    public Capacity: Property<number>;
    public Income: Property<NumberMap>;
    public CapacityEffect: Property<NumberMap>;
    public CostRatio: Property<number>;
    public ZeroAtCapacity: Property<boolean>;
    public IncomeWhenZeroed: Property<NumberMap>;
    public ProgressThing: Property<string>;

    constructor(tt: ThingTypeData) {
        this.name = tt.name;
        this.Display = new Property(tt.display);
        this.Title = new Property(tt.title);
        this.Cost = new Property(tt.cost);
        this.Capacity = new Property(tt.capacity);
        this.Income = new Property(tt.income);
        this.CapacityEffect = new Property(tt.capacityEffect);
        this.CostRatio = new Property(tt.costRatio);
        this.ZeroAtCapacity = new Property(tt.zeroAtCapacity);
        this.IncomeWhenZeroed = new Property(tt.incomeWhenZeroed);
        this.ProgressThing = new Property(tt.progressThing);
    }
}

class ThingViewModelCollection {
    private viewModels: { [thingName: string]: ThingViewModel } = {};

    public AddEntities(entities: ThingType[]) {
        entities.forEach(entity => {
            var thingName = entity.GetName();

            if (Inventory.IsRevealed(thingName)) {
                this.viewModels[thingName] = new ThingViewModel(entity);
            }

            Inventory.GetRevealEvent(thingName).Register((revealed: boolean) => {
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
        return this.viewModels[entity.GetName()];
    }
}

class ThingViewModel {
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
        this.thingName = this.thingType.GetName();
        this.model = game.Model(this.thingName);

        // fill in initial values
        this.DisplayText = new Property(this.thingType.Display.Get());
        this.Progress = new Property(this.calculateProgress());

        this.Count = new Property(this.model.Count.Get());
        this.CapacityShown = new Property(this.model.CapacityRevealed.Get());
        this.Capacity = new Property(this.model.Capacity.Get());

        this.ButtonText = new Property(this.calculateButtonText());
        this.ButtonEnabled = new Property(this.model.Purchasable.Get());
        this.ButtonTitle = new Property(this.thingType.Title.Get());

        this.setupEvents();
    }

    setupProgressEvent() {
        // unregister previous count tracking event
        if (this.progressUnreg) {
            this.progressUnreg();
            this.progressUnreg = null;
        }

        // register new one if need
        var progressThing = this.thingType.ProgressThing.Get();
        if (progressThing) {
            var progresModel = game.Model(progressThing);
            this.progressUnreg = progresModel.Count.Event().Register(() => this.Progress.Set(this.calculateProgress()));
            this.Progress.Set(this.calculateProgress());
        }
    }

    setupButtonTextEvents() {
        if (this.costUnregs) {
            this.costUnregs.forEach(unreg => unreg());
            this.costUnregs = [];
        }

        var u = (callback: () => void) => this.costUnregs.push(callback);

        // change of name to anything in the cost of the entity
        var cost = this.thingType.Cost.Get();
        if (cost) {
            Object.keys(cost).forEach(costName => {
                u(entityByName[costName].Display.Event().Register(() => this.calculateButtonText()));
            });
        }

        u(this.thingType.Cost.Event().Register(() => this.setupButtonTextEvents()));
    }

    setupEvents() {
        var u = (callback: () => void) => this.unregs.push(callback);

        // set up events so properties update correctly
        u(this.thingType.Display.Event().Register(newName => {
            this.DisplayText.Set(newName);
            this.ButtonText.Set(this.calculateButtonText());
        }));

        this.setupProgressEvent();

        u(this.model.Count.Event().Register(() => {
            this.Count.Set(() => this.model.Count.Get());
        }));

        u(this.model.Price.Event().Register(() => {
            this.ButtonText.Set(this.calculateButtonText());
        }));

        u(this.model.CapacityRevealed.Event().Register(reveal => this.CapacityShown.Set(reveal)));
        u(this.model.Capacity.Event().Register(newCapacity => this.Capacity.Set(newCapacity)));

        u(this.model.Purchasable.Event().Register(enabled => this.ButtonEnabled.Set(enabled)));
        u(this.thingType.Title.Event().Register(newTitle => this.ButtonTitle.Set(newTitle)));
    }

    calculateProgress(): number {
        var progressThing = this.thingType.ProgressThing.Get();
        if (!progressThing) {
            return 0;
        }

        if (this.model.Count.Get() === this.model.Capacity.Get()) {
            return 0;
        }

        var progressModel = game.Model(progressThing);

        return progressModel.Count.Get() / progressModel.Capacity.Get();
    }

    calculateButtonText(): string {
        var price = this.model.Price.Get();
        var costString = Object.keys(price).map(thingName =>
            price[thingName] + ' ' + entityByName[thingName].Display.Get()
            ).join(', ');

        if (!costString) {
            costString = "FREE!";
        }

        return 'Buy a ' + this.thingType.Display.Get() + ' for ' + costString;
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

        this.gameEvent = new GameEvent<{ (): void}>();
    }

    public GetEntities() { return this.entities; }
    public GetThingNames() { return this.thingNames; }
    public GetEntity(thingName: string) { return this.entityLookup[thingName]; }

    public GetThingModels() { return this.models; }
    public Model(thingName: string) { return this.modelLookup[thingName]; }

    public GetEvent(): IGameEvent<{ (): void }> {
        return this.gameEvent;
    }

    public addEntities(entities: ThingType[], saveData: SaveData) {
        var initialize = () => { };

        entities.forEach(entity => {
            this.entities.push(entity);

            var thingName = entity.GetName();

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

        this.gameEvent.Fire(callback => callback());
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

    private gameEvent: GameEvent<{ (): void }>;
}

class ThingModel {
    constructor(
        public Type: ThingType,
        saveData: ThingSaveData,
        private gameState: GameState
    ) {
        this.thingName = this.Type.GetName();

        this.createProperties(saveData);

        this.saveEvents();
    }

    // should be called only once all models are created
    public Initialize() {
        this.components = [
            new CostComponent(this, this.gameState),
            new CapacityComponent(this, this.gameState),
        ];
    }

    public Reset() {
        this.Revealed.Set(false);
        this.Count.Set(0);
        this.CapacityRevealed.Set(false);
    }

    // Can be shown to the user
    public Revealed: Property<boolean>;

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
        var price = this.Price.Get();

        if (!this.Purchasable.Get()) {
            return;
        }

        Object.keys(price).forEach(thingName => {
            var count = game.Model(thingName).Count;
            var current = count.Get();
            count.Set(current - price[thingName]);
        });

        this.Count.Set(this.Count.Get() + 1);
    }

    createProperties(saveData: ThingSaveData) {
        // values from the game save
        this.Revealed = new Property(saveData.IsRevealed);
        this.CapacityRevealed = new Property(saveData.IsCapShown);
        this.Count = new Property(saveData.Count);

        // derivative values
        this.CanAfford =  new Property(true);
        this.AtCapacity = new Property(false);

        this.Capacity = new Property(-1);
        this.Price = new Property<NumberMap>({});

        // calculated properties
        this.Purchasable = new Property(false);
        var updatePurchasable = () => this.Purchasable.Set(
            this.CanAfford.Get() && !this.AtCapacity.Get()
            );

        this.CanAfford.Event().Register(updatePurchasable);
        this.AtCapacity.Event().Register(updatePurchasable);
    }

    saveEvents() {
        this.CapacityRevealed.Event().Register(reveal => saveData.Stuff[this.thingName].IsCapShown = reveal);
        this.Revealed.Event().Register(reveal => saveData.Stuff[this.thingName].IsRevealed = reveal);
        this.Count.Event().Register(count => saveData.Stuff[this.thingName].Count = count);
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

        var unreg = this.model.Count.Event().Register(() => this.updateCost());
        var unreg2 = gameState.GetEvent().Register(() => {
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

        var cost = this.type.Cost.Get();
        if (cost) {
            Object.keys(cost).forEach(affected =>
                u(this.gameState.Model(affected).Count.Event()
                    .Register(() => this.updateAffordability())));
        }

        // remove old callbacks
        this.refreshCleanup();
        this.refreshCleanup = () => unregs.forEach(unreg => unreg());
    }

    private updateCost() {
        var cost = this.type.Cost.Get();
        if (!cost) {
            return {};
        }

        var ratio = this.type.CostRatio.Get();
        if (ratio === 0) {
            this.model.Price.Set(cost);
            return;
        }

        if (!ratio) {
            ratio = 1.15;
        }

        var currentPrice = <NumberMap>{};
        var count = this.model.Count.Get();
        var multiplier = Math.pow(ratio, count);

        Object.keys(cost).forEach(thingName => {
            currentPrice[thingName] = Math.floor(cost[thingName] * multiplier);
        });

        this.model.Price.Set(currentPrice);

        this.updateAffordability();
    }

    private updateAffordability() {
        var price = this.model.Price.Get();

        var canAfford = true;
        if (price) {
            canAfford = Object.keys(price).every(thingName =>
                game.Model(thingName).Count.Get() >= price[thingName]
                );
        }

        this.model.CanAfford.Set(canAfford);
    }

    private cleanupComponent: () => void;
    private refreshCleanup: () => void = () => { };
}

class CapacityComponent extends Component {

    constructor(protected model: ThingModel, protected gameState: GameState) {
        super(model, gameState);

        this.refresh();
        this.updateCapacity();

        var unreg = this.model.Count.Event().Register((curr, prev) => this.onCountChange(curr, prev));
        var unreg2 = gameState.GetEvent().Register(() => this.refresh());

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
            var effects = entity.CapacityEffect.Get();
            if (!effects) {
                return;
            }

            var effect = effects[this.type.GetName()];
            if (effect) {
                effectTable[entity.GetName()] = effect;
            }
        });

        var initial = this.type.Capacity.Get();
        var affecting = Object.keys(effectTable);

        this.calculateCapacity = () => affecting.reduce(
            (sum, affecting) => sum
                + this.gameState.Model(affecting).Count.Get()
                * effectTable[affecting],
            initial
            );

        this.calculateCapacityRevealed = () => this.model.Count.Get() > this.model.Capacity.Get();

        var unregs: { (): void; }[] = [];
        var u = (unreg: { (): void; }) => unregs.push(unreg);

        affecting.forEach(affected =>
            u(this.gameState.Model(affected).Count.Event()
                .Register(() => this.updateCapacity())));

        // remove old callbacks
        this.refreshCleanup();
        this.refreshCleanup = () => unregs.forEach(unreg => unreg());
    }

    private updateCapacity() {
        var capacity = this.calculateCapacity();
        this.model.Capacity.Set(capacity);
        this.updateCapacityRevealed();
    }

    // called when the count of our owner changes
    private onCountChange(current: number, previous: number) {
        var capacity = this.model.Capacity.Get();
        if (capacity === -1) {
            return;
        }

        // check if we're over capacity
        var countProp = this.model.Count;
        var count = countProp.Get();
        if (count >= capacity) {
            // check if we're a special zero-at-capacity type
            if (this.type.ZeroAtCapacity.Get()) {
                var timesOver = Math.floor(count / capacity);

                countProp.Set(current - timesOver * capacity);
                var income = this.type.IncomeWhenZeroed.Get();
                if (income) {
                    Object.keys(income).forEach(earnedThing => {
                        var earnedCount = game.Model(earnedThing).Count;
                        earnedCount.Set(earnedCount.Get() + income[earnedThing] * timesOver);
                    });
                }
            }
            else {
                countProp.Set(capacity);
            }
        }

        this.updateCapacityRevealed();
    }

    private updateCapacityRevealed() {
        var capacity = this.model.Capacity.Get();
        if (capacity === -1) {
            this.model.AtCapacity.Set(false);
            this.model.CapacityRevealed.Set(false);
            return;
        }

        var atCapacity = this.model.Count.Get() >= capacity;
        this.model.AtCapacity.Set(atCapacity);

        if (atCapacity) {
            this.model.CapacityRevealed.Set(true);
        }
    }

    private calculateCapacity: () => number;
    private calculateCapacityRevealed: () => boolean;
    private cleanupComponent: () => void;
    private refreshCleanup: () => void = () => { };
}

module Inventory {
    export function Initialize(entities: ThingType[]) {
        entities.forEach(entity => initializeEntity(entity));
    }

    function initializeRevealEnabled(entity: ThingType) {
        if (!entity.Display.Get()) {
            return;
        }

        var thingName = entity.GetName()
        var model = game.Model(thingName);
        var purchasable = model.Purchasable.Get();

        var count = model.Count.Get();
        if (count > 0 || purchasable) {
            SetReveal(thingName, true);
        }
    }

    function initializeEntity(thingType: ThingType) {
        var thingName = thingType.GetName();

        var registerCostEvents = () => {
            var unregs: { (): void }[] = [];
            var u = (unreg: { (): void; }) => unregs.push(unreg);

            var model = game.Model(thingName);
            var price = model.Price.Get();
            var callback = () => initializeRevealEnabled(thingType);

            Object.keys(price).forEach(needed => {
                u(game.Model(needed).Count.Event().Register(callback));
            });

            u(model.Count.Event().Register(callback));
            u(game.Model(thingName).Capacity.Event().Register(callback));

            callback();

            if (unregs.length > 0) {
                costEventMap[thingName] = unregs;
            }
        }

        registerCostEvents();

        thingType.Cost.Event().Register(capacityEffects => {
            costEventMap[thingName].forEach(unreg => unreg());
            delete costEventMap[thingName];
            registerCostEvents();
        });
    }

    var costEventMap: { [index: string]: { (): void }[] } = {};

    export function SetReveal(thingName: string, revealed: boolean) {
        var current = saveData.Stuff[thingName].IsRevealed;
        if (current === revealed) {
            return;
        }

        saveData.Stuff[thingName].IsRevealed = revealed;
        revealEvent.FireEvent(thingName, callback => callback(revealed));
    }

    export function IsRevealed(thingName: string) {
        if (!entityByName[thingName].Display.Get()) {
            return false;
        }

        return saveData.Stuff[thingName].IsRevealed;
    }

    // event callback interfaces
    interface ToggleCallback { (toggled: boolean): void; };

    class ThingEvent<T> {
        private eventTable: { [thingName: string]: GameEvent<T> } = {};
        public GetEvent(thingName: string): IGameEvent<T> {
            var event = this.eventTable[thingName];
            if (!event) {
                event = this.eventTable[thingName] = new GameEvent<T>();
            }

            return event;
        }
        public FireEvent(thingName: string, caller: (callback: T) => void) {
            var event = this.eventTable[thingName];
            if (event)
                event.Fire(caller);
        }
    }

    // for showing that things exist at all
    var revealEvent = new ThingEvent<ToggleCallback>();
    export var GetRevealEvent = (thingName: string) => revealEvent.GetEvent(thingName);
}

function createElementsForEntity(thingName: string) {
    if (Inventory.IsRevealed(thingName)) {
        createThingRow(thingName);
    }

    var create = (reveal: boolean) => {
        if (reveal) {
            createThingRow(thingName);
        }
    }

    Inventory.GetRevealEvent(thingName).Register(create);
}

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

    m.mount(newDiv, {
        controller: () => {
            onunload: (e: { (): void; }) => toUnload.forEach(u => u());
        },
        view: () => thingRow.view(thingViewModels.GetViewModel(entity))
    });

    var redraw = () => m.redraw();
    var u = (unreg: { (): void; }) => toUnload.push(unreg);

    var vm = thingViewModels.GetViewModel(entity);

    u(vm.ButtonEnabled.Event().Register(redraw));
    u(vm.ButtonText.Event().Register(redraw));
    u(vm.ButtonTitle.Event().Register(redraw));
    u(vm.Capacity.Event().Register(redraw));
    u(vm.CapacityShown.Event().Register(redraw));
    u(vm.Count.Event().Register(redraw));
    u(vm.DisplayText.Event().Register(redraw));
    u(vm.Progress.Event().Register(redraw));

    var unregReveal: () => void;
    unregReveal = Inventory.GetRevealEvent(thingName).Register(revealed => {
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
        var income = type.Income.Get();
        var count = game.Model(thingName).Count.Get();
        if (income && count) {
            Object.keys(income).forEach(earnedName => {
                var countProp = game.Model(earnedName).Count;
                countProp.Set(countProp.Get() + income[earnedName] * count);
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

    var entities = definitions.map(thingType => new ThingType(thingType));
    addNewEntities(entities);

    setInterval(onInterval, 200);
}

function addNewEntities(entities: ThingType[]) {
    entities.forEach(entity => entityByName[entity.GetName()] = entity);
    initializeSaveData();
    game.addEntities(entities, saveData);
    Inventory.Initialize(entities);
    thingViewModels.AddEntities(entities);
    entities.forEach(entity => createElementsForEntity(entity.GetName()));

    Object.keys(entityByName).forEach(thingName => things[entityByName[thingName].Display.Get()] = entityByName[thingName]);
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
    var newThingType: ThingTypeData = {
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

    addNewEntities([new ThingType(newThingType)]);
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

        return JSON.parse(json);
    });
    var entities = newDefs.map(thingType => new ThingType(thingType));
    addNewEntities(entities);

    definitions = newDefs;
}