import { useState, useRef, useCallback, useEffect } from 'react';
import { InventoryItem } from '@/lib/mockData';
import { useApp } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, GripVertical, Image as ImageIcon, Video, CircleDot, FlipHorizontal, SwitchCamera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PhotoManagerProps {
  item: InventoryItem;
}

export function PhotoManager({ item }: PhotoManagerProps) {
  const { updateItemPhotos } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

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
        
        // Convert to data URL and add to photos
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        updateItemPhotos(item.id, [...item.photos, dataUrl]);
      }
    }
  }, [facingMode, item.id, item.photos, updateItemPhotos]);

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

  // Mock upload functionality
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // In a real app, we'd upload these. Here we just create object URLs
      const newPhotos = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      updateItemPhotos(item.id, [...item.photos, ...newPhotos]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Mock drop handling - just adding a placeholder for effect if no files actually dropped
    // or processing files if they exist
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newPhotos = Array.from(e.dataTransfer.files).map(file => URL.createObjectURL(file));
      updateItemPhotos(item.id, [...item.photos, ...newPhotos]);
    } else {
       // Just to simulate interaction if dropped something else
       // In real app we'd handle this better
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...item.photos];
    newPhotos.splice(index, 1);
    updateItemPhotos(item.id, newPhotos);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Action buttons row */}
      <div className="flex gap-3">
        <Button
          variant="default"
          size="lg"
          className="flex-1 h-14"
          onClick={() => setIsCameraOpen(true)}
          data-testid="button-open-camera"
        >
          <Video className="w-5 h-5 mr-2" />
          Take Photo
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1 h-14"
          onClick={() => fileInputRef.current?.click()}
          data-testid="button-upload-file"
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload File
        </Button>
      </div>

      {/* Drag and drop area */}
      <div 
        className={cn(
          "border-2 border-dashed rounded-xl p-6 transition-all text-center cursor-pointer group relative overflow-hidden bg-card/50",
          isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
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
        
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Camera className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm text-muted-foreground">Or drag photos here</p>
          </div>
        </div>
      </div>

      {/* Camera Dialog */}
      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Take Photo</DialogTitle>
          </DialogHeader>
          
          <div className="p-4 space-y-4">
            {cameraError ? (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <p className="text-destructive text-center px-4">{cameraError}</p>
              </div>
            ) : (
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn(
                    "w-full h-full object-cover",
                    facingMode === 'user' && "scale-x-[-1]"
                  )}
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}
            
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={switchCamera}
                data-testid="button-switch-camera"
              >
                <SwitchCamera className="w-5 h-5" />
              </Button>
              
              <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
                onClick={capturePhoto}
                disabled={!!cameraError}
                data-testid="button-capture-photo"
              >
                <CircleDot className="w-8 h-8" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setIsCameraOpen(false)}
                data-testid="button-close-camera"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <p className="text-center text-sm text-muted-foreground">
              Photos taken: {item.photos.length}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
            Gallery ({item.photos.length})
          </h3>
          {item.photos.length < 4 && (
            <span className="text-xs text-amber-600 font-medium">Add {4 - item.photos.length} more recommended</span>
          )}
        </div>

        {item.photos.length === 0 ? (
          <div className="h-40 flex items-center justify-center border rounded-lg bg-muted/20 text-muted-foreground text-sm italic">
            No photos added yet
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {item.photos.map((photo, index) => (
                <motion.div
                  key={`${photo}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  className="group relative aspect-square rounded-lg overflow-hidden bg-background border shadow-sm"
                >
                  <img src={photo} alt={`Item ${index + 1}`} className="w-full h-full object-cover" />
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => { e.stopPropagation(); removePhoto(index); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-md">
                    #{index + 1}
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
