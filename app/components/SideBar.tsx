'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Gauge, 
  Car, 
  CalendarCheck, 
  Users, 
  X, 
  MessageCircle, 
  ChevronDown, 
  Folder, 
  CarFront, 
  CarTaxiFront
} from 'lucide-react';
import { useState } from 'react';

const navigationItems = [
  { name: 'Dashboard', href: '/d', icon: Gauge },
  { 
    name: 'Car Management', 
    icon: Car,
    subItems: [
      { name: 'Cars', href: '/d/cars', icon: Car },
      { name: 'Categories', href: '/d/category', icon: Folder },
    ]
  },
  { name: 'Bookings', href: '/d/bookings', icon: CalendarCheck },
  { 
    name: 'Users Management', 
    icon: Users,
    subItems: [
      { name: 'Customers', href: '/d/users', icon: CarTaxiFront },
      { name: 'Car Owners', href: '/d/owners', icon: CarFront },
    ]
  },
  { name: 'Messages', href: '/d/messages', icon: MessageCircle },
  { name: 'Test', href: '/d/test', icon: MessageCircle },
];

interface SideBarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideBar = ({ isOpen, onClose }: SideBarProps) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-dark bg-opacity-50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-light shadow-xl transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center">
            <div className="p-2 bg-primary/15 rounded-lg mr-2 border border-primary/20">
              <Car className="text-primary" size={24} />
            </div>
            <h1 className="text-xl font-bold text-primary">Safari Cars</h1>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary text-earth transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              
              if ('subItems' in item) {
                const isExpanded = expandedItems[item.name];
                const hasActiveChild = item.subItems?.some(subItem => pathname === subItem.href) ?? false;
                
                return (
                  <li key={item.name}>
                    {/* Parent Item */}
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className={`
                        w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 text-sm group
                        ${hasActiveChild 
                          ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm border border-primary/20' 
                          : 'text-earth hover:bg-gradient-to-r hover:from-secondary hover:to-secondary/50 hover:text-primary hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <div className={`
                          p-1.5 rounded-lg mr-3 transition-colors duration-200
                          ${hasActiveChild ? 'bg-primary/20' : 'bg-transparent group-hover:bg-primary/10'}
                        `}>
                          <Icon size={18} />
                        </div>
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={18} />
                      </div>
                    </button>

                    {/* Dropdown */}
                    <div className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                    `}>
                      <div className="py-1">
                        <ul className="ml-6 space-y-1 relative">
                          {/* Vertical line */}
                          <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-secondary to-transparent"></div>
                          
                          {item.subItems?.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isActive = pathname === subItem.href;
                            
                            return (
                              <li key={subItem.name} className="relative">
                                {/* Dot */}
                                <div className={`
                                  absolute left-1.5 top-1/2 w-1.5 h-1.5 rounded-full transform -translate-y-1/2 transition-colors duration-200
                                  ${isActive ? 'bg-primary' : 'bg-secondary-dark'}
                                `}></div>
                                
                                <Link
                                  href={subItem.href}
                                  onClick={() => {
                                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                                      onClose();
                                    }
                                  }}
                                  className={`
                                    group flex items-center pl-6 pr-3 py-2.5 ml-2 rounded-lg transition-all duration-200 text-sm
                                    ${isActive 
                                      ? 'bg-gradient-to-r from-primary to-primary-dark text-light shadow-lg transform scale-[1.02] border border-primary-light/30' 
                                      : 'text-earth hover:bg-gradient-to-r hover:from-secondary hover:to-secondary-dark hover:text-primary hover:shadow-sm hover:pl-7'
                                    }
                                  `}
                                >
                                  <div className={`
                                    p-1 rounded-md mr-3 transition-all duration-200
                                    ${isActive ? 'bg-light/20' : 'bg-transparent group-hover:bg-primary/10'}
                                  `}>
                                    <SubIcon size={16} />
                                  </div>
                                  <span className="font-medium">{subItem.name}</span>
                                  
                                  {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                                  )}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              } else {
                const isActive = pathname === item.href;
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                          onClose();
                        }
                      }}
                      className={`
                        group flex items-center px-3 py-3 rounded-xl transition-all duration-200 text-sm
                        ${isActive 
                          ? 'bg-gradient-to-r from-primary to-primary-dark text-light shadow-lg transform scale-[1.02] border border-primary-light/30' 
                          : 'text-earth hover:bg-gradient-to-r hover:from-secondary hover:to-secondary-dark hover:text-primary hover:shadow-sm'
                        }
                      `}
                    >
                      <div className={`
                        p-1.5 rounded-lg mr-3 transition-colors duration-200
                        ${isActive ? 'bg-light/20' : 'bg-transparent group-hover:bg-primary/10'}
                      `}>
                        <Icon size={18} />
                      </div>
                      <span className="font-medium">{item.name}</span>
                      
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                      )}
                    </Link>
                  </li>
                );
              }
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-secondary bg-gradient-to-t from-secondary/30 to-transparent">
          <div className="text-xs text-earth-light text-left font-medium">
            Car Hire Admin
          </div>
        </div>
      </div>
    </>
  );
};

export default SideBar;
