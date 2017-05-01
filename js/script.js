var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("gamedata", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
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
    exports.__esModule = true;
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
    exports.__esModule = true;
    function Event() {
        var callbacks = [];
        var unregister = function (callback) {
            var index = callbacks.indexOf(callback);
            if (index === -1) {
                return false;
            }
            callbacks.splice(index, 1);
            return true;
        };
        return {
            register: function (callback) {
                callbacks.push(callback);
                return function () { return unregister(callback); };
            },
            fire: function (caller) {
                callbacks.forEach(function (callback) { return caller(callback); });
            }
        };
    }
    exports.Event = Event;
    function Property(initial) {
        // hide our internal state away in a closure
        var _a = Event(), register = _a.register, fire = _a.fire;
        var hasFired = false;
        var current = initial;
        var setValue = function (value) {
            // setValue always fires the first time, even without a change in value.
            if (current === value && hasFired) {
                return current;
            }
            hasFired = true;
            var previous = current;
            current = value;
            fire(function (callback) { return callback(current, previous); });
            return current;
        };
        // property is just a function with a single, optional argument
        var property = function (value) {
            if (value === undefined) {
                return current;
            }
            if (typeof value === "function") {
                setTimeout(function () {
                    var val = value();
                    setValue(val);
                });
            }
            else {
                setValue(value);
            }
        };
        // also allows callbacks to register for change events
        property.register = register;
        return property;
    }
    exports.Property = Property;
});
define("app", ["require", "exports", "gamedata", "views", "event"], function (require, exports, gamedata, views, event_1) {
    "use strict";
    exports.__esModule = true;
    var definitions = gamedata.definitions;
    var thingRow = views.thingRow;
    var resetButton = document.getElementById("resetButton");
    var myText = document.getElementById("helloText");
    resetButton.addEventListener('click', resetEverything, false);
    ;
    var saveData;
    // export interface ThingTypeData {
    //     name: string;
    //     display?: string; // things without display are never shown
    //     title?: string; // tooltip display
    //     cost?: NumberMap;
    //     capacity: number;
    //     income?: NumberMap;
    //     capacityEffect?: NumberMap;
    //     costRatio?: number;
    //     zeroAtCapacity?: boolean;
    //     incomeWhenZeroed?: NumberMap;
    //     progressThing?: string; // value is name of thing to show percentage of
    // }
    var requiredFields = {
        name: '',
        capacity: 0
    };
    var optionalFields = {
        display: '',
        title: '',
        cost: {},
        income: {},
        capacityEffect: {},
        costRatio: 0,
        zeroAtCapacity: false,
        incomeWhenZeroed: {},
        progressThing: ''
    };
    var keys = Object.keys;
    function propertize(obj) {
        return keys(obj).reduce(function (o, k) { return (o[k] = event_1.Property(obj[k]), o); }, {});
    }
    function withAllProperties(obj, optionals) {
        var copy = JSON.parse(JSON.stringify(optionals));
        var filledIn = keys(obj).reduce(function (o, k) { return (copy[k] = obj[k], o); }, copy);
        return propertize(filledIn);
    }
    // class ThingType {
    //     public GetName() {
    //         return this.name;
    //     }
    //     private name: string;
    //     public Display: Property<string>;
    //     public Title: Property<string>;
    //     public Cost: Property<NumberMap>;
    //     public Capacity: Property<number>;
    //     public Income: Property<NumberMap>;
    //     public CapacityEffect: Property<NumberMap>;
    //     public CostRatio: Property<number>;
    //     public ZeroAtCapacity: Property<boolean>;
    //     public IncomeWhenZeroed: Property<NumberMap>;
    //     public ProgressThing: Property<string>;
    //     constructor(tt: ThingTypeData) {
    //         keys(tt).forEach(key => this[key] = tt[key]);
    //         this.name = tt.name;
    //         this.Display = Property(tt.display);
    //         this.Title = Property(tt.title);
    //         this.Cost = Property(tt.cost);
    //         this.Capacity = Property(tt.capacity);
    //         this.Income = Property(tt.income);
    //         this.CapacityEffect = Property(tt.capacityEffect);
    //         this.CostRatio = Property(tt.costRatio);
    //         this.ZeroAtCapacity = Property(tt.zeroAtCapacity);
    //         this.IncomeWhenZeroed = Property(tt.incomeWhenZeroed);
    //         this.ProgressThing = Property(tt.progressThing);
    //     }
    // }
    var ThingViewModelCollection = (function () {
        function ThingViewModelCollection() {
            this.viewModels = {};
        }
        ThingViewModelCollection.prototype.AddEntities = function (entities) {
            var _this = this;
            entities.forEach(function (entity) {
                var thingName = entity.name();
                if (game.Model(thingName).Revealed()) {
                    _this.viewModels[thingName] = new ThingViewModel(entity);
                }
                game.Model(thingName).Revealed.register(function (revealed) {
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
            return this.viewModels[entity.name()];
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
            this.thingName = this.thingType.name();
            this.model = game.Model(this.thingName);
            // fill in initial values
            this.DisplayText = event_1.Property(this.thingType.display());
            this.Progress = event_1.Property(this.calculateProgress());
            this.Count = event_1.Property(this.model.Count());
            this.CapacityShown = event_1.Property(this.model.CapacityRevealed());
            this.Capacity = event_1.Property(this.model.Capacity());
            this.ButtonText = event_1.Property(this.calculateButtonText());
            this.ButtonEnabled = event_1.Property(this.model.Purchasable());
            this.ButtonTitle = event_1.Property(this.thingType.title());
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
            var progressThing = this.thingType.progressThing();
            if (progressThing) {
                var progresModel = game.Model(progressThing);
                this.progressUnreg = progresModel.Count.register(function () { return _this.Progress(_this.calculateProgress()); });
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
            var cost = this.thingType.cost();
            if (cost) {
                Object.keys(cost).forEach(function (costName) {
                    u(entityByName[costName].display.register(function () { return _this.calculateButtonText(); }));
                });
            }
            u(this.thingType.cost.register(function () { return _this.setupButtonTextEvents(); }));
        };
        ThingViewModel.prototype.setupEvents = function () {
            var _this = this;
            var u = function (callback) { return _this.unregs.push(callback); };
            // set up events so properties update correctly
            u(this.thingType.display.register(function (newName) {
                _this.DisplayText(newName);
                _this.ButtonText(_this.calculateButtonText());
            }));
            this.setupProgressEvent();
            u(this.model.Count.register(function () {
                _this.Count(function () { return _this.model.Count(); });
            }));
            u(this.model.Price.register(function () {
                _this.ButtonText(_this.calculateButtonText());
            }));
            u(this.model.CapacityRevealed.register(function (reveal) { return _this.CapacityShown(reveal); }));
            u(this.model.Capacity.register(function (newCapacity) { return _this.Capacity(newCapacity); }));
            u(this.model.Purchasable.register(function (enabled) { return _this.ButtonEnabled(enabled); }));
            u(this.thingType.title.register(function (newTitle) { return _this.ButtonTitle(newTitle); }));
        };
        ThingViewModel.prototype.calculateProgress = function () {
            var progressThing = this.thingType.progressThing();
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
                return price[thingName] + ' ' + entityByName[thingName].display();
            }).join(', ');
            if (!costString) {
                costString = "FREE!";
            }
            return 'Buy a ' + this.thingType.display() + ' for ' + costString;
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
            this.gameEvent = event_1.Event();
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
                var thingName = entity.name();
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
            this.gameEvent.fire(function (callback) { return callback(); });
        };
        return GameState;
    }());
    var ThingModel = (function () {
        function ThingModel(Type, saveData, gameState) {
            this.Type = Type;
            this.gameState = gameState;
            this.thingName = this.Type.name();
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
            this.Revealed = event_1.Property(saveData.IsRevealed);
            this.Revealed.register(function (reveal) { return _this.everRevealed = _this.everRevealed || reveal; });
            this.CapacityRevealed = event_1.Property(saveData.IsCapShown);
            this.Count = event_1.Property(saveData.Count);
            // derivative values
            this.CanAfford = event_1.Property(false);
            this.AtCapacity = event_1.Property(true);
            this.Capacity = event_1.Property(-1);
            this.Price = event_1.Property({});
            // calculated properties
            this.Purchasable = event_1.Property(false);
            var updatePurchasable = function () { return _this.Purchasable(_this.CanAfford() && !_this.AtCapacity()); };
            this.CanAfford.register(updatePurchasable);
            this.AtCapacity.register(updatePurchasable);
            var updateRevealed = function () { return _this.Revealed(_this.shouldReveal()); };
            // show if we have any, or can buy any
            this.Count.register(updateRevealed);
            this.Purchasable.register(updateRevealed);
        };
        ThingModel.prototype.shouldReveal = function () {
            // don't show things without display names
            if (!entityByName[this.thingName].display()) {
                return false;
            }
            if (this.everRevealed) {
                return true;
            }
            return this.Count() > 0 || this.Purchasable();
        };
        ThingModel.prototype.saveEvents = function () {
            var _this = this;
            this.CapacityRevealed.register(function (reveal) { return saveData.Stuff[_this.thingName].IsCapShown = reveal; });
            this.Revealed.register(function (reveal) { return saveData.Stuff[_this.thingName].IsRevealed = reveal; });
            this.Count.register(function (count) { return saveData.Stuff[_this.thingName].Count = count; });
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
            var unreg = _this.model.Count.register(function () { return _this.updateCost(); });
            var unreg2 = gameState.GetEvent().register(function () {
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
            var cost = this.type.cost();
            if (cost) {
                Object.keys(cost).forEach(function (affected) {
                    return u(_this.gameState.Model(affected).Count
                        .register(function () { return _this.updateAffordability(); }));
                });
            }
            // remove old callbacks
            this.refreshCleanup();
            this.refreshCleanup = function () { return unregs.forEach(function (unreg) { return unreg(); }); };
        };
        CostComponent.prototype.updateCost = function () {
            var cost = this.type.cost();
            if (!cost) {
                return {};
            }
            var ratio = this.type.costRatio();
            if (ratio === 1) {
                this.model.Price(cost);
                this.updateAffordability();
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
            var unreg = _this.model.Count.register(function (curr, prev) { return _this.onCountChange(curr, prev); });
            var unreg2 = gameState.GetEvent().register(function () { return _this.refresh(); });
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
                var effects = entity.capacityEffect();
                if (!effects) {
                    return;
                }
                var effect = effects[_this.type.name()];
                if (effect) {
                    effectTable[entity.name()] = effect;
                }
            });
            var initial = this.type.capacity();
            var affecting = Object.keys(effectTable);
            this.calculateCapacity = function () { return affecting.reduce(function (sum, affecting) { return sum
                + _this.gameState.Model(affecting).Count()
                    * effectTable[affecting]; }, initial); };
            this.calculateCapacityRevealed = function () { return _this.model.Count() > _this.model.Capacity(); };
            var unregs = [];
            var u = function (unreg) { return unregs.push(unreg); };
            affecting.forEach(function (affected) {
                return u(_this.gameState.Model(affected).Count.register(function () { return _this.updateCapacity(); }));
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
                if (this.type.zeroAtCapacity()) {
                    var timesOver = Math.floor(count / capacity);
                    countProp(current - timesOver * capacity);
                    var income = this.type.incomeWhenZeroed();
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
        model.Revealed.register(create);
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
        u(vm.ButtonEnabled.register(redraw));
        u(vm.ButtonText.register(redraw));
        u(vm.ButtonTitle.register(redraw));
        u(vm.Capacity.register(redraw));
        u(vm.CapacityShown.register(redraw));
        u(vm.Count.register(redraw));
        u(vm.DisplayText.register(redraw));
        u(vm.Progress.register(redraw));
        var unregReveal;
        unregReveal = game.Model(thingName).Revealed.register(function (revealed) {
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
            var income = type.income();
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
        var entities = definitions.map(function (thingType) {
            return withAllProperties(thingType, optionalFields);
            // let copy = <typeof optionalFields>JSON.parse(JSON.stringify(optionalFields));
            // let filled = keys(thingType).reduce(
            //     (o, k) => (k in thingType ? (copy[k] = thingType[k], o) : o),
            //     copy
            // );
            // return propertize(filled);
        });
        addNewEntities(entities);
        setInterval(onInterval, 200);
    }
    function addNewEntities(entities) {
        entities.forEach(function (entity) { return entityByName[entity.name()] = entity; });
        initializeSaveData();
        game.addEntities(entities, saveData);
        thingViewModels.AddEntities(entities);
        entities.forEach(function (entity) { return createElementsForEntity(entity.name()); });
        Object.keys(entityByName).forEach(function (thingName) { return things[entityByName[thingName].display()] = entityByName[thingName]; });
    }
    requirejs(['app'], function () { onLoad(); });
    //window.onload = onLoad;
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
        addNewEntities([withAllProperties(newThingType, optionalFields)]);
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
        var entities = newDefs.map(function (thingType) { return withAllProperties(thingType, optionalFields); });
        addNewEntities(entities);
        definitions = newDefs;
    }
});
