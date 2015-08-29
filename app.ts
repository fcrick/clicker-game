

var resetButton = document.getElementById("resetButton");
var myText = document.getElementById("helloText");

resetButton.addEventListener('click', resetEverything, false);

// TODO:
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

function updateDiplay() {
    updateButtons();
    updateInventory();
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
            saveData.Stuff[thingName].IsRevealed = true;
        }

        if (!saveData.Stuff[thingName].IsRevealed) {
            button.style.visibility = 'hidden';
            return;
        }

        if (button.style.visibility && button.style.visibility === 'hidden') {
            button.style.visibility = 'visible';
        }

        var costString = cost.GetThingNames().map(name => cost.GetCost(name) + ' ' + defByName[name].display).join(', ');

        if (!costString) {
            costString = "FREE!";
            saveData.Stuff[thingName].IsRevealed = true;
        }

        button.innerText = 'Buy a ' + display + ' for ' + costString;
    });
}

function updateInventory() {
    definitions.forEach(thingDef => {
        var thingName = thingDef.name;

        var currentDiv = document.getElementById('current-' + thingName);
        var count = saveData.Stuff[thingName].Count;
        if (currentDiv) {
            currentDiv.innerText = count.toString();
        }

        var capacityDiv = document.getElementById('capacity-' + thingName);
        var capacity = getCapacity(thingName);
        if (capacityDiv && capacity) {
            capacityDiv.innerText = capacity.toString();
        }
    });
}

function createInventory() {
    var inventory = document.getElementById('inventory');

    var cellClass = 'col-sm-2';

    definitions.forEach(function (thingDef) {
        var thingName = thingDef.name;

        var count = saveData.Stuff[thingName].Count;
        var capacity = getCapacity(thingName);
        var display = thingDef.display;

        var outerDiv = document.createElement('div');
        outerDiv.classList.add('row');
        //outerDiv.classList.add('panel');
        //outerDiv.classList.add('panel-default');

        var nameDiv = document.createElement('div');
        nameDiv.innerText = display;
        nameDiv.className = cellClass;
        outerDiv.appendChild(nameDiv);

        var countDiv = document.createElement('div');

        var currentDiv = document.createElement('div');
        currentDiv.id = 'current-' + thingName;
        currentDiv.innerText = count.toString();
        currentDiv.className = cellClass;
        countDiv.appendChild(currentDiv);

        if (capacity) {
            var slashDiv = document.createElement('div');
            slashDiv.innerText = '/';
            slashDiv.className = cellClass;
            countDiv.appendChild(slashDiv);

            var capacityDiv = document.createElement('div');
            capacityDiv.id = 'capacity-' + thingName;
            capacityDiv.innerText = capacity.toString();
            capacityDiv.className = cellClass;
            countDiv.appendChild(capacityDiv);
        }

        countDiv.className = cellClass;
        outerDiv.appendChild(countDiv);

        var buttonDiv = document.createElement('div');
        buttonDiv.className = cellClass;

        var buyButton = document.createElement('button');
        buyButton.id = 'buy-' + thingName;
        buyButton.classList.add('btn');
        buyButton.classList.add('btn-primary');
        buyButton.innerText = "Buy";
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
        return this.GetThingNames().every(thingName => saveData.Stuff[thingName].Count >= this.GetCost(thingName));
    }

    public Deduct() {
        this.GetThingNames().forEach(thingName => {
            saveData.Stuff[thingName].Count -= this.GetCost(thingName);
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

        return Math.floor(cost * Math.pow(1.15, saveData.Stuff[this.ThingToBuy].Count));
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
        var count = saveData.Stuff[thingType.name].Count;
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
    if (capacity && getCapacity(thingToBuy) <= saveData.Stuff[thingToBuy].Count) {
        return;
    }

    cost.Deduct();
    saveData.Stuff[thingToBuy].Count++;

    save();
    updateDiplay();
}

function resetEverything() {
    saveData.Stuff = {};
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
        var count = saveData.Stuff[typeDef.name].Count;
        if (income && count) {
            Object.keys(income).forEach(earnedName => saveData.Stuff[earnedName].Count += income[earnedName] * count);

            var capacity = getCapacity('Cookie');
            if (capacity !== 0 && saveData.Stuff['Cookie'].Count > capacity) {
                saveData.Stuff['Cookie'].Count = capacity;
            }
        }
    });

    updateDiplay();
    save();
}

// i think i need something that will fire when the page finished loading
window.onload = () => {
    try {
        saveData = JSON.parse(localStorage['SaveData']);
    }
    catch (e) {}
    
    initializeStuff();
    createInventory();

    updateDiplay();
    setInterval(onInterval, 200);
};