import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";
import { getBanners, createBanner, deleteBanner } from "../../firebase/banners";
import { uploadToR2 } from "../../utils/r2Upload";

const BannersTab = () => {
  const { language } = useLanguage();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageTitle, setImageTitle] = useState("");
  const [imageLink, setImageLink] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const result = await getBanners();
      if (result.success) {
        // Filter only images (not videos)
        const imageItems = (result.banners || []).filter(b => {
          const isVideo = b.image_url && (
            b.image_url.endsWith('.mp4') || 
            b.image_url.endsWith('.webm') || 
            b.image_url.endsWith('.ogg') ||
            b.type === 'video'
          );
          return !isVideo;
        });
        setBanners(imageItems);
      }
    } catch (error) {
      console.error('Bannerlər yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageInputRef.current?.files[0]) {
      toast.error(language === 'az' ? 'Şəkil seçin' : 'Select an image');
      return;
    }

    setUploading(true);
    try {
      const file = imageInputRef.current.files[0];
      toast.info(language === 'az' ? 'Yüklənir...' : 'Uploading...');
      
      // Upload directly to R2
      const uploadResult = await uploadToR2(file, 'banners');
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      const bannerData = {
        image_url: uploadResult.url,
        title: imageTitle || "",
        link: imageLink || "",
        order: banners.length,
        type: 'image'
      };

      const result = await createBanner(bannerData);
      
      if (result.success) {
        toast.success(language === 'az' ? 'Banner əlavə edildi' : 'Banner added');
        fetchBanners();
        setPreviewImage(null);
        setImageTitle("");
        setImageLink("");
        if (imageInputRef.current) imageInputRef.current.value = "";
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Banner upload error:', error);
      toast.error(language === 'az' ? 'Banner əlavə edilə bilmədi' : 'Failed to add banner');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (bannerId) => {
    if (!window.confirm(language === 'az' ? 'Bu banneri silmək istədiyinizə əminsiniz?' : 'Are you sure?')) {
      return;
    }
    try {
      const result = await deleteBanner(bannerId);
      if (result.success) {
        toast.success(language === 'az' ? 'Banner silindi' : 'Banner deleted');
        fetchBanners();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error(language === 'az' ? 'Banner silinə bilmədi' : 'Failed to delete banner');
    }
  };

  if (loading) {
    return <div className="text-center py-8">{language === 'az' ? 'Yüklənir...' : 'Loading...'}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add New Image Banner */}
      <div className="border border-border rounded-2xl p-6 bg-card">
        <h3 className="text-lg font-semibold mb-4">
          {language === 'az' ? '🖼️ Yeni Şəkil Banner Əlavə Et' : '🖼️ Add New Image Banner'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {language === 'az' ? 'Şəkil banner slider-də videolar ilə birlikdə göstəriləcək' : 'Image banner will be shown in banner slider with videos'}
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>{language === 'az' ? 'Banner Şəkili' : 'Banner Image'}</Label>
              <p className="text-xs text-muted-foreground mb-2">JPG, PNG, GIF, WebP və s.</p>
              
              {/* Visible file input for images */}
              <input
                ref={imageInputRef}
                type="file"
                onChange={handleImageSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              
              {/* Preview */}
              {previewImage && (
                <div className="mt-4 border-2 border-dashed border-border rounded-2xl p-4">
                  <img src={previewImage} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                </div>
              )}
            </div>

            <div>
              <Label>{language === 'az' ? 'Başlıq (optional)' : 'Title (optional)'}</Label>
              <Input
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                placeholder={language === 'az' ? 'Banner başlığı' : 'Banner title'}
                className="mt-1 rounded-full"
              />
            </div>

            <div>
              <Label>{language === 'az' ? 'Link (optional)' : 'Link (optional)'}</Label>
              <Input
                value={imageLink}
                onChange={(e) => setImageLink(e.target.value)}
                placeholder="https://..."
                className="mt-1 rounded-full"
              />
            </div>

            <Button 
              onClick={handleImageUpload} 
              disabled={uploading || !previewImage}
              className="w-full rounded-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading 
                ? (language === 'az' ? 'Yüklənir...' : 'Uploading...') 
                : (language === 'az' ? 'Banner Əlavə Et' : 'Add Banner')
              }
            </Button>
          </div>

          <div>
            <Label>{language === 'az' ? 'Önizləmə' : 'Preview'}</Label>
            <div className="mt-2 border border-border rounded-2xl overflow-hidden bg-muted">
              {previewImage ? (
                <img src={previewImage} alt="Preview" className="w-full h-64 object-cover" />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 mx-auto mb-2 opacity-50" />
                    <p>{language === 'az' ? 'Şəkil seçilməyib' : 'No image selected'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Existing Image Banners */}
      <div className="border border-border rounded-2xl p-6 bg-card">
        <h3 className="text-lg font-semibold mb-4">
          {language === 'az' ? 'Mövcud Bannerlər' : 'Existing Banners'} ({banners.length})
        </h3>
        
        {banners.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {language === 'az' ? 'Heç bir banner yoxdur' : 'No banners yet'}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map((banner, index) => (
              <div key={banner.id} className="border border-border rounded-xl overflow-hidden group relative">
                <img 
                  src={banner.image_url} 
                  alt={banner.title || `Banner ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <p className="font-medium truncate">{banner.title || `Banner ${index + 1}`}</p>
                  {banner.link && (
                    <p className="text-xs text-muted-foreground truncate">{banner.link}</p>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(banner.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  🖼️ {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BannersTab;
