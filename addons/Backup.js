import _ from "lodash";

/**
 * Simple utility class for storing old
 * objects.
 */
class Backup {
    constructor() {
        this.backupList = {};
    }

    Add(id, value) {
        this.backupList[id] = value;
        return this;
    }

    Get(id, notFoundValue) {
        return this.backupList[id] || notFoundValue;
    }

    Remove(id) {
        this.backupList[id] = undefined;
        return this;
    }
}

export default Backup;