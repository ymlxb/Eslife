import React, { useRef, useEffect, useState } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholder?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, placeholder = '', alt, ...props }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [currentSrc, setCurrentSrc] = useState(placeholder);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        setCurrentSrc(src);
        if (imgRef.current) {
          observer.unobserve(imgRef.current);
        }
      }
    });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  return <img ref={imgRef} src={currentSrc} alt={alt} {...props} />;
};

export default LazyImage;
