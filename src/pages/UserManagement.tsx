import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Users as UsersIcon, Shield, Edit2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type AppRole = 'manager' | 'editor' | 'viewer';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: AppRole[];
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<AppRole | null>(null);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    checkUserRole();
    fetchUsers();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (roles && roles.length > 0) {
        const userRoles = roles.map(r => r.role);
        setCurrentUserRole(userRoles[0]);
        setIsManager(userRoles.includes('manager'));
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        roles: rolesData
          ?.filter(r => r.user_id === profile.id)
          .map(r => r.role as AppRole) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error('Failed to load users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    try {
      // Remove all existing roles for the user
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Add the new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error('Failed to update user role');
      console.error('Error updating role:', error);
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'manager':
        return 'default';
      case 'editor':
        return 'secondary';
      case 'viewer':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <UsersIcon className="w-12 h-12 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              User Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage users and their access levels
            </p>
          </div>
          {currentUserRole && (
            <Badge variant={getRoleBadgeVariant(currentUserRole)} className="text-sm px-4 py-2">
              Your Role: {currentUserRole}
            </Badge>
          )}
        </div>

        {/* Role Descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-subtle border-dashboard-border">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Manager
            </h3>
            <p className="text-sm text-muted-foreground">
              Full access to all features including user management and system settings.
            </p>
          </Card>
          <Card className="p-4 bg-gradient-subtle border-dashboard-border">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Editor
            </h3>
            <p className="text-sm text-muted-foreground">
              Can create, edit, and delete sites and models. Cannot manage users.
            </p>
          </Card>
          <Card className="p-4 bg-gradient-subtle border-dashboard-border">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-primary" />
              Viewer
            </h3>
            <p className="text-sm text-muted-foreground">
              Read-only access to view sites, models, and analytics. Cannot make changes.
            </p>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="bg-gradient-panel border-dashboard-border">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">All Users</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  {isManager && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.full_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.roles[0])}>
                        {user.roles[0] || 'No Role'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    {isManager && (
                      <TableCell>
                        <Select
                          value={user.roles[0]}
                          onValueChange={(value) => updateUserRole(user.id, value as AppRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
