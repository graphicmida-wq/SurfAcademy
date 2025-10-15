import { useState, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MediaUploadZoneProps {
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
  userId?: string;
}

export function MediaUploadZone({ onUploadComplete, currentUrl, userId }: MediaUploadZoneProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);

      // Get upload URL
      const urlRes = await apiRequest("POST", "/api/object-storage/upload-url");
      const { url } = await urlRes.json();

      // Upload file
      await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      // Set ACL
      const aclRes = await apiRequest("POST", "/api/object-storage/set-acl", {
        objectPath: url,
        aclPolicy: {
          owner: userId,
          visibility: "public",
        },
      });
      const { path } = await aclRes.json();

      onUploadComplete(path);
      toast({ title: "Media caricato con successo!" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ 
        title: "Errore durante il caricamento", 
        variant: "destructive",
        description: "Riprova più tardi" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center
        transition-colors cursor-pointer
        ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
        ${isUploading ? "pointer-events-none opacity-50" : ""}
      `}
      data-testid="media-upload-zone"
    >
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
        data-testid="input-file-upload"
      />

      <div className="flex flex-col items-center gap-2">
        {isUploading ? (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Caricamento in corso...</p>
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Trascina file qui o clicca per caricare
              </p>
              <p className="text-xs text-muted-foreground">
                Supporta immagini e video (max 50MB)
              </p>
            </div>
            {currentUrl && (
              <p className="text-xs text-primary mt-2">
                ✓ File caricato
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
