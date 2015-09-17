/// <reference path="mithril.d.ts"/>
/// <reference path="app.ts"/>
/// <reference path="gamedata.ts"/>
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
})();
var Property = (function () {
    function Property(current) {
        this.current = current;
        this.hasFired = false;
        this.event = new GameEvent();
    }
    Property.prototype.Get = function () {
        return this.current;
    };
    Property.prototype.Set = function (value) {
        if (this.current === value && this.hasFired) {
            return;
        }
        var previous = this.current;
        this.current = value;
        this.hasFired = true;
        this.event.Fire(function (callback) { return callback(value, previous); });
    };
    Property.prototype.Event = function () {
        return this.event;
    };
    return Property;
})();
//# sourceMappingURL=event.js.map