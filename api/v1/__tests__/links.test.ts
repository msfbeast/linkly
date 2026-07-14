
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../links';

// Mock Supabase
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockFrom = vi.fn();

const mockSupabase = {
    from: mockFrom,
};

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => mockSupabase),
}));

describe('API v1/links', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default mocks
        mockFrom.mockReturnValue({
            select: mockSelect,
            insert: mockInsert,
        });
        mockSelect.mockReturnValue({
            eq: mockEq,
            single: mockSingle, // For insert return
        });
        mockEq.mockReturnValue({
            single: mockSingle,
            maybeSingle: mockMaybeSingle,
        });

        // Default: no slug collision
        mockMaybeSingle.mockResolvedValue({ data: null, error: null });

        // Mock Env
        process.env.VITE_SUPABASE_URL = 'https://mock.supabase.co';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_service_key';
    });

    it('should return 401 if Authorization header is missing', async () => {
        const req = new Request('http://localhost/api/v1/links', {
            method: 'POST',
        });
        const res = await handler(req);
        expect(res.status).toBe(401);
    });

    it('should return 401 if API Key is invalid', async () => {
        // Mock Key lookup returning null
        mockSingle.mockResolvedValueOnce({ data: null, error: null });

        const req = new Request('http://localhost/api/v1/links', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ga_live_invalid' },
            body: JSON.stringify({ url: 'https://google.com' })
        });

        const res = await handler(req);
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toBe('Invalid API Key');
    });

    it('should return 403 if key lacks links:write scope', async () => {
        // Key valid but read-only scope
        mockSingle.mockResolvedValueOnce({
            data: { user_id: 'user_123', scopes: ['links:read'] },
            error: null
        });

        const req = new Request('http://localhost/api/v1/links', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ga_live_readonly' },
            body: JSON.stringify({ url: 'https://google.com' })
        });

        const res = await handler(req);
        expect(res.status).toBe(403);
        const body = await res.json();
        expect(body.error).toContain('links:write');
    });

    it('should return 400 for a non-http(s) URL', async () => {
        mockSingle.mockResolvedValueOnce({
            data: { user_id: 'user_123', scopes: ['links:read', 'links:write'] },
            error: null
        });

        const req = new Request('http://localhost/api/v1/links', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ga_live_valid' },
            body: JSON.stringify({ url: 'javascript:alert(1)' })
        });

        const res = await handler(req);
        expect(res.status).toBe(400);
    });

    it('should create a link (201) if Key is valid', async () => {
        // 1. Mock Key Verification Success (with write scope)
        mockSingle.mockResolvedValueOnce({
            data: { user_id: 'user_123', scopes: ['links:read', 'links:write'] },
            error: null
        });

        // 2. Mock Link Insertion Success
        mockInsert.mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                    data: {
                        id: 'link_new',
                        short_code: 'abc1234',
                        original_url: 'https://google.com',
                        created_at: '2023-01-01'
                    },
                    error: null
                })
            })
        });

        const req = new Request('http://localhost/api/v1/links', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ga_live_valid' },
            body: JSON.stringify({ url: 'https://google.com' })
        });

        const res = await handler(req);

        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.shortUrl).toContain('abc1234');
        expect(mockFrom).toHaveBeenCalledWith('api_keys'); // Verify Key check
        expect(mockFrom).toHaveBeenCalledWith('links');    // Verify Insert
    });

    it('should retry with a new code on slug collision', async () => {
        mockSingle.mockResolvedValueOnce({
            data: { user_id: 'user_123', scopes: ['links:write'] },
            error: null
        });

        // First collision check finds an existing link, second is clear
        mockMaybeSingle
            .mockResolvedValueOnce({ data: { id: 'existing' }, error: null })
            .mockResolvedValueOnce({ data: null, error: null });

        mockInsert.mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                    data: {
                        id: 'link_new',
                        short_code: 'zzz9999',
                        original_url: 'https://google.com',
                        created_at: '2023-01-01'
                    },
                    error: null
                })
            })
        });

        const req = new Request('http://localhost/api/v1/links', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ga_live_valid' },
            body: JSON.stringify({ url: 'https://google.com' })
        });

        const res = await handler(req);
        expect(res.status).toBe(201);
        // maybeSingle called at least twice (collision then success)
        expect(mockMaybeSingle.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
});
