
/**
 * Simple utility class for storing old
 * objects.
 */
export default class Backup {
    private backupList: { [k: string]: any } = {}

    constructor() { }

    add(id: number, value: any): Backup {
        this.backupList[id] = value;
        return this;
    }

    get(id: string | number, notFoundValue: any = undefined): any {
        return this.backupList[id] || notFoundValue;
    }

    remove(id: number): Backup {
        this.backupList[id] = undefined;
        return this;
    }
}