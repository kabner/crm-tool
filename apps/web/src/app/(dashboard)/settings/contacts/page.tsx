'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import {
  useContactTypes,
  useCreateContactType,
  useUpdateContactType,
  useDeleteContactType,
} from '@/hooks/use-contact-types';
import {
  useActivityTypes,
  useCreateActivityType,
  useUpdateActivityType,
  useDeleteActivityType,
} from '@/hooks/use-activity-types';

const COLOR_OPTIONS = [
  'gray', 'blue', 'green', 'purple', 'orange', 'red', 'yellow', 'pink',
] as const;

const COLOR_MAP: Record<string, string> = {
  gray: '#6b7280',
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  red: '#ef4444',
  yellow: '#eab308',
  pink: '#ec4899',
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_');
}

export default function ContactsSettingsPage() {
  const { data: contactTypes = [] } = useContactTypes();
  const createContactType = useCreateContactType();
  const updateContactType = useUpdateContactType();
  const deleteContactType = useDeleteContactType();

  const { data: activityTypes = [] } = useActivityTypes();
  const createActivityType = useCreateActivityType();
  const updateActivityType = useUpdateActivityType();
  const deleteActivityType = useDeleteActivityType();

  // Contact type state
  const [showAddContactType, setShowAddContactType] = useState(false);
  const [newCtName, setNewCtName] = useState('');
  const [newCtColor, setNewCtColor] = useState('blue');
  const [editingCtId, setEditingCtId] = useState<string | null>(null);
  const [editCtName, setEditCtName] = useState('');
  const [editCtColor, setEditCtColor] = useState('blue');

  // Activity type state
  const [showAddActivityType, setShowAddActivityType] = useState(false);
  const [newAtName, setNewAtName] = useState('');
  const [newAtSlug, setNewAtSlug] = useState('');
  const [newAtIcon, setNewAtIcon] = useState('');
  const [newAtColor, setNewAtColor] = useState('blue');
  const [newAtIsInteraction, setNewAtIsInteraction] = useState(false);
  const [editingAtId, setEditingAtId] = useState<string | null>(null);
  const [editAtName, setEditAtName] = useState('');
  const [editAtIcon, setEditAtIcon] = useState('');
  const [editAtColor, setEditAtColor] = useState('blue');
  const [editAtIsInteraction, setEditAtIsInteraction] = useState(false);

  // Contact Type handlers
  const handleAddContactType = () => {
    if (!newCtName.trim()) return;
    createContactType.mutate(
      { name: newCtName.trim(), color: newCtColor },
      {
        onSuccess: () => {
          setNewCtName('');
          setNewCtColor('blue');
          setShowAddContactType(false);
        },
      },
    );
  };

  const handleStartEditContactType = (ct: { id: string; name: string; color: string }) => {
    setEditingCtId(ct.id);
    setEditCtName(ct.name);
    setEditCtColor(ct.color);
  };

  const handleSaveEditContactType = () => {
    if (!editingCtId || !editCtName.trim()) return;
    updateContactType.mutate(
      { id: editingCtId, name: editCtName.trim(), color: editCtColor },
      { onSuccess: () => setEditingCtId(null) },
    );
  };

  // Activity Type handlers
  const handleAddActivityType = () => {
    if (!newAtName.trim() || !newAtSlug.trim()) return;
    createActivityType.mutate(
      {
        name: newAtName.trim(),
        slug: newAtSlug.trim(),
        icon: newAtIcon.trim() || undefined,
        color: newAtColor,
        isInteraction: newAtIsInteraction,
      },
      {
        onSuccess: () => {
          setNewAtName('');
          setNewAtSlug('');
          setNewAtIcon('');
          setNewAtColor('blue');
          setNewAtIsInteraction(false);
          setShowAddActivityType(false);
        },
      },
    );
  };

  const handleStartEditActivityType = (at: {
    id: string;
    name: string;
    icon: string;
    color: string;
    isInteraction: boolean;
  }) => {
    setEditingAtId(at.id);
    setEditAtName(at.name);
    setEditAtIcon(at.icon);
    setEditAtColor(at.color);
    setEditAtIsInteraction(at.isInteraction);
  };

  const handleSaveEditActivityType = () => {
    if (!editingAtId || !editAtName.trim()) return;
    updateActivityType.mutate(
      {
        id: editingAtId,
        name: editAtName.trim(),
        icon: editAtIcon.trim() || undefined,
        color: editAtColor,
        isInteraction: editAtIsInteraction,
      },
      { onSuccess: () => setEditingAtId(null) },
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Contacts Settings</h1>

      {/* Contact Types */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {contactTypes.map((ct) =>
            editingCtId === ct.id ? (
              <div key={ct.id} className="flex items-center gap-2">
                <Input
                  value={editCtName}
                  onChange={(e) => setEditCtName(e.target.value)}
                  className="max-w-[200px]"
                />
                <select
                  value={editCtColor}
                  onChange={(e) => setEditCtColor(e.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="ghost" onClick={handleSaveEditContactType}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingCtId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div key={ct.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLOR_MAP[ct.color] ?? ct.color }}
                  />
                  <span className="text-sm">{ct.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEditContactType(ct)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteContactType.mutate(ct.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ),
          )}

          {showAddContactType ? (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Input
                placeholder="Type name"
                value={newCtName}
                onChange={(e) => setNewCtName(e.target.value)}
                className="max-w-[200px]"
              />
              <select
                value={newCtColor}
                onChange={(e) => setNewCtColor(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {COLOR_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={handleAddContactType}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddContactType(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setShowAddContactType(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Type
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Activity Types */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activityTypes.map((at) =>
            editingAtId === at.id ? (
              <div key={at.id} className="flex items-center gap-2 flex-wrap">
                <Input
                  placeholder="Name"
                  value={editAtName}
                  onChange={(e) => setEditAtName(e.target.value)}
                  className="max-w-[160px]"
                />
                <Input
                  placeholder="Icon"
                  value={editAtIcon}
                  onChange={(e) => setEditAtIcon(e.target.value)}
                  className="max-w-[120px]"
                />
                <select
                  value={editAtColor}
                  onChange={(e) => setEditAtColor(e.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={editAtIsInteraction}
                    onChange={(e) => setEditAtIsInteraction(e.target.checked)}
                  />
                  Interaction
                </label>
                <Button size="sm" variant="ghost" onClick={handleSaveEditActivityType}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingAtId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div key={at.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLOR_MAP[at.color] ?? at.color }}
                  />
                  <span className="text-sm font-medium">{at.name}</span>
                  <span className="text-xs text-muted-foreground">{at.slug}</span>
                  <span className="text-xs text-muted-foreground">({at.icon})</span>
                  {at.isSystem && (
                    <Badge variant="secondary" className="text-xs">
                      System
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEditActivityType(at)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={at.isSystem}
                    onClick={() => deleteActivityType.mutate(at.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ),
          )}

          {showAddActivityType ? (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
              <Input
                placeholder="Name"
                value={newAtName}
                onChange={(e) => {
                  setNewAtName(e.target.value);
                  setNewAtSlug(slugify(e.target.value));
                }}
                className="max-w-[160px]"
              />
              <Input
                placeholder="Slug"
                value={newAtSlug}
                onChange={(e) => setNewAtSlug(e.target.value)}
                className="max-w-[140px]"
              />
              <Input
                placeholder="lucide icon name"
                value={newAtIcon}
                onChange={(e) => setNewAtIcon(e.target.value)}
                className="max-w-[140px]"
              />
              <select
                value={newAtColor}
                onChange={(e) => setNewAtColor(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {COLOR_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={newAtIsInteraction}
                  onChange={(e) => setNewAtIsInteraction(e.target.checked)}
                />
                Interaction
              </label>
              <Button size="sm" onClick={handleAddActivityType}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddActivityType(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setShowAddActivityType(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Activity Type
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
