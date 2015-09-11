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

interface SaveThingInfo {
    Count: number;
    IsRevealed: boolean;
    IsCapShown: boolean;
}

interface SaveData {
    Stuff: { [index: string]: SaveThingInfo };
};

var saveData: SaveData;

interface NumberMap {
    [thingName: string]: number;
};

interface ThingType {
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

class Entity {
    public GetName() {
        return this.name;
    }

    private name;

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

    constructor(tt: ThingType) {
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

    public AddEntities(entities: Entity[]) {
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

    public GetViewModel(entity: Entity) {
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

    public Buy = () => tryBuy(this.entity.GetName());

    constructor(private entity: Entity) {
        this.thingName = entity.GetName();

        // fill in initial values
        this.DisplayText = new Property(entity.Display.Get());
        this.Progress = new Property(this.calculateProgress());

        this.Count = new Property(Inventory.GetCount(this.thingName));
        this.CapacityShown = new Property(game.Model(this.thingName).CapacityRevealed.Get());
        //this.Capacity = new Property(Inventory.GetCapacity(this.thingName));
        this.Capacity = new Property(game.Model(this.thingName).Capacity.Get());

        this.ButtonText = new Property(this.calculateButtonText());
        this.ButtonEnabled = new Property(Inventory.IsEnabled(this.thingName));
        this.ButtonTitle = new Property(entity.Title.Get());

        this.setupEvents();
    }

    setupProgressEvent() {
        // unregister previous count tracking event
        if (this.progressUnreg) {
            this.progressUnreg();
            this.progressUnreg = null;
        }

        // register new one if need
        var progressThing = this.entity.ProgressThing.Get();
        if (progressThing) {
            this.progressUnreg = Inventory.GetCountEvent(progressThing).Register(() => this.Progress.Set(this.calculateProgress()));
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
        var cost = this.entity.Cost.Get();
        if (cost) {
            Object.keys(cost).forEach(costName => {
                u(entityByName[costName].Display.Event().Register(() => this.calculateButtonText()));
            });
        }

        u(this.entity.Cost.Event().Register(() => this.setupButtonTextEvents()));
    }

    setupEvents() {
        var u = (callback: () => void) => this.unregs.push(callback);

        // set up events so properties update correctly
        u(this.entity.Display.Event().Register(newName => {
            this.DisplayText.Set(newName);
            this.ButtonText.Set(this.calculateButtonText());
        }));

        this.setupProgressEvent();

        u(Inventory.GetCountEvent(this.thingName).Register(newCount => {
            this.Count.Set(newCount);
            this.ButtonText.Set(this.calculateButtonText());
        }));

        //u(Inventory.GetShowCapacityEvent(this.thingName).Register(shown => this.CapacityShown.Set(shown)));
        u(game.Model(this.thingName).CapacityRevealed.Event().Register(reveal => this.CapacityShown.Set(reveal)));
        //u(Inventory.GetCapacityEvent(this.thingName).Register(newCapacity => this.Capacity.Set(newCapacity)));
        u(game.Model(this.thingName).Capacity.Event().Register(newCapacity => this.Capacity.Set(newCapacity)));

        u(Inventory.GetEnableEvent(this.thingName).Register(newEnabled => this.ButtonEnabled.Set(newEnabled)));
        u(this.entity.Title.Event().Register(newTitle => this.ButtonTitle.Set(newTitle)));
    }

    calculateProgress(): number {
        var progressThing = this.entity.ProgressThing.Get();
        if (!progressThing) {
            return 0;
        }

        //if (Inventory.GetCount(this.thingName) === Inventory.GetCapacity(this.thingName)) {
        if (Inventory.GetCount(this.thingName) === game.Model(this.thingName).Capacity.Get()) {
            return 0;
        }

        //return Inventory.GetCount(progressThing) / Inventory.GetCapacity(progressThing);
        return Inventory.GetCount(progressThing) / game.Model(progressThing).Capacity.Get();
    }

    calculateButtonText(): string {
        var cost = new PurchaseCost(this.thingName);
        var costString = cost.GetThingNames().map(name =>
            cost.GetCost(name) + ' ' + entityByName[name].Display.Get()
            ).join(', ');

        if (!costString) {
            costString = "FREE!";
        }

        return 'Buy a ' + this.entity.Display.Get() + ' for ' + costString;
    }

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

    public addEntities(entities: Entity[], saveData: SaveData) {
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

    private entities: Entity[];
    private thingNames: string[];
    private entityLookup: {
        [thingName: string]: Entity;
    }

    private models: ThingModel[];
    private modelLookup: {
        [thingName: string]: ThingModel;
    }

    private gameEvent: GameEvent<{ (): void }>;
}

class ThingModel {
    constructor(
        public Entity: Entity,
        saveData: SaveThingInfo,
        private gameState: GameState
    ) {
        this.thingName = this.Entity.GetName();

        this.createProperties(saveData);

        this.legacyEvents();
    }

    // should be called only once all models are created
    public Initialize() {
        this.components = [];

        // if we don't have infinite space, we need to track capacity
        if (this.Entity.Capacity.Get() !== -1) {
            this.components.push(new CapacityComponent(this, this.gameState));
        }
    }

    // Can be shown to the user
    public Revealed: Property<boolean>;

    // Purchase can be attempted
    public Purchasable: Property<boolean>;

    // Capacity can be shown to the user
    public CapacityRevealed: Property<boolean>;

    // how many we have and how many we can have
    // -1 capacity mean infinite capacity
    public Count: Property<number>;
    public Capacity: Property<number>;

    // the price of buying one additional thing of this type
    public Price: Property<{ [thingName: string]: number }>;

    // Purchase one of this type
    public Buy() {
    }

    createProperties(saveData: SaveThingInfo) {
        // values from the game save
        this.Revealed = new Property(saveData.IsRevealed);
        this.CapacityRevealed = new Property(saveData.IsCapShown);
        this.Count = new Property(saveData.Count);

        // derivative values
        this.Purchasable = new Property(false);
        this.Capacity = new Property(-1);
        this.Price = new Property<NumberMap>({});
    }

    saveEvents() {
        // need cleanup
        this.CapacityRevealed.Event().Register(reveal => saveData[this.thingName].IsCapShown = reveal);
    }

    legacyEvents() {
        Inventory.GetCountEvent(this.thingName).Register(newCount => {
            this.Count.Set(newCount)
        });
    }

    private thingName: string;
    private components: Component[];
}

class Component {
    constructor(protected thingModel: ThingModel, protected gameState: GameState) {
    }

    Dispose() { }
}

class CapacityComponent extends Component {

    constructor(protected thingModel: ThingModel, protected gameState: GameState) {
        super(thingModel, gameState);

        this.entity = this.thingModel.Entity;

        this.refresh();
        this.updateCapacity();

        var unreg = this.thingModel.Count.Event().Register(() => this.updateCapacityRevealed());
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

            var effect = effects[this.entity.GetName()];
            if (effect) {
                effectTable[entity.GetName()] = effect;
            }
        });

        var initial = this.entity.Capacity.Get();
        var affecting = Object.keys(effectTable);

        this.calculateCapacity = () => affecting.reduce(
            (sum, affecting) => sum
                + this.gameState.Model(affecting).Count.Get()
                * effectTable[affecting],
            initial
            );

        this.calculateCapacityRevealed = () => this.thingModel.Count.Get() > this.thingModel.Capacity.Get();

        var unregs = [];
        var u = unreg => unregs.push(unreg);

        affecting.forEach(affected =>
            u(this.gameState.Model(affected).Count.Event()
                .Register(() => this.updateCapacity())));

        // remove old callbacks
        this.refreshCleanup();
        this.refreshCleanup = () => unregs.forEach(unreg => unreg());
    }

    private updateCapacity() {
        this.thingModel.Capacity.Set(this.calculateCapacity());
        this.updateCapacityRevealed();
    }

    private updateCapacityRevealed() {
        if (this.thingModel.CapacityRevealed.Get()) {
            return;
        }

        if (this.thingModel.Count.Get() >= this.thingModel.Capacity.Get()) {
            this.thingModel.CapacityRevealed.Set(true);
        }
    }

    private calculateCapacity: () => number;
    private calculateCapacityRevealed: () => boolean;
    private cleanupComponent: () => void;
    private refreshCleanup: () => void = () => { };

    private entity: Entity;
}

module Inventory {
    export function Initialize(entities: Entity[]) {
        entities.forEach(entity => initializeEntity(entity));
    }

    function initializeRevealEnabled(entity: Entity) {
        if (!entity.Display.Get()) {
            return;
        }

        var thingName = entity.GetName()
        var purchaseCost = new PurchaseCost(thingName);

        var count = GetCount(thingName);
        if (count > 0 || GetCapacity(thingName) !== 0 && purchaseCost.CanAfford()) {
            SetReveal(thingName, true);
        }

        SetEnabled(thingName, IsEnabled(thingName));
    }

    function initializeEntity(entity: Entity) {
        var thingName = entity.GetName();

        var registerCostEvents = () => {
            var events: { (): void }[] = [];

            var purchaseCost = new PurchaseCost(thingName);
            var callback = () => initializeRevealEnabled(entity);

            purchaseCost.GetThingNames().forEach(needed => {
                events.push(GetCountEvent(needed).Register(callback));
            });

            events.push(GetCountEvent(thingName).Register(callback));
            events.push(game.Model(thingName).Capacity.Event().Register(callback));

            callback();

            if (events.length > 0) {
                costEventMap[thingName] = events;
            }
        }

        registerCostEvents();

        entity.Cost.Event().Register(capacityEffects => {
            costEventMap[thingName].forEach(unreg => unreg());
            delete costEventMap[thingName];
            registerCostEvents();
        });
    }

    var costEventMap: { [index: string]: { (): void }[] } = {};

    export function GetCount(thingName: string) {
        return saveData.Stuff[thingName].Count;
    }

    export function ChangeCount(thingName: string, delta: number) {
        var initialCount = saveData.Stuff[thingName].Count;
        var capacity = game.Model(thingName).Capacity.Get();
        var count = saveData.Stuff[thingName].Count += delta;
        var overflow = 0;

        if (capacity !== -1 && count > capacity) {
            overflow = count - capacity;
            count = saveData.Stuff[thingName].Count = capacity;
        }
        else if (count < 0) {
            count = saveData.Stuff[thingName].Count = 0;
        }

        // send notification
        if (count === initialCount) {
            return count;
        }

        countEvent.FireEvent(thingName, callback => callback(count, initialCount));
        capacityUpdate(thingName, count, capacity);

        var afterCount = GetCount(thingName);
        if (afterCount !== count && overflow !== 0) {
            ChangeCount(thingName, overflow);
        }

        return count;
    }

    export function SetCount(thingName: string, count: number) {
        var initialCount = saveData.Stuff[thingName].Count;
        if (initialCount === count) {
            return count;
        }

        saveData.Stuff[thingName].Count = count;
        countEvent.FireEvent(thingName, callback => callback(count, initialCount));
        capacityUpdate(thingName, count, GetCapacity(thingName));

        return count;
    }

    function capacityUpdate(thingName: string, count: number, capacity: number) {
        var entity = entityByName[thingName];

        if (entity.ZeroAtCapacity.Get() && count >= capacity) {
            SetCount(thingName, 0);
            var income = entity.IncomeWhenZeroed.Get();
            if (income) {
                Object.keys(income).forEach(earnedThing => {
                    ChangeCount(earnedThing, income[earnedThing]);
                });
            }
            return;
        }
    }

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

    export function GetCapacity(thingName: string) {
        return game.Model(thingName).Capacity.Get();
    }

    export function SetEnabled(thingName: string, enabled: boolean) {
        var current = enabledTable[thingName];
        if (current === enabled) {
            return;
        }

        enabledTable[thingName] = enabled;
        enableEvent.FireEvent(thingName, callback => callback(enabled));
    }

    export function IsEnabled(thingName: string) {
        var canAfford = new PurchaseCost(thingName).CanAfford();

        var count = GetCount(thingName);
        var capacity = GetCapacity(thingName);

        return canAfford && (capacity === -1 || count < capacity)
    }

    // full game reset
    export function Reset() {
        var names = Object.keys(entityByName);
        names.forEach(thingName => SetCount(thingName, 0));

        names.forEach(thingName => {
            // TODO: this should also check capacity
            SetReveal(thingName, false);
            game.Model(thingName).CapacityRevealed.Set(false);
        });

        names.forEach(thingName => initializeRevealEnabled(entityByName[thingName]));
    }

    // event callback interfaces
    interface CountCallback { (count: number, previous: number): void; };
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

    // for updating counts of things
    var countEvent = new ThingEvent<CountCallback>();
    export var GetCountEvent = (thingName: string) => countEvent.GetEvent(thingName);

    // for enabling and disabling buy buttons
    var enableEvent = new ThingEvent<ToggleCallback>();
    export var GetEnableEvent = (thingName: string) => enableEvent.GetEvent(thingName);

    // for showing that things exist at all
    var revealEvent = new ThingEvent<ToggleCallback>();
    export var GetRevealEvent = (thingName: string) => revealEvent.GetEvent(thingName);

    var enabledTable: { [index: string]: boolean } = {};
}

var cellClass = 'col-sm-2';

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

    var toUnload = [];

    m.mount(newDiv, {
        controller: () => {
            onunload: e => toUnload.forEach(u => u());
        },
        view: () => thingRow.view(thingViewModels.GetViewModel(entity))
    });

    var redraw = () => m.redraw();
    var u = unreg => toUnload.push(unreg);

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

class PurchaseCost {
    private costTable: { [index: string]: number; };

    constructor(public thingName: string) {
        this.costTable = entityByName[thingName].Cost.Get();
        if (!this.costTable) {
            this.costTable = {};
        }
    }

    public CanAfford() {
        return this.GetThingNames().every(thingName => Inventory.GetCount(thingName) >= this.GetCost(thingName));
    }

    public Deduct() {
        this.GetThingNames().forEach(thingName => {
            Inventory.ChangeCount(thingName, -this.GetCost(thingName));
        });
    }

    public GetThingNames() {
        return Object.keys(this.costTable);
    }

    // get how much of thingName I need to purchase 1 this.ThingToBuy
    public GetCost(thingName): number {
        var cost = this.costTable[thingName];
        if (!cost)
            return 0;

        var ratio = entityByName[this.thingName].CostRatio.Get();
        if (!ratio) {
            ratio = 1.15;
        }

        return Math.floor(cost * Math.pow(ratio, Inventory.GetCount(this.thingName)));
    }
}

function tryBuy(thingToBuy) {
    var cost = new PurchaseCost(thingToBuy);
    var things = cost.GetThingNames();

    if (!cost.CanAfford()) {
        return;
    }

    var capacity = game.Model(thingToBuy).Capacity.Get();
    if (capacity !== -1 && Inventory.GetCount(thingToBuy) >= capacity) {
        return;
    }

    cost.Deduct();
    Inventory.ChangeCount(thingToBuy, 1);

    save();
}

function resetEverything() {
    Inventory.Reset();

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
        var entity = entityByName[thingName];
        var income = entity.Income.Get();
        var count = Inventory.GetCount(thingName);
        if (income && count) {
            Object.keys(income).forEach(earnedName => {
                Inventory.ChangeCount(earnedName, income[earnedName] * count);
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

    var entities = definitions.map(thingType => new Entity(thingType));
    addNewEntities(entities);

    setInterval(onInterval, 200);
}

function addNewEntities(entities: Entity[]) {
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
var entityByName: { [index: string]: Entity } = {};
var thingViewModels = new ThingViewModelCollection();
var game = new GameState();

// for debugging
var things: { [index: string]: Entity } = {};
var nextId = 1;

function Add(display: string) {
    var newThingType: ThingType = {
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

    addNewEntities([new Entity(newThingType)]);
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
    var entities = newDefs.map(thingType => new Entity(thingType));
    addNewEntities(entities);

    definitions = newDefs;
}