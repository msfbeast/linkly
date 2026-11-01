/**
 * Chainable stand-in for the Supabase query builder, for unit tests.
 *
 * `from(table)` returns a builder that accepts any method (`select`, `eq`,
 * `neq`, `is`, `order`, `limit`, `range`, `in`, `insert`, ...) and records it.
 * Awaiting the builder, or calling `single()` / `maybeSingle()`, resolves via
 * the `respond` callback, which sees the table and every recorded call.
 *
 * Tests describe what the database returns, not the exact order the code
 * chains query methods, so they don't break each time a filter is added.
 */

export interface QueryOp {
    method: string;
    args: unknown[];
}

export interface QueryCall {
    table: string;
    ops: QueryOp[];
    /** Args of the first call to `method`, if any. */
    arg(method: string): unknown[] | undefined;
    /** True if `method` was called with `args` (compared with ===). */
    has(method: string, ...args: unknown[]): boolean;
}

export interface QueryResult {
    data?: unknown;
    error?: unknown;
    count?: number | null;
}

export type Responder = (call: QueryCall) => QueryResult | undefined;

export function createFakeSupabase(respond: Responder) {
    const calls: QueryCall[] = [];

    const from = (table: string) => {
        const ops: QueryOp[] = [];
        const call: QueryCall = {
            table,
            ops,
            arg: (method) => ops.find(o => o.method === method)?.args,
            has: (method, ...args) =>
                ops.some(o => o.method === method && args.every((a, i) => o.args[i] === a)),
        };
        calls.push(call);

        const result = () => {
            const r = respond(call) ?? {};
            return { data: r.data ?? null, error: r.error ?? null, count: r.count ?? null };
        };

        const builder: any = new Proxy({}, {
            get(_target, prop) {
                if (prop === 'then') {
                    return (onFulfilled: any, onRejected: any) =>
                        Promise.resolve(result()).then(onFulfilled, onRejected);
                }
                if (typeof prop !== 'string') return undefined;
                return (...args: unknown[]) => {
                    ops.push({ method: prop, args });
                    if (prop === 'single' || prop === 'maybeSingle') {
                        return Promise.resolve(result());
                    }
                    return builder;
                };
            },
        });
        return builder;
    };

    return { from, calls };
}
