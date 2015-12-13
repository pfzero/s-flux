/**
 * Simple utility class for storing old
 * objects.
 */
var Backup = (function () {
    function Backup() {
        this.backupList = {};
    }
    Backup.prototype.Add = function (id, value) {
        this.backupList[id] = value;
        return this;
    };
    Backup.prototype.Get = function (id, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = undefined; }
        return this.backupList[id] || notFoundValue;
    };
    Backup.prototype.Remove = function (id) {
        this.backupList[id] = undefined;
        return this;
    };
    return Backup;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Backup;
//# sourceMappingURL=Backup.js.map