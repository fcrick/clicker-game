

var resetButton = document.getElementById("resetButton");
var myText = document.getElementById("helloText");

resetButton.addEventListener('click', resetEverything, false);

// TODO:
// - get rid of updateButtons and make updates event driven
// - add github link to stream
// - make game available
// - change how costs can increase
// - buy buttons should only be enabled when you can afford the purchase
// - display income
// - make inventory less bad
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
        name: 'Cookie',
        display: 'Widget',
        capacity: 100,
    },
    {
        name: 'Tapper',
        display: 'Widget Spawner',
        cost: {
            'Cookie': 10,
        },
        income: {
            'Cookie': 1,
        },
    },
    {
        name: 'CookieJar',
        display: 'Widget Box',
        cost: {
            'Cookie': 25,
        },
        capacityEffect: {
            'Cookie': 10,
        }
    },
    {
        name: 'Garage',
        display: 'Garage',
        cost: {
            'CookieJar': 10,
        },
        capacityEffect: {
            'Cookie': 20,
        }
    }
];

var defByName: { [index: string]: ThingType } = {};
definitions.forEach(thingType => defByName[thingType.name] = thingType);

module Inventory {

    export function Initialize() {
        definitions.forEach(thingType => {
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
                    Register('count', thingType.name, callback);
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
        saveData.Stuff[thingName].IsRevealed = revealed;
    }

    export function IsRevealed(thingName: string) {
        return saveData.Stuff[thingName].IsRevealed;
    }

    export function Reset() {
        definitions.forEach(thingType => {
            var thingName = thingType.name;

            SetCount(thingName, 0);
            SetReveal(thingName, false);
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
        if (callbacks) {
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

function updateDiplay() {
    updateButtons();
}

function updateButtons() {
    definitions.forEach(function (typeDef) {
        var thingName = typeDef.name;
        var id = 'buy-' + thingName;
        var display = typeDef.display;
        var button = document.getElementById(id);
        if (!button) {
            return;
        }

        var cost = new PurchaseCost(thingName);

        if (cost.CanAfford()) {
            Inventory.SetReveal(thingName, true);
        }

        if (!Inventory.IsRevealed(thingName)) {
            button.style.visibility = 'hidden';
            return;
        }

        if (button.style.visibility && button.style.visibility === 'hidden') {
            button.style.visibility = 'visible';
        }

        if (!cost.GetThingNames()) {
            Inventory.SetReveal(thingName, true);
        }
    });
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

function createInventory() {
    var inventory = document.getElementById('inventory');

    var cellClass = 'col-sm-2';

    definitions.forEach(thingDef => {
        var thingName = thingDef.name;

        var count = Inventory.GetCount(thingName);
        var capacity = getCapacity(thingName);
        var display = thingDef.display;

        var outerDiv = document.createElement('div');
        outerDiv.classList.add('row');

        var nameDiv = document.createElement('div');
        nameDiv.innerText = display;
        nameDiv.className = cellClass;
        outerDiv.appendChild(nameDiv);

        var countDiv = document.createElement('div');

        var currentDiv = document.createElement('div');
        currentDiv.id = 'current-' + thingName;

        var updateCount = count => currentDiv.innerText = count.toString();
        updateCount(count);
        Inventory.Register('count', thingName, updateCount);
        currentDiv.className = cellClass;
        countDiv.appendChild(currentDiv);

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
        outerDiv.appendChild(countDiv);

        var buttonDiv = document.createElement('div');
        buttonDiv.className = cellClass;

        var buyButton = document.createElement('button');
        buyButton.id = 'buy-' + thingName;

        var updateButton = count => buyButton.innerText = getButtonText(thingName);
        updateButton(count);
        Inventory.Register('count', thingName, updateButton);

        buyButton.classList.add('btn');
        buyButton.classList.add('btn-primary');
        buyButton.addEventListener('click', function () { tryBuy(thingName); });

        buttonDiv.appendChild(buyButton);

        outerDiv.appendChild(buttonDiv);
        
        inventory.appendChild(outerDiv);
    });
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

        // capacityEffect: {
        // 	'Cookie': 10,
        // }
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
    updateDiplay();
}

function resetEverything() {
    Inventory.Reset();

    initializeStuff();
    save();

    updateDiplay();
}

function save() {
    // how about we remember how many cookies you have in browser local storage?
    localStorage['SaveData'] = JSON.stringify(saveData);
}

function initializeStuff() {
    var stuff = saveData.Stuff;
    if (!stuff) {
        stuff = saveData.Stuff = {};
    }

    definitions.forEach(function (thingDef) {
        if (!stuff[thingDef.name]) {
            stuff[thingDef.name] = { Count: 0 };
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

    updateDiplay();
    save();
}

function onLoad() {
    try {
        saveData = JSON.parse(localStorage['SaveData']);
    }
    catch (e) { }

    Inventory.Initialize();

    initializeStuff();
    createInventory();

    updateDiplay();
    setInterval(onInterval, 200);
}

// i think i need something that will fire when the page finished loading
window.onload = onLoad;