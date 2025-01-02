import { useState, useEffect } from 'react';

const Footer = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const pageHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrollThreshold = (pageHeight - windowHeight) * 0.2;

      setIsVisible(scrollPosition > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer
      className={`bg-slate-900/90 backdrop-blur-lg fixed w-full bottom-0 z-40 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-center h-full">
          <p className="text-sm font-medium text-slate-200 flex items-center gap-2 text-center">
            From Softech Chartage, inventors of Freelanso <br />
            @2025 all rights reserved
          </p> 
        </div>
      </div>
    </footer>
  );
};

export default Footer;