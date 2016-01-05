/**
 * Simple utility class for storing old
 * objects.
 */
var Backup = (function () {
    function Backup() {
        this.backupList = {};
    }
    Backup.prototype.add = function (id, value) {
        this.backupList[id] = value;
        return this;
    };
    Backup.prototype.get = function (id, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = undefined; }
        return this.backupList[id] || notFoundValue;
    };
    Backup.prototype.remove = function (id) {
        this.backupList[id] = undefined;
        return this;
    };
    return Backup;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Backup;
//# sourceMappingURL=Backup.js.map