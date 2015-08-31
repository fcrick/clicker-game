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
        capacityEffect: {
            'tt-PointHolder1': 50,
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
        capacity: 50,
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
var defByName = {};
definitions.forEach(function (thingType) { return defByName[thingType.name] = thingType; });
var Inventory;
(function (Inventory) {
    function Initialize() {
        definitions.forEach(function (thingType) {
            var thingName = thingType.name;
            var cost = thingType.cost;
            var count = GetCount(thingName);
            if (!cost || count > 0) {
                SetReveal(thingName, true);
            }
            var purchaseCost = new PurchaseCost(thingType.name);
            var callback = function (c) {
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
            };
            purchaseCost.GetThingNames().forEach(function (needed) {
                Inventory.GetCountEvent(needed).Register(callback);
            });
            Inventory.GetCountEvent(thingName).Register(callback);
            callback(GetCount(thingName));
            var capacity = GetCapacity(thingName);
            if (capacity !== -1 && GetCount(thingName) >= capacity) {
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
                        capacityEvent.FireEvent(affectedName, function (callback) { return callback(capacity); });
                    };
                    Inventory.GetCountEvent(thingName).Register(callback);
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
        countEvent.FireEvent(thingName, function (callback) { return callback(count, initialCount); });
        capacityUpdate(thingName, count, capacity);
        return count;
    }
    Inventory.ChangeCount = ChangeCount;
    function SetCount(thingName, count) {
        var initialCount = saveData.Stuff[thingName].Count;
        if (initialCount === count) {
            return count;
        }
        saveData.Stuff[thingName].Count = count;
        countEvent.FireEvent(thingName, function (callback) { return callback(count, initialCount); });
        capacityUpdate(thingName, count, GetCapacity(thingName));
        return count;
    }
    Inventory.SetCount = SetCount;
    function capacityUpdate(thingName, count, capacity) {
        var thingType = defByName[thingName];
        if (thingType.zeroAtCapacity && count >= capacity) {
            SetCount(thingName, 0);
            var income = thingType.incomeWhenZeroed;
            if (income) {
                Object.keys(income).forEach(function (earnedThing) {
                    ChangeCount(earnedThing, income[earnedThing]);
                });
            }
            return;
        }
        if (capacity !== -1 && count >= capacity) {
            SetCapacityShown(thingName, true);
        }
    }
    function SetReveal(thingName, revealed) {
        if (!defByName[thingName].display) {
            return;
        }
        var current = saveData.Stuff[thingName].IsRevealed;
        if (current === revealed) {
            return;
        }
        saveData.Stuff[thingName].IsRevealed = revealed;
        revealEvent.FireEvent(thingName, function (callback) { return callback(revealed); });
    }
    Inventory.SetReveal = SetReveal;
    function IsRevealed(thingName) {
        if (!defByName[thingName].display) {
            return false;
        }
        return saveData.Stuff[thingName].IsRevealed;
    }
    Inventory.IsRevealed = IsRevealed;
    function GetCapacity(thingName) {
        var baseCapacity = 0;
        var capacityDelta = 0;
        var thingType = defByName[thingName];
        var capacity = thingType.capacity;
        if (capacity === -1) {
            return -1;
        }
        baseCapacity = thingType.capacity;
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
        showCapacityEvent.FireEvent(thingName, function (callback) { return callback(shown); });
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
        enableEvent.FireEvent(thingName, function (callback) { return callback(enabled); });
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
    ;
    ;
    ;
    var ThingEvent = (function () {
        function ThingEvent() {
            this.eventTable = {};
        }
        ThingEvent.prototype.GetEvent = function (thingName) {
            var event = this.eventTable[thingName];
            if (!event) {
                event = this.eventTable[thingName] = new Events.GameEvent();
            }
            return event;
        };
        ThingEvent.prototype.FireEvent = function (thingName, caller) {
            var event = this.eventTable[thingName];
            if (event)
                event.Fire(caller);
        };
        return ThingEvent;
    })();
    // for updating counts of things
    var countEvent = new ThingEvent();
    Inventory.GetCountEvent = function (thingName) { return countEvent.GetEvent(thingName); };
    // for updating capacity of things
    var capacityEvent = new ThingEvent();
    Inventory.GetCapacityEvent = function (thingName) { return capacityEvent.GetEvent(thingName); };
    // for enabling and disabling buy buttons
    var enableEvent = new ThingEvent();
    Inventory.GetEnableEvent = function (thingName) { return enableEvent.GetEvent(thingName); };
    // for showing that things exist at all
    var revealEvent = new ThingEvent();
    Inventory.GetRevealEvent = function (thingName) { return revealEvent.GetEvent(thingName); };
    // for showing the capacity of a thing
    var showCapacityEvent = new ThingEvent();
    Inventory.GetShowCapacityEvent = function (thingName) { return showCapacityEvent.GetEvent(thingName); };
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
    outerDiv.appendChild(createCountDiv(thingName, unregisterMe));
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
function createCountDiv(thingName, unregisterMe) {
    var countDiv = document.createElement('div');
    var currentDiv = document.createElement('div');
    currentDiv.id = 'current-' + thingName;
    var count = Inventory.GetCount(thingName);
    var updateCount = function (count) { return currentDiv.innerText = count.toString(); };
    updateCount(count);
    // TODO: make sure this gets unregistered
    Inventory.GetCountEvent(thingName).Register(updateCount);
    unregisterMe(function () { return Inventory.GetCountEvent(thingName).Unregister(updateCount); });
    currentDiv.className = cellClass;
    countDiv.appendChild(currentDiv);
    var capShown = Inventory.IsCapacityShown(thingName);
    if (capShown) {
        createCapacity(thingName, countDiv, unregisterMe);
    }
    else {
        var callback = function (show) {
            if (!show) {
                return;
            }
            createCapacity(thingName, countDiv, unregisterMe);
            Inventory.GetShowCapacityEvent(thingName).Unregister(callback);
        };
        Inventory.GetShowCapacityEvent(thingName).Register(callback);
        unregisterMe(function () { return Inventory.GetShowCapacityEvent(thingName).Unregister(callback); });
    }
    countDiv.className = cellClass;
    return countDiv;
}
function createCapacity(thingName, countDiv, unregisterMe) {
    var slashDiv = document.createElement('div');
    slashDiv.innerText = '/';
    slashDiv.className = cellClass;
    var capacityDiv = document.createElement('div');
    capacityDiv.id = 'capacity-' + thingName;
    var updateCapacity = function (capacity) { return capacityDiv.innerText = capacity.toString(); };
    updateCapacity(Inventory.GetCapacity(thingName));
    Inventory.GetCapacityEvent(thingName).Register(updateCapacity);
    unregisterMe(function () { return Inventory.GetCapacityEvent(thingName).Unregister(updateCapacity); });
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