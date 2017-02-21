
export type GameEvent<T> = {
    register(callback: T): () => boolean;
    fire(caller: (callback: T) => void): void;
};

export type Property<T> = {
    (value?: T | { (): T }): T;
    register(callback: Property.Change<T>): () => void;
};

type PropertyInternal<T> = {
    current: T;
    hasFired: boolean;
    (value?: T | { (): T }): T;
    setValue: (value: T) => T;
    register: (callback: (current: T, previous: T) => void) => () => void;
};

export module Property {
    export type Change<T> = {
        (current: T, previous: T): void;
    };

    // this hacks together a property starting with a function, then adding
    // the other fields to it manually. Hopefully I'll figure out a less awful
    // way to do this at some point.
    export function create<T>(current: T): Property<T> {
        let { register, fire } = GameEvent.create<Property.Change<T>>();
        let property = <PropertyInternal<T>>(
            function(value?: T | { (): T}): T {
                // call with no argument to get, otherwise set
                if (value === undefined) {
                    return property.current;
                }
                if (typeof value === "function") {
                    setTimeout(() => {
                        var val = (<() => T>value)();
                        property.setValue(val);
                    });
                }
                else {
                    property.setValue(<T>value);
                }
            }
        );

        property.setValue = (value: T) => {
            // setValue always fires the first time, even without a change in value.
            if (property.current === value && property.hasFired) {
                return this.current;
            }

            property.hasFired = true;

            var previous = property.current;
            property.current = value;
            fire(callback => callback(property.current, previous));

            return property.current;
        };

        property.register = register;
        property.current = current;
        property.hasFired = false;
        return property;
    }
}

export namespace GameEvent {
    export function create<T>(): GameEvent<T> {
        let callbacks: T[] = [];
        let unregister = (callback: T) => {
            var index = callbacks.indexOf(callback);

            if (index === -1) {
                return false;
            }

            callbacks.splice(index, 1);
            return true;
        };

        return {
            register: callback => {
                callbacks.push(callback);
                return () => unregister(callback);
            },
            fire: caller => {
                callbacks.forEach(callback => caller(callback));
            },
        }
    }
}


