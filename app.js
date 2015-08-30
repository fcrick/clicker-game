var resetButton = document.getElementById("resetButton");
var myText = document.getElementById("helloText");
resetButton.addEventListener('click', resetEverything, false);
;
var saveData;
var definitions = [
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
            Object.keys(capacityEffect).forEach(function (affectedName) {
                var effect = capacityEffect[affectedName];
                if (effect) {
                    var callback = function (count) {
                        var capacity = Inventory.GetCapacity(affectedName);
                        fireCapacityEvent(affectedName, capacity);
                    };
                    GetCountEvent(thingName).Register(callback);
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
        //fireCallback(InvEvent.Count, thingName, count);
        fireCountEvent(thingName, count, initialCount);
        // clean me
        if (capacity && count >= capacity) {
            SetCapacityShown(thingName, true);
        }
        return count;
    }
    Inventory.ChangeCount = ChangeCount;
    function SetCount(thingName, count) {
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
    Inventory.SetCount = SetCount;
    function SetReveal(thingName, revealed) {
        var current = saveData.Stuff[thingName].IsRevealed;
        if (current === revealed) {
            return;
        }
        saveData.Stuff[thingName].IsRevealed = revealed;
        fireRevealEvent(thingName, revealed);
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
        fireShowCapacityEvent(thingName, shown);
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
        fireEnableEvent(thingName, enabled);
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
    ;
    ;
    ;
    // Count events
    var countEvents = {};
    function GetCountEvent(thingName) {
        return getThingEvent(thingName, countEvents);
    }
    Inventory.GetCountEvent = GetCountEvent;
    function fireCountEvent(thingName, count, previous) {
        fireThingEvent(thingName, countEvents, function (callback) { return callback(count, previous); });
    }
    // Capacity events
    var capacityEvents = {};
    function GetCapacityEvent(thingName) {
        return getThingEvent(thingName, capacityEvents);
    }
    Inventory.GetCapacityEvent = GetCapacityEvent;
    function fireCapacityEvent(thingName, capacity) {
        fireThingEvent(thingName, capacityEvents, function (callback) { return callback(capacity); });
    }
    // Enable events (enabling and disabling buy buttons)
    var enableEvents = {};
    function GetEnableEvent(thingName) {
        return getThingEvent(thingName, enableEvents);
    }
    Inventory.GetEnableEvent = GetEnableEvent;
    function fireEnableEvent(thingName, enabled) {
        fireThingEvent(thingName, enableEvents, function (callback) { return callback(enabled); });
    }
    // Reveal and hide events (for showing that a thing exists at all)
    var revealEvents = {};
    function GetRevealEvent(thingName) {
        return getThingEvent(thingName, revealEvents);
    }
    Inventory.GetRevealEvent = GetRevealEvent;
    function fireRevealEvent(thingName, enabled) {
        fireThingEvent(thingName, revealEvents, function (callback) { return callback(enabled); });
    }
    // Show and hide capacity events
    var showCapacityEvents = {};
    function GetShowCapacityEvent(thingName) {
        return getThingEvent(thingName, showCapacityEvents);
    }
    Inventory.GetShowCapacityEvent = GetShowCapacityEvent;
    function fireShowCapacityEvent(thingName, enabled) {
        fireThingEvent(thingName, showCapacityEvents, function (callback) { return callback(enabled); });
    }
    function fireThingEvent(thingName, eventTable, caller) {
        var event = eventTable[thingName];
        if (!event) {
            return;
        }
        event.Fire(caller);
    }
    function getThingEvent(thingName, eventTable) {
        var event = eventTable[thingName];
        if (!event) {
            event = eventTable[thingName] = new Events.GameEvent();
        }
        return event;
    }
    var eventNameToThingNameToCallbacks = {};
    var enabledTable = {};
})(Inventory || (Inventory = {}));
var Events;
(function (Events) {
    var GameEvent = (function () {
        function GameEvent() {
            this.callbacks = [];
        }
        GameEvent.prototype.Register = function (callback) {
            this.callbacks.push(callback);
        };
        GameEvent.prototype.Unregister = function (callback) {
            var index = this.callbacks.indexOf(callback);
            if (index === -1) {
                return false;
            }
            this.callbacks.splice(index, 1);
            return true;
        };
        GameEvent.prototype.Fire = function (caller) {
            this.callbacks.forEach(function (callback) { return caller(callback); });
        };
        return GameEvent;
    })();
    Events.GameEvent = GameEvent;
})(Events || (Events = {}));
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
        var create = function (reveal) {
            if (reveal) {
                createThingRow(thingName);
            }
        };
        Inventory.GetRevealEvent(thingName).Register(create);
    });
}
function createThingRow(thingName) {
    var outerDiv = document.createElement('div');
    outerDiv.className = 'row';
    var toUnregister = [];
    var unregisterMe = function (callback) { return toUnregister.push(callback); };
    outerDiv.appendChild(createName(defByName[thingName].display));
    outerDiv.appendChild(createCountDiv(thingName));
    outerDiv.appendChild(createButton(thingName, unregisterMe));
    var hideThingRow = function (revealed) {
        if (revealed) {
            return;
        }
        outerDiv.parentElement.removeChild(outerDiv);
        Inventory.GetRevealEvent(thingName).Unregister(hideThingRow);
        toUnregister.forEach(function (unreg) { return unreg(); });
    };
    Inventory.GetRevealEvent(thingName).Register(hideThingRow);
    document.getElementById('inventory').appendChild(outerDiv);
}
function createCountDiv(thingName) {
    var countDiv = document.createElement('div');
    var currentDiv = document.createElement('div');
    currentDiv.id = 'current-' + thingName;
    var count = Inventory.GetCount(thingName);
    var updateCount = function (count) { return currentDiv.innerText = count.toString(); };
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
        var callback = function (show) {
            if (!show) {
                return;
            }
            createCapacity(thingName, countDiv);
            Inventory.GetShowCapacityEvent(thingName).Unregister(callback);
        };
        Inventory.GetShowCapacityEvent(thingName).Register(callback);
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
    // TODO: unregister
    Inventory.GetCapacityEvent(thingName).Register(updateCapacity);
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
    Inventory.GetCountEvent(thingName).Register(updateButton);
    unregisterMe(function () { return Inventory.GetCountEvent(thingName).Unregister(updateButton); });
    var enableDisableButton = function (enabled) { return buyButton.disabled = !enabled; };
    Inventory.GetEnableEvent(thingName).Register(enableDisableButton);
    unregisterMe(function () { return Inventory.GetEnableEvent(thingName).Unregister(enableDisableButton); });
    enableDisableButton(Inventory.IsEnabled(thingName));
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