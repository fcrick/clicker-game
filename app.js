/// <reference path="mithril.d.ts"/>
/// <reference path="event.ts"/>
/// <reference path="gamedata.ts"/>
/// <reference path="views.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
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
    function ThingViewModel(thingType) {
        var _this = this;
        this.thingType = thingType;
        this.Buy = function () { return _this.model.Buy(); };
        this.unregs = [];
        this.costUnregs = [];
        this.thingName = this.thingType.GetName();
        this.model = game.Model(this.thingName);
        // fill in initial values
        this.DisplayText = new Property(this.thingType.Display.Get());
        this.Progress = new Property(this.calculateProgress());
        this.Count = new Property(this.model.Count.Get());
        this.CapacityShown = new Property(this.model.CapacityRevealed.Get());
        this.Capacity = new Property(this.model.Capacity.Get());
        this.ButtonText = new Property(this.calculateButtonText());
        this.ButtonEnabled = new Property(this.model.Purchasable.Get());
        this.ButtonTitle = new Property(this.thingType.Title.Get());
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
        var progressThing = this.thingType.ProgressThing.Get();
        if (progressThing) {
            var progresModel = game.Model(progressThing);
            this.progressUnreg = progresModel.Count.Event().Register(function () { return _this.Progress.Set(_this.calculateProgress()); });
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
        var cost = this.thingType.Cost.Get();
        if (cost) {
            Object.keys(cost).forEach(function (costName) {
                u(entityByName[costName].Display.Event().Register(function () { return _this.calculateButtonText(); }));
            });
        }
        u(this.thingType.Cost.Event().Register(function () { return _this.setupButtonTextEvents(); }));
    };
    ThingViewModel.prototype.setupEvents = function () {
        var _this = this;
        var u = function (callback) { return _this.unregs.push(callback); };
        // set up events so properties update correctly
        u(this.thingType.Display.Event().Register(function (newName) {
            _this.DisplayText.Set(newName);
            _this.ButtonText.Set(_this.calculateButtonText());
        }));
        this.setupProgressEvent();
        u(this.model.Count.Event().Register(function () {
            _this.Count.Set(function () { return _this.model.Count.Get(); });
        }));
        u(this.model.Price.Event().Register(function () {
            _this.ButtonText.Set(_this.calculateButtonText());
        }));
        u(this.model.CapacityRevealed.Event().Register(function (reveal) { return _this.CapacityShown.Set(reveal); }));
        u(this.model.Capacity.Event().Register(function (newCapacity) { return _this.Capacity.Set(newCapacity); }));
        u(this.model.Purchasable.Event().Register(function (enabled) { return _this.ButtonEnabled.Set(enabled); }));
        u(this.thingType.Title.Event().Register(function (newTitle) { return _this.ButtonTitle.Set(newTitle); }));
    };
    ThingViewModel.prototype.calculateProgress = function () {
        var progressThing = this.thingType.ProgressThing.Get();
        if (!progressThing) {
            return 0;
        }
        if (this.model.Count.Get() === this.model.Capacity.Get()) {
            return 0;
        }
        var progressModel = game.Model(progressThing);
        return progressModel.Count.Get() / progressModel.Capacity.Get();
    };
    ThingViewModel.prototype.calculateButtonText = function () {
        var price = this.model.Price.Get();
        var costString = Object.keys(price).map(function (thingName) {
            return price[thingName] + ' ' + entityByName[thingName].Display.Get();
        }).join(', ');
        if (!costString) {
            costString = "FREE!";
        }
        return 'Buy a ' + this.thingType.Display.Get() + ' for ' + costString;
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
    function ThingModel(Type, saveData, gameState) {
        this.Type = Type;
        this.gameState = gameState;
        this.thingName = this.Type.GetName();
        this.createProperties(saveData);
        this.saveEvents();
    }
    // should be called only once all models are created
    ThingModel.prototype.Initialize = function () {
        this.components = [
            new CostComponent(this, this.gameState),
            new CapacityComponent(this, this.gameState),
        ];
        if (this.Count.Get() > 0 || this.Purchasable.Get()) {
            this.Revealed.Set(true);
        }
    };
    ThingModel.prototype.Reset = function () {
        this.Revealed.Set(false);
        this.Count.Set(0);
        this.CapacityRevealed.Set(false);
    };
    // Purchase one of this type
    ThingModel.prototype.Buy = function () {
        var price = this.Price.Get();
        if (!this.Purchasable.Get()) {
            return;
        }
        Object.keys(price).forEach(function (thingName) {
            var count = game.Model(thingName).Count;
            var current = count.Get();
            count.Set(current - price[thingName]);
        });
        this.Count.Set(this.Count.Get() + 1);
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
        var updatePurchasable = function () { return _this.Purchasable.Set(_this.CanAfford.Get() && !_this.AtCapacity.Get()); };
        this.CanAfford.Event().Register(updatePurchasable);
        this.AtCapacity.Event().Register(updatePurchasable);
        // show if we have any, or can buy any
        var updateRevealed = function () { return _this.Revealed.Set(_this.Count.Get() > 0 || _this.Purchasable.Get()); };
        this.Count.Event().Register(updateRevealed);
        this.Purchasable.Event().Register(updateRevealed);
    };
    ThingModel.prototype.saveEvents = function () {
        var _this = this;
        this.CapacityRevealed.Event().Register(function (reveal) { return saveData.Stuff[_this.thingName].IsCapShown = reveal; });
        this.Revealed.Event().Register(function (reveal) { return saveData.Stuff[_this.thingName].IsRevealed = reveal; });
        this.Count.Event().Register(function (count) { return saveData.Stuff[_this.thingName].Count = count; });
    };
    return ThingModel;
})();
var Component = (function () {
    function Component(model, gameState) {
        this.model = model;
        this.gameState = gameState;
        this.type = this.model.Type;
    }
    Component.prototype.Dispose = function () { };
    return Component;
})();
var CostComponent = (function (_super) {
    __extends(CostComponent, _super);
    function CostComponent(model, gameState) {
        var _this = this;
        _super.call(this, model, gameState);
        this.model = model;
        this.gameState = gameState;
        this.refreshCleanup = function () { };
        this.refresh();
        this.updateCost();
        var unreg = this.model.Count.Event().Register(function () { return _this.updateCost(); });
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
        var cost = this.type.Cost.Get();
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
        var cost = this.type.Cost.Get();
        if (!cost) {
            return {};
        }
        var ratio = this.type.CostRatio.Get();
        if (ratio === 0) {
            this.model.Price.Set(cost);
            return;
        }
        if (!ratio) {
            ratio = 1.15;
        }
        var currentPrice = {};
        var count = this.model.Count.Get();
        var multiplier = Math.pow(ratio, count);
        Object.keys(cost).forEach(function (thingName) {
            currentPrice[thingName] = Math.floor(cost[thingName] * multiplier);
        });
        this.model.Price.Set(currentPrice);
        this.updateAffordability();
    };
    CostComponent.prototype.updateAffordability = function () {
        var price = this.model.Price.Get();
        var canAfford = true;
        if (price) {
            canAfford = Object.keys(price).every(function (thingName) {
                return game.Model(thingName).Count.Get() >= price[thingName];
            });
        }
        this.model.CanAfford.Set(canAfford);
    };
    return CostComponent;
})(Component);
var CapacityComponent = (function (_super) {
    __extends(CapacityComponent, _super);
    function CapacityComponent(model, gameState) {
        var _this = this;
        _super.call(this, model, gameState);
        this.model = model;
        this.gameState = gameState;
        this.refreshCleanup = function () { };
        this.refresh();
        this.updateCapacity();
        var unreg = this.model.Count.Event().Register(function (curr, prev) { return _this.onCountChange(curr, prev); });
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
            var effect = effects[_this.type.GetName()];
            if (effect) {
                effectTable[entity.GetName()] = effect;
            }
        });
        var initial = this.type.Capacity.Get();
        var affecting = Object.keys(effectTable);
        this.calculateCapacity = function () { return affecting.reduce(function (sum, affecting) { return sum
            + _this.gameState.Model(affecting).Count.Get()
                * effectTable[affecting]; }, initial); };
        this.calculateCapacityRevealed = function () { return _this.model.Count.Get() > _this.model.Capacity.Get(); };
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
        var capacity = this.calculateCapacity();
        this.model.Capacity.Set(capacity);
        this.updateCapacityRevealed();
    };
    // called when the count of our owner changes
    CapacityComponent.prototype.onCountChange = function (current, previous) {
        var capacity = this.model.Capacity.Get();
        if (capacity === -1) {
            return;
        }
        // check if we're over capacity
        var countProp = this.model.Count;
        var count = countProp.Get();
        if (count >= capacity) {
            // check if we're a special zero-at-capacity type
            if (this.type.ZeroAtCapacity.Get()) {
                var timesOver = Math.floor(count / capacity);
                countProp.Set(current - timesOver * capacity);
                var income = this.type.IncomeWhenZeroed.Get();
                if (income) {
                    Object.keys(income).forEach(function (earnedThing) {
                        var earnedCount = game.Model(earnedThing).Count;
                        earnedCount.Set(earnedCount.Get() + income[earnedThing] * timesOver);
                    });
                }
            }
            else {
                countProp.Set(capacity);
            }
        }
        this.updateCapacityRevealed();
    };
    CapacityComponent.prototype.updateCapacityRevealed = function () {
        var capacity = this.model.Capacity.Get();
        if (capacity === -1) {
            this.model.AtCapacity.Set(false);
            this.model.CapacityRevealed.Set(false);
            return;
        }
        var atCapacity = this.model.Count.Get() >= capacity;
        this.model.AtCapacity.Set(atCapacity);
        if (atCapacity) {
            this.model.CapacityRevealed.Set(true);
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
    //function initializeRevealEnabled(entity: ThingType) {
    //    if (!entity.Display.Get()) {
    //        return;
    //    }
    //    var thingName = entity.GetName()
    //    var model = game.Model(thingName);
    //    var purchasable = model.Purchasable.Get();
    //    var count = model.Count.Get();
    //    if (count > 0 || purchasable) {
    //        SetReveal(thingName, true);
    //    }
    //}
    function initializeEntity(thingType) {
        var thingName = thingType.GetName();
        //var registerCostEvents = () => {
        //    var unregs: { (): void }[] = [];
        //    var u = (unreg: { (): void; }) => unregs.push(unreg);
        //    var model = game.Model(thingName);
        //    var price = model.Price.Get();
        //    var callback = () => initializeRevealEnabled(thingType);
        //    Object.keys(price).forEach(needed => {
        //        u(game.Model(needed).Count.Event().Register(callback));
        //    });
        //    u(model.Count.Event().Register(callback));
        //    u(game.Model(thingName).Capacity.Event().Register(callback));
        //    callback();
        //    if (unregs.length > 0) {
        //        costEventMap[thingName] = unregs;
        //    }
        //}
        //registerCostEvents();
        //thingType.Cost.Event().Register(capacityEffects => {
        //    costEventMap[thingName].forEach(unreg => unreg());
        //    delete costEventMap[thingName];
        //    registerCostEvents();
        //});
    }
    var costEventMap = {};
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
function resetEverything() {
    game.GetThingModels().forEach(function (model) { return model.Reset(); });
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
        var model = game.Model(thingName);
        var type = model.Type;
        var income = type.Income.Get();
        var count = game.Model(thingName).Count.Get();
        if (income && count) {
            Object.keys(income).forEach(function (earnedName) {
                var countProp = game.Model(earnedName).Count;
                countProp.Set(countProp.Get() + income[earnedName] * count);
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