

var resetButton = document.getElementById("resetButton");
var myText = document.getElementById("helloText");

resetButton.addEventListener('click', resetEverything, false);

// TODO:
// - make game editable from inside the game
//   - fix remaining event bugs
//   - hook up events for anything missing them
//   - switching to a more explicit component architecture

// - add automation thing you can buy A-Tomato-Meter
// - display income
// - floating text that highlights progress
// - give shoutouts to people who have helped - special thanks to Oppositions for that suggestion
//   - thesamelabel for helping me get flex working
//   - mistamadd001 suggested keg capacities with microbreweries
// - make achievements for karbz0ne
// - work on simulating the game so I know how long things take
// - auto-generating game definitions
// - fractional income support
// - enforce display ordering so reloading the page doesn't change the order
// - highlights when a button is hovered
// - make text vertically centered
// - come up with better display of rapidly increasing things

interface SaveThingInfo {
    Count: number;
    IsRevealed: boolean;
    IsCapShown: boolean;
}

interface SaveData {
    Stuff: { [index: string]: SaveThingInfo };
};

var saveData: SaveData;

interface ThingType {
    name: string;
    display?: string; // things without display are never shown
    title?: string; // tooltip display
    cost?: { [index: string]: number };
    capacity: number;
    income?: { [index: string]: number };
    capacityEffect?: { [index: string]: number };
    costRatio?: number;
    zeroAtCapacity?: boolean;
    incomeWhenZeroed?: { [index: string]: number };
    progressThing?: string; // value is name of thing to show percentage of
}

class Entity {
    public GetName() {
        return this.tt.name;
    }

    public Display: Property<string>;
    public Title: Property<string>;
    public Cost: Property<{ [index: string]: number }>;
    public Capacity: Property<number>;
    public Income: Property<{ [index: string]: number }>;
    public CapacityEffect: Property<{ [index: string]: number }>;
    public CostRatio: Property<number>;
    public ZeroAtCapacity: Property<boolean>;
    public IncomeWhenZeroed: Property<{ [index: string]: number }>;
    public ProgressThing: Property<string>;

    // derivative properties
    public ButtonText: Property<string>;

    constructor(private tt: ThingType) {
        this.Display = new Property(() => this.tt.display, value => this.tt.display = value);
        this.Title = new Property(() => this.tt.title, value => this.tt.display = value);
        this.Cost = new Property(() => this.tt.cost, value => this.tt.cost = value);
        this.Capacity = new Property(() => this.tt.capacity, value => this.tt.capacity = value);
        this.Income = new Property(() => this.tt.income, value => this.tt.income = value);
        this.CapacityEffect = new Property(() => this.tt.capacityEffect, value => this.tt.capacityEffect = value);
        this.CostRatio = new Property(() => this.tt.costRatio, value => this.tt.costRatio = value);
        this.ZeroAtCapacity = new Property(() => this.tt.zeroAtCapacity, value => this.tt.zeroAtCapacity = value);
        this.IncomeWhenZeroed = new Property(() => this.tt.incomeWhenZeroed, value => this.tt.incomeWhenZeroed = value);
        this.ProgressThing = new Property(() => this.tt.progressThing, value => this.tt.progressThing = value);
    }

    public Initialize() {
        this.setUpButtonText();
    }

    getButtonText(thingName) {
        var entity = entityByName[thingName];

        var cost = new PurchaseCost(thingName);
        var costString = cost.GetThingNames().map(name =>
            cost.GetCost(name) + ' ' + entityByName[name].Display.Get()
            ).join(', ');

        if (!costString) {
            costString = "FREE!";
        }

        return 'Buy a ' + entity.Display.Get() + ' for ' + costString;
    }

    private buttonText: string;

    private setUpButtonText() {
        this.ButtonText = new Property(() => this.buttonText, value => { this.buttonText = value; });

        var update = () => this.ButtonText.Set(this.getButtonText(this.GetName()));
        update();

        // change of name to this entity
        this.Display.Event().Register((current, previous) => update());

        // change of name to anything in the cost of the entity

        // change of cost composition
        // change of the cost amounts
    }
}

var definitions = <ThingType[]>[
    {
        name: 'tt-Point',
        display: 'Beer',
        capacity: 100,
    },
    {
        name: 'tt-Scorer1',
        display: 'Delivery Guy',
        title: 'Delivers to you 1 Beer per tick',
        capacity: -1,
        cost: {
            'tt-Point': 10,
        },
        income: {
            'tt-Point': 1,
        },
    },
    {
        name: 'tt-Scorer2',
        display: 'Microbrewery',
        title: 'Makes a lot more Beer and stores Kegs',
        capacity: -1,
        cost: {
            'tt-FixedPrice1': 25,
        },
        capacityEffect: {
            'tt-PointHolder1': 25,
        },
        income: {
            'tt-Point': 5,
        },
    },
    {
        name: 'tt-Scorer3',
        display: 'Taxi Driver',
        title: 'Earns Benjamins and skim a lot off the top',
        capacity: 0,
        cost: {
            'tt-Point': 100,
        },
        income: {
            'tt-FractionOfFixedPrice1': 10,
        }
    },
    {
        name: 'tt-PointHolder1',
        display: 'Keg',
        title: 'Increases Beer capacity',
        capacity: 50,
        cost: {
            'tt-Point': 25,
        },
        capacityEffect: {
            'tt-Point': 10,
            'tt-FractionOfPointHolder1': 10,
        },
        progressThing: 'tt-FractionOfPointHolder1',
    },
    {
        name: 'tt-PointHolder2',
        display: 'Garage',
        title: 'Holds taxis',
        capacity: -1,
        cost: {
            'tt-FixedPrice1': 10,
        },
        costRatio: 1.3,
        capacityEffect: {
            'tt-Scorer3': 2,
        }
    },
    {
        name: 'tt-PointHolder3',
        display: 'Swimming Pool',
        title: 'A storage facility for Beer',
        capacity: -1,
        cost: {
            'tt-Point': 400,
        },
        capacityEffect: {
            'tt-Point': 200,
        }
    },
    {
        name: 'tt-PointHolder4',
        display: 'Piggy Bank',
        title: 'Increases Benjamin capacity',
        capacity: -1,
        cost: {
            'tt-Point': 4000,
        },
        capacityEffect: {
            'tt-FixedPrice1': 100,
        }
    },
    {
        name: 'tt-FixedPrice1',
        display: 'Benjamin',
        title: 'One hundred dollar bills',
        cost: {
            'tt-Point': 250,
        },
        capacityEffect: {
            'tt-FractionOfFixedPrice1': 1,
        },
        capacity: 100,
        costRatio: 1,
        progressThing: 'tt-FractionOfFixedPrice1',
    },
    {
        name: 'tt-PointHolderMaker1',
        display: 'Keg Delivery Guy',
        title: 'Delivers free Kegs to you...eventually',
        capacity: -1,
        cost: {
            'tt-FixedPrice1': 5,
        },
        income: {
            'tt-FractionOfPointHolder1': 1,
        }
    },
    {
        name: 'tt-FractionOfPointHolder1',
        capacity: 100,
        zeroAtCapacity: true,
        incomeWhenZeroed: {
            'tt-PointHolder1': 1,
        }
    },
    {
        name: 'tt-FractionOfFixedPrice1',
        capacity: 50,
        zeroAtCapacity: true,
        incomeWhenZeroed: {
            'tt-FixedPrice1': 1,
        }
    },
];


module Inventory {

    export function Initialize() {
        Object.keys(entityByName).forEach(thingName => {
            var entity = entityByName[thingName];
            var cost = entity.Cost.Get();
            var count = GetCount(thingName);

            if (!cost || count > 0) {
                SetReveal(thingName, true);
            }

            var purchaseCost = new PurchaseCost(thingName);
            var callback = c => {
                var capacity = GetCapacity(thingName);
                var canAfford = purchaseCost.CanAfford();
                var count = GetCount(thingName);

                if (capacity !== 0 && (count > 0 || canAfford)) {
                    SetReveal(thingName, true);
                }

                SetEnabled(thingName, IsEnabled(thingName));
            }

            purchaseCost.GetThingNames().forEach(needed => {
                GetCountEvent(needed).Register(callback);
            });

            GetCountEvent(thingName).Register(callback);
            GetCapacityEvent(thingName).Register(callback);

            callback(GetCount(thingName));

            var capacity = GetCapacity(thingName);
            if (capacity !== -1 && GetCount(thingName) >= capacity) {
                SetCapacityShown(thingName, true);
            }

            var capacityEffect = entity.CapacityEffect.Get();
            if (!capacityEffect)
                return;

            Object.keys(capacityEffect).forEach(affectedName => {
                var effect = capacityEffect[affectedName];
                if (effect) {
                    var callback = (count) => {
                        var capacity = Inventory.GetCapacity(affectedName);
                        capacityEvent.FireEvent(affectedName, callback => callback(capacity));
                    };
                    GetCountEvent(thingName).Register(callback);
                }
            });
        });
    }

    export function GetCount(thingName: string) {
        return saveData.Stuff[thingName].Count;
    }

    export function ChangeCount(thingName: string, delta: number) {
        var initialCount = saveData.Stuff[thingName].Count;
        var capacity = Inventory.GetCapacity(thingName);
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

        if (capacity !== -1 && count >= capacity) {
            SetCapacityShown(thingName, true);
        }
    }

    export function SetReveal(thingName: string, revealed: boolean) {
        if (!entityByName[thingName].Display.Get()) {
            return;
        }

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
        var baseCapacity = 0;
        var capacityDelta = 0;

        var entity = entityByName[thingName]

        var capacity = entity.Capacity.Get();
        if (capacity === -1) {
            return -1;
        }

        baseCapacity = capacity;

        // TODO: make not wasteful
        Object.keys(entityByName).forEach(affecterName => {
            var entity = entityByName[affecterName];
            var capacityEffect = entity.CapacityEffect.Get();
            if (!capacityEffect) {
                return;
            }

            var effect = capacityEffect[thingName];
            var count = Inventory.GetCount(entity.GetName());
            if (effect && count) {
                capacityDelta += effect * count;
            }
        });

        return baseCapacity + capacityDelta;
    }

    export function SetCapacityShown(thingName: string, shown: boolean) {
        var current = saveData.Stuff[thingName].IsCapShown;
        if (current === shown) {
            return;
        }

        saveData.Stuff[thingName].IsCapShown = shown;
        showCapacityEvent.FireEvent(thingName, callback => callback(shown));
    }

    export function IsCapacityShown(thingName: string) {
        return saveData.Stuff[thingName].IsCapShown;
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
            SetReveal(thingName, !entityByName[thingName].Cost.Get()); 
            SetCapacityShown(thingName, false);
        });
    }

    // event callback interfaces
    interface CountCallback { (count: number, previous: number): void; };
    interface CapacityCallback { (capacity: number): void; };
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

    // for updating capacity of things
    var capacityEvent = new ThingEvent<CapacityCallback>();
    export var GetCapacityEvent = (thingName: string) => capacityEvent.GetEvent(thingName);

    // for enabling and disabling buy buttons
    var enableEvent = new ThingEvent<ToggleCallback>();
    export var GetEnableEvent = (thingName: string) => enableEvent.GetEvent(thingName);

    // for showing that things exist at all
    var revealEvent = new ThingEvent<ToggleCallback>();
    export var GetRevealEvent = (thingName: string) => revealEvent.GetEvent(thingName);

    // for showing the capacity of a thing
    var showCapacityEvent = new ThingEvent<ToggleCallback>();
    export var GetShowCapacityEvent = (thingName: string) => showCapacityEvent.GetEvent(thingName);

    var enabledTable: { [index: string]: boolean } = {};
}

interface IGameEvent<T> {
    Register: (callback: T) => () => void;
    Unregister: (callback: T) => void;
}

class GameEvent<T> implements IGameEvent<T> {
    callbacks: T[] = [];

    public Register(callback: T): () => void {
        this.callbacks.push(callback);
        return () => this.Unregister(callback);
    }

    public Unregister(callback: T) {
        var index = this.callbacks.indexOf(callback);

        if (index === -1) {
            return false;
        }

        this.callbacks.splice(index, 1);
        return true;
    }

    public Fire(caller: (callback: T) => void) {
        this.callbacks.forEach(callback => caller(callback));
    }
}

class Property<T> {
    private current: T;
    private event: GameEvent<Property.Change<T>>;

    constructor(private getter: Property.Get<T>, private setter: Property.Set<T>) {
        this.current = getter();
        this.event = new GameEvent<Property.Change<T>>();
    }

    public Get(): T {
        return this.current;
    }

    public Set(value: T) {
        if (this.current === value) {
            return;
        }

        var previous = this.current;
        this.setter(value);
        this.current = value;
        this.event.Fire(callback => callback(value, previous));
    }

    public Event() {
        return this.event;
    }
}

module Property {
    export interface Change<T> {
        (current: T, previous: T): void;
    }

    export interface Get<T> {
        (): T;
    }

    export interface Set<T> {
        (value: T): void;
    }
}

class StringProperty extends Property<string> { }

var cellClass = 'col-sm-2';

function createInventory() {
    Object.keys(entityByName).forEach(thingName => {
        if (Inventory.IsRevealed(thingName)) {
            createThingRow(thingName);
        }

        var create = (reveal: boolean) => {
            if (reveal) {
                createThingRow(thingName);
            }
        }

        Inventory.GetRevealEvent(thingName).Register(create);
    });
}

function createThingRow(thingName: string) {
    var outerDiv = document.createElement('div');
    outerDiv.className = 'row';
    outerDiv.style.display = 'flex';
    outerDiv.style.alignItems = 'center';

    var toUnregister: { (): void }[] = [];
    var unregisterMe = callback => toUnregister.push(callback);

    outerDiv.appendChild(createName(thingName, unregisterMe));
    outerDiv.appendChild(createCountDiv(thingName, unregisterMe));
    outerDiv.appendChild(createButton(thingName, unregisterMe));

    var unregHideThingRow: () => void;

    var hideThingRow = (revealed: boolean) => {
        if (revealed) {
            return;
        }

        outerDiv.parentElement.removeChild(outerDiv);
        unregHideThingRow();

        toUnregister.forEach(unreg => unreg());
    };
    unregHideThingRow = Inventory.GetRevealEvent(thingName).Register(hideThingRow);

    document.getElementById('inventory').appendChild(outerDiv);
}

function createCountDiv(thingName: string, unregisterMe: { (unreg: { (): void }): void }) {
    var countDiv = document.createElement('div');
    countDiv.className = cellClass;

    var currentDiv = document.createElement('span');
    currentDiv.id = 'current-' + thingName;

    var count = Inventory.GetCount(thingName);

    var updateCount = (count:number) => currentDiv.innerText = count.toString();
    updateCount(count);

    var unregUpdateCount = Inventory.GetCountEvent(thingName).Register(updateCount);
    unregisterMe(unregUpdateCount);

    countDiv.appendChild(currentDiv);

    var capShown = Inventory.IsCapacityShown(thingName);
    if (capShown) {
        createCapacity(thingName, countDiv, unregisterMe);
    }

    // set up callback to show capacity display
    var callback = (show: boolean) => {
        if (!show) {
            return;
        }

        createCapacity(thingName, countDiv, unregisterMe);
    }
    unregisterMe(Inventory.GetShowCapacityEvent(thingName).Register(callback));

    return countDiv;
}

function createCapacity(thingName: string, countDiv: HTMLDivElement, unregisterMe: { (unreg: { (): void }): void }) {
    var slashDiv = document.createElement('span');
    slashDiv.innerText = ' / ';

    var capacityDiv = document.createElement('span');
    capacityDiv.id = 'capacity-' + thingName;

    var updateCapacity = capacity => capacityDiv.innerText = capacity.toString();
    updateCapacity(Inventory.GetCapacity(thingName));

    var unregUpdateCapacity = Inventory.GetCapacityEvent(thingName).Register(updateCapacity);
    unregisterMe(unregUpdateCapacity);

    var elements = [slashDiv, capacityDiv];
    elements.forEach(div => countDiv.appendChild(div));

    var unregRemoveCapacity: () => void;

    var removeCapacity = (shown: boolean) => {
        if (shown) {
            return;
        }

        elements.forEach(div => countDiv.removeChild(div));
        unregUpdateCapacity(); // remove event added above
        unregRemoveCapacity(); // remove this event handler
    }

    unregRemoveCapacity = Inventory.GetShowCapacityEvent(thingName).Register(removeCapacity);
    unregisterMe(unregRemoveCapacity);
}

function removeCapacity(thingName: string, countDiv: HTMLDivElement) {

}

function createName(thingName: string, unregisterMe: { (unreg: { (): void }): void }) {
    var entity = entityByName[thingName];
    var display = entity.Display.Get();

    var nameDiv = document.createElement('div');

    nameDiv.innerText = display;
    nameDiv.className = cellClass;

    // logic for making the label move from left to right
    // like a progress bar
    var progressThing = entity.ProgressThing.Get();
    if (progressThing) {
        var progressDiv = document.createElement('div');
        progressDiv.className = 'progress progress-bar';
        progressDiv.style.width = '0%';

        var callback = () => {
            var current = Inventory.GetCount(progressThing);
            var max = Inventory.GetCapacity(progressThing);

            var percent = (Math.floor(current / max * 700) / 10);

            // check if we're full
            var count = Inventory.GetCount(thingName);
            var capacity = Inventory.GetCapacity(thingName);

            if (count === capacity) {
                percent = 0;
            }
                
            progressDiv.style.width = percent + '%';
        };

        unregisterMe(Inventory.GetCountEvent(progressThing).Register(callback));
        unregisterMe(Inventory.GetCapacityEvent(progressThing).Register(callback));

        nameDiv.appendChild(progressDiv);
    }

    return nameDiv;
}

function createButton(thingName: string, unregisterMe: { (unreg: { (): void }): void }) {
    var buttonDiv = document.createElement('div');
    buttonDiv.className = cellClass;

    var entity = entityByName[thingName];

    var buyButton = document.createElement('button');
    var id = buyButton.id = 'buy-' + thingName;

    var title = entity.Title.Get();
    if (title) {
        buyButton.title = title;
    }

    var updateButton = () => buyButton.innerText = entity.ButtonText.Get();
    updateButton();

    unregisterMe(Inventory.GetCountEvent(thingName).Register(updateButton));
    unregisterMe(entity.ButtonText.Event().Register(updateButton));

    var enableDisableButton = (enabled) => buyButton.disabled = !enabled;
    unregisterMe(Inventory.GetEnableEvent(thingName).Register(enableDisableButton));

    enableDisableButton(Inventory.IsEnabled(thingName));

    buyButton.classList.add('btn');
    buyButton.classList.add('btn-primary');
    buyButton.addEventListener('click', function () { tryBuy(thingName); });

    buttonDiv.appendChild(buyButton);

    return buttonDiv;
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

    var capacity = Inventory.GetCapacity(thingToBuy);
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
    // how about we remember how many cookies you have in browser local storage?
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

    initializeSaveData();
    Object.keys(entityByName).forEach(thingName => entityByName[thingName].Initialize());

    Inventory.Initialize();
    createInventory();

    setInterval(onInterval, 200);
}

// i think i need something that will fire when the page finished loading
window.onload = onLoad;

var entityByName: { [index: string]: Entity } = {};
definitions.forEach(thingType => entityByName[thingType.name] = new Entity(thingType));

// for debugging
var entities: { [index: string]: Entity } = {};
Object.keys(entityByName).forEach(thingName => entities[entityByName[thingName].Display.Get()] = entityByName[thingName]);