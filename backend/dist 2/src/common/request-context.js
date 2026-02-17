"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestContext = void 0;
const node_async_hooks_1 = require("node:async_hooks");
const als = new node_async_hooks_1.AsyncLocalStorage();
exports.RequestContext = {
    run(store, fn) {
        return als.run(store, fn);
    },
    getStore() {
        return als.getStore();
    },
};
//# sourceMappingURL=request-context.js.map