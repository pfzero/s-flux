'use strict';
/**
 * It generates a unique ID; This is used to uniquely identified
 * errors once they get into
 * @return {String} The generated unique id
 */
function generateUniqueId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 3 | 8;
        return v.toString(16);
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateUniqueId;
//# sourceMappingURL=generateUniqueId.js.map