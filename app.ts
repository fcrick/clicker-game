

var resetButton = document.getElementById("resetButton");
var myText = document.getElementById("helloText");

resetButton.addEventListener('click', resetEverything, false);

// TODO:
// - add automation thing you can buy A-Tomato-Meter
// - make my event code my generisized
// - make game editable from inside the game
// - change how costs can increase
// - display income
// - confirm on reset or have an undo
// - add hidden currencies
// - add autopurchasing currencies
// - floating text that highlights progress
// - give shoutouts to people who have helped - special thanks to Oppositions for that suggestion
// - make achievements for karbz0ne

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
    display: string;
    cost?: { [index: string]: number };
    capacity?: number;
    income?: { [index: string]: number };
    capacityEffect?: { [index: string]: number };
    costRatio?: number;
}

var definitions = <ThingType[]>[
    {
        name: 'tt-Point',
        display: 'Beer',
        capacity: 100,
    },
    {
        name: 'tt-Scorer',
        display: 'Delivery Guy',
        cost: {
            'tt-Point': 10,
        },
        income: {
            'tt-Point': 1,
        },
    },
    {
        name: 'tt-PointHolder1',
        display: 'Keg',
        cost: {
            'tt-Point': 25,
        },
        capacityEffect: {
            'tt-Point': 10,
        }
    },
    {
        name: 'tt-PointHolder2',
        display: 'Garage',
        cost: {
            'tt-FixedPrice1': 10,
        },
        capacityEffect: {
            'tt-Point': 25,
        }
    },
    {
        name: 'tt-PointHolder3',
        display: 'Swimming Pool',
        cost: {
            'tt-Point': 400,
        },
        capacityEffect: {
            'tt-Point': 200,
        }
    },
    {
        name: 'tt-FixedPrice1',
        display: 'Benjamin',
        cost: {
            'tt-Point': 250,
        },
        capacity: 100,
        costRatio: 1,
    }
];

var defByName: { [index: string]: ThingType } = {};
definitions.forEach(thingType => defByName[thingType.name] = thingType);

module Inventory {

    export function Initialize() {
        definitions.forEach(thingType => {
            var thingName = thingType.name;
            var cost = thingType.cost;

            if (!cost) {
                SetReveal(thingName, true);
            }
            else {
                var purchaseCost = new PurchaseCost(thingType.name);
                var callback = count => {
                    if (purchaseCost.CanAfford()) {
                        SetReveal(thingName, true);
                        SetEnabled(thingName, true);
                    }
                    else {
                        SetEnabled(thingName, false);
                    }
                    // add button disable
                }

                purchaseCost.GetThingNames().forEach(needed => {
                    GetCountEvent(needed).Register(callback);
                });

                callback(GetCount(thingName));
            }

            var capacity = GetCapacity(thingName);
            if (capacity && GetCount(thingName) >= capacity) {
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
                        fireCapacityEvent(affectedName, capacity);
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

        if (capacity !== 0 && count > capacity) {
            count = saveData.Stuff[thingName].Count = capacity;
        }
        else if (count < 0) {
            count = saveData.Stuff[thingName].Count = 0;
        }

        // send notification
        if (count === initialCount) {
            return count;
        }

        //fireCallback(InvEvent.Count, thingName, count);
        fireCountEvent(thingName, count, initialCount);

        // clean me
        if (capacity && count >= capacity) {
            SetCapacityShown(thingName, true);
        }

        return count;
    }

    export function SetCount(thingName: string, count: number) {
        var initialCount = saveData.Stuff[thingName].Count;
        if (initialCount === count) {
            return count;
        }

        saveData.Stuff[thingName].Count = count;

        //fireCallback(InvEvent.Count, thingName, count);
        fireCountEvent(thingName, count, initialCount);

        // clean me
        var capacity = GetCapacity(thingName);
        if (capacity && count >= capacity) {
            SetCapacityShown(thingName, true);
        }

        return count;
    }

    export function SetReveal(thingName: string, revealed: boolean) {
        var current = saveData.Stuff[thingName].IsRevealed;
        if (current === revealed) {
            return;
        }

        saveData.Stuff[thingName].IsRevealed = revealed;

        fireRevealEvent(thingName, revealed);
    }

    export function IsRevealed(thingName: string) {
        return saveData.Stuff[thingName].IsRevealed;
    }

    export function GetCapacity(thingName: string) {
        var baseCapacity = 0;
        var capacityDelta = 0;

        var thingType = defByName[thingName]

        var capacity = thingType.capacity
        if (capacity) {
            baseCapacity = thingType.capacity;
        }

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
        fireShowCapacityEvent(thingName, shown);
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
        fireEnableEvent(thingName, enabled);
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

    function fireCallback(eventName: string, thingName: string, count: number) {
        var thingNameToCallbacks = eventNameToThingNameToCallbacks[eventName];
        if (!thingNameToCallbacks) {
            return;
        }

        var callbacks = thingNameToCallbacks[thingName];
        if (callbacks) {
            callbacks.forEach(callback => callback(count));
        }
    }

    export function Register(eventName: string, thingName: string, callback: (count: number) => void) {
        var thingNameToCallbacks = eventNameToThingNameToCallbacks[eventName]
        if (!thingNameToCallbacks) {
            thingNameToCallbacks = eventNameToThingNameToCallbacks[eventName] = {};
        }

        var callbacks = thingNameToCallbacks[thingName];
        if (!callbacks) {
            callbacks = thingNameToCallbacks[thingName] = [];
        }

        callbacks.push(callback);
    }

    export function Unregister(eventName: string, thingName: string, callback: (count: number) => void) {
        var thingNameToCallbacks = eventNameToThingNameToCallbacks[eventName];
        if (!thingNameToCallbacks) {
            return false;
        }

        var callbacks = thingNameToCallbacks[thingName];
        if (!callbacks) {
            return false;
        }

        var index = callbacks.indexOf(callback);

        if (index === -1) {
            return false;
        }

        callbacks.splice(index, 1);
        return true;
    }

    // event callback interfaces
    interface CountCallback { (count: number, previous: number): void; };
    interface CapacityCallback { (capacity: number): void; };
    interface ToggleCallback { (toggled: boolean): void; };

    // Count events
    var countEvents: { [thingName: string]: Events.GameEvent<CountCallback> } = {};
    export function GetCountEvent(thingName: string): Events.IGameEvent<CountCallback> {
        return getThingEvent(thingName, countEvents);
    }
    function fireCountEvent(thingName: string, count: number, previous: number) {
        fireThingEvent(thingName, countEvents, callback => callback(count, previous));
    }

    // Capacity events
    var capacityEvents: { [thingName: string]: Events.GameEvent<CapacityCallback> } = {};
    export function GetCapacityEvent(thingName: string): Events.IGameEvent<CapacityCallback> {
        return getThingEvent(thingName, capacityEvents);
    }
    function fireCapacityEvent(thingName: string, capacity: number) {
        fireThingEvent(thingName, capacityEvents, callback => callback(capacity));
    }

    // Enable events (enabling and disabling buy buttons)
    var enableEvents: { [thingName: string]: Events.GameEvent<ToggleCallback> } = {};
    export function GetEnableEvent(thingName: string): Events.IGameEvent<ToggleCallback> {
        return getThingEvent(thingName, enableEvents);
    }
    function fireEnableEvent(thingName: string, enabled: boolean) {
        fireThingEvent(thingName, enableEvents, callback => callback(enabled));
    }

    // Reveal and hide events (for showing that a thing exists at all)
    var revealEvents: { [thingName: string]: Events.GameEvent<ToggleCallback> } = {};
    export function GetRevealEvent(thingName: string): Events.IGameEvent<ToggleCallback> {
        return getThingEvent(thingName, revealEvents);
    }
    function fireRevealEvent(thingName: string, enabled: boolean) {
        fireThingEvent(thingName, revealEvents, callback => callback(enabled));
    }

    // Show and hide capacity events
    var showCapacityEvents: { [thingName: string]: Events.GameEvent<ToggleCallback> } = {};
    export function GetShowCapacityEvent(thingName: string): Events.IGameEvent<ToggleCallback> {
        return getThingEvent(thingName, showCapacityEvents);
    }
    function fireShowCapacityEvent(thingName: string, enabled: boolean) {
        fireThingEvent(thingName, showCapacityEvents, callback => callback(enabled));
    }

    function fireThingEvent<T>(
        thingName: string,
        eventTable: { [index: string]: Events.GameEvent<T> },
        caller: (callback: T) => void
    ) {
        var event = eventTable[thingName];
        if (!event) {
            return;
        }

        event.Fire(caller);
    }

    function getThingEvent<T>(
        thingName: string,
        eventTable: { [index: string]: Events.GameEvent<T> }
    ): Events.IGameEvent<T> {

        var event = eventTable[thingName];
        if (!event) {
            event = eventTable[thingName] = new Events.GameEvent<T>();
        }

        return event;
    }

    var eventNameToThingNameToCallbacks: { [eventName: string]: { [index: string]: { (count: number): void }[] } } = {};
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
    outerDiv.appendChild(createCountDiv(thingName));
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

function createCountDiv(thingName: string) {
    var countDiv = document.createElement('div');

    var currentDiv = document.createElement('div');
    currentDiv.id = 'current-' + thingName;

    var count = Inventory.GetCount(thingName);

    var updateCount = (count:number) => currentDiv.innerText = count.toString();
    updateCount(count);

    // TODO: make sure this gets unregistered
    Inventory.GetCountEvent(thingName).Register(updateCount);

    currentDiv.className = cellClass;
    countDiv.appendChild(currentDiv);

    var capShown = Inventory.IsCapacityShown(thingName);
    if (capShown) {
        createCapacity(thingName, countDiv);
    }
    else {
        var callback = (show: boolean) => {
            if (!show) {
                return;
            }

            createCapacity(thingName, countDiv);
            Inventory.GetShowCapacityEvent(thingName).Unregister(callback);
        }
        Inventory.GetShowCapacityEvent(thingName).Register(callback);
    }

    countDiv.className = cellClass;
    return countDiv;
}

function createCapacity(thingName: string, countDiv: HTMLDivElement) {
    var slashDiv = document.createElement('div');
    slashDiv.innerText = '/';
    slashDiv.className = cellClass;

    var capacityDiv = document.createElement('div');
    capacityDiv.id = 'capacity-' + thingName;

    var updateCapacity = capacity => capacityDiv.innerText = capacity.toString();
    updateCapacity(Inventory.GetCapacity(thingName));
    // TODO: unregister
    Inventory.GetCapacityEvent(thingName).Register(updateCapacity);
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
    if (capacity && capacity <= Inventory.GetCount(thingToBuy)) {
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