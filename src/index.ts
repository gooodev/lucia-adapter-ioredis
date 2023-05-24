import { Redis } from "ioredis";
import { AdapterFunction, SessionAdapter, SessionSchema } from "lucia-auth";

type Params = {
  session: Redis;
  namespaces?: {
    session: string;
    userSession: string;
  };
};

const DEFAULT_NAMESPACES = {
  session: "session",
  userSession: "userSession",
};

const adapter = ({
  session: sessionRedis,
  namespaces = DEFAULT_NAMESPACES,
}: Params): AdapterFunction<SessionAdapter> => {
  const calcSessionKey = (sessionId: string) =>
    `${namespaces.session}:${sessionId}`;
  const calcUserSessionKey = (userId: string) =>
    `${namespaces.userSession}:${userId}`;

  return () => ({
    getSession: async (sessionId: string) => {
      const sessionData = await sessionRedis.get(calcSessionKey(sessionId));
      return sessionData ? (JSON.parse(sessionData) as SessionSchema) : null;
    },
    getSessionsByUserId: async (userId: string) => {
      const sessionIds = await sessionRedis.lrange(userId, 0, -1);
      const sessions = await Promise.all(
        sessionIds.map(async (sessionId) => {
          const sessionData = await sessionRedis.get(calcSessionKey(sessionId));
          return sessionData ? JSON.parse(sessionData) : null;
        })
      );
      return sessions.filter(
        (session): session is SessionSchema => session !== null
      );
    },
    setSession: async (session) => {
      await Promise.all([
        sessionRedis.set(calcUserSessionKey(session.user_id), session.id),
        sessionRedis.set(
          calcSessionKey(session.id),
          JSON.stringify(session),
          "EX",
          Math.floor(Number(session.idle_expires) / 1000)
        ),
      ]);
    },
    deleteSession: async (...sessionIds: string[]) => {
      const targetSessionIds = await Promise.all(
        sessionIds.map(async (sessionId) => {
          return sessionRedis.get(calcSessionKey(sessionId));
        })
      );
      const sessions = targetSessionIds
        .filter((sessionId): sessionId is string => sessionId !== null)
        .map((sessionId) => JSON.parse(sessionId) as SessionSchema);
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
        }),
      ]);
    },
    deleteSessionsByUserId: async (userId: string) => {
      const sessionIds = await sessionRedis.lrange(userId, 0, -1);
      await Promise.all([
        ...sessionIds.map((sessionId) => {
          return sessionRedis.del(calcSessionKey(sessionId));
        }),
        sessionRedis.del(calcUserSessionKey(userId)),
      ]);
    },
  });
};
export default adapter;
