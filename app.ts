

var resetButton = document.getElementById("resetButton");
var myText = document.getElementById("helloText");

resetButton.addEventListener('click', resetEverything, false);

// TODO:
// - add automation thing you can buy A-Tomato-Meter
// - make game editable from inside the game
// - display income
// - confirm on reset or have an undo
// - floating text that highlights progress
// - give shoutouts to people who have helped - special thanks to Oppositions for that suggestion
// - make achievements for karbz0ne
// - work on simulating the game so I know how long things take
// - auto-generating game definitions
// - fix capacity not turning off as it should when the game is reset
// - fix the numeric display so it looks fine with larger numbers
// - fractional income support
// - progress bars for Keg Delivery Guy progress
// - make 0 no longer mean unlimited capacity
// - enforce display ordering so reloading the page doesn't change the order

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
    cost?: { [index: string]: number };
    capacity: number;
    income?: { [index: string]: number };
    capacityEffect?: { [index: string]: number };
    costRatio?: number;
    zeroAtCapacity?: boolean;
    incomeWhenZeroed?: { [index: string]: number };
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
        capacity: -1,
        cost: {
            'tt-FixedPrice1': 25,
        },
        income: {
            'tt-Point': 10,
        },
    },
    {
        name: 'tt-Scorer3',
        display: 'Taxi Driver',
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
        capacity: -1,
        cost: {
            'tt-Point': 25,
        },
        capacityEffect: {
            'tt-Point': 10,
            'tt-FractionOfPointHolder1': 10,
        }
    },
    {
        name: 'tt-PointHolder2',
        display: 'Garage',
        capacity: -1,
        cost: {
            'tt-FixedPrice1': 10,
        },
        costRatio: 1.4,
        capacityEffect: {
            'tt-Scorer3': 2,
        }
    },
    {
        name: 'tt-PointHolder3',
        display: 'Swimming Pool',
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
        cost: {
            'tt-Point': 250,
        },
        capacityEffect: {
            'tt-FractionOfFixedPrice1': 4,
        },
        capacity: 100,
        costRatio: 1,
    },
    {
        name: 'tt-PointHolderMaker1',
        display: 'Keg Delivery Guy',
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

var defByName: { [index: string]: ThingType } = {};
definitions.forEach(thingType => defByName[thingType.name] = thingType);

module Inventory {

    export function Initialize() {
        definitions.forEach(thingType => {
            var thingName = thingType.name;
            var cost = thingType.cost;
            var count = GetCount(thingName);

            if (!cost || count > 0) {
                SetReveal(thingName, true);
            }

            var purchaseCost = new PurchaseCost(thingType.name);
            var callback = c => {
                var capacity = GetCapacity(thingName);
                var canAfford = purchaseCost.CanAfford();
                var count = GetCount(thingName);

                if (capacity !== 0 && (count > 0 || canAfford)) {
                    SetReveal(thingName, true);
                }

                if (canAfford && (capacity === -1 || count < capacity)) {
                    SetEnabled(thingName, true);
                }
                else {
                    SetEnabled(thingName, false);
                }
            }

            purchaseCost.GetThingNames().forEach(needed => {
                GetCountEvent(needed).Register(callback);
            });

            GetCountEvent(thingName).Register(callback);

            callback(GetCount(thingName));

            var capacity = GetCapacity(thingName);
            if (capacity !== -1 && GetCount(thingName) >= capacity) {
                SetCapacityShown(thingName, true);
            }

            var capacityEffect = thingType.capacityEffect;
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

        if (capacity !== -1 && count > capacity) {
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
        var thingType = defByName[thingName];

        if (thingType.zeroAtCapacity && count >= capacity) {
            SetCount(thingName, 0);
            var income = thingType.incomeWhenZeroed;
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
        if (!defByName[thingName].display) {
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
        if (!defByName[thingName].display) {
            return false;
        }

        return saveData.Stuff[thingName].IsRevealed;
    }

    export function GetCapacity(thingName: string) {
        var baseCapacity = 0;
        var capacityDelta = 0;

        var thingType = defByName[thingName]

        var capacity = thingType.capacity
        if (capacity === -1) {
            return -1;
        }

        baseCapacity = thingType.capacity;

        // TODO: make not wasteful
        definitions.forEach(thingType => {
            var capacityEffect = thingType.capacityEffect;
            if (!capacityEffect) {
                return;
            }

            var effect = thingType.capacityEffect[thingName];
            var count = Inventory.GetCount(thingType.name);
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
        var cost = new PurchaseCost(thingName);
        return cost.CanAfford();
    }

    // full game reset
    export function Reset() {
        definitions.forEach(thingType => {
            var thingName = thingType.name;

            SetCount(thingName, 0);
            SetReveal(thingName, !thingType.cost);
            SetCapacityShown(thingName, false);
        });
    }

    // event callback interfaces
    interface CountCallback { (count: number, previous: number): void; };
    interface CapacityCallback { (capacity: number): void; };
    interface ToggleCallback { (toggled: boolean): void; };

    class ThingEvent<T> {
        private eventTable: { [thingName: string]: Events.GameEvent<T> } = {};
        public GetEvent(thingName: string): Events.IGameEvent<T> {
            var event = this.eventTable[thingName];
            if (!event) {
                event = this.eventTable[thingName] = new Events.GameEvent<T>();
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

module Events {
    export interface IGameEvent<T> {
        Register: (callback: T) => void;
        Unregister: (callback: T) => void;
    }

    export class GameEvent<T> implements IGameEvent<T> {
        callbacks: T[] = [];

        public Register(callback: T) {
            this.callbacks.push(callback);
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
}

function getButtonText(thingName) {
    var thingType = defByName[thingName];

    var cost = new PurchaseCost(thingName);
    var costString = cost.GetThingNames().map(name => cost.GetCost(name) + ' ' + defByName[name].display).join(', ');

    if (!costString) {
        costString = "FREE!";
    }

    return 'Buy a ' + thingType.display + ' for ' + costString;
}

var cellClass = 'col-sm-2';

function createInventory() {
    definitions.forEach(thingType => {
        var thingName = thingType.name;

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

    var toUnregister: { (): void }[] = [];
    var unregisterMe = callback => toUnregister.push(callback);

    outerDiv.appendChild(createName(defByName[thingName].display));
    outerDiv.appendChild(createCountDiv(thingName, unregisterMe));
    outerDiv.appendChild(createButton(thingName, unregisterMe));

    var hideThingRow = (revealed: boolean) => {
        if (revealed) {
            return;
        }

        outerDiv.parentElement.removeChild(outerDiv);
        Inventory.GetRevealEvent(thingName).Unregister(hideThingRow);

        toUnregister.forEach(unreg => unreg());
    };
    Inventory.GetRevealEvent(thingName).Register(hideThingRow);

    document.getElementById('inventory').appendChild(outerDiv);
}

function createCountDiv(thingName: string, unregisterMe: { (unreg: { (): void }): void }) {
    var countDiv = document.createElement('div');

    var currentDiv = document.createElement('div');
    currentDiv.id = 'current-' + thingName;

    var count = Inventory.GetCount(thingName);

    var updateCount = (count:number) => currentDiv.innerText = count.toString();
    updateCount(count);

    // TODO: make sure this gets unregistered
    Inventory.GetCountEvent(thingName).Register(updateCount);
    unregisterMe(() => Inventory.GetCountEvent(thingName).Unregister(updateCount));

    currentDiv.className = cellClass;
    countDiv.appendChild(currentDiv);

    var capShown = Inventory.IsCapacityShown(thingName);
    if (capShown) {
        createCapacity(thingName, countDiv, unregisterMe);
    }
    else {
        var callback = (show: boolean) => {
            if (!show) {
                return;
            }

            createCapacity(thingName, countDiv, unregisterMe);
            Inventory.GetShowCapacityEvent(thingName).Unregister(callback);
        }
        Inventory.GetShowCapacityEvent(thingName).Register(callback);
        unregisterMe(() => Inventory.GetShowCapacityEvent(thingName).Unregister(callback));
    }

    countDiv.className = cellClass;
    return countDiv;
}

function createCapacity(thingName: string, countDiv: HTMLDivElement, unregisterMe: { (unreg: { (): void }): void }) {
    var slashDiv = document.createElement('div');
    slashDiv.innerText = '/';
    slashDiv.className = cellClass;

    var capacityDiv = document.createElement('div');
    capacityDiv.id = 'capacity-' + thingName;

    var updateCapacity = capacity => capacityDiv.innerText = capacity.toString();
    updateCapacity(Inventory.GetCapacity(thingName));

    Inventory.GetCapacityEvent(thingName).Register(updateCapacity);
    unregisterMe(() => Inventory.GetCapacityEvent(thingName).Unregister(updateCapacity));

    capacityDiv.className = cellClass;

    [slashDiv, capacityDiv].forEach(div => countDiv.appendChild(div));
}

function createName(display: string) {
    var nameDiv = document.createElement('div');

    nameDiv.innerText = display;
    nameDiv.className = cellClass;

    return nameDiv;
}

function createButton(thingName: string, unregisterMe: { (unreg: { (): void }): void }) {
    var buttonDiv = document.createElement('div');
    buttonDiv.className = cellClass;

    var buyButton = document.createElement('button');
    var id = buyButton.id = 'buy-' + thingName;

    var updateButton: (count?: number) => void = () => buyButton.innerText = getButtonText(thingName);
    updateButton();

    Inventory.GetCountEvent(thingName).Register(updateButton);
    unregisterMe(() => Inventory.GetCountEvent(thingName).Unregister(updateButton));

    var enableDisableButton = (enabled) => buyButton.disabled = !enabled;
    Inventory.GetEnableEvent(thingName).Register(enableDisableButton);
    unregisterMe(() => Inventory.GetEnableEvent(thingName).Unregister(enableDisableButton));

    enableDisableButton(Inventory.IsEnabled(thingName));

    buyButton.classList.add('btn');
    buyButton.classList.add('btn-primary');
    buyButton.addEventListener('click', function () { tryBuy(thingName); });

    buttonDiv.appendChild(buyButton);

    return buttonDiv;
}

class PurchaseCost {
    private costTable: { [index: string]: number; };

    constructor(public ThingToBuy: string) {
        this.costTable = definitions.filter(item => item.name === this.ThingToBuy)[0].cost;
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

        var ratio = defByName[this.ThingToBuy].costRatio;
        if (!ratio) {
            ratio = 1.15;
        }

        return Math.floor(cost * Math.pow(ratio, Inventory.GetCount(this.ThingToBuy)));
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

    definitions.forEach(function (thingType) {
        if (!stuff[thingType.name]) {
            stuff[thingType.name] = {
                Count: 0,
                IsRevealed: false,
                IsCapShown: false,
            };
        }
    });
}

function onInterval() {
    definitions.forEach(function (typeDef) {
        var income = typeDef.income;
        var count = Inventory.GetCount(typeDef.name);
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
    Inventory.Initialize();
    
    createInventory();

    setInterval(onInterval, 200);
}

// i think i need something that will fire when the page finished loading
window.onload = onLoad;