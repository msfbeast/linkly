import { BaseRepository } from './BaseRepository';
import { Team, TeamInvite, TeamMember } from '../../../types';
import { v4 as uuidv4 } from 'uuid';

export class TeamRepository extends BaseRepository {

    async getTeams(): Promise<Team[]> {
        if (!this.isConfigured()) return [];

        const { data, error } = await this.supabase!
            .from('teams')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching teams:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            avatarUrl: row.avatar_url || undefined,
            ownerId: row.owner_id,
            createdAt: new Date(row.created_at).getTime(),
        }));
    }

    async createTeam(name: string, slug: string, ownerId: string): Promise<Team> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const { data, error } = await this.supabase!.rpc('create_team_with_owner', {
            p_name: name,
            p_slug: slug,
            p_owner_id: ownerId
        });

        if (error) {
            console.error('RPC create_team_with_owner failed:', error);
            return this.createTeamFallback(name, slug, ownerId);
        }

        return {
            id: data.id,
            name: data.name,
            slug: data.slug,
            avatarUrl: null,
            ownerId: data.owner_id,
            createdAt: new Date(data.created_at).getTime(),
        };
    }

    private async createTeamFallback(name: string, slug: string, ownerId: string): Promise<Team> {
        const { data, error } = await this.supabase!
            .from('teams')
            .insert({
                name,
                slug,
                owner_id: ownerId,
            })
            .select()
            .single();

        if (error) throw error;

        await this.supabase!.from('team_members').insert({
            team_id: data.id,
            user_id: ownerId,
            role: 'owner',
        });

        return {
            id: data.id,
            name: data.name,
            slug: data.slug,
            avatarUrl: data.avatar_url,
            ownerId: data.owner_id,
            createdAt: new Date(data.created_at).getTime(),
        };
    }

    async getTeamMembers(teamId: string): Promise<TeamMember[]> {
        if (!this.isConfigured()) return [];

        const { data, error } = await this.supabase!
            .from('team_members')
            .select('*')
            .eq('team_id', teamId);

        if (error) {
            console.error('Error fetching team members:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            teamId: row.team_id,
            userId: row.user_id,
            role: row.role as any,
            joinedAt: new Date(row.joined_at).getTime(),
        }));
    }

    async createInvite(teamId: string, email: string, role: string): Promise<TeamInvite> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

        const { data, error } = await this.supabase!.rpc('create_team_invite', {
            p_team_id: teamId,
            p_email: email,
            p_role: role,
            p_token: token
        });

        if (error) throw error;

        return {
            id: (data as any).id,
            teamId,
            email,
            role: role as any,
            token,
            expiresAt: new Date(expiresAt).getTime(),
            createdAt: Date.now(),
            createdBy: (await this.supabase!.auth.getUser()).data.user?.id || '',
        };
    }

    async getTeamInvites(teamId: string): Promise<TeamInvite[]> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const { data, error } = await this.supabase!
            .from('team_invites')
            .select('*')
            .eq('team_id', teamId)
            .gt('expires_at', new Date().toISOString());

        if (error) throw error;

        return data.map((invite: any) => ({
            id: invite.id,
            teamId: invite.team_id,
            email: invite.email,
            role: invite.role as any,
            token: invite.token,
            expiresAt: new Date(invite.expires_at).getTime(),
            createdAt: new Date(invite.created_at).getTime(),
            createdBy: invite.created_by
        }));
    }

    async acceptInvite(token: string, userId: string): Promise<void> {
        if (!this.isConfigured()) throw new Error('Supabase not configured');

        const { data: invite, error: inviteError } = await this.supabase!
            .from('team_invites')
            .select('*')
            .eq('token', token)
            .single();

        if (inviteError || !invite) throw new Error('Invalid invite');

        if (new Date(invite.expires_at) < new Date()) {
            throw new Error('Invite expired');
        }

        const { error: memberError } = await this.supabase!
            .from('team_members')
            .insert({
                team_id: invite.team_id,
                user_id: userId,
                role: invite.role,
            });

        if (memberError) throw memberError;

        await this.supabase!.from('team_invites').delete().eq('id', invite.id);
    }
}
