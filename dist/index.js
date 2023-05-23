// src/index.ts
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
export {
  src_default as default
};
//# sourceMappingURL=index.js.map