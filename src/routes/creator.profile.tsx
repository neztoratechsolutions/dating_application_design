import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth-store";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Camera } from "lucide-react";

export const Route = createFileRoute("/creator/profile")({ component: P });

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

function P() {
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  const update = useAuth((s) => s.updateUser);
  
  const [bio, setBio] = useState("");
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch the latest user details from API on mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.user_id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/users/${user.user_id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          const resData = await response.json();
          const userData = resData.data || resData; 
          
          setName(userData.display_name || "");
          setBio(userData.bio || "");
          
          if (userData.profile_photo) {
            // 1. Replace Windows backslashes with forward slashes
            let cleanPath = userData.profile_photo.replace(/\\/g, '/');
            // 2. Remove leading slash if present to avoid double slashes (http://...//uploads)
            if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
            // 3. Encode URI components to handle spaces and parentheses safely
            const encodedPath = encodeURI(cleanPath);
            
            setPhotoPreview(`${API_BASE_URL}/${encodedPath}`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [user, token]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      // Create a temporary local URL for instant preview
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!user?.user_id) {
      toast.error("Authentication error. Please log in again.");
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("display_name", name);
      formData.append("bio", bio);
      
      if (photo) {
        formData.append("profile_photo", photo);
      }

      const response = await fetch(`${API_BASE_URL}/users/${user.user_id}`, {
        method: "PUT",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Failed to update profile");
      }

      if (update) {
        update({ 
          ...user, 
          display_name: name, 
          bio: bio,
          profile_photo: data.data?.profile_photo || user.profile_photo
        });
      }

      toast.success("Profile saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
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
      <PageHeader title="Profile Setup" subtitle="How customers see you" />
      <div className="glass-strong rounded-3xl p-6 space-y-4">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handlePhotoChange} 
          accept="image/*"
          className="hidden" 
        />
        
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-3xl font-bold overflow-hidden">
            {photoPreview ? (
              <img 
                src={photoPreview} 
                alt="Profile" 
                className="w-full h-full object-cover" 
                // Fallback if the image URL is broken or if the file was a PDF
                onError={() => setPhotoPreview(null)} 
              />
            ) : (
              <span className="text-white">
                {name.charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl glass px-4 py-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Camera className="h-4 w-4" />
            Change photo
          </button>
        </div>
        
        <div>
          <label className="text-xs text-muted-foreground">Display name</label>
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            disabled={isSaving}
            className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none disabled:opacity-70" 
          />
        </div>
        
        <div>
          <label className="text-xs text-muted-foreground">Bio</label>
          <textarea 
            value={bio} 
            onChange={(e) => setBio(e.target.value)} 
            rows={3} 
            disabled={isSaving}
            className="w-full glass rounded-xl px-4 py-2.5 text-sm mt-1 outline-none disabled:opacity-70 resize-none" 
          />
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 font-semibold shadow-glow disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </button>
      </div>
    </div>
  );
}