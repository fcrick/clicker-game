
type Change<T> = {(current?: T, previous?: T): void};

export type GameEvent<T> = {
    register(callback: Change<T>): () => boolean;
    fire(caller: (callback: Change<T>) => void): void;
};

export function event<T>(): GameEvent<T> {
    let callbacks: Change<T>[] = [];
    let unregister = (callback: Change<T>) => {
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

export type Property<T> = {
    (value?: T | { (): T }): T;
    register(callback: Change<T>): () => boolean;
};

export function property<T>(initial: T): Property<T> {
    // hide our internal state away in a closure
    let { register, fire } = event<T>();
    let hasFired = false;
    let current: T = initial;

    let setValue = (value: T) => {
        // setValue always fires the first time, even without a change in value.
        if (current === value && hasFired) {
            return current;
        }

        hasFired = true;

        let previous = current;
        current = value;
        fire(callback => callback(current, previous));

        return current;
    };

    // property is just a function with a single, optional argument
    let property = <Property<T>>function(value?: T | { (): T}): T {
        if (value === undefined) {
            return current;
        }
        if (typeof value === "function") {
            setTimeout(() => {
                var val = (<() => T>value)();
                setValue(val);
            });
        }
        else {
            setValue(<T>value);
        }
    };

    // also allows callbacks to register for change events
    property.register = register;
    return property;
}

