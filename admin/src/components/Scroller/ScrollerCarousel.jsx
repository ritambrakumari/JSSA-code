import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { scrollerAPI } from "../../utils/api";

const ScrollerCarousel = () => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchScrollerImages();
  }, []);

  const fetchScrollerImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await scrollerAPI.getAll("true"); // Only fetch active images
      if (response.success && response.data) {
        const activeImages = (response.data.images || []).filter(
          (img) => img.isActive
        );
        setImages(activeImages);
        if (activeImages.length > 0) {
          setCurrentIndex(0);
        }
      }
    } catch (err) {
      console.error("Fetch scroller images error:", err);
      setError(err.message || "Failed to load scroller images");
    } finally {
      setLoading(false);
    }
  };

  // Auto-rotate images
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="w-full aspect-video bg-gray-200 animate-pulse rounded-lg"></div>
    );
  }

  if (error || images.length === 0) {
    return null; // Don't show anything if no images or error
  }

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-lg shadow-lg mb-6">
      {/* Images */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={image._id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {image.link ? (
              <a
                href={image.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full"
              >
                <img
                  src={image.imageUrl}
                  alt={image.title || `Scroller ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </a>
            ) : (
              <img
                src={image.imageUrl}
                alt={image.title || `Scroller ${index + 1}`}
                className="w-full h-full object-cover"
              />
            )}
            {/* Overlay with title and description */}
            {(image.title || image.description) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                {image.title && (
                  <h3 className="text-white font-bold text-lg mb-1">
                    {image.title}
                  </h3>
                )}
                {image.description && (
                  <p className="text-white/90 text-sm">{image.description}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ScrollerCarousel;
