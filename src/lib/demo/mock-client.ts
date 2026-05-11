/**
 * Mock Supabase client for demo mode.
 *
 * Implements the chainable PostgREST query-builder pattern so that existing
 * page code (`supabase.from("x").select(...).eq(...).order(...)`) works
 * unchanged against in-memory mock data.
 */
import { DEMO_TABLES } from "./data";

// ── Query builder ────────────────────────────────────────────────────

class MockQueryBuilder {
  private rows: any[];
  private filters: ((row: any) => boolean)[] = [];
  private orderings: { field: string; ascending: boolean }[] = [];
  private limitN: number | null = null;
  private isSingle = false;

  constructor(rows: any[]) {
    // Deep-clone so filters/mutations never affect source data
    this.rows = rows.map((r) => ({ ...r }));
  }

  select(_columns?: string) {
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push((r) => r[field] === value);
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push((r) => r[field] !== value);
    return this;
  }

  gt(field: string, value: any) {
    this.filters.push((r) => r[field] > value);
    return this;
  }

  gte(field: string, value: any) {
    this.filters.push((r) => r[field] >= value);
    return this;
  }

  lt(field: string, value: any) {
    this.filters.push((r) => r[field] < value);
    return this;
  }

  lte(field: string, value: any) {
    this.filters.push((r) => r[field] <= value);
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push((r) => values.includes(r[field]));
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this.orderings.push({ field, ascending: opts?.ascending ?? true });
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  // Mutation stubs — no-ops that keep the chain thenable
  upsert(_data: any, _opts?: any) { return this; }
  update(_data: any) { return this; }
  delete() { return this; }
  insert(_data: any) { return this; }

  // ── Execute ──────────────────────────────────────────────────────
  private resolve() {
    let result = [...this.rows];

    for (const f of this.filters) {
      result = result.filter(f);
    }

    for (const o of this.orderings) {
      result.sort((a, b) => {
        const va = a[o.field];
        const vb = b[o.field];
        if (va < vb) return o.ascending ? -1 : 1;
        if (va > vb) return o.ascending ? 1 : -1;
        return 0;
      });
    }

    if (this.limitN !== null) {
      result = result.slice(0, this.limitN);
    }

    if (this.isSingle) {
      return { data: result[0] ?? null, error: null };
    }
    return { data: result, error: null };
  }

  // Thenable — makes `await supabase.from(…).select(…)` work
  then(
    resolve: (v: any) => any,
    reject?: (e: any) => any,
  ) {
    try {
      return Promise.resolve(this.resolve()).then(resolve, reject);
    } catch (e) {
      return reject ? Promise.reject(e).catch(reject) : Promise.reject(e);
    }
  }
}

// ── Mock auth ────────────────────────────────────────────────────────

const mockAuth = {
  async getUser() {
    return {
      data: {
        user: {
          id: "demo-user-0000-0000-000000000001",
          email: "demo@centsible.app",
          user_metadata: { display_name: "Sammi" },
        },
      },
      error: null,
    };
  },
  async signOut() {
    return { error: null };
  },
  async getSession() {
    return { data: { session: { user: { id: "demo-user-0000-0000-000000000001" } } }, error: null };
  },
  onAuthStateChange(_callback: any) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
  mfa: {
    async getAuthenticatorAssuranceLevel() {
      return { data: { currentLevel: "aal1", nextLevel: "aal1" }, error: null };
    },
  },
};

// ── Public API ───────────────────────────────────────────────────────

export function createDemoClient() {
  return {
    from(table: string) {
      const rows = DEMO_TABLES[table] ?? [];
      return new MockQueryBuilder(rows);
    },
    auth: mockAuth,
  };
}
