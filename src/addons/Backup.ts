
/**
 * Simple utility class for storing old
 * objects.
 */
class Backup {
    private backupList: {[k: string] : any} = {}
    
    constructor() {}
    
    Add(id: number, value: any) {
        this.backupList[id] = value;
        return this;
    }
    Get(id: number, notFoundValue: any) {
        return this.backupList[id] || notFoundValue;
    }
    
    Remove(id: number) {
        this.backupList[id] = undefined;
        return this;
    }
}

export default Backup;