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

    public Set(value: T) {
        if (this.current === value && this.hasFired) {
            return;
        }

        var previous = this.current;
        this.current = value;
        this.hasFired = true;
        this.event.Fire(callback => callback(value, previous));
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