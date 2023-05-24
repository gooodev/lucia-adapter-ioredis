import { Redis } from "ioredis";
import { AdapterFunction, SessionAdapter } from "lucia-auth";
type Params = {
    session: Redis;
    namespaces?: {
        session: string;
        userSession: string;
    };
};
declare const adapter: ({ session: sessionRedis, namespaces, }: Params) => AdapterFunction<SessionAdapter>;
export default adapter;
//# sourceMappingURL=index.d.ts.map