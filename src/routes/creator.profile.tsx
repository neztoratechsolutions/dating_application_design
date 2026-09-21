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
  
  const [bio, setBio] = useState("Let's vibe! Music, movies & midnight chats 🌙");
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when user data is loaded from auth context
  useEffect(() => {
    if (user) {
      setName(user.display_name || user.name || "");
      setBio(user.bio || "Let's vibe! Music, movies & midnight chats 🌙");
      
      // Construct image URL if user has a profile photo
      if (user.profile_photo) {
        const cleanPath = user.profile_photo.replace(/\\/g, '/'); // Replace backslashes with forward slashes
        setPhotoPreview(`${API_BASE_URL}/${cleanPath}`);
      }
    }
  }, [user]);

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
      
      // Only append photo if a new one was selected
      if (photo) {
        formData.append("profile_photo", photo);
      }

      const response = await fetch(`${API_BASE_URL}/users/${user.user_id}`, {
        method: "PUT",
        headers: {
          // Do not set Content-Type, browser handles FormData boundaries
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Failed to update profile");
      }

      // Update local auth context if your store supports it
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
              <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
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