'use client';

import { CopyrightIcon } from "lucide-react";



const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-light to-secondary/30 border-t border-secondary-dark py-4 px-4 text-center shadow-sm">
      <div className="flex flex-col md:flex-row items-center justify-between text-sm text-earth">
        <div className="flex items-center mb-2 md:mb-0">
          <div className="p-1 bg-primary/10 rounded-full mr-2">
            <CopyrightIcon className="text-primary" size={16} />
          </div>
          <span className="font-medium">{currentYear} Safari Ride Car Hire </span>
        </div>
        
        <div className="flex space-x-6">
          <a href="#" className="hover:text-primary transition-colors duration-200 hover:underline decoration-primary/30">
            Privacy
          </a>
          <a href="#" className="hover:text-primary transition-colors duration-200 hover:underline decoration-primary/30">
            Terms
          </a>
          <a href="#" className="hover:text-primary transition-colors duration-200 hover:underline decoration-primary/30">
            Help
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;