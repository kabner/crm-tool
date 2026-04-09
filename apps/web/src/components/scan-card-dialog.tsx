'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Scan, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ScannedData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
}

interface ScanCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (data: ScannedData) => void;
}

export function ScanCardDialog({
  open,
  onOpenChange,
  onResult,
}: ScanCardDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScannedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setScanning(false);
    setError(null);
    setResult(null);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        reset();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, reset],
  );

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5 MB');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFileSelect(selected);
    },
    [handleFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFileSelect(dropped);
    },
    [handleFileSelect],
  );

  const handleScan = useCallback(async () => {
    if (!file) return;
    setScanning(true);
    setError(null);

    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('auth_token')
          : null;

      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_URL}/api/v1/scan-card`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: 'Scan failed' }));
        throw new Error(body.message || 'Scan failed');
      }

      const data = await res.json();
      setResult({
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        companyName: data.companyName ?? '',
        jobTitle: data.jobTitle ?? '',
      });
    } catch (err: any) {
      setError(err.message ?? 'Failed to scan business card');
    } finally {
      setScanning(false);
    }
  }, [file]);

  const handleUseFields = useCallback(() => {
    if (!result) return;
    onResult(result);
    handleOpenChange(false);
  }, [result, onResult, handleOpenChange]);

  const updateResultField = useCallback(
    (field: keyof ScannedData, value: string) => {
      setResult((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    [],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Business Card</DialogTitle>
          <DialogDescription>
            Upload a photo of a business card to extract contact information.
          </DialogDescription>
        </DialogHeader>

        {/* Upload area */}
        {!result && (
          <div className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ')
                  fileInputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Business card preview"
                  className="max-h-[200px] rounded object-contain"
                />
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drop a business card image here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse (JPG, PNG, max 5 MB)
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleScan} disabled={!file || scanning}>
                {scanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Scan className="mr-2 h-4 w-4" />
                    Scan Card
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">First Name</Label>
                <Input
                  value={result.firstName ?? ''}
                  onChange={(e) =>
                    updateResultField('firstName', e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Last Name</Label>
                <Input
                  value={result.lastName ?? ''}
                  onChange={(e) =>
                    updateResultField('lastName', e.target.value)
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                value={result.email ?? ''}
                onChange={(e) => updateResultField('email', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input
                value={result.phone ?? ''}
                onChange={(e) => updateResultField('phone', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Company</Label>
              <Input
                value={result.companyName ?? ''}
                onChange={(e) =>
                  updateResultField('companyName', e.target.value)
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Job Title</Label>
              <Input
                value={result.jobTitle ?? ''}
                onChange={(e) =>
                  updateResultField('jobTitle', e.target.value)
                }
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                Scan Another
              </Button>
              <Button onClick={handleUseFields}>Use These Fields</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
