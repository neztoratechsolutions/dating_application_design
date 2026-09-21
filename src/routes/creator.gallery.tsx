import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit";
import { Plus, X, Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/creator/gallery")({ component: Gallery });

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

// Type for our gallery images
type GalleryImage = {
  id: number;
  url: string;
};

function Gallery() {
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  
  const [imgs, setImgs] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 5;

  // Fetch existing gallery images on mount
  useEffect(() => {
    const fetchGallery = async () => {
      if (!user?.user_id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/gallery/user/${user.user_id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            // Map API response to construct full image URLs
            const fetchedImgs = data.map((item: any) => ({
              id: item.id,
              url: `${API_BASE_URL}/${item.photo}`,
            }));
            setImgs(fetchedImgs);
          }
        }
      } catch (error) {
        console.error("Failed to fetch gallery:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, [user, token]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.user_id) {
      toast.error("Authentication error. Please log in again.");
      return;
    }

    if (imgs.length >= MAX_IMAGES) {
      toast.error(`You can only upload up to ${MAX_IMAGES} photos.`);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("user_id", String(user.user_id));
      formData.append("photo", file);

      const response = await fetch(`${API_BASE_URL}/gallery/`, {
        method: "POST",
        headers: {
          // Don't set Content-Type for FormData, browser handles it
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Failed to upload photo");
      }

      // Construct full image URL for the newly uploaded image
      const newImage: GalleryImage = {
        id: data.data.id,
        url: `${API_BASE_URL}/${data.data.photo}`,
      };
      
      setImgs((prev) => [...prev, newImage]);
      toast.success("Photo uploaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (idToRemove: number) => {
    // Note: This only removes it from the local UI state.
    // If you have a DELETE API endpoint, you would call it here.
    setImgs(imgs.filter((img) => img.id !== idToRemove));
    toast("Removed from view");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Gallery" subtitle={`Upload up to ${MAX_IMAGES} photos`} />
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*"
        className="hidden" 
      />
      
      <div className="grid grid-cols-3 gap-3">
        {imgs.map((img) => (
          <div key={img.id} className="relative aspect-square rounded-2xl bg-gradient-accent overflow-hidden group">
            <img src={img.url} alt={`Gallery ${img.id}`} className="w-full h-full object-cover" />
            <button 
              onClick={() => handleRemove(img.id)} 
              className="absolute top-2 right-2 rounded-full bg-destructive/80 p-1 opacity-0 group-hover:opacity-100 transition"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}
        
        {imgs.length < MAX_IMAGES && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-2xl glass border-2 border-dashed border-glass-border flex items-center justify-center text-muted-foreground disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}