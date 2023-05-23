import { Redis } from "ioredis";
import { AdapterFunction, SessionAdapter } from "lucia-auth";
type Params = {
    session: Redis;
    userSession: Redis;
};
declare const adapter: ({ session: sessionRedis, userSession: userSessionRedis, }: Params) => AdapterFunction<SessionAdapter>;
export default adapter;
//# sourceMappingURL=index.d.ts.map