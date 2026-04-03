"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Upload,
  Link as LinkIcon,
  Trash2,
  Star,
  GripVertical,
  Loader2,
  ImagePlus,
} from "lucide-react";

interface ProductImage {
  id: string;
  url: string;
  gcsPath: string | null;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

interface ProductImageManagerProps {
  productId: string;
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}

export function ProductImageManager({
  productId,
  images,
  onChange,
}: ProductImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const canAdd = images.length < 10;

  const uploadFile = useCallback(
    async (file: File) => {
      if (!canAdd) {
        toast.error("Maximum of 10 images per product");
        return;
      }
      setUploading(true);
      try {
        // Get signed upload URL
        const urlRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            pathPrefix: "products",
          }),
        });
        if (!urlRes.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, gcsPath, publicUrl } = await urlRes.json();

        // Upload to GCS
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        // Save to DB
        const saveRes = await fetch(`/api/products/${productId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: publicUrl, gcsPath }),
        });
        if (!saveRes.ok) {
          const err = await saveRes.json();
          throw new Error(err.error || "Failed to save image");
        }
        const newImage = await saveRes.json();
        onChange([...images, newImage]);
        toast.success("Image uploaded");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to upload image"
        );
      } finally {
        setUploading(false);
      }
    },
    [canAdd, images, onChange, productId]
  );

  const addExternalUrl = async () => {
    if (!externalUrl.trim()) return;
    if (!canAdd) {
      toast.error("Maximum of 10 images per product");
      return;
    }
    try {
      const res = await fetch(`/api/products/${productId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: externalUrl.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add image");
      }
      const newImage = await res.json();
      onChange([...images, newImage]);
      setExternalUrl("");
      setShowUrlInput(false);
      toast.success("Image added");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add image"
      );
    }
  };

  const removeImage = async (imageId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      const updated = images.filter((i) => i.id !== imageId);
      // If we removed the primary, the API auto-promotes - refetch
      if (images.find((i) => i.id === imageId)?.isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      onChange(updated);
      toast.success("Image removed");
    } catch {
      toast.error("Failed to remove image");
    }
  };

  const setPrimary = async (imageId: string) => {
    const updated = images.map((img) => ({
      ...img,
      isPrimary: img.id === imageId,
    }));
    onChange(updated);
    try {
      await fetch(`/api/products/${productId}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          updated.map((img) => ({
            id: img.id,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
            altText: img.altText,
          }))
        ),
      });
    } catch {
      toast.error("Failed to update primary image");
    }
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDrop = async (dropIdx: number) => {
    if (dragIdx === null || dragIdx === dropIdx) {
      setDragIdx(null);
      return;
    }
    const reordered = [...images];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    const updated = reordered.map((img, i) => ({ ...img, sortOrder: i }));
    onChange(updated);
    setDragIdx(null);

    try {
      await fetch(`/api/products/${productId}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          updated.map((img) => ({
            id: img.id,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
            altText: img.altText,
          }))
        ),
      });
    } catch {
      toast.error("Failed to reorder images");
    }
  };

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length > 0) uploadFile(files[0]);
    },
    [uploadFile]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>
          Product Images ({images.length}/10)
        </Label>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(idx)}
              className={`relative group rounded-lg border-2 overflow-hidden aspect-square ${
                img.isPrimary
                  ? "border-brand-primary"
                  : "border-gray-200"
              } ${dragIdx === idx ? "opacity-50" : ""}`}
            >
              <Image
                src={img.url}
                alt={img.altText || "Product image"}
                fill
                className="object-cover"
                unoptimized
              />
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setPrimary(img.id)}
                  className={`p-1.5 rounded-full ${
                    img.isPrimary
                      ? "bg-brand-primary text-white"
                      : "bg-white/90 text-gray-700 hover:bg-brand-primary hover:text-white"
                  } transition-colors`}
                  title="Set as primary"
                >
                  <Star className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="p-1.5 rounded-full bg-white/90 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {/* Drag handle */}
              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 cursor-grab">
                <GripVertical className="h-4 w-4 text-white drop-shadow" />
              </div>
              {/* Primary badge */}
              {img.isPrimary && (
                <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-brand-primary text-white px-1.5 py-0.5 rounded">
                  PRIMARY
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {canAdd && (
        <div className="flex flex-col gap-3">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-primary/50 transition-colors"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-brand-text-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Uploading...</span>
              </div>
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-brand-text-muted mx-auto mb-2" />
                <p className="text-sm text-brand-text-muted mb-3">
                  Drag and drop an image, or
                </p>
                <div className="flex items-center justify-center gap-2">
                  <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Upload className="h-4 w-4" />
                    Upload File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadFile(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                  >
                    <LinkIcon className="h-4 w-4 mr-1" />
                    Paste URL
                  </Button>
                </div>
              </>
            )}
          </div>

          {showUrlInput && (
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addExternalUrl();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addExternalUrl}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white"
              >
                Add
              </Button>
            </div>
          )}
        </div>
      )}

      {!canAdd && (
        <p className="text-sm text-brand-text-muted">
          Maximum of 10 images reached. Remove an image to add more.
        </p>
      )}
    </div>
  );
}
