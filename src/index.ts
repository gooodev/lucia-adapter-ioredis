import { Redis } from "ioredis";
import { AdapterFunction, SessionAdapter, SessionSchema } from "lucia-auth";

type Params = {
  session: Redis;
  userSession: Redis;
};

const adapter =
  ({
    session: sessionRedis,
    userSession: userSessionRedis,
  }: Params): AdapterFunction<SessionAdapter> =>
  () => ({
    getSession: async (sessionId: string) => {
      const sessionData = await sessionRedis.get(sessionId);
      return sessionData ? (JSON.parse(sessionData) as SessionSchema) : null;
    },
    getSessionsByUserId: async (userId: string) => {
      const sessionIds = await userSessionRedis.lrange(userId, 0, -1);
      const sessions = await Promise.all(
        sessionIds.map(async (sessionId) => {
          const sessionData = await sessionRedis.get(sessionId);
          return sessionData ? JSON.parse(sessionData) : null;
        })
      );
      return sessions.filter(
        (session): session is SessionSchema => session !== null
      );
    },
    setSession: async (session) => {
      await Promise.all([
        userSessionRedis.set(session.user_id, session.id),
        sessionRedis.set(
          session.id,
          JSON.stringify(session),
          "EX",
          Math.floor(Number(session.idle_expires) / 1000)
        ),
      ]);
    },
    deleteSession: async (...sessionIds: string[]) => {
      const targetSessionIds = await Promise.all(
        sessionIds.map(async (sessionId) => sessionRedis.get(sessionId))
      );
      const sessions = targetSessionIds
        .filter((sessionId): sessionId is string => sessionId !== null)
        .map((sessionId) => JSON.parse(sessionId) as SessionSchema);
      await Promise.all([
        ...sessionIds.map((sessionId) => sessionRedis.del(sessionId)),
        ...sessions.map((session) => userSessionRedis.del(session.user_id)),
      ]);
    },
    deleteSessionsByUserId: async (userId: string) => {
      const sessionIds = await userSessionRedis.lrange(userId, 0, -1);
      await Promise.all([
        ...sessionIds.map((sessionId) => sessionRedis.del(sessionId)),
        userSessionRedis.del(userId),
      ]);
    },
  });

export default adapter;
