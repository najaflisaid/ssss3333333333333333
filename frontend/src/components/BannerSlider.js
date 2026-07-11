import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

const BannerSlider = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, banners.length, nextSlide]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div 
      className="relative w-full overflow-hidden group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides Container */}
      <div 
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner, index) => {
          // Check if banner is video (by file extension or mime type)
          const isVideo = banner.image_url && (
            banner.image_url.endsWith('.mp4') || 
            banner.image_url.endsWith('.webm') || 
            banner.image_url.endsWith('.ogg') ||
            banner.mime_type?.startsWith('video/')
          );

          return (
          <div 
            key={banner.id || index}
            className="min-w-full relative"
          >
            {banner.link ? (
              <a href={banner.link} target="_blank" rel="noopener noreferrer">
                {isVideo ? (
                  <video
                    src={banner.image_url}
                    className="w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] object-cover bg-gray-100 dark:bg-gray-800"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={banner.image_url}
                    alt={banner.title || `Banner ${index + 1}`}
                    className="w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] object-contain bg-gray-100 dark:bg-gray-800"
                  />
                )}
              </a>
            ) : (
              isVideo ? (
                <video
                  src={banner.image_url}
                  className="w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] object-cover bg-gray-100 dark:bg-gray-800"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={banner.image_url}
                  alt={banner.title || `Banner ${index + 1}`}
                  className="w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] object-contain bg-gray-100 dark:bg-gray-800"
                />
              )
            )}
            
            {/* Banner Title Overlay */}
            {banner.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 sm:p-6 md:p-8">
                <h2 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold">
                  {banner.title}
                </h2>
              </div>
            )}
          </div>
        )}
        )}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-6 sm:w-8' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerSlider;
