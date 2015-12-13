/**
 * Simple utility class for storing old
 * objects.
 */
export default class Backup {
    private backupList;
    constructor();
    Add(id: number, value: any): Backup;
    Get(id: string | number, notFoundValue?: any): any;
    Remove(id: number): Backup;
}
