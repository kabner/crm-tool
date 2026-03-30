"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EntitySearch } from "@/components/entity-search";
import {
  useList,
  useListMembers,
  useUpdateList,
  useDeleteList,
  useAddMembers,
  useRemoveMembers,
} from "@/hooks/use-lists";
import { ListForm } from "../components/list-form";
import type { UpdateListInput } from "@/hooks/use-lists";

const FIELD_LABELS: Record<string, string> = {
  lifecycleStage: "Lifecycle Stage",
  leadStatus: "Lead Status",
  email: "Email",
  firstName: "First Name",
  lastName: "Last Name",
  jobTitle: "Job Title",
  tags: "Tags",
  source: "Source",
  createdAt: "Created At",
  updatedAt: "Updated At",
  lastActivityAt: "Last Activity At",
  ownerId: "Owner ID",
  phone: "Phone",
};

const OPERATOR_LABELS: Record<string, string> = {
  equals: "equals",
  not_equals: "does not equal",
  contains: "contains",
  not_contains: "does not contain",
  starts_with: "starts with",
  greater_than: "is greater than",
  less_than: "is less than",
  after: "is after",
  before: "is before",
  is_empty: "is empty",
  is_not_empty: "is not empty",
};

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [membersPage, setMembersPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddContacts, setShowAddContacts] = useState(false);
  const [contactIdsInput, setContactIdsInput] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<{ id: string; label: string }[]>([]);

  const { data: list, isLoading } = useList(id);
  const { data: membersData, isLoading: membersLoading } = useListMembers(id, {
    page: membersPage,
    limit: 20,
  });
  const updateList = useUpdateList();
  const deleteList = useDeleteList();
  const addMembers = useAddMembers();
  const removeMembers = useRemoveMembers();

  const handleUpdate = async (formData: UpdateListInput) => {
    await updateList.mutateAsync({ id, data: formData });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this list? This action cannot be undone.",
      )
    ) {
      await deleteList.mutateAsync(id);
      router.push("/lists");
    }
  };

  const handleAddContacts = async () => {
    const ids = selectedContactIds.map((c) => c.id);
    if (ids.length === 0) return;
    await addMembers.mutateAsync({ listId: id, contactIds: ids });
    setSelectedContactIds([]);
    setShowAddContacts(false);
  };

  const handleRemoveMember = async (contactId: string) => {
    await removeMembers.mutateAsync({ listId: id, contactIds: [contactId] });
  };

  const members = membersData?.data ?? [];
  const membersMeta = membersData?.meta ?? {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-64" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/lists")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lists
        </Button>
        <p className="text-muted-foreground">List not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/lists")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{list.name}</h1>
          <Badge variant={list.type === "smart" ? "default" : "secondary"}>
            {list.type === "smart" ? "Smart" : "Static"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {list.memberCount} member{list.memberCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            {isEditing ? "Cancel" : "Edit"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteList.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Edit form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit List</CardTitle>
          </CardHeader>
          <CardContent>
            <ListForm
              initialData={list}
              onSubmit={handleUpdate}
              isLoading={updateList.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Smart list filter criteria display */}
      {!isEditing &&
        list.type === "smart" &&
        list.filters &&
        list.filters.conditions?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Filter Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Matching{" "}
                  <span className="font-medium text-foreground">
                    {list.filters.operator}
                  </span>{" "}
                  of the following conditions:
                </p>
                <ul className="space-y-1">
                  {list.filters.conditions.map(
                    (
                      condition: {
                        field: string;
                        operator: string;
                        value?: string;
                      },
                      index: number,
                    ) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium">
                          {FIELD_LABELS[condition.field] ?? condition.field}
                        </span>
                        <span className="text-muted-foreground">
                          {OPERATOR_LABELS[condition.operator] ??
                            condition.operator}
                        </span>
                        {condition.value && (
                          <span className="font-medium">
                            &quot;{condition.value}&quot;
                          </span>
                        )}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Add contacts to static list */}
      {list.type === "static" && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddContacts(!showAddContacts)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {showAddContacts ? "Cancel" : "Add Contacts"}
          </Button>
        </div>
      )}

      {showAddContacts && list.type === "static" && (
        <Card>
          <CardHeader>
            <CardTitle>Add Contacts to List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Search and add contacts</Label>
                <EntitySearch
                  entityType="contact"
                  value=""
                  onChange={(id, entity) => {
                    if (id && !selectedContactIds.some((c) => c.id === id)) {
                      setSelectedContactIds((prev) => [
                        ...prev,
                        { id, label: entity?.label || id },
                      ]);
                    }
                  }}
                  placeholder="Search contacts to add..."
                />
              </div>
              {selectedContactIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedContactIds.map((contact) => (
                    <span
                      key={contact.id}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
                    >
                      {contact.label}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedContactIds((prev) =>
                            prev.filter((c) => c.id !== contact.id),
                          )
                        }
                        className="ml-1 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <Button
                onClick={handleAddContacts}
                disabled={addMembers.isPending || selectedContactIds.length === 0}
              >
                {addMembers.isPending ? "Adding..." : `Add ${selectedContactIds.length} to List`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members table */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No members in this list yet.
            </p>
          ) : (
            <>
              <div className="rounded-md border border-border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Lifecycle Stage
                      </th>
                      {list.type === "static" && (
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((contact) => (
                      <tr
                        key={contact.id}
                        className="border-b border-border transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 text-sm font-medium">
                          {contact.firstName} {contact.lastName}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {contact.email ?? "-"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">
                            {contact.lifecycleStage}
                          </Badge>
                        </td>
                        {list.type === "static" && (
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(contact.id)}
                              disabled={removeMembers.isPending}
                            >
                              <UserMinus className="mr-1 h-4 w-4" />
                              Remove
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Members pagination */}
              {membersMeta.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    {(membersMeta.page - 1) * membersMeta.limit + 1} to{" "}
                    {Math.min(
                      membersMeta.page * membersMeta.limit,
                      membersMeta.total,
                    )}{" "}
                    of {membersMeta.total} members
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMembersPage((p) => Math.max(1, p - 1))
                      }
                      disabled={membersPage <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {membersMeta.page} of {membersMeta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMembersPage((p) =>
                          Math.min(membersMeta.totalPages, p + 1),
                        )
                      }
                      disabled={membersPage >= membersMeta.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
