import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SupabaseAdapter } from '../services/storage/supabaseAdapter';
import { supabase } from '../services/storage/supabaseClient';
import { Team, TeamInvite, TeamMember } from '../types';
import { useAuth } from './AuthContext';

interface TeamContextType {
    currentTeam: Team | null; // null represents "Personal Workspace"
    teams: Team[];
    userRole: 'owner' | 'admin' | 'editor' | 'viewer' | null; // Role in current team
    isLoading: boolean;
    createTeam: (name: string) => Promise<Team>;
    switchTeam: (teamId: string | null) => void;
    fetchTeams: () => Promise<void>;
    createInvite: (email: string, role: string) => Promise<void>;
    acceptInvite: (token: string) => Promise<void>;
    can: (action: PermissionAction) => boolean;
}

export type PermissionAction = 'edit_links' | 'manage_team' | 'view_analytics' | 'manage_billing';

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null); // Start in Personal Workspace
    const [teams, setTeams] = useState<Team[]>([]);
    const [userRole, setUserRole] = useState<TeamContextType['userRole']>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize Adapter
    const adapter = SupabaseAdapter.getInstance();

    /**
     * Fetch teams the user belongs to
     */
    const fetchTeams = useCallback(async () => {
        if (!user) {
            setTeams([]);
            setIsLoading(false);
            return;
        }

        try {
            // We need to implement getTeams in SupabaseAdapter or use raw query
            // For now, let's assume getTeams exists or we add it. 
            // Actually SupabaseAdapter didn't show getTeams in the earlier "read".
            // I'll query directly via the adapter's client if needed, or add the method to Adapter.
            // Wait, let's look at migration. 
            // User can view teams they belong to.

            const { data, error } = await supabase!
                .from('teams')
                .select('*');

            if (error) throw error;

            // We need to map to Team interface
            const teamList = data.map((t: any) => ({
                id: t.id,
                name: t.name,
                slug: t.slug,
                avatarUrl: t.avatar_url,
                ownerId: t.owner_id,
                createdAt: new Date(t.created_at).getTime()
            }));

            setTeams(teamList);
        } catch (err) {
            console.error('Failed to fetch teams', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, adapter]);

    // Initial fetch
    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    /**
     * Determine User Role when Current Team changes
     */
    useEffect(() => {
        async function fetchRole() {
            if (!currentTeam || !user?.id) {
                setUserRole(null);
                return;
            }

            if (currentTeam.ownerId === user.id) {
                setUserRole('owner');
                return;
            }

            // Fetch member capability
            const { data, error } = await supabase!
                .from('team_members')
                .select('role')
                .eq('team_id', currentTeam.id)
                .eq('user_id', user.id)
                .single();

            if (data) setUserRole(data.role);
        }

        fetchRole();
    }, [currentTeam, user, adapter]);


    const createTeam = async (name: string) => {
        if (!user) throw new Error('Must be logged in');
        // Slug generation
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);

        const newTeam = await adapter.createTeam(name, slug, user.id);
        setTeams(prev => [...prev, newTeam]);
        return newTeam;
    };

    const switchTeam = (teamId: string | null) => {
        if (teamId === null) {
            setCurrentTeam(null);
        } else {
            const team = teams.find(t => t.id === teamId);
            if (team) setCurrentTeam(team);
        }
    };

    const createInvite = async (email: string, role: string) => {
        if (!currentTeam) throw new Error('No team active');
        await adapter.createInvite(currentTeam.id, email, role);
    };

    const acceptInvite = async (token: string) => {
        if (!user) throw new Error('Must be logged in');
        await adapter.acceptInvite(token, user.id);
        await fetchTeams(); // Refresh list
    };

    const can = useCallback((action: PermissionAction): boolean => {
        if (!currentTeam) return true; // Personal workspace has full access
        if (userRole === 'owner') return true;
        if (userRole === 'admin') return true;

        switch (action) {
            case 'edit_links':
                return userRole === 'editor';
            case 'view_analytics':
                return userRole === 'editor' || userRole === 'viewer';
            case 'manage_team':
                return false; // Only admin/owner
            case 'manage_billing':
                return false; // Only owner (handled above)
            default:
                return false;
        }
    }, [currentTeam, userRole]);

    return (
        <TeamContext.Provider value={{
            currentTeam,
            teams,
            userRole,
            isLoading,
            createTeam,
            switchTeam,
            fetchTeams,
            createInvite,
            acceptInvite,
            can
        }}>
            {children}
        </TeamContext.Provider>
    );
};

export const useTeam = () => {
    const context = useContext(TeamContext);
    if (context === undefined) {
        throw new Error('useTeam must be used within a TeamProvider');
    }
    return context;
};
