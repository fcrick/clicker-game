var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var resetButton = document.getElementById("resetButton");
var myText = document.getElementById("helloText");
resetButton.addEventListener('click', resetEverything, false);
;
var saveData;
var Entity = (function () {
    function Entity(tt) {
        var _this = this;
        this.tt = tt;
        this.Display = new Property(function () { return _this.tt.display; }, function (value) { return _this.tt.display = value; });
        this.Title = new Property(function () { return _this.tt.title; }, function (value) { return _this.tt.display = value; });
        this.Cost = new Property(function () { return _this.tt.cost; }, function (value) { return _this.tt.cost = value; });
        this.Capacity = new Property(function () { return _this.tt.capacity; }, function (value) { return _this.tt.capacity = value; });
        this.Income = new Property(function () { return _this.tt.income; }, function (value) { return _this.tt.income = value; });
        this.CapacityEffect = new Property(function () { return _this.tt.capacityEffect; }, function (value) { return _this.tt.capacityEffect = value; });
        this.CostRatio = new Property(function () { return _this.tt.costRatio; }, function (value) { return _this.tt.costRatio = value; });
        this.ZeroAtCapacity = new Property(function () { return _this.tt.zeroAtCapacity; }, function (value) { return _this.tt.zeroAtCapacity = value; });
        this.IncomeWhenZeroed = new Property(function () { return _this.tt.incomeWhenZeroed; }, function (value) { return _this.tt.incomeWhenZeroed = value; });
        this.ProgressThing = new Property(function () { return _this.tt.progressThing; }, function (value) { return _this.tt.progressThing = value; });
    }
    Entity.prototype.GetName = function () {
        return this.tt.name;
    };
    Entity.prototype.Initialize = function () {
        this.setUpButtonText();
    };
    Entity.prototype.getButtonText = function (thingName) {
        var entity = entityByName[thingName];
        var cost = new PurchaseCost(thingName);
        var costString = cost.GetThingNames().map(function (name) {
            return cost.GetCost(name) + ' ' + entityByName[name].Display.Get();
        }).join(', ');
        if (!costString) {
            costString = "FREE!";
        }
        return 'Buy a ' + entity.Display.Get() + ' for ' + costString;
    };
    Entity.prototype.setUpButtonText = function () {
        var _this = this;
        this.ButtonText = new Property(function () { return _this.buttonText; }, function (value) { _this.buttonText = value; });
        var update = function () { return _this.ButtonText.Set(_this.getButtonText(_this.GetName())); };
        update();
        // change of name to this entity
        this.Display.Event().Register(function (current, previous) { return update(); });
        // change of name to anything in the cost of the entity
        // change of cost composition
        // change of the cost amounts
    };
    return Entity;
})();
var definitions = [
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
var Inventory;
(function (Inventory) {
    function Initialize() {
        Object.keys(entityByName).forEach(function (thingName) {
            var entity = entityByName[thingName];
            var cost = entity.Cost.Get();
            var count = GetCount(thingName);
            if (!cost || count > 0) {
                SetReveal(thingName, true);
            }
            var purchaseCost = new PurchaseCost(thingName);
            var callback = function (c) {
                var capacity = GetCapacity(thingName);
                var canAfford = purchaseCost.CanAfford();
                var count = GetCount(thingName);
                if (capacity !== 0 && (count > 0 || canAfford)) {
                    SetReveal(thingName, true);
                }
                SetEnabled(thingName, IsEnabled(thingName));
            };
            purchaseCost.GetThingNames().forEach(function (needed) {
                Inventory.GetCountEvent(needed).Register(callback);
            });
            Inventory.GetCountEvent(thingName).Register(callback);
            Inventory.GetCapacityEvent(thingName).Register(callback);
            callback(GetCount(thingName));
            var capacity = GetCapacity(thingName);
            if (capacity !== -1 && GetCount(thingName) >= capacity) {
                SetCapacityShown(thingName, true);
            }
            var capacityEffect = entity.CapacityEffect.Get();
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
        countEvent.FireEvent(thingName, function (callback) { return callback(count, initialCount); });
        capacityUpdate(thingName, count, capacity);
        var afterCount = GetCount(thingName);
        if (afterCount !== count && overflow !== 0) {
            ChangeCount(thingName, overflow);
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
        countEvent.FireEvent(thingName, function (callback) { return callback(count, initialCount); });
        capacityUpdate(thingName, count, GetCapacity(thingName));
        return count;
    }
    Inventory.SetCount = SetCount;
    function capacityUpdate(thingName, count, capacity) {
        var entity = entityByName[thingName];
        if (entity.ZeroAtCapacity.Get() && count >= capacity) {
            SetCount(thingName, 0);
            var income = entity.IncomeWhenZeroed.Get();
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
        if (!entityByName[thingName].Display.Get()) {
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
        if (!entityByName[thingName].Display.Get()) {
            return false;
        }
        return saveData.Stuff[thingName].IsRevealed;
    }
    Inventory.IsRevealed = IsRevealed;
    function GetCapacity(thingName) {
        var baseCapacity = 0;
        var capacityDelta = 0;
        var entity = entityByName[thingName];
        var capacity = entity.Capacity.Get();
        if (capacity === -1) {
            return -1;
        }
        baseCapacity = capacity;
        // TODO: make not wasteful
        Object.keys(entityByName).forEach(function (affecterName) {
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
        var canAfford = new PurchaseCost(thingName).CanAfford();
        var count = GetCount(thingName);
        var capacity = GetCapacity(thingName);
        return canAfford && (capacity === -1 || count < capacity);
    }
    Inventory.IsEnabled = IsEnabled;
    // full game reset
    function Reset() {
        var names = Object.keys(entityByName);
        names.forEach(function (thingName) { return SetCount(thingName, 0); });
        names.forEach(function (thingName) {
            // TODO: this should also check capacity
            SetReveal(thingName, !entityByName[thingName].Cost.Get());
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
                event = this.eventTable[thingName] = new GameEvent();
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
var Property = (function () {
    function Property(getter, setter) {
        this.getter = getter;
        this.setter = setter;
        this.current = getter();
        this.event = new GameEvent();
    }
    Property.prototype.Get = function () {
        return this.current;
    };
    Property.prototype.Set = function (value) {
        if (this.current === value) {
            return;
        }
        var previous = this.current;
        this.setter(value);
        this.current = value;
        this.event.Fire(function (callback) { return callback(value, previous); });
    };
    Property.prototype.Event = function () {
        return this.event;
    };
    return Property;
})();
var StringProperty = (function (_super) {
    __extends(StringProperty, _super);
    function StringProperty() {
        _super.apply(this, arguments);
    }
    return StringProperty;
})(Property);
var cellClass = 'col-sm-2';
function createInventory() {
    Object.keys(entityByName).forEach(function (thingName) {
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
    outerDiv.style.display = 'flex';
    outerDiv.style.alignItems = 'center';
    var toUnregister = [];
    var unregisterMe = function (callback) { return toUnregister.push(callback); };
    outerDiv.appendChild(createName(thingName));
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
    countDiv.className = cellClass;
    var currentDiv = document.createElement('span');
    currentDiv.id = 'current-' + thingName;
    var count = Inventory.GetCount(thingName);
    var updateCount = function (count) { return currentDiv.innerText = count.toString(); };
    updateCount(count);
    Inventory.GetCountEvent(thingName).Register(updateCount);
    unregisterMe(function () { return Inventory.GetCountEvent(thingName).Unregister(updateCount); });
    countDiv.appendChild(currentDiv);
    var capShown = Inventory.IsCapacityShown(thingName);
    if (capShown) {
        createCapacity(thingName, countDiv, unregisterMe);
    }
    // set up callback to show capacity display
    var callback = function (show) {
        if (!show) {
            return;
        }
        createCapacity(thingName, countDiv, unregisterMe);
    };
    Inventory.GetShowCapacityEvent(thingName).Register(callback);
    unregisterMe(function () { return Inventory.GetShowCapacityEvent(thingName).Unregister(callback); });
    return countDiv;
}
function createCapacity(thingName, countDiv, unregisterMe) {
    var slashDiv = document.createElement('span');
    slashDiv.innerText = ' / ';
    var capacityDiv = document.createElement('span');
    capacityDiv.id = 'capacity-' + thingName;
    var updateCapacity = function (capacity) { return capacityDiv.innerText = capacity.toString(); };
    updateCapacity(Inventory.GetCapacity(thingName));
    Inventory.GetCapacityEvent(thingName).Register(updateCapacity);
    var unregister = function () { return Inventory.GetCapacityEvent(thingName).Unregister(updateCapacity); };
    unregisterMe(unregister);
    var elements = [slashDiv, capacityDiv];
    elements.forEach(function (div) { return countDiv.appendChild(div); });
    var removeCapacity = function (shown) {
        if (shown) {
            return;
        }
        elements.forEach(function (div) { return countDiv.removeChild(div); });
        unregister(); // remove event added above
        Inventory.GetShowCapacityEvent(thingName).Unregister(removeCapacity);
    };
    Inventory.GetShowCapacityEvent(thingName).Register(removeCapacity);
    unregisterMe(function () { return Inventory.GetShowCapacityEvent(thingName).Unregister(removeCapacity); });
}
function removeCapacity(thingName, countDiv) {
}
function createName(thingName) {
    var entity = entityByName[thingName];
    var display = entity.Display.Get();
    var nameDiv = document.createElement('div');
    nameDiv.innerText = display;
    nameDiv.className = cellClass;
    var progressThing = entity.ProgressThing.Get();
    if (progressThing) {
        var progressDiv = document.createElement('div');
        progressDiv.className = 'progress progress-bar';
        progressDiv.style.width = '0%';
        var callback = function () {
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
        Inventory.GetCountEvent(progressThing).Register(callback);
        Inventory.GetCapacityEvent(progressThing).Register(callback);
        nameDiv.appendChild(progressDiv);
    }
    return nameDiv;
}
function createButton(thingName, unregisterMe) {
    var buttonDiv = document.createElement('div');
    buttonDiv.className = cellClass;
    var entity = entityByName[thingName];
    var buyButton = document.createElement('button');
    var id = buyButton.id = 'buy-' + thingName;
    var title = entity.Title.Get();
    if (title) {
        buyButton.title = title;
    }
    var updateButton = function () { return buyButton.innerText = entity.ButtonText.Get(); };
    updateButton();
    Inventory.GetCountEvent(thingName).Register(updateButton);
    unregisterMe(function () { return Inventory.GetCountEvent(thingName).Unregister(updateButton); });
    entity.ButtonText.Event().Register(updateButton);
    unregisterMe(function () { return entity.ButtonText.Event().Unregister(updateButton); });
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
    function PurchaseCost(thingName) {
        this.thingName = thingName;
        this.costTable = entityByName[thingName].Cost.Get();
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
        var ratio = entityByName[this.thingName].CostRatio.Get();
        if (!ratio) {
            ratio = 1.15;
        }
        return Math.floor(cost * Math.pow(ratio, Inventory.GetCount(this.thingName)));
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
    Object.keys(entityByName).forEach(function (thingName) {
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
    Object.keys(entityByName).forEach(function (thingName) {
        var entity = entityByName[thingName];
        var income = entity.Income.Get();
        var count = Inventory.GetCount(thingName);
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
    Object.keys(entityByName).forEach(function (thingName) { return entityByName[thingName].Initialize(); });
    Inventory.Initialize();
    createInventory();
    setInterval(onInterval, 200);
}
// i think i need something that will fire when the page finished loading
window.onload = onLoad;
var entityByName = {};
definitions.forEach(function (thingType) { return entityByName[thingType.name] = new Entity(thingType); });
// for debugging
var entities = {};
Object.keys(entityByName).forEach(function (thingName) { return entities[entityByName[thingName].Display.Get()] = entityByName[thingName]; });
//# sourceMappingURL=app.js.map