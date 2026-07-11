import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Video as VideoIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";
import { getBanners, createBanner, deleteBanner } from "../../firebase/banners";
import { uploadToR2 } from "../../utils/r2Upload";

const VideosTab = () => {
  const { language } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const result = await getBanners();
      if (result.success) {
        // Filter only videos
        const videoItems = (result.banners || []).filter(b => {
          const isVideo = b.image_url && (
            b.image_url.endsWith('.mp4') || 
            b.image_url.endsWith('.webm') || 
            b.image_url.endsWith('.ogg') ||
            b.type === 'video'
          );
          return isVideo;
        });
        setVideos(videoItems);
      }
    } catch (error) {
      console.error('Videolar yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewVideo(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Upload file to R2 via backend
  const handleVideoUpload = async () => {
    if (!videoInputRef.current?.files[0]) {
      toast.error(language === 'az' ? 'Video seçin' : 'Select a video');
      return;
    }

    setUploading(true);
    try {
      const file = videoInputRef.current.files[0];
      toast.info(language === 'az' ? 'Video yüklənir...' : 'Uploading video...');
      
      // Upload directly to R2
      const uploadResult = await uploadToR2(file, 'videos');
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      const bannerData = {
        image_url: uploadResult.url,
        title: "",
        link: "",
        order: videos.length,
        type: 'video'
      };

      const result = await createBanner(bannerData);
      
      if (result.success) {
        toast.success(language === 'az' ? 'Video əlavə edildi' : 'Video added');
        fetchVideos();
        setPreviewVideo(null);
        if (videoInputRef.current) videoInputRef.current.value = "";
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Video upload error:', error);
      toast.error(language === 'az' ? 'Video əlavə edilə bilmədi' : 'Failed to add video');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm(language === 'az' ? 'Bu videonu silmək istədiyinizə əminsiniz?' : 'Are you sure?')) {
      return;
    }
    try {
      const result = await deleteBanner(videoId);
      if (result.success) {
        toast.success(language === 'az' ? 'Video silindi' : 'Video deleted');
        fetchVideos();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error(language === 'az' ? 'Video silinə bilmədi' : 'Failed to delete video');
    }
  };

  if (loading) {
    return <div className="text-center py-8">{language === 'az' ? 'Yüklənir...' : 'Loading...'}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add New Video */}
      <div className="border border-border rounded-2xl p-6 bg-card">
        <h3 className="text-lg font-semibold mb-4">
          {language === 'az' ? '🎥 Yeni Video Əlavə Et' : '🎥 Add New Video'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {language === 'az' ? 'Video banner slider-də şəkil bannerlər ilə birlikdə göstəriləcək' : 'Video will be shown in banner slider with image banners'}
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>{language === 'az' ? 'Video Fayl' : 'Video File'}</Label>
              <p className="text-xs text-muted-foreground mb-2">MP4, WebM, MOV, AVI və s.</p>
              
              {/* Visible file input for videos */}
              <input
                ref={videoInputRef}
                type="file"
                onChange={handleVideoSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              
              {/* Preview */}
              {previewVideo && (
                <div className="mt-4 border-2 border-dashed border-border rounded-2xl p-4">
                  <video src={previewVideo} className="max-h-48 mx-auto rounded-lg" controls />
                </div>
              )}
            </div>

            <Button 
              onClick={handleVideoUpload} 
              disabled={uploading || !previewVideo}
              className="w-full rounded-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading 
                ? (language === 'az' ? 'Yüklənir...' : 'Uploading...') 
                : (language === 'az' ? 'Video Əlavə Et' : 'Add Video')
              }
            </Button>
          </div>

          <div>
            <Label>{language === 'az' ? 'Önizləmə' : 'Preview'}</Label>
            <div className="mt-2 border border-border rounded-2xl overflow-hidden bg-muted">
              {previewVideo ? (
                <video src={previewVideo} className="w-full h-64 object-cover" controls />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <VideoIcon className="h-16 w-16 mx-auto mb-2 opacity-50" />
                    <p>{language === 'az' ? 'Video seçilməyib' : 'No video selected'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Existing Videos */}
      <div className="border border-border rounded-2xl p-6 bg-card">
        <h3 className="text-lg font-semibold mb-4">
          {language === 'az' ? 'Mövcud Videolar' : 'Existing Videos'} ({videos.length})
        </h3>
        
        {videos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {language === 'az' ? 'Heç bir video yoxdur' : 'No videos yet'}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video, index) => (
              <div key={video.id} className="border border-border rounded-xl overflow-hidden group relative">
                <video 
                  src={video.image_url}
                  className="w-full h-32 object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
                <div className="p-3">
                  <p className="font-medium truncate">Video {index + 1}</p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(video.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  🎥 {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideosTab;
