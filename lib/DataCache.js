'use strict'

class DataCache {
    constructor() {
        this.cache = {};
    }

    get(key) {
        return this.cache[key];
    }

    save(key, value) {
        this.cache[key] = value;
    }

    saveAll(values) {
        for (let index in values) {
            let value = values[index];
            this.save(value.id, value);
        }
    }

    remove(key) {
        this.cache.splice(key, 1);
    }

    clear() {
        this.cache = {};
    }
}

module.exports = DataCache;
