'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { Plus, Users } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  createdAt: string;
}

const ROLES = ['Admin', 'Manager', 'Member', 'Viewer'] as const;

export default function UsersSettingsPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);

  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<string>('Member');
  const [newPassword, setNewPassword] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => apiClient.get<User[]>('/api/v1/users'),
  });

  const createUser = useMutation({
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      password: string;
    }) => apiClient.post('/api/v1/auth/create-user', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowAddForm(false);
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewRole('Member');
      setNewPassword('');
      setCreateError(null);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  const handleCreate = () => {
    if (!newFirstName || !newEmail || !newPassword) return;
    setCreateError(null);
    createUser.mutate({
      firstName: newFirstName,
      lastName: newLastName,
      email: newEmail,
      role: newRole,
      password: newPassword,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="mt-1 text-muted-foreground">
            Manage users and their roles.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? (
            'Cancel'
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </>
          )}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newFirstName">First Name</Label>
                <Input
                  id="newFirstName"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newLastName">Last Name</Label>
                <Input
                  id="newLastName"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newRole">Role</Label>
                <select
                  id="newRole"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="max-w-sm space-y-2">
              <Label htmlFor="newPassword">Temporary Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Temporary password"
              />
            </div>
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
            <div className="flex justify-end">
              <Button
                onClick={handleCreate}
                disabled={
                  createUser.isPending || !newFirstName || !newEmail || !newPassword
                }
              >
                {createUser.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading users...
          </CardContent>
        </Card>
      ) : !users || users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No users found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first team member to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border border-border">
          <div className="grid grid-cols-4 gap-4 border-b border-border bg-muted/50 px-4 py-2.5 text-xs font-medium text-muted-foreground">
            <span>Name</span>
            <span>Email</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          {users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-4 items-center gap-4 border-b border-border last:border-0 px-4 py-3"
            >
              <span className="text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-sm text-muted-foreground truncate">
                {user.email}
              </span>
              <div>
                <Badge
                  variant={
                    user.status === 'active' ? 'default' : 'secondary'
                  }
                >
                  {user.status || 'active'}
                </Badge>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" disabled>
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
