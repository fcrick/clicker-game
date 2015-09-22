/// <reference path="mithril.d.ts"/>
/// <reference path="app.ts"/>
/// <reference path="gamedata.ts"/>

interface IGameEvent<T> {
    Register: (callback: T) => () => void;
}

class GameEvent<T> implements IGameEvent<T> {
    callbacks: T[] = [];

    public Register(callback: T): () => void {
        this.callbacks.push(callback);
        return () => this.unregister(callback);
    }

    unregister(callback: T) {
        var index = this.callbacks.indexOf(callback);

        if (index === -1) {
            return false;
        }

        this.callbacks.splice(index, 1);
        return true;
    }

    public Fire(caller: (callback: T) => void) {
        this.callbacks.forEach(callback => caller(callback));
    }
}

class Property<T> {
    private event: GameEvent<Property.Change<T>>;
    private hasFired: boolean = false;

    constructor(private current: T) {
        this.event = new GameEvent<Property.Change<T>>();
    }

    public Get(): T {
        return this.current;
    }

    public Set(value: T | { (): T }) {
        if (typeof value === "function") {
            setTimeout(() => {
                var val = (<{ (): T }>value)();
                this.setValue(val);
            });
        }
        else {
            this.setValue(<T>value);
        }
    }

    private setValue(value: T) {
        if (this.current === value && this.hasFired) {
            return;
        }

        this.hasFired = true;

        var previous = this.current;
        this.current = <T>value;
        this.event.Fire(callback => callback(this.current, previous));
    }

    public Event() {
        return this.event;
    }
}

module Property {
    export interface Change<T> {
        (current: T, previous: T): void;
    }
}