'use client';

import { useRef } from 'react';
import { Paperclip, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useAttachments,
  useUploadAttachment,
  useDeleteAttachment,
} from '@/hooks/use-attachments';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentsPanelProps {
  entityType: 'contact' | 'company' | 'deal';
  entityId: string;
}

export function AttachmentsPanel({
  entityType,
  entityId,
}: AttachmentsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: attachments, isLoading } = useAttachments(entityType, entityId);
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAttachment.mutate({ entityType, entityId, file });
    // Reset input so the same file can be re-uploaded
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this attachment?')) return;
    deleteAttachment.mutate(id);
  };

  const apiUrl =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      : '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Attachments
            {attachments && attachments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {attachments.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadAttachment.isPending}
          >
            <Upload className="mr-1 h-3 w-3" />
            {uploadAttachment.isPending ? 'Uploading...' : 'Upload'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : attachments && attachments.length > 0 ? (
          <ul className="space-y-2">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <a
                      href={`${apiUrl}${attachment.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate font-medium text-primary hover:underline"
                    >
                      {attachment.fileName}
                    </a>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(attachment.fileSize)}</span>
                      {attachment.uploadedBy && (
                        <span>
                          by {attachment.uploadedBy.firstName}{' '}
                          {attachment.uploadedBy.lastName}
                        </span>
                      )}
                      <span>
                        {new Date(attachment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(attachment.id)}
                  disabled={deleteAttachment.isPending}
                  className="ml-2 flex-shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete attachment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No attachments yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
