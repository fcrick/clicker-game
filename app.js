/// <reference path="mithril.d.ts"/>
/// <reference path="event.ts"/>
/// <reference path="gamedata.ts"/>
/// <reference path="views.ts"/>
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
;
var ThingType = (function () {
    function ThingType(tt) {
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
    ThingType.prototype.GetName = function () {
        return this.name;
    };
    return ThingType;
})();
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
        this.CapacityShown = new Property(game.Model(this.thingName).CapacityRevealed.Get());
        this.Capacity = new Property(game.Model(this.thingName).Capacity.Get());
        this.ButtonText = new Property(this.calculateButtonText());
        this.ButtonEnabled = new Property(game.Model(this.thingName).Purchasable.Get());
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
        var thingModel = game.Model(this.thingName);
        u(thingModel.Count.Event().Register(function (newCount) {
            _this.Count.Set(newCount);
        }));
        u(thingModel.Price.Event().Register(function () {
            _this.ButtonText.Set(_this.calculateButtonText());
        }));
        u(thingModel.CapacityRevealed.Event().Register(function (reveal) { return _this.CapacityShown.Set(reveal); }));
        u(thingModel.Capacity.Event().Register(function (newCapacity) { return _this.Capacity.Set(newCapacity); }));
        u(thingModel.Purchasable.Event().Register(function (enabled) { return _this.ButtonEnabled.Set(enabled); }));
        //u(Inventory.GetEnableEvent(this.thingName).Register(newEnabled => this.ButtonEnabled.Set(newEnabled)));
        u(this.entity.Title.Event().Register(function (newTitle) { return _this.ButtonTitle.Set(newTitle); }));
    };
    ThingViewModel.prototype.calculateProgress = function () {
        var progressThing = this.entity.ProgressThing.Get();
        if (!progressThing) {
            return 0;
        }
        if (Inventory.GetCount(this.thingName) === game.Model(this.thingName).Capacity.Get()) {
            return 0;
        }
        return Inventory.GetCount(progressThing) / game.Model(progressThing).Capacity.Get();
    };
    ThingViewModel.prototype.calculateButtonText = function () {
        var price = game.Model(this.thingName).Price.Get();
        var costString = Object.keys(price).map(function (thingName) {
            return price[thingName] + ' ' + entityByName[thingName].Display.Get();
        }).join(', ');
        if (!costString) {
            costString = "FREE!";
        }
        return 'Buy a ' + this.entity.Display.Get() + ' for ' + costString;
    };
    return ThingViewModel;
})();
var GameState = (function () {
    function GameState() {
        this.entities = [];
        this.thingNames = [];
        this.entityLookup = {};
        this.models = [];
        this.modelLookup = {};
        this.gameEvent = new GameEvent();
    }
    GameState.prototype.GetEntities = function () { return this.entities; };
    GameState.prototype.GetThingNames = function () { return this.thingNames; };
    GameState.prototype.GetEntity = function (thingName) { return this.entityLookup[thingName]; };
    GameState.prototype.GetThingModels = function () { return this.models; };
    GameState.prototype.Model = function (thingName) { return this.modelLookup[thingName]; };
    GameState.prototype.GetEvent = function () {
        return this.gameEvent;
    };
    GameState.prototype.addEntities = function (entities, saveData) {
        var _this = this;
        var initialize = function () { };
        entities.forEach(function (entity) {
            _this.entities.push(entity);
            var thingName = entity.GetName();
            _this.thingNames.push(thingName);
            _this.entityLookup[thingName] = entity;
            var model = new ThingModel(entity, saveData.Stuff[thingName], _this);
            _this.models.push(model);
            _this.modelLookup[thingName] = model;
            var lastInitialize = initialize;
            initialize = function () {
                model.Initialize();
                lastInitialize();
            };
        });
        initialize();
        this.gameEvent.Fire(function (callback) { return callback(); });
    };
    return GameState;
})();
var ThingModel = (function () {
    function ThingModel(Entity, saveData, gameState) {
        this.Entity = Entity;
        this.gameState = gameState;
        this.thingName = this.Entity.GetName();
        this.createProperties(saveData);
        this.legacyEvents();
    }
    // should be called only once all models are created
    ThingModel.prototype.Initialize = function () {
        this.components = [];
        this.components.push(new CostComponent(this, this.gameState));
        // if we don't have infinite space, we need to track capacity
        if (this.Entity.Capacity.Get() !== -1) {
            this.components.push(new CapacityComponent(this, this.gameState));
        }
    };
    // Purchase one of this type
    ThingModel.prototype.Buy = function () {
    };
    ThingModel.prototype.createProperties = function (saveData) {
        var _this = this;
        // values from the game save
        this.Revealed = new Property(saveData.IsRevealed);
        this.CapacityRevealed = new Property(saveData.IsCapShown);
        this.Count = new Property(saveData.Count);
        // derivative values
        this.CanAfford = new Property(true);
        this.AtCapacity = new Property(false);
        this.Capacity = new Property(-1);
        this.Price = new Property({});
        // calculated properties
        this.Purchasable = new Property(false);
        var updatePurchable = function () { return _this.Purchasable.Set(_this.CanAfford.Get() && !_this.AtCapacity.Get()); };
        this.CanAfford.Event().Register(updatePurchable);
        this.AtCapacity.Event().Register(updatePurchable);
    };
    ThingModel.prototype.saveEvents = function () {
        var _this = this;
        // need cleanup
        this.CapacityRevealed.Event().Register(function (reveal) { return saveData.Stuff[_this.thingName].IsCapShown = reveal; });
    };
    ThingModel.prototype.legacyEvents = function () {
        var _this = this;
        Inventory.GetCountEvent(this.thingName).Register(function (newCount) {
            _this.Count.Set(newCount);
        });
    };
    return ThingModel;
})();
var Component = (function () {
    function Component(thingModel, gameState) {
        this.thingModel = thingModel;
        this.gameState = gameState;
        this.entity = this.thingModel.Entity;
    }
    Component.prototype.Dispose = function () { };
    return Component;
})();
var CostComponent = (function (_super) {
    __extends(CostComponent, _super);
    function CostComponent(thingModel, gameState) {
        var _this = this;
        _super.call(this, thingModel, gameState);
        this.thingModel = thingModel;
        this.gameState = gameState;
        this.refreshCleanup = function () { };
        this.refresh();
        this.updateCost();
        var unreg = this.thingModel.Count.Event().Register(function () { return _this.updateCost(); });
        var unreg2 = gameState.GetEvent().Register(function () {
            _this.refresh();
            _this.updateCost();
        });
        this.cleanupComponent = function () {
            unreg();
            unreg2();
        };
    }
    // call this when you're getting rid of this component
    CostComponent.prototype.Dispose = function () {
        this.cleanupComponent();
        this.refreshCleanup();
    };
    CostComponent.prototype.refresh = function () {
        var _this = this;
        var unregs = [];
        var u = function (unreg) { return unregs.push(unreg); };
        var cost = this.entity.Cost.Get();
        if (cost) {
            Object.keys(cost).forEach(function (affected) {
                return u(_this.gameState.Model(affected).Count.Event()
                    .Register(function () { return _this.updateAffordability(); }));
            });
        }
        // remove old callbacks
        this.refreshCleanup();
        this.refreshCleanup = function () { return unregs.forEach(function (unreg) { return unreg(); }); };
    };
    CostComponent.prototype.updateCost = function () {
        var cost = this.entity.Cost.Get();
        if (!cost) {
            return {};
        }
        var ratio = this.entity.CostRatio.Get();
        if (ratio === 0) {
            this.thingModel.Price.Set(cost);
            return;
        }
        if (!ratio) {
            ratio = 1.15;
        }
        var currentPrice = {};
        var count = this.thingModel.Count.Get();
        var multiplier = Math.pow(ratio, count);
        Object.keys(cost).forEach(function (thingName) {
            currentPrice[thingName] = Math.floor(cost[thingName] * multiplier);
        });
        this.thingModel.Price.Set(currentPrice);
        this.updateAffordability();
    };
    CostComponent.prototype.updateAffordability = function () {
        var price = this.thingModel.Price.Get();
        var canAfford = true;
        if (price) {
            canAfford = Object.keys(price).every(function (thingName) {
                return game.Model(thingName).Count.Get() >= price[thingName];
            });
        }
        this.thingModel.CanAfford.Set(canAfford);
    };
    return CostComponent;
})(Component);
var CapacityComponent = (function (_super) {
    __extends(CapacityComponent, _super);
    function CapacityComponent(thingModel, gameState) {
        var _this = this;
        _super.call(this, thingModel, gameState);
        this.thingModel = thingModel;
        this.gameState = gameState;
        this.refreshCleanup = function () { };
        this.refresh();
        this.updateCapacity();
        var unreg = this.thingModel.Count.Event().Register(function () { return _this.updateCapacityRevealed(); });
        var unreg2 = gameState.GetEvent().Register(function () { return _this.refresh(); });
        this.cleanupComponent = function () {
            unreg();
            unreg2();
        };
    }
    // call this when you're getting rid of this component
    CapacityComponent.prototype.Dispose = function () {
        this.cleanupComponent();
        this.refreshCleanup();
    };
    CapacityComponent.prototype.refresh = function () {
        var _this = this;
        var effectTable = {};
        this.gameState.GetEntities().forEach(function (entity) {
            var effects = entity.CapacityEffect.Get();
            if (!effects) {
                return;
            }
            var effect = effects[_this.entity.GetName()];
            if (effect) {
                effectTable[entity.GetName()] = effect;
            }
        });
        var initial = this.entity.Capacity.Get();
        var affecting = Object.keys(effectTable);
        this.calculateCapacity = function () { return affecting.reduce(function (sum, affecting) { return sum
            + _this.gameState.Model(affecting).Count.Get()
                * effectTable[affecting]; }, initial); };
        this.calculateCapacityRevealed = function () { return _this.thingModel.Count.Get() > _this.thingModel.Capacity.Get(); };
        var unregs = [];
        var u = function (unreg) { return unregs.push(unreg); };
        affecting.forEach(function (affected) {
            return u(_this.gameState.Model(affected).Count.Event()
                .Register(function () { return _this.updateCapacity(); }));
        });
        // remove old callbacks
        this.refreshCleanup();
        this.refreshCleanup = function () { return unregs.forEach(function (unreg) { return unreg(); }); };
    };
    CapacityComponent.prototype.updateCapacity = function () {
        this.thingModel.Capacity.Set(this.calculateCapacity());
        this.updateCapacityRevealed();
    };
    CapacityComponent.prototype.updateCapacityRevealed = function () {
        var capacity = this.thingModel.Capacity.Get();
        if (capacity === -1) {
            this.thingModel.AtCapacity.Set(false);
            this.thingModel.CapacityRevealed.Set(false);
            return;
        }
        var atCapacity = this.thingModel.Count.Get() >= capacity;
        this.thingModel.AtCapacity.Set(atCapacity);
        if (atCapacity) {
            this.thingModel.CapacityRevealed.Set(true);
        }
    };
    return CapacityComponent;
})(Component);
var Inventory;
(function (Inventory) {
    function Initialize(entities) {
        entities.forEach(function (entity) { return initializeEntity(entity); });
    }
    Inventory.Initialize = Initialize;
    function initializeRevealEnabled(entity) {
        if (!entity.Display.Get()) {
            return;
        }
        var thingName = entity.GetName();
        var purchasable = game.Model(thingName).Purchasable.Get();
        var count = GetCount(thingName);
        if (count > 0 || purchasable) {
            SetReveal(thingName, true);
        }
    }
    function initializeEntity(entity) {
        var thingName = entity.GetName();
        var registerCostEvents = function () {
            var events = [];
            var price = game.Model(thingName).Price.Get();
            var callback = function () { return initializeRevealEnabled(entity); };
            Object.keys(price).forEach(function (needed) {
                events.push(Inventory.GetCountEvent(needed).Register(callback));
            });
            events.push(Inventory.GetCountEvent(thingName).Register(callback));
            events.push(game.Model(thingName).Capacity.Event().Register(callback));
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
    }
    var costEventMap = {};
    function GetCount(thingName) {
        return saveData.Stuff[thingName].Count;
    }
    Inventory.GetCount = GetCount;
    function ChangeCount(thingName, delta) {
        var initialCount = saveData.Stuff[thingName].Count;
        var capacity = game.Model(thingName).Capacity.Get();
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
    }
    function SetReveal(thingName, revealed) {
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
        return game.Model(thingName).Capacity.Get();
    }
    Inventory.GetCapacity = GetCapacity;
    // full game reset
    function Reset() {
        var names = Object.keys(entityByName);
        names.forEach(function (thingName) { return SetCount(thingName, 0); });
        names.forEach(function (thingName) {
            // TODO: this should also check capacity
            SetReveal(thingName, false);
            game.Model(thingName).CapacityRevealed.Set(false);
        });
        names.forEach(function (thingName) { return initializeRevealEnabled(entityByName[thingName]); });
    }
    Inventory.Reset = Reset;
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
    // for showing that things exist at all
    var revealEvent = new ThingEvent();
    Inventory.GetRevealEvent = function (thingName) { return revealEvent.GetEvent(thingName); };
})(Inventory || (Inventory = {}));
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
function tryBuy(thingToBuy) {
    var thingModel = game.Model(thingToBuy);
    var price = thingModel.Price.Get();
    if (!thingModel.Purchasable.Get()) {
        return;
    }
    Object.keys(price).forEach(function (thingName) { return Inventory.ChangeCount(thingName, -price[thingName]); });
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
    var entities = definitions.map(function (thingType) { return new ThingType(thingType); });
    addNewEntities(entities);
    setInterval(onInterval, 200);
}
function addNewEntities(entities) {
    entities.forEach(function (entity) { return entityByName[entity.GetName()] = entity; });
    initializeSaveData();
    game.addEntities(entities, saveData);
    Inventory.Initialize(entities);
    thingViewModels.AddEntities(entities);
    entities.forEach(function (entity) { return createElementsForEntity(entity.GetName()); });
    Object.keys(entityByName).forEach(function (thingName) { return things[entityByName[thingName].Display.Get()] = entityByName[thingName]; });
}
// i think i need something that will fire when the page finished loading
window.onload = onLoad;
var entityByName = {};
var thingViewModels = new ThingViewModelCollection();
var game = new GameState();
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
    addNewEntities([new ThingType(newThingType)]);
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
    var entities = newDefs.map(function (thingType) { return new ThingType(thingType); });
    addNewEntities(entities);
    definitions = newDefs;
}
//# sourceMappingURL=app.js.map