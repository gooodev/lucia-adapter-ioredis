// src/index.ts
var DEFAULT_NAMESPACES = {
  session: "session",
  userSession: "userSession"
};
var adapter = ({
  session: sessionRedis,
  namespaces = DEFAULT_NAMESPACES
}) => {
  const calcSessionKey = (sessionId) => `${namespaces.session}:${sessionId}`;
  const calcUserSessionKey = (userId) => `${namespaces.userSession}:${userId}`;
  return () => ({
    getSession: async (sessionId) => {
      const sessionData = await sessionRedis.get(calcSessionKey(sessionId));
      return sessionData ? JSON.parse(sessionData) : null;
    },
    getSessionsByUserId: async (userId) => {
      const sessionIds = await sessionRedis.lrange(userId, 0, -1);
      const sessions = await Promise.all(
        sessionIds.map(async (sessionId) => {
          const sessionData = await sessionRedis.get(calcSessionKey(sessionId));
          return sessionData ? JSON.parse(sessionData) : null;
        })
      );
      return sessions.filter(
        (session) => session !== null
      );
    },
    setSession: async (session) => {
      await Promise.all([
        sessionRedis.set(calcUserSessionKey(session.user_id), session.id),
        sessionRedis.set(
          calcSessionKey(session.id),
          JSON.stringify(session),
          "EX",
          Math.floor(Number(session.idle_expires) / 1e3)
        )
      ]);
    },
    deleteSession: async (...sessionIds) => {
      const targetSessionIds = await Promise.all(
        sessionIds.map(async (sessionId) => {
          return sessionRedis.get(calcSessionKey(sessionId));
        })
      );
      const sessions = targetSessionIds.filter((sessionId) => sessionId !== null).map((sessionId) => JSON.parse(sessionId));
      await Promise.all([
        ...sessionIds.map((sessionId) => {
          return sessionRedis.del(calcSessionKey(sessionId));
        }),
        ...sessions.map((session) => {
          return sessionRedis.lrem(
            calcUserSessionKey(session.user_id),
            0,
            session.id
          );
        })
      ]);
    },
    deleteSessionsByUserId: async (userId) => {
      const sessionIds = await sessionRedis.lrange(userId, 0, -1);
      await Promise.all([
        ...sessionIds.map((sessionId) => {
          return sessionRedis.del(calcSessionKey(sessionId));
        }),
        sessionRedis.del(calcUserSessionKey(userId))
      ]);
    }
  });
};
var src_default = adapter;
export {
  src_default as default
};
//# sourceMappingURL=index.js.map