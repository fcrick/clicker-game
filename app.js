/// <reference path="mithril.d.ts"/>
var resetButton = document.getElementById("resetButton");
var myText = document.getElementById("helloText");
resetButton.addEventListener('click', resetEverything, false);
;
var saveData;
var Entity = (function () {
    function Entity(tt) {
        this.name = tt.name;
        this.Display = new Property(tt.display);
        this.Title = new Property(tt.title);
        this.Cost = new Property(tt.cost);
        this.Capacity = new Property(tt.capacity);
        this.Income = new Property(tt.income);
        this.CapacityEffect = new Property(tt.capacityEffect);
        this.CostRatio = new Property(tt.costRatio);
        this.ZeroAtCapacity = new Property(tt.zeroAtCapacity);
        this.IncomeWhenZeroed = new Property(tt.incomeWhenZeroed);
        this.ProgressThing = new Property(tt.progressThing);
    }
    Entity.prototype.GetName = function () {
        return this.name;
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
    Entity.prototype.UpdateButtonText = function () {
        this.ButtonText.Set(this.getButtonText(this.GetName()));
    };
    Entity.prototype.setUpButtonText = function () {
        var _this = this;
        this.ButtonText = new Property('');
        var updateButtonText = function () { return _this.UpdateButtonText(); };
        updateButtonText();
        // change of name to this entity
        this.Display.Event().Register(updateButtonText);
        // change of name to anything in the cost of the entity
        var cost = this.Cost.Get();
        if (cost) {
            Object.keys(cost).forEach(function (costName) {
                var costEntity = entityByName[costName].Display.Event().Register(updateButtonText);
            });
        }
        // change of cost composition
        // change of the cost amounts
        this.Cost.Event().Register(updateButtonText);
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
        },
        progressThing: 'tt-FractionOfPointHolder4',
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
    {
        name: 'tt-XpEarner',
        capacity: -1,
        display: "Macrobrewery",
        income: {
            'tt-Click': 1,
        },
        cost: {
            'tt-Scorer2': 20,
            'tt-PointHolder3': 10,
            'tt-PointHolder4': 1,
        },
        capacityEffect: {
            'tt-Click': 10000,
        },
    },
    {
        name: 'tt-Click',
        capacity: 0,
        display: "Click",
    },
    {
        name: 'tt-Hero',
        display: 'Hero',
        title: 'Made of clicks. Finds Piggy Banks.',
        capacity: -1,
        cost: {
            'tt-Click': 50,
        },
        income: {
            'tt-FractionOfPointHolder4': 1,
        },
    },
    {
        name: 'tt-FractionOfPointHolder4',
        capacity: 10000,
        zeroAtCapacity: true,
        incomeWhenZeroed: {
            'tt-PointHolder4': 1,
        }
    },
    {
        name: 'tt-Scorer4',
        display: 'Company',
        title: 'Makes money',
        capacity: -1,
        cost: {
            'tt-Hero': 20,
        },
        costRatio: 1.1,
        income: {
            'tt-FractionOfFixedPrice1': 1000,
        }
    },
];
var ThingViewModelCollection = (function () {
    function ThingViewModelCollection() {
        this.viewModels = {};
    }
    ThingViewModelCollection.prototype.AddEntities = function (entities) {
        var _this = this;
        entities.forEach(function (entity) {
            var thingName = entity.GetName();
            if (Inventory.IsRevealed(thingName)) {
                _this.viewModels[thingName] = new ThingViewModel(entity);
            }
            Inventory.GetRevealEvent(thingName).Register(function (revealed) {
                if (!revealed || _this.viewModels[thingName]) {
                    return;
                }
                _this.viewModels[thingName] = new ThingViewModel(entity);
            });
        });
    };
    ThingViewModelCollection.prototype.GetViewModels = function () {
        var _this = this;
        return Object.keys(this.viewModels).map(function (key) { return _this.viewModels[key]; });
    };
    ThingViewModelCollection.prototype.GetViewModel = function (entity) {
        return this.viewModels[entity.GetName()];
    };
    return ThingViewModelCollection;
})();
var ThingViewModel = (function () {
    function ThingViewModel(entity) {
        var _this = this;
        this.entity = entity;
        this.Buy = function () { return tryBuy(_this.entity.GetName()); };
        this.unregs = [];
        this.costUnregs = [];
        this.thingName = entity.GetName();
        // fill in initial values
        this.DisplayText = new Property(entity.Display.Get());
        this.Progress = new Property(this.calculateProgress());
        this.Count = new Property(Inventory.GetCount(this.thingName));
        this.CapacityShown = new Property(Inventory.IsCapacityShown(this.thingName));
        this.Capacity = new Property(Inventory.GetCapacity(this.thingName));
        this.ButtonText = new Property(this.calculateButtonText());
        this.ButtonEnabled = new Property(Inventory.IsEnabled(this.thingName));
        this.ButtonTitle = new Property(entity.Title.Get());
        this.setupEvents();
    }
    ThingViewModel.prototype.setupProgressEvent = function () {
        var _this = this;
        // unregister previous count tracking event
        if (this.progressUnreg) {
            this.progressUnreg();
            this.progressUnreg = null;
        }
        // register new one if need
        var progressThing = this.entity.ProgressThing.Get();
        if (progressThing) {
            this.progressUnreg = Inventory.GetCountEvent(progressThing).Register(function () { return _this.Progress.Set(_this.calculateProgress()); });
            this.Progress.Set(this.calculateProgress());
        }
    };
    ThingViewModel.prototype.setupButtonTextEvents = function () {
        var _this = this;
        if (this.costUnregs) {
            this.costUnregs.forEach(function (unreg) { return unreg(); });
            this.costUnregs = [];
        }
        var u = function (callback) { return _this.costUnregs.push(callback); };
        // change of name to anything in the cost of the entity
        var cost = this.entity.Cost.Get();
        if (cost) {
            Object.keys(cost).forEach(function (costName) {
                u(entityByName[costName].Display.Event().Register(function () { return _this.calculateButtonText(); }));
            });
        }
        u(this.entity.Cost.Event().Register(function () { return _this.setupButtonTextEvents(); }));
    };
    ThingViewModel.prototype.setupEvents = function () {
        var _this = this;
        var u = function (callback) { return _this.unregs.push(callback); };
        // set up events so properties update correctly
        u(this.entity.Display.Event().Register(function (newName) {
            _this.DisplayText.Set(newName);
            _this.ButtonText.Set(_this.calculateButtonText());
        }));
        this.setupProgressEvent();
        u(Inventory.GetCountEvent(this.thingName).Register(function (newCount) {
            _this.Count.Set(newCount);
            _this.ButtonText.Set(_this.calculateButtonText());
        }));
        u(Inventory.GetShowCapacityEvent(this.thingName).Register(function (shown) { return _this.CapacityShown.Set(shown); }));
        u(Inventory.GetCapacityEvent(this.thingName).Register(function (newCapacity) { return _this.Capacity.Set(newCapacity); }));
        u(Inventory.GetEnableEvent(this.thingName).Register(function (newEnabled) { return _this.ButtonEnabled.Set(newEnabled); }));
        u(this.entity.Title.Event().Register(function (newTitle) { return _this.ButtonTitle.Set(newTitle); }));
    };
    ThingViewModel.prototype.calculateProgress = function () {
        var progressThing = this.entity.ProgressThing.Get();
        if (!progressThing) {
            return 0;
        }
        if (Inventory.GetCount(this.thingName) === Inventory.GetCapacity(this.thingName)) {
            return 0;
        }
        return Inventory.GetCount(progressThing) / Inventory.GetCapacity(progressThing);
    };
    ThingViewModel.prototype.calculateButtonText = function () {
        var cost = new PurchaseCost(this.thingName);
        var costString = cost.GetThingNames().map(function (name) {
            return cost.GetCost(name) + ' ' + entityByName[name].Display.Get();
        }).join(', ');
        if (!costString) {
            costString = "FREE!";
        }
        return 'Buy a ' + this.entity.Display.Get() + ' for ' + costString;
    };
    return ThingViewModel;
})();
var Inventory;
(function (Inventory) {
    function Initialize(entities) {
        entities.forEach(function (entity) { return InitializeEntity(entity); });
    }
    Inventory.Initialize = Initialize;
    function InitializeEntity(entity) {
        var thingName = entity.GetName();
        var registerCostEvents = function () {
            var events = [];
            var cost = entity.Cost.Get();
            var count = GetCount(thingName);
            var capacity = GetCapacity(thingName);
            if ((!cost && capacity !== 0) || count > 0) {
                SetReveal(thingName, true);
            }
            var purchaseCost = new PurchaseCost(thingName);
            var callback = function () {
                var capacity = GetCapacity(thingName);
                var canAfford = purchaseCost.CanAfford();
                var count = GetCount(thingName);
                if (capacity !== 0 && (count > 0 || canAfford)) {
                    SetReveal(thingName, true);
                }
                SetEnabled(thingName, IsEnabled(thingName));
            };
            purchaseCost.GetThingNames().forEach(function (needed) {
                events.push(Inventory.GetCountEvent(needed).Register(callback));
            });
            events.push(Inventory.GetCountEvent(thingName).Register(callback));
            events.push(Inventory.GetCapacityEvent(thingName).Register(callback));
            callback();
            if (events.length > 0) {
                costEventMap[thingName] = events;
            }
        };
        registerCostEvents();
        entity.Cost.Event().Register(function (capacityEffects) {
            costEventMap[thingName].forEach(function (unreg) { return unreg(); });
            delete costEventMap[thingName];
            registerCostEvents();
        });
        // update button text when count changes
        Inventory.GetCountEvent(thingName).Register(function () { return entity.UpdateButtonText(); });
        // set up for changing whether capacity is displayed
        var capacity = GetCapacity(thingName);
        if (capacity !== -1 && GetCount(thingName) >= capacity) {
            SetCapacityShown(thingName, true);
        }
        // set up for changing capacity display
        var registerCapacityEvents = function () {
            var events = [];
            Object.keys(capacityEffect).forEach(function (affectedName) {
                var effect = capacityEffect[affectedName];
                if (effect) {
                    var callback = function (count) {
                        var capacity = Inventory.GetCapacity(affectedName);
                        capacityEvent.FireEvent(affectedName, function (callback) { return callback(capacity); });
                    };
                    var unregCallback = Inventory.GetCountEvent(thingName).Register(callback);
                    events.push(unregCallback);
                }
            });
            if (events.length > 0) {
                capacityEventMap[thingName] = events;
            }
        };
        var capacityEffect = entity.CapacityEffect.Get();
        if (capacityEffect) {
            registerCapacityEvents();
        }
        entity.CapacityEffect.Event().Register(function (capacityEffects) {
            capacityEventMap[thingName].forEach(function (unreg) { return unreg(); });
            delete capacityEventMap[thingName];
            registerCapacityEvents();
            Object.keys(capacityEffects).forEach(function (affectedName) {
                capacity = Inventory.GetCapacity(affectedName);
                capacityEvent.FireEvent(affectedName, function (callback) { return callback(capacity); });
            });
        });
    }
    var capacityEventMap = {};
    var costEventMap = {};
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
        var _this = this;
        this.callbacks.push(callback);
        return function () { return _this.Unregister(callback); };
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
    function Property(current) {
        this.current = current;
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
        this.current = value;
        this.event.Fire(function (callback) { return callback(value, previous); });
    };
    Property.prototype.Event = function () {
        return this.event;
    };
    return Property;
})();
var cellClass = 'col-sm-2';
function createElementsForEntity(thingName) {
    if (Inventory.IsRevealed(thingName)) {
        createThingRow(thingName);
    }
    var create = function (reveal) {
        if (reveal) {
            createThingRow(thingName);
        }
    };
    Inventory.GetRevealEvent(thingName).Register(create);
}
var thingRow = {
    view: function (vm) {
        // row
        return m('.row', { style: { display: 'flex', alignItems: 'center' } }, [
            // name
            m('.col-sm-2', [
                m('div', {
                    class: 'progress progress-bar',
                    style: { width: Math.floor(vm.Progress.Get() * 500) / 10 + '%' },
                }),
                vm.DisplayText.Get()
            ]),
            // count
            m('.col-sm-2', [
                m('span', vm.Count.Get()),
                vm.CapacityShown.Get() ? m('span', ' / ') : '',
                vm.CapacityShown.Get() ? m('span', vm.Capacity.Get()) : '',
            ]),
            // button
            m('.col-sm-2', [
                m('button', {
                    title: vm.ButtonTitle.Get(),
                    class: 'btn btn-primary',
                    disabled: !vm.ButtonEnabled.Get(),
                    onclick: vm.Buy,
                }, [
                    vm.ButtonText.Get(),
                ]),
            ]),
        ]);
    }
};
function createThingRow(thingName) {
    var outerDiv = document.createElement('div');
    outerDiv.className = 'row';
    outerDiv.style.display = 'flex';
    outerDiv.style.alignItems = 'center';
    var inv = document.getElementById('inventory');
    var newDiv = document.createElement('div');
    inv.appendChild(newDiv);
    var entity = entityByName[thingName];
    var toUnload = [];
    m.mount(newDiv, {
        controller: function () {
            onunload: (function (e) { return toUnload.forEach(function (u) { return u(); }); });
        },
        view: function () { return thingRow.view(thingViewModels.GetViewModel(entity)); }
    });
    var redraw = function () { return m.redraw(); };
    var u = function (unreg) { return toUnload.push(unreg); };
    var vm = thingViewModels.GetViewModel(entity);
    u(vm.ButtonEnabled.Event().Register(redraw));
    u(vm.ButtonText.Event().Register(redraw));
    u(vm.ButtonTitle.Event().Register(redraw));
    u(vm.Capacity.Event().Register(redraw));
    u(vm.CapacityShown.Event().Register(redraw));
    u(vm.Count.Event().Register(redraw));
    u(vm.DisplayText.Event().Register(redraw));
    u(vm.Progress.Event().Register(redraw));
    var unregReveal;
    unregReveal = Inventory.GetRevealEvent(thingName).Register(function (revealed) {
        if (revealed) {
            return;
        }
        m.mount(newDiv, null);
        unregReveal();
    });
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
    var entities = definitions.map(function (thingType) { return new Entity(thingType); });
    addNewEntities(entities);
    setInterval(onInterval, 200);
}
function addNewEntities(entities) {
    entities.forEach(function (entity) { return entityByName[entity.GetName()] = entity; });
    initializeSaveData();
    entities.forEach(function (entity) { return entity.Initialize(); });
    Inventory.Initialize(entities);
    thingViewModels.AddEntities(entities);
    entities.forEach(function (entity) { return createElementsForEntity(entity.GetName()); });
    Object.keys(entityByName).forEach(function (thingName) { return things[entityByName[thingName].Display.Get()] = entityByName[thingName]; });
}
// i think i need something that will fire when the page finished loading
window.onload = onLoad;
var entityByName = {};
var thingViewModels = new ThingViewModelCollection();
// for debugging
var things = {};
var nextId = 1;
function Add(display) {
    var newThingType = {
        name: '',
        capacity: -1,
        cost: {
            'tt-Point': 10,
        },
        income: {
            'tt-Point': 1,
        },
    };
    newThingType['name'] = 'tt-Custom' + nextId++;
    newThingType['display'] = display;
    addNewEntities([new Entity(newThingType)]);
}
function ReAddAll() {
    var oldNames = definitions.map(function (thingType) { return thingType.name; });
    var newDefs = definitions.map(function (thingType) {
        var originalName = thingType.name;
        var json = JSON.stringify(thingType);
        oldNames.forEach(function (oldName) {
            var re = new RegExp('"' + oldName + '"', 'g');
            json = json.replace(re, '"' + oldName + 'Again"');
        });
        return JSON.parse(json);
    });
    var entities = newDefs.map(function (thingType) { return new Entity(thingType); });
    addNewEntities(entities);
    definitions = newDefs;
}
//# sourceMappingURL=app.js.map