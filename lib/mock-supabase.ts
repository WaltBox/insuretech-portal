// Mock Supabase client for demo mode - no real database connection
import {
  mockUsers,
  mockProperties,
  mockEnrollments,
  mockClaims,
  mockPropertyManagers,
  mockSupportTickets,
  mockInvitations,
  DEMO_USER
} from './mock-data'

type MockData = {
  users: typeof mockUsers
  properties: typeof mockProperties
  enrollments: typeof mockEnrollments
  claims: typeof mockClaims
  property_managers: typeof mockPropertyManagers
  support_tickets: typeof mockSupportTickets
  support_messages: any[]
  invitations: typeof mockInvitations
}

const mockDatabase: MockData = {
  users: mockUsers,
  properties: mockProperties,
  enrollments: mockEnrollments,
  claims: mockClaims,
  property_managers: mockPropertyManagers,
  support_tickets: mockSupportTickets,
  support_messages: mockSupportTickets.flatMap(t => t.messages || []),
  invitations: mockInvitations
}

// Query builder that mimics Supabase's chainable API
class MockQueryBuilder<T> {
  private data: T[]
  private tableName: string
  private _count: 'exact' | null = null
  private _head: boolean = false
  private _single: boolean = false
  private _selectFields: string | null = null
  private filters: Array<(item: T) => boolean> = []
  private _orderBy: { column: string; ascending: boolean } | null = null
  private _limit: number | null = null
  private _range: { from: number; to: number } | null = null
  private _insertData: any = null
  private _updateData: any = null
  private _isDelete: boolean = false

  constructor(data: T[], tableName: string = '') {
    this.data = [...data]
    this.tableName = tableName
  }

  select(fields: string = '*', options?: { count?: 'exact'; head?: boolean }) {
    this._selectFields = fields
    if (options?.count) this._count = options.count
    if (options?.head) this._head = options.head
    return this
  }

  insert(data: any) {
    this._insertData = data
    return this
  }

  update(data: any) {
    this._updateData = data
    return this
  }

  delete() {
    this._isDelete = true
    return this
  }

  upsert(data: any) {
    this._insertData = data
    return this
  }

  eq(column: string, value: any) {
    this.filters.push((item: any) => item[column] === value)
    return this
  }

  neq(column: string, value: any) {
    this.filters.push((item: any) => item[column] !== value)
    return this
  }

  in(column: string, values: any[]) {
    this.filters.push((item: any) => values.includes(item[column]))
    return this
  }

  is(column: string, value: any) {
    this.filters.push((item: any) => item[column] === value)
    return this
  }

  not(column: string, operator: string, value: any) {
    if (operator === 'is') {
      this.filters.push((item: any) => item[column] !== value)
    }
    return this
  }

  or(conditions: string) {
    // Parse simple or conditions like "coverage_name.eq.SDI,coverage_name.eq.sdi"
    const parts = conditions.split(',')
    this.filters.push((item: any) => {
      return parts.some(part => {
        const match = part.match(/(\w+)\.eq\.(.+)/)
        if (match) {
          const [, column, value] = match
          return String(item[column]).toLowerCase() === value.toLowerCase()
        }
        return false
      })
    })
    return this
  }

  ilike(column: string, pattern: string) {
    const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i')
    this.filters.push((item: any) => regex.test(String(item[column] || '')))
    return this
  }

  gte(column: string, value: any) {
    this.filters.push((item: any) => item[column] >= value)
    return this
  }

  lte(column: string, value: any) {
    this.filters.push((item: any) => item[column] <= value)
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this._orderBy = { column, ascending: options?.ascending ?? true }
    return this
  }

  limit(count: number) {
    this._limit = count
    return this
  }

  range(from: number, to: number) {
    this._range = { from, to }
    return this
  }

  single() {
    this._single = true
    return this.execute()
  }

  maybeSingle() {
    this._single = true
    return this.execute()
  }

  async execute(): Promise<{ data: T | T[] | null; error: null; count?: number }> {
    // Handle insert - return mock data with generated ID
    if (this._insertData) {
      const newItem = {
        id: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...this._insertData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      if (this._single) {
        return { data: newItem as T, error: null }
      }
      return { data: [newItem] as T[], error: null }
    }

    // Handle update - return mock updated data
    if (this._updateData) {
      let result = this.data
      for (const filter of this.filters) {
        result = result.filter(filter)
      }
      const updated = result.map(item => ({
        ...item,
        ...this._updateData,
        updated_at: new Date().toISOString()
      }))
      if (this._single) {
        return { data: updated[0] || null, error: null }
      }
      return { data: updated as T[], error: null }
    }

    // Handle delete - return null
    if (this._isDelete) {
      return { data: null, error: null }
    }

    let result = this.data

    // Apply filters
    for (const filter of this.filters) {
      result = result.filter(filter)
    }

    // Apply ordering
    if (this._orderBy) {
      const { column, ascending } = this._orderBy
      result = result.sort((a: any, b: any) => {
        const aVal = a[column]
        const bVal = b[column]
        if (aVal < bVal) return ascending ? -1 : 1
        if (aVal > bVal) return ascending ? 1 : -1
        return 0
      })
    }

    const totalCount = result.length

    // Apply range
    if (this._range) {
      result = result.slice(this._range.from, this._range.to + 1)
    }

    // Apply limit
    if (this._limit) {
      result = result.slice(0, this._limit)
    }

    // Handle head (count only)
    if (this._head) {
      return { data: null, error: null, count: totalCount }
    }

    // Handle single
    if (this._single) {
      const item = result[0] || null
      return { data: item, error: null, count: this._count ? totalCount : undefined }
    }

    // Handle field selection for relations
    if (this._selectFields && this._selectFields.includes(':')) {
      // Handle joined queries like 'property:properties(id, name)'
      result = result.map((item: any) => {
        const newItem = { ...item }
        const relationMatch = this._selectFields!.match(/(\w+):(\w+)\(([^)]+)\)/)
        if (relationMatch) {
          const [, alias, table, fields] = relationMatch
          const relatedData = (mockDatabase as any)[table]
          if (relatedData && item.property_id) {
            const related = relatedData.find((r: any) => r.id === item.property_id)
            if (related) {
              const selectedFields: any = {}
              fields.split(',').map(f => f.trim()).forEach(f => {
                selectedFields[f] = related[f]
              })
              newItem[alias] = selectedFields
            }
          }
        }
        return newItem
      })
    }

    return { 
      data: result, 
      error: null, 
      count: this._count ? totalCount : undefined 
    }
  }

  then<TResult>(
    onfulfilled?: ((value: { data: T | T[] | null; error: null; count?: number }) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<TResult> {
    return this.execute().then(onfulfilled)
  }
}

// Mock Supabase client
export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: DEMO_USER.id,
            email: DEMO_USER.email,
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: DEMO_USER.created_at
          }
        },
        error: null
      }),
      getSession: async () => ({
        data: {
          session: {
            user: {
              id: DEMO_USER.id,
              email: DEMO_USER.email,
              app_metadata: {},
              user_metadata: {},
              aud: 'authenticated',
              created_at: DEMO_USER.created_at
            },
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer'
          }
        },
        error: null
      }),
      signInWithPassword: async () => ({
        data: {
          user: {
            id: DEMO_USER.id,
            email: DEMO_USER.email
          },
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token'
          }
        },
        error: null
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } }
      })
    },

    from: (table: string) => {
      const tableData = (mockDatabase as any)[table] || []
      return new MockQueryBuilder(tableData, table)
    },

    rpc: async (functionName: string, params?: any) => {
      // Handle RPC functions
      switch (functionName) {
        case 'get_tll_count':
          return { data: mockEnrollments.filter(e => e.coverage_name.toLowerCase() === 'tll').length, error: null }
        case 'get_sdi_count':
          return { data: mockEnrollments.filter(e => e.coverage_name.toLowerCase() === 'sdi').length, error: null }
        case 'get_enrollment_stats':
          const stats: Record<string, number> = {}
          const propEnrollments = params?.p_property_id 
            ? mockEnrollments.filter(e => e.property_id === params.p_property_id)
            : mockEnrollments
          propEnrollments.forEach(e => {
            stats[e.status] = (stats[e.status] || 0) + 1
          })
          return { data: Object.entries(stats).map(([status, count]) => ({ status, count })), error: null }
        case 'set_impersonation_context':
          return { data: null, error: null }
        default:
          return { data: null, error: null }
      }
    },

    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'mock-path' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://mock-storage.com/file' } }),
        download: async () => ({ data: new Blob(), error: null }),
        remove: async () => ({ data: null, error: null })
      })
    },

    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} })
    })
  }
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>
