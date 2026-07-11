import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '/.netlify/functions';

const BannerTab = () => {
  const { language } = useLanguage();
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBanner();
  }, []);

  const fetchBanner = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/banner`);
      if (response.data.banner) {
        setBanner(response.data.banner);
        setTitle(response.data.banner.title || "");
        setDescription(response.data.banner.description || "");
      }
    } catch (error) {
      console.error('Banner yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files[0] && !banner) {
      toast.error(language === 'az' ? 'Şəkil seçin' : 'Select an image');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      if (fileInputRef.current?.files[0]) {
        formData.append('banner_image', fileInputRef.current.files[0]);
      }
      formData.append('title', title);
      formData.append('description', description);

      await axios.post(`${BACKEND_URL}/api/admin/banner`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Banner yeniləndi');
      fetchBanner();
      setPreviewImage(null);
    } catch (error) {
      toast.error('Banner yenilənə bilmədi');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">{language === 'az' ? 'Yüklənir...' : 'Loading...'}</div>;
  }

  return (
    <div className="border border-border rounded-2xl p-6 space-y-6">
      <h2 className="text-lg font-semibold">
        {language === 'az' ? 'Ana Səhifə Banneri' : language === 'en' ? 'Homepage Banner' : 'Баннер главной страницы'}
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label>{language === 'az' ? 'Banner Şəkli' : 'Banner Image'}</Label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
            >
              {previewImage || banner?.image_url ? (
                <img 
                  src={previewImage || banner?.image_url} 
                  alt="Banner" 
                  className="max-h-48 mx-auto rounded-lg object-cover" 
                />
              ) : (
                <div className="text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>{language === 'az' ? 'Şəkil seçmək üçün klikləyin' : 'Click to select image'}</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div>
            <Label htmlFor="banner-title">{language === 'az' ? 'Başlıq (optional)' : 'Title (optional)'}</Label>
            <Input
              id="banner-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'az' ? 'Banner başlığı' : 'Banner title'}
              className="mt-2 rounded-full"
            />
          </div>

          <div>
            <Label htmlFor="banner-desc">{language === 'az' ? 'Təsvir (optional)' : 'Description (optional)'}</Label>
            <Textarea
              id="banner-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'az' ? 'Banner təsviri' : 'Banner description'}
              className="mt-2 rounded-2xl"
              rows={3}
            />
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={uploading}
            className="w-full rounded-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading 
              ? (language === 'az' ? 'Yüklənir...' : 'Uploading...') 
              : (language === 'az' ? 'Banner Yenilə' : 'Update Banner')
            }
          </Button>
        </div>

        <div>
          <Label>{language === 'az' ? 'Cari Banner' : 'Current Banner'}</Label>
          <div className="mt-2 border border-border rounded-2xl overflow-hidden">
            {banner?.image_url ? (
              <img src={banner.image_url} alt="Current Banner" className="w-full h-64 object-cover" />
            ) : (
              <div className="h-64 flex items-center justify-center bg-muted">
                <p className="text-muted-foreground">{language === 'az' ? 'Banner yoxdur' : 'No banner set'}</p>
              </div>
            )}
          </div>
          {banner && (
            <div className="mt-4 text-sm text-muted-foreground">
              <p>{language === 'az' ? 'Son yenilənmə' : 'Last updated'}: {new Date(banner.updated_at).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BannerTab;
