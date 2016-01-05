/**
 * Simple utility class for storing old
 * objects.
 */
export default class Backup {
    private backupList;
    constructor();
    add(id: number, value: any): Backup;
    get(id: string | number, notFoundValue?: any): any;
    remove(id: number): Backup;
}
