var resetButton = document.getElementById("resetButton");
var myText = document.getElementById("helloText");
resetButton.addEventListener('click', resetEverything, false);
;
var saveData;
var definitions = [
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
            'FixedPrice1': 20,
        },
        capacityEffect: {
            'Point': 20,
        }
    },
    {
        name: 'PointHolder3',
        display: 'Backyard',
        cost: {
            'Point': 400,
        },
        capacityEffect: {
            'Point': 200,
        }
    },
    {
        name: 'FixedPrice1',
        display: 'Wrench',
        cost: {
            'Point': 250,
        },
        capacity: 100,
        costRatio: 1,
    }
];
var defByName = {};
definitions.forEach(function (thingType) { return defByName[thingType.name] = thingType; });
var Inventory;
(function (Inventory) {
    function Initialize() {
        definitions.forEach(function (thingType) {
            var thingName = thingType.name;
            var cost = thingType.cost;
            if (!cost) {
                SetReveal(thingName, true);
            }
            else {
                var purchaseCost = new PurchaseCost(thingType.name);
                var callback = function (count) {
                    if (purchaseCost.CanAfford()) {
                        SetReveal(thingName, true);
                        SetEnabled(thingName, true);
                    }
                    else {
                        SetEnabled(thingName, false);
                    }
                    // add button disable
                };
                purchaseCost.GetThingNames().forEach(function (needed) {
                    Register('count', needed, callback);
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
            Object.keys(capacityEffect).forEach(function (affectedName) {
                var effect = capacityEffect[affectedName];
                if (effect) {
                    var callback = function (count) {
                        var capacity = Inventory.GetCapacity(affectedName);
                        fireCallback('capacity', affectedName, capacity);
                    };
                    Register('count', thingName, callback);
                }
            });
        });
    }
    Inventory.Initialize = Initialize;
    function GetCount(thingName) {
        return saveData.Stuff[thingName].Count;
    }
    Inventory.GetCount = GetCount;
    function ChangeCount(thingName, delta) {
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
        fireCallback('count', thingName, count);
        if (capacity && count >= capacity) {
            SetCapacityShown(thingName, true);
        }
        return count;
    }
    Inventory.ChangeCount = ChangeCount;
    function SetCount(thingName, count) {
        if (saveData.Stuff[thingName].Count === count) {
            return count;
        }
        saveData.Stuff[thingName].Count = count;
        fireCallback('count', thingName, count);
        var capacity = GetCapacity(thingName);
        if (capacity && count >= capacity) {
            SetCapacityShown(thingName, true);
        }
        return count;
    }
    Inventory.SetCount = SetCount;
    function SetReveal(thingName, revealed) {
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
    Inventory.SetReveal = SetReveal;
    function IsRevealed(thingName) {
        return saveData.Stuff[thingName].IsRevealed;
    }
    Inventory.IsRevealed = IsRevealed;
    function GetCapacity(thingName) {
        var baseCapacity = 0;
        var capacityDelta = 0;
        var thingType = defByName[thingName];
        var capacity = thingType.capacity;
        if (capacity) {
            baseCapacity = thingType.capacity;
        }
        // TODO: make not wasteful
        definitions.forEach(function (thingType) {
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
    Inventory.GetCapacity = GetCapacity;
    function SetCapacityShown(thingName, shown) {
        var current = saveData.Stuff[thingName].IsCapShown;
        if (current === shown) {
            return;
        }
        saveData.Stuff[thingName].IsCapShown = shown;
        if (shown) {
            fireCallback('showcap', thingName, 0);
        }
        else {
            fireCallback('hidecap', thingName, 0);
        }
    }
    Inventory.SetCapacityShown = SetCapacityShown;
    function IsCapacityShown(thingName) {
        return saveData.Stuff[thingName].IsCapShown;
    }
    Inventory.IsCapacityShown = IsCapacityShown;
    function SetEnabled(thingName, enabled) {
        var current = enabledTable[thingName];
        if (current === enabled) {
            return;
        }
        enabledTable[thingName] = enabled;
        if (enabled) {
            fireCallback('enable', thingName, 0);
        }
        else {
            fireCallback('disable', thingName, 0);
        }
    }
    Inventory.SetEnabled = SetEnabled;
    function IsEnabled(thingName) {
        var cost = new PurchaseCost(thingName);
        return cost.CanAfford();
    }
    Inventory.IsEnabled = IsEnabled;
    // full game reset
    function Reset() {
        definitions.forEach(function (thingType) {
            var thingName = thingType.name;
            SetCount(thingName, 0);
            SetReveal(thingName, !thingType.cost);
            SetCapacityShown(thingName, false);
        });
    }
    Inventory.Reset = Reset;
    function fireCallback(eventName, thingName, count) {
        var thingNameToCallbacks = eventNameToThingNameToCallbacks[eventName];
        if (!thingNameToCallbacks) {
            return;
        }
        var callbacks = thingNameToCallbacks[thingName];
        if (callbacks) {
            callbacks.forEach(function (callback) { return callback(count); });
        }
    }
    function Register(eventName, thingName, callback) {
        var thingNameToCallbacks = eventNameToThingNameToCallbacks[eventName];
        if (!thingNameToCallbacks) {
            thingNameToCallbacks = eventNameToThingNameToCallbacks[eventName] = {};
        }
        var callbacks = thingNameToCallbacks[thingName];
        if (!callbacks) {
            callbacks = thingNameToCallbacks[thingName] = [];
        }
        callbacks.push(callback);
    }
    Inventory.Register = Register;
    function Unregister(eventName, thingName, callback) {
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
    Inventory.Unregister = Unregister;
    var eventNameToThingNameToCallbacks = {};
    var enabledTable = {};
})(Inventory || (Inventory = {}));
function getButtonText(thingName) {
    var thingType = defByName[thingName];
    var cost = new PurchaseCost(thingName);
    var costString = cost.GetThingNames().map(function (name) { return cost.GetCost(name) + ' ' + defByName[name].display; }).join(', ');
    if (!costString) {
        costString = "FREE!";
    }
    return 'Buy a ' + thingType.display + ' for ' + costString;
}
var cellClass = 'col-sm-2';
function createInventory() {
    definitions.forEach(function (thingType) {
        var thingName = thingType.name;
        if (Inventory.IsRevealed(thingName)) {
            createThingRow(thingName);
        }
        var create = function () {
            createThingRow(thingName);
        };
        Inventory.Register('reveal', thingName, create);
    });
}
function createThingRow(thingName) {
    var outerDiv = document.createElement('div');
    outerDiv.className = 'row';
    var toUnregister = [];
    var unregisterMe = function (eventName, callback) { return toUnregister.push([eventName, callback]); };
    outerDiv.appendChild(createName(defByName[thingName].display));
    outerDiv.appendChild(createCountDiv(thingName));
    outerDiv.appendChild(createButton(thingName, unregisterMe));
    var hideThingRow = function () {
        outerDiv.parentElement.removeChild(outerDiv);
        Inventory.Unregister('hide', thingName, hideThingRow);
        toUnregister.forEach(function (unreg) { return Inventory.Unregister(unreg[0], thingName, unreg[1]); });
    };
    Inventory.Register('hide', thingName, hideThingRow);
    document.getElementById('inventory').appendChild(outerDiv);
}
function createCountDiv(thingName) {
    var countDiv = document.createElement('div');
    var currentDiv = document.createElement('div');
    currentDiv.id = 'current-' + thingName;
    var count = Inventory.GetCount(thingName);
    var updateCount = function (count) { return currentDiv.innerText = count.toString(); };
    updateCount(count);
    Inventory.Register('count', thingName, updateCount);
    currentDiv.className = cellClass;
    countDiv.appendChild(currentDiv);
    var capShown = Inventory.IsCapacityShown(thingName);
    if (capShown) {
        createCapacity(thingName, countDiv);
    }
    else {
        var callback = function (count) {
            createCapacity(thingName, countDiv);
            Inventory.Unregister('showcap', thingName, callback);
        };
        Inventory.Register('showcap', thingName, callback);
    }
    countDiv.className = cellClass;
    return countDiv;
}
function createCapacity(thingName, countDiv) {
    var slashDiv = document.createElement('div');
    slashDiv.innerText = '/';
    slashDiv.className = cellClass;
    var capacityDiv = document.createElement('div');
    capacityDiv.id = 'capacity-' + thingName;
    var updateCapacity = function (capacity) { return capacityDiv.innerText = capacity.toString(); };
    updateCapacity(Inventory.GetCapacity(thingName));
    Inventory.Register('capacity', thingName, updateCapacity);
    capacityDiv.className = cellClass;
    [slashDiv, capacityDiv].forEach(function (div) { return countDiv.appendChild(div); });
}
function createName(display) {
    var nameDiv = document.createElement('div');
    nameDiv.innerText = display;
    nameDiv.className = cellClass;
    return nameDiv;
}
function createButton(thingName, unregisterMe) {
    var buttonDiv = document.createElement('div');
    buttonDiv.className = cellClass;
    var buyButton = document.createElement('button');
    var id = buyButton.id = 'buy-' + thingName;
    var updateButton = function () { return buyButton.innerText = getButtonText(thingName); };
    updateButton();
    Inventory.Register('count', thingName, updateButton);
    unregisterMe('count', updateButton);
    var enableButton = function () { return buyButton.disabled = false; };
    Inventory.Register('enable', thingName, enableButton);
    unregisterMe('enable', enableButton);
    var disableButton = function () { return buyButton.disabled = true; };
    Inventory.Register('disable', thingName, disableButton);
    unregisterMe('disable', disableButton);
    if (Inventory.IsEnabled(thingName)) {
        enableButton();
    }
    else {
        disableButton();
    }
    buyButton.classList.add('btn');
    buyButton.classList.add('btn-primary');
    buyButton.addEventListener('click', function () { tryBuy(thingName); });
    buttonDiv.appendChild(buyButton);
    return buttonDiv;
}
var PurchaseCost = (function () {
    function PurchaseCost(ThingToBuy) {
        var _this = this;
        this.ThingToBuy = ThingToBuy;
        this.costTable = definitions.filter(function (item) { return item.name === _this.ThingToBuy; })[0].cost;
        if (!this.costTable) {
            this.costTable = {};
        }
    }
    PurchaseCost.prototype.CanAfford = function () {
        var _this = this;
        return this.GetThingNames().every(function (thingName) { return Inventory.GetCount(thingName) >= _this.GetCost(thingName); });
    };
    PurchaseCost.prototype.Deduct = function () {
        var _this = this;
        this.GetThingNames().forEach(function (thingName) {
            Inventory.ChangeCount(thingName, -_this.GetCost(thingName));
        });
    };
    PurchaseCost.prototype.GetThingNames = function () {
        return Object.keys(this.costTable);
    };
    // get how much of thingName I need to purchase 1 this.ThingToBuy
    PurchaseCost.prototype.GetCost = function (thingName) {
        var cost = this.costTable[thingName];
        if (!cost)
            return 0;
        var ratio = defByName[this.ThingToBuy].costRatio;
        if (!ratio) {
            ratio = 1.15;
        }
        return Math.floor(cost * Math.pow(ratio, Inventory.GetCount(this.ThingToBuy)));
    };
    return PurchaseCost;
})();
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
        saveData = {};
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
            Object.keys(income).forEach(function (earnedName) {
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
//# sourceMappingURL=app.js.map