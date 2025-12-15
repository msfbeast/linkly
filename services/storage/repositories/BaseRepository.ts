import { SupabaseClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, TABLES } from '../supabaseClient';

export abstract class BaseRepository {
    protected supabase: SupabaseClient | null;

    constructor() {
        this.supabase = supabase;
    }

    protected isConfigured(): boolean {
        return !!this.supabase;
    }

    public configure(client: SupabaseClient | null) {
        this.supabase = client;
    }

    protected get TABLES() {
        return TABLES;
    }
}
