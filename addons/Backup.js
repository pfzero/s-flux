/**
 * Simple utility class for storing old
 * objects.
 */
function Backup() {
    this.backupList = {};
}

Backup.prototype.Add = function(id, value) {
    this.backupList[id] = value;
    return this;
}


Backup.prototype.Get = function(id, notFoundValue) {
    return this.backupList[id] || notFoundValue;
}

Backup.prototype.Remove = function(id) {
    this.backupList[id] = undefined;
    return this;
}

module.exports = Backup;