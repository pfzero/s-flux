'use strict';
/**
 * It generates a unique ID; This is used to uniquely identified
 * errors once they get into
 * @return {String} The generated unique id
 */
module.exports = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 3 | 8;
        return v.toString(16);
    });
};