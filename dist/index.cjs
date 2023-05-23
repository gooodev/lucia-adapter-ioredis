"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var adapter = ({
  session: sessionRedis,
  userSession: userSessionRedis
}) => () => ({
  getSession: async (sessionId) => {
    const sessionData = await sessionRedis.get(sessionId);
    return sessionData ? JSON.parse(sessionData) : null;
  },
  getSessionsByUserId: async (userId) => {
    const sessionIds = await userSessionRedis.lrange(userId, 0, -1);
    const sessions = await Promise.all(
      sessionIds.map(async (sessionId) => {
        const sessionData = await sessionRedis.get(sessionId);
        return sessionData ? JSON.parse(sessionData) : null;
      })
    );
    return sessions.filter(
      (session) => session !== null
    );
  },
  setSession: async (session) => {
    await Promise.all([
      userSessionRedis.set(session.user_id, session.id),
      sessionRedis.set(
        session.id,
        JSON.stringify(session),
        "EX",
        Math.floor(Number(session.idle_expires) / 1e3)
      )
    ]);
  },
  deleteSession: async (...sessionIds) => {
    const targetSessionIds = await Promise.all(
      sessionIds.map(async (sessionId) => sessionRedis.get(sessionId))
    );
    const sessions = targetSessionIds.filter((sessionId) => sessionId !== null).map((sessionId) => JSON.parse(sessionId));
    await Promise.all([
      ...sessionIds.map((sessionId) => sessionRedis.del(sessionId)),
      ...sessions.map((session) => userSessionRedis.del(session.user_id))
    ]);
  },
  deleteSessionsByUserId: async (userId) => {
    const sessionIds = await userSessionRedis.lrange(userId, 0, -1);
    await Promise.all([
      ...sessionIds.map((sessionId) => sessionRedis.del(sessionId)),
      userSessionRedis.del(userId)
    ]);
  }
});
var src_default = adapter;
//# sourceMappingURL=index.cjs.map