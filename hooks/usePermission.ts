import { useTeam } from '../contexts/TeamContext';

export type Permission =
    | 'view_analytics'
    | 'create_link'
    | 'edit_link'
    | 'delete_link'
    | 'manage_bio'
    | 'manage_products'
    | 'manage_team'
    | 'invite_members'
    | 'manage_billing'
    | 'delete_team';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    viewer: ['view_analytics'],
    editor: ['view_analytics', 'create_link', 'edit_link', 'delete_link', 'manage_bio', 'manage_products'],
    admin: [
        'view_analytics', 'create_link', 'edit_link', 'delete_link', 'manage_bio', 'manage_products',
        'manage_team', 'invite_members', 'manage_billing'
    ],
    owner: [
        'view_analytics', 'create_link', 'edit_link', 'delete_link', 'manage_bio', 'manage_products',
        'manage_team', 'invite_members', 'manage_billing', 'delete_team'
    ]
};

export const usePermission = () => {
    const { userRole, currentTeam } = useTeam();

    const can = (permission: Permission): boolean => {
        // Personal workspace (null team) implies Owner privileges usually, 
        // or we handle it as full access if currentTeam is null.
        if (!currentTeam) return true;

        if (!userRole) return false;

        const allowed = ROLE_PERMISSIONS[userRole] || [];
        return allowed.includes(permission);
    };

    /**
     * Check if user has a minimum role level
     */
    const hasRole = (role: 'viewer' | 'editor' | 'admin' | 'owner'): boolean => {
        if (!currentTeam) return true; // Personal workspace = owner equivalent
        if (!userRole) return false;

        const levels = ['viewer', 'editor', 'admin', 'owner'];
        const userLevel = levels.indexOf(userRole);
        const requiredLevel = levels.indexOf(role);

        return userLevel >= requiredLevel;
    };

    return { can, hasRole, userRole };
};
