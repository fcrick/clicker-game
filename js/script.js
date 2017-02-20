var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define("gamedata", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.definitions = [
        {
            name: 'tt-Point',
            display: 'Beer',
            capacity: 100
        },
        {
            name: 'tt-Scorer1',
            display: 'Delivery Guy',
            title: 'Delivers to you 1 Beer per tick',
            capacity: -1,
            cost: {
                'tt-Point': 10
            },
            income: {
                'tt-Point': 1
            }
        },
        {
            name: 'tt-Scorer2',
            display: 'Microbrewery',
            title: 'Makes a lot more Beer and stores Kegs',
            capacity: -1,
            cost: {
                'tt-FixedPrice1': 25
            },
            capacityEffect: {
                'tt-PointHolder1': 25
            },
            income: {
                'tt-Point': 5
            }
        },
        {
            name: 'tt-Scorer3',
            display: 'Taxi Driver',
            title: 'Earns Benjamins and skim a lot off the top',
            capacity: 0,
            cost: {
                'tt-Point': 100
            },
            income: {
                'tt-FractionOfFixedPrice1': 10
            }
        },
        {
            name: 'tt-PointHolder1',
            display: 'Keg',
            title: 'Increases Beer capacity',
            capacity: 50,
            cost: {
                'tt-Point': 25
            },
            capacityEffect: {
                'tt-Point': 10,
                'tt-FractionOfPointHolder1': 10
            },
            progressThing: 'tt-FractionOfPointHolder1'
        },
        {
            name: 'tt-PointHolder2',
            display: 'Garage',
            title: 'Holds taxis',
            capacity: -1,
            cost: {
                'tt-FixedPrice1': 10
            },
            costRatio: 1.3,
            capacityEffect: {
                'tt-Scorer3': 2
            }
        },
        {
            name: 'tt-PointHolder3',
            display: 'Swimming Pool',
            title: 'A storage facility for Beer',
            capacity: -1,
            cost: {
                'tt-Point': 400
            },
            capacityEffect: {
                'tt-Point': 200
            }
        },
        {
            name: 'tt-PointHolder4',
            display: 'Piggy Bank',
            title: 'Increases Benjamin capacity',
            capacity: -1,
            cost: {
                'tt-Point': 4000
            },
            capacityEffect: {
                'tt-FixedPrice1': 100
            },
            progressThing: 'tt-FractionOfPointHolder4'
        },
        {
            name: 'tt-FixedPrice1',
            display: 'Benjamin',
            title: 'One hundred dollar bills',
            cost: {
                'tt-Point': 250
            },
            capacityEffect: {
                'tt-FractionOfFixedPrice1': 1
            },
            capacity: 100,
            costRatio: 1
        },
        {
            name: 'tt-PointHolderMaker1',
            display: 'Keg Delivery Guy',
            title: 'Delivers free Kegs to you...eventually',
            capacity: -1,
            cost: {
                'tt-FixedPrice1': 5
            },
            income: {
                'tt-FractionOfPointHolder1': 1
            }
        },
        {
            name: 'tt-FractionOfPointHolder1',
            capacity: 100,
            zeroAtCapacity: true,
            incomeWhenZeroed: {
                'tt-PointHolder1': 1
            }
        },
        {
            name: 'tt-FractionOfFixedPrice1',
            capacity: 50,
            zeroAtCapacity: true,
            incomeWhenZeroed: {
                'tt-FixedPrice1': 1
            }
        },
        {
            name: 'tt-XpEarner',
            capacity: -1,
            display: "Macrobrewery",
            income: {
                'tt-Click': 1
            },
            cost: {
                'tt-Scorer2': 20,
                'tt-PointHolder3': 10,
                'tt-PointHolder4': 1
            },
            capacityEffect: {
                'tt-Click': 10000
            }
        },
        {
            name: 'tt-Click',
            capacity: 0,
            display: "Click"
        },
        {
            name: 'tt-Hero',
            display: 'Hero',
            title: 'Made of clicks. Finds Piggy Banks.',
            capacity: -1,
            cost: {
                'tt-Click': 50
            },
            income: {
                'tt-FractionOfPointHolder4': 1
            }
        },
        {
            name: 'tt-FractionOfPointHolder4',
            capacity: 10000,
            zeroAtCapacity: true,
            incomeWhenZeroed: {
                'tt-PointHolder4': 1
            }
        },
        {
            name: 'tt-Scorer4',
            display: 'Company',
            title: 'Makes money',
            capacity: -1,
            cost: {
                'tt-Hero': 20
            },
            costRatio: 1.1,
            income: {
                'tt-FractionOfFixedPrice1': 1000
            }
        },
    ];
});
define("views", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.thingRow = {
        view: function (vm) {
            // row
            return m('.row', { style: { display: 'flex', alignItems: 'center' } }, [
                // name
                m('.col-sm-2', [
                    m('div', {
                        "class": 'progress progress-bar',
                        style: { width: Math.floor(vm.Progress() * 500) / 10 + '%' }
                    }),
                    vm.DisplayText()
                ]),
                // count
                m('.col-sm-2', [
                    m('span', vm.Count()),
                    vm.CapacityShown() ? m('span', ' / ') : '',
                    vm.CapacityShown() ? m('span', vm.Capacity()) : '',
                ]),
                // button
                m('.col-sm-2', [
                    m('button', {
                        title: vm.ButtonTitle(),
                        "class": 'btn btn-primary',
                        disabled: !vm.ButtonEnabled(),
                        onclick: vm.Buy
                    }, [
                        vm.ButtonText(),
                    ]),
                ]),
            ]);
        }
    };
});
define("event", ["require", "exports"], function (require, exports) {
    "use strict";
    var GameEvent = (function () {
        function GameEvent() {
            this.callbacks = [];
        }
        GameEvent.prototype.Register = function (callback) {
            var _this = this;
            this.callbacks.push(callback);
            return function () { return _this.unregister(callback); };
        };
        GameEvent.prototype.unregister = function (callback) {
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
    }());
    exports.GameEvent = GameEvent;
    // we use assign to merge this class and a callable object to get the interface
    // we want.
    var PropertyInternal = (function () {
        function PropertyInternal() {
            this.hasFired = false;
        }
        PropertyInternal.prototype.getSet = function (value) {
            var _this = this;
            // call with no argument to get, otherwise set
            if (value === undefined) {
                return this.current;
            }
            if (typeof value === "function") {
                setTimeout(function () {
                    var val = value();
                    _this.setValue(val);
                });
            }
            else {
                this.setValue(value);
            }
        };
        PropertyInternal.prototype.setValue = function (value) {
            var _this = this;
            // setValue always fires the first time, even without a change in value.
            if (this.current === value && this.hasFired) {
                return this.current;
            }
            this.hasFired = true;
            var previous = this.current;
            this.current = value;
            this.event.Fire(function (callback) { return callback(_this.current, previous); });
            return this.current;
        };
        PropertyInternal.prototype.Event = function () {
            return this.event;
        };
        return PropertyInternal;
    }());
    var Property;
    (function (Property) {
        function create(current) {
            var property = (function (value) {
                return property.getSet(value);
            });
            property.getSet = PropertyInternal.prototype.getSet.bind(property);
            property.setValue = PropertyInternal.prototype.setValue.bind(property);
            property.Event = PropertyInternal.prototype.Event.bind(property);
            property.event = new GameEvent();
            property.current = current;
            property.hasFired = false;
            return property;
        }
        Property.create = create;
    })(Property = exports.Property || (exports.Property = {}));
});
define("app", ["require", "exports", "gamedata", "views", "event"], function (require, exports, gamedata, views, event_1) {
    "use strict";
    var definitions = gamedata.definitions;
    var thingRow = views.thingRow;
    var resetButton = document.getElementById("resetButton");
    var myText = document.getElementById("helloText");
    resetButton.addEventListener('click', resetEverything, false);
    ;
    var saveData;
    ;
    var ThingType = (function () {
        function ThingType(tt) {
            this.name = tt.name;
            this.Display = event_1.Property.create(tt.display);
            this.Title = event_1.Property.create(tt.title);
            this.Cost = event_1.Property.create(tt.cost);
            this.Capacity = event_1.Property.create(tt.capacity);
            this.Income = event_1.Property.create(tt.income);
            this.CapacityEffect = event_1.Property.create(tt.capacityEffect);
            this.CostRatio = event_1.Property.create(tt.costRatio);
            this.ZeroAtCapacity = event_1.Property.create(tt.zeroAtCapacity);
            this.IncomeWhenZeroed = event_1.Property.create(tt.incomeWhenZeroed);
            this.ProgressThing = event_1.Property.create(tt.progressThing);
        }
        ThingType.prototype.GetName = function () {
            return this.name;
        };
        return ThingType;
    }());
    var ThingViewModelCollection = (function () {
        function ThingViewModelCollection() {
            this.viewModels = {};
        }
        ThingViewModelCollection.prototype.AddEntities = function (entities) {
            var _this = this;
            entities.forEach(function (entity) {
                var thingName = entity.GetName();
                if (game.Model(thingName).Revealed()) {
                    _this.viewModels[thingName] = new ThingViewModel(entity);
                }
                game.Model(thingName).Revealed.Event().Register(function (revealed) {
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
    }());
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
            this.DisplayText = event_1.Property.create(this.thingType.Display());
            this.Progress = event_1.Property.create(this.calculateProgress());
            this.Count = event_1.Property.create(this.model.Count());
            this.CapacityShown = event_1.Property.create(this.model.CapacityRevealed());
            this.Capacity = event_1.Property.create(this.model.Capacity());
            this.ButtonText = event_1.Property.create(this.calculateButtonText());
            this.ButtonEnabled = event_1.Property.create(this.model.Purchasable());
            this.ButtonTitle = event_1.Property.create(this.thingType.Title());
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
            var progressThing = this.thingType.ProgressThing();
            if (progressThing) {
                var progresModel = game.Model(progressThing);
                this.progressUnreg = progresModel.Count.Event().Register(function () { return _this.Progress(_this.calculateProgress()); });
                this.Progress(this.calculateProgress());
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
            var cost = this.thingType.Cost();
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
                _this.DisplayText(newName);
                _this.ButtonText(_this.calculateButtonText());
            }));
            this.setupProgressEvent();
            u(this.model.Count.Event().Register(function () {
                _this.Count(function () { return _this.model.Count(); });
            }));
            u(this.model.Price.Event().Register(function () {
                _this.ButtonText(_this.calculateButtonText());
            }));
            u(this.model.CapacityRevealed.Event().Register(function (reveal) { return _this.CapacityShown(reveal); }));
            u(this.model.Capacity.Event().Register(function (newCapacity) { return _this.Capacity(newCapacity); }));
            u(this.model.Purchasable.Event().Register(function (enabled) { return _this.ButtonEnabled(enabled); }));
            u(this.thingType.Title.Event().Register(function (newTitle) { return _this.ButtonTitle(newTitle); }));
        };
        ThingViewModel.prototype.calculateProgress = function () {
            var progressThing = this.thingType.ProgressThing();
            if (!progressThing) {
                return 0;
            }
            if (this.model.Count() === this.model.Capacity()) {
                return 0;
            }
            var progressModel = game.Model(progressThing);
            return progressModel.Count() / progressModel.Capacity();
        };
        ThingViewModel.prototype.calculateButtonText = function () {
            var price = this.model.Price();
            var costString = Object.keys(price).map(function (thingName) {
                return price[thingName] + ' ' + entityByName[thingName].Display();
            }).join(', ');
            if (!costString) {
                costString = "FREE!";
            }
            return 'Buy a ' + this.thingType.Display() + ' for ' + costString;
        };
        return ThingViewModel;
    }());
    exports.ThingViewModel = ThingViewModel;
    var GameState = (function () {
        function GameState() {
            this.entities = [];
            this.thingNames = [];
            this.entityLookup = {};
            this.models = [];
            this.modelLookup = {};
            this.gameEvent = new event_1.GameEvent();
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
    }());
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
            this.Revealed(this.shouldReveal());
        };
        ThingModel.prototype.Reset = function () {
            this.everRevealed = false;
            this.Revealed(false);
            this.Count(0);
            this.CapacityRevealed(false);
        };
        // Purchase one of this type
        ThingModel.prototype.Buy = function () {
            var price = this.Price();
            if (!this.Purchasable()) {
                return;
            }
            Object.keys(price).forEach(function (thingName) {
                var count = game.Model(thingName).Count;
                var current = count();
                count(current - price[thingName]);
            });
            this.Count(this.Count() + 1);
        };
        ThingModel.prototype.createProperties = function (saveData) {
            var _this = this;
            // values from the game save
            this.everRevealed = saveData.IsRevealed;
            this.Revealed = event_1.Property.create(saveData.IsRevealed);
            this.Revealed.Event().Register(function (reveal) { return _this.everRevealed = _this.everRevealed || reveal; });
            this.CapacityRevealed = event_1.Property.create(saveData.IsCapShown);
            this.Count = event_1.Property.create(saveData.Count);
            // derivative values
            this.CanAfford = event_1.Property.create(true);
            this.AtCapacity = event_1.Property.create(false);
            this.Capacity = event_1.Property.create(-1);
            this.Price = event_1.Property.create({});
            // calculated properties
            this.Purchasable = event_1.Property.create(false);
            var updatePurchasable = function () { return _this.Purchasable(_this.CanAfford() && !_this.AtCapacity()); };
            this.CanAfford.Event().Register(updatePurchasable);
            this.AtCapacity.Event().Register(updatePurchasable);
            var updateRevealed = function () { return _this.Revealed(_this.shouldReveal()); };
            // show if we have any, or can buy any
            this.Count.Event().Register(updateRevealed);
            this.Purchasable.Event().Register(updateRevealed);
        };
        ThingModel.prototype.shouldReveal = function () {
            // don't show things without display names
            if (!entityByName[this.thingName].Display()) {
                return false;
            }
            if (this.everRevealed) {
                return true;
            }
            return this.Count() > 0 || this.Purchasable();
        };
        ThingModel.prototype.saveEvents = function () {
            var _this = this;
            this.CapacityRevealed.Event().Register(function (reveal) { return saveData.Stuff[_this.thingName].IsCapShown = reveal; });
            this.Revealed.Event().Register(function (reveal) { return saveData.Stuff[_this.thingName].IsRevealed = reveal; });
            this.Count.Event().Register(function (count) { return saveData.Stuff[_this.thingName].Count = count; });
        };
        return ThingModel;
    }());
    var Component = (function () {
        function Component(model, gameState) {
            this.model = model;
            this.gameState = gameState;
            this.type = this.model.Type;
        }
        Component.prototype.Dispose = function () { };
        return Component;
    }());
    var CostComponent = (function (_super) {
        __extends(CostComponent, _super);
        function CostComponent(model, gameState) {
            var _this = _super.call(this, model, gameState) || this;
            _this.model = model;
            _this.gameState = gameState;
            _this.refreshCleanup = function () { };
            _this.refresh();
            _this.updateCost();
            var unreg = _this.model.Count.Event().Register(function () { return _this.updateCost(); });
            var unreg2 = gameState.GetEvent().Register(function () {
                _this.refresh();
                _this.updateCost();
            });
            _this.cleanupComponent = function () {
                unreg();
                unreg2();
            };
            return _this;
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
            var cost = this.type.Cost();
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
            var cost = this.type.Cost();
            if (!cost) {
                return {};
            }
            var ratio = this.type.CostRatio();
            if (ratio === 0) {
                this.model.Price(cost);
                return;
            }
            if (!ratio) {
                ratio = 1.15;
            }
            var currentPrice = {};
            var count = this.model.Count();
            var multiplier = Math.pow(ratio, count);
            Object.keys(cost).forEach(function (thingName) {
                currentPrice[thingName] = Math.floor(cost[thingName] * multiplier);
            });
            this.model.Price(currentPrice);
            this.updateAffordability();
        };
        CostComponent.prototype.updateAffordability = function () {
            var price = this.model.Price();
            var canAfford = true;
            if (price) {
                canAfford = Object.keys(price).every(function (thingName) {
                    return game.Model(thingName).Count() >= price[thingName];
                });
            }
            this.model.CanAfford(canAfford);
        };
        return CostComponent;
    }(Component));
    var CapacityComponent = (function (_super) {
        __extends(CapacityComponent, _super);
        function CapacityComponent(model, gameState) {
            var _this = _super.call(this, model, gameState) || this;
            _this.model = model;
            _this.gameState = gameState;
            _this.refreshCleanup = function () { };
            _this.refresh();
            _this.updateCapacity();
            var unreg = _this.model.Count.Event().Register(function (curr, prev) { return _this.onCountChange(curr, prev); });
            var unreg2 = gameState.GetEvent().Register(function () { return _this.refresh(); });
            _this.cleanupComponent = function () {
                unreg();
                unreg2();
            };
            return _this;
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
                var effects = entity.CapacityEffect();
                if (!effects) {
                    return;
                }
                var effect = effects[_this.type.GetName()];
                if (effect) {
                    effectTable[entity.GetName()] = effect;
                }
            });
            var initial = this.type.Capacity();
            var affecting = Object.keys(effectTable);
            this.calculateCapacity = function () { return affecting.reduce(function (sum, affecting) { return sum
                + _this.gameState.Model(affecting).Count()
                    * effectTable[affecting]; }, initial); };
            this.calculateCapacityRevealed = function () { return _this.model.Count() > _this.model.Capacity(); };
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
            this.model.Capacity(capacity);
            this.updateCapacityRevealed();
        };
        // called when the count of our owner changes
        CapacityComponent.prototype.onCountChange = function (current, previous) {
            var capacity = this.model.Capacity();
            if (capacity === -1) {
                return;
            }
            // check if we're over capacity
            var countProp = this.model.Count;
            var count = countProp();
            if (count >= capacity) {
                // check if we're a special zero-at-capacity type
                if (this.type.ZeroAtCapacity()) {
                    var timesOver = Math.floor(count / capacity);
                    countProp(current - timesOver * capacity);
                    var income = this.type.IncomeWhenZeroed();
                    if (income) {
                        Object.keys(income).forEach(function (earnedThing) {
                            var earnedCount = game.Model(earnedThing).Count;
                            earnedCount(earnedCount() + income[earnedThing] * timesOver);
                        });
                    }
                }
                else {
                    countProp(capacity);
                }
            }
            this.updateCapacityRevealed();
        };
        CapacityComponent.prototype.updateCapacityRevealed = function () {
            var capacity = this.model.Capacity();
            if (capacity === -1) {
                this.model.AtCapacity(false);
                this.model.CapacityRevealed(false);
                return;
            }
            var atCapacity = this.model.Count() >= capacity;
            this.model.AtCapacity(atCapacity);
            if (atCapacity) {
                this.model.CapacityRevealed(true);
            }
        };
        return CapacityComponent;
    }(Component));
    function createElementsForEntity(thingName) {
        var model = game.Model(thingName);
        if (model.Revealed()) {
            createThingRow(thingName);
        }
        var create = function (reveal, previous) {
            if (reveal && !previous) {
                createThingRow(thingName);
            }
        };
        model.Revealed.Event().Register(create);
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
            controller: function () { return ({
                onunload: function (e) { return toUnload.forEach(function (u) { return u(); }); }
            }); },
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
        unregReveal = game.Model(thingName).Revealed.Event().Register(function (revealed) {
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
                    IsCapShown: false
                };
            }
        });
    }
    function onInterval() {
        Object.keys(entityByName).forEach(function (thingName) {
            var model = game.Model(thingName);
            var type = model.Type;
            var income = type.Income();
            var count = game.Model(thingName).Count();
            if (income && count) {
                Object.keys(income).forEach(function (earnedName) {
                    var countProp = game.Model(earnedName).Count;
                    countProp(countProp() + income[earnedName] * count);
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
        thingViewModels.AddEntities(entities);
        entities.forEach(function (entity) { return createElementsForEntity(entity.GetName()); });
        Object.keys(entityByName).forEach(function (thingName) { return things[entityByName[thingName].Display()] = entityByName[thingName]; });
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
                'tt-Point': 10
            },
            income: {
                'tt-Point': 1
            }
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
});
