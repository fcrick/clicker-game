
export interface IGameEvent<T> {
    Register: (callback: T) => () => void;
}

export class GameEvent<T> implements IGameEvent<T> {
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

export interface Property<T> {
    (value?: T | { (): T }): T;
    Event(): GameEvent<Property.Change<T>>;
}

type PropertyType<T> = {
    current: T;
    event: GameEvent<Property.Change<T>>;
    hasFired: boolean;
    (value?: T | { (): T }): T;
    getSet: (value?: T | { (): T }) => T;
    setValue: (value: T) => T;
    Event: () => GameEvent<Property.Change<T>>;
};

// we use assign to merge this class and a callable object to get the interface
// we want.
class PropertyInternal<T> {
    private event: GameEvent<Property.Change<T>>;
    private hasFired: boolean = false;
    private current: T;

    public getSet (value?: T | { (): T}): T {
        // call with no argument to get, otherwise set
        if (value === undefined) {
            return this.current;
        }
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

    public setValue(value: T) {
        // setValue always fires the first time, even without a change in value.
        if (this.current === value && this.hasFired) {
            return this.current;
        }

        this.hasFired = true;

        var previous = this.current;
        this.current = <T>value;
        this.event.Fire(callback => callback(this.current, previous));

        return this.current;
    }

    public Event() {
        return this.event;
    }
}

export module Property {
    export interface Change<T> {
        (current: T, previous: T): void;
    }

    export function create<T>(current: T): Property<T> {
        let property = <PropertyType<T>><any>(
            function(value?: T | { (): T}): T {
                return property.getSet(value);
            }
        );

        property.getSet = PropertyInternal.prototype.getSet.bind(property);
        property.setValue = PropertyInternal.prototype.setValue.bind(property);
        property.Event = PropertyInternal.prototype.Event.bind(property);

        property.event = new GameEvent<Property.Change<T>>();
        property.current = current;
        property.hasFired = false;
        return <Property<T>>property;
    }
}
