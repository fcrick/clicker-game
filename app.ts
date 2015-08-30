

var resetButton = document.getElementById("resetButton");
var myText = document.getElementById("helloText");

resetButton.addEventListener('click', resetEverything, false);

// TODO:
// - add github link to stream
// - make game available
// - change how costs can increase
// - buy buttons should only be enabled when you can afford the purchase
// - display income
// - confirm on reset or have an undo
// - hide capacity until it's been hit

interface SaveThingInfo {
    Count: number;
    IsRevealed?: boolean;
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
}

var definitions = <ThingType[]>[
    {
        name: 'Point',
        display: 'Widget',
        capacity: 100,
    },
    {
        name: 'Scorer',
        display: 'Widget Spawner',
        cost: {
            'Point': 10,
        },
        income: {
            'Point': 1,
        },
    },
    {
        name: 'PointHolder1',
        display: 'Widget Box',
        cost: {
            'Point': 25,
        },
        capacityEffect: {
            'Point': 10,
        }
    },
    {
        name: 'PointHolder2',
        display: 'Garage',
        cost: {
            'PointHolder1': 10,
        },
        capacityEffect: {
            'Point': 20,
        }
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
                        Inventory.SetReveal(thingName, true);
                    }
                    // add button disable
                }

                purchaseCost.GetThingNames().forEach(needed => {
                    Inventory.Register('count', needed, callback);
                });
            }

            var capacityEffect = thingType.capacityEffect;
            if (!capacityEffect)
                return;

            Object.keys(capacityEffect).forEach(affectedName => {
                var effect = capacityEffect[affectedName];
                if (effect) {
                    var callback = (count) => {
                        var capacity = getCapacity(affectedName);
                        fireCallback('capacity', affectedName, capacity);
                    };
                    Register('count', thingName, callback);
                }
            });
        });
    }

    export function GetCount(thingName: string) {
        return saveData.Stuff[thingName].Count;
    }

    export function ChangeCount(thingName: string, delta: number) {
        var initialCount = saveData.Stuff[thingName].Count;
        var capacity = getCapacity(thingName);
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

        fireCallback('count', thingName, count);

        return count;
    }

    export function SetCount(thingName: string, count: number) {
        if (saveData.Stuff[thingName].Count === count) {
            return count;
        }

        saveData.Stuff[thingName].Count = count;

        fireCallback('count', thingName, count);

        return count;
    }

    export function SetReveal(thingName: string, revealed: boolean) {
        var current = saveData.Stuff[thingName].IsRevealed;
        if (current === revealed) {
            return;
        }

        saveData.Stuff[thingName].IsRevealed = revealed;

        if (revealed) {
            fireCallback('reveal', thingName, 0);
        }
        else {
            fireCallback('hide', thingName, 0);
        }
    }

    export function IsRevealed(thingName: string) {
        return saveData.Stuff[thingName].IsRevealed;
    }

    // full game reset
    export function Reset() {
        definitions.forEach(thingType => {
            var thingName = thingType.name;

            SetCount(thingName, 0);

            if (thingType.cost) {
                SetReveal(thingName, false);
            }
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

    var eventNameToThingNameToCallbacks: { [eventName: string]: { [index: string]: { (count: number): void }[] } } = {};
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
        else {
            var create = () => {
                createThingRow(thingName);
                Inventory.Unregister('reveal', thingName, create);
            }

            Inventory.Register('reveal', thingName, create);
        }
    });
}

function createThingRow(thingName: string) {
    var outerDiv = document.createElement('div');
    outerDiv.className = 'row';

    var toUnregister = [];
    var unregisterMe = (callback: (count?: number) => void) => toUnregister.push(callback);

    outerDiv.appendChild(createName(defByName[thingName].display));
    outerDiv.appendChild(createCountDiv(thingName));
    outerDiv.appendChild(createButton(thingName, unregisterMe));

    var hideThingRow = () => {
        outerDiv.parentElement.removeChild(outerDiv);
        Inventory.Unregister('hide', thingName, hideThingRow);

        toUnregister.forEach(unreg => Inventory.Unregister('count', thingName, unreg));
    };
    Inventory.Register('hide', thingName, hideThingRow);

    document.getElementById('inventory').appendChild(outerDiv);
}

function createCountDiv(thingName: string) {
    var countDiv = document.createElement('div');

    var currentDiv = document.createElement('div');
    currentDiv.id = 'current-' + thingName;

    var updateCount = count => currentDiv.innerText = count.toString();
    updateCount(Inventory.GetCount(thingName));
    Inventory.Register('count', thingName, updateCount);
    currentDiv.className = cellClass;
    countDiv.appendChild(currentDiv);

    var capacity = getCapacity(thingName);
    if (capacity) {
        var slashDiv = document.createElement('div');
        slashDiv.innerText = '/';
        slashDiv.className = cellClass;
        countDiv.appendChild(slashDiv);

        var capacityDiv = document.createElement('div');
        capacityDiv.id = 'capacity-' + thingName;

        var updateCapacity = capacity => capacityDiv.innerText = capacity.toString();
        updateCapacity(capacity);
        Inventory.Register('capacity', thingName, updateCapacity);
        capacityDiv.className = cellClass;
        countDiv.appendChild(capacityDiv);
    }

    countDiv.className = cellClass;
    return countDiv;
}

function createName(display: string) {
    var nameDiv = document.createElement('div');

    nameDiv.innerText = display;
    nameDiv.className = cellClass;

    return nameDiv;
}

function createButton(thingName: string, unregisterMe: (callback: (count?: number) => void) => void) {
    var buttonDiv = document.createElement('div');
    buttonDiv.className = cellClass;

    var buyButton = document.createElement('button');
    var id = buyButton.id = 'buy-' + thingName;

    var updateButton: (count?: number) => void = () => buyButton.innerText = getButtonText(thingName);
    updateButton();

    Inventory.Register('count', thingName, updateButton);
    unregisterMe(updateButton);

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

        return Math.floor(cost * Math.pow(1.15, Inventory.GetCount(this.ThingToBuy)));
    }
}

function getCapacity(thingName) {
    var baseCapacity = 0;
    var capacityDelta = 0;

    definitions.forEach(function (thingType) {
        if (thingType.name === thingName) {
            var capacity = thingType.capacity
            if (capacity)
                baseCapacity = thingType.capacity;
        }

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

function tryBuy(thingToBuy) {
    var cost = new PurchaseCost(thingToBuy);
    var things = cost.GetThingNames();

    if (!cost.CanAfford()) {
        return;
    }

    var capacity = getCapacity(thingToBuy);
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