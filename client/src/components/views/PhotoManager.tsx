import { useState, useRef, useCallback, useEffect } from 'react';
import { InventoryItem } from '@/lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, GripVertical, Image as ImageIcon, Video, CircleDot, FlipHorizontal, SwitchCamera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Photo {
  id: string;
  itemId: string;
  url: string;
  createdAt: string;
}

interface PhotoManagerProps {
  item: InventoryItem;
}

export function PhotoManager({ item }: PhotoManagerProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Fetch photos from database
  const { data: photos = [], isLoading: photosLoading } = useQuery<Photo[]>({
    queryKey: ['photos', item.id],
    queryFn: async () => {
      const res = await fetch(`/api/items/${item.id}/photos`);
      if (!res.ok) throw new Error('Failed to fetch photos');
      return res.json();
    },
  });

  // Add photo mutation
  const addPhotoMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch(`/api/items/${item.id}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error('Failed to add photo');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', item.id] });
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete photo');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', item.id] });
    },
  });

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      // Stop any existing stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Could not access camera. Please check permissions.');
    }
  }, [facingMode, cameraStream]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        // Mirror if using front camera
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);
        ctx.restore();
        
        // Convert to data URL and save to database
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        addPhotoMutation.mutate(dataUrl);
      }
    }
  }, [facingMode, addPhotoMutation]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Use a ref to track the stream for cleanup to avoid stale closure issues
  const streamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    streamRef.current = cameraStream;
  }, [cameraStream]);

  // Start camera when dialog opens
  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    }
    return () => {
      // Use ref for cleanup to get current stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isCameraOpen, facingMode]);

  // Convert file to data URL and save to database
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      for (const file of Array.from(e.target.files)) {
        const dataUrl = await fileToDataUrl(file);
        addPhotoMutation.mutate(dataUrl);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (const file of Array.from(e.dataTransfer.files)) {
        const dataUrl = await fileToDataUrl(file);
        addPhotoMutation.mutate(dataUrl);
      }
    }
  };

  const removePhoto = (photoId: string) => {
    deletePhotoMutation.mutate(photoId);
  };

  return (
    <div className="space-y-8 h-full flex flex-col animate-in fade-in duration-500">
      {/* Action buttons row */}
      <div className="flex gap-4">
        <Button
          variant="secondary"
          className="flex-1 h-12 text-[13px] font-bold border border-border/50 shadow-sm transition-all active:scale-[0.98]"
          onClick={() => setIsCameraOpen(true)}
          data-testid="button-open-camera"
        >
          <Video className="w-4 h-4 mr-2 text-primary" />
          Capture Photo
        </Button>
        <Button
          variant="secondary"
          className="flex-1 h-12 text-[13px] font-bold border border-border/50 shadow-sm transition-all active:scale-[0.98]"
          onClick={() => fileInputRef.current?.click()}
          data-testid="button-upload-file"
        >
          <Upload className="w-4 h-4 mr-2 text-primary" />
          Upload Files
        </Button>
      </div>

      {/* Drag and drop area */}
      <div 
        className={cn(
          "border border-dashed rounded-xl p-8 transition-all text-center cursor-pointer group relative overflow-hidden bg-muted/[0.03]",
          isDragging ? "border-primary bg-primary/[0.02] scale-[1.01]" : "border-border/60 hover:border-primary/40 hover:bg-muted/[0.08]"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-background border border-border/40 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <ImageIcon className="w-5 h-5 text-muted-foreground/60" />
          </div>
          <div className="space-y-1">
            <p className="text-[13px] font-bold text-foreground/70">Click or drag photos to upload</p>
            <p className="text-[11px] text-muted-foreground/50 font-medium uppercase tracking-wider">Supports JPG, PNG up to 10MB</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-foreground/80 flex items-center gap-2">
            Asset Gallery
            <span className="text-[11px] font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
              {photos.length}
            </span>
            {photosLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground/40" />}
          </h3>
          {photos.length < 4 && (
            <span className="text-[11px] font-bold text-amber-600/70 uppercase tracking-tight">Recommended: 4+ photos</span>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center border border-border/40 rounded-xl bg-muted/[0.02] text-muted-foreground/30 gap-3">
            <ImageIcon className="w-8 h-8 opacity-10" />
            <p className="text-[13px] font-medium italic">{photosLoading ? 'Scanning library...' : 'No assets in gallery'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                  className="group relative aspect-square rounded-xl overflow-hidden bg-background border border-border/50 shadow-sm hover:shadow-md transition-all"
                >
                  <img src={photo.url} alt={`Item ${index + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform"
                      onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                      disabled={deletePhotoMutation.isPending}
                    >
                      {deletePhotoMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  
                  <div className="absolute top-2 left-2 bg-background/90 text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-md border border-border/50">
                    {index === 0 ? 'Primary' : `Asset ${index + 1}`}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
