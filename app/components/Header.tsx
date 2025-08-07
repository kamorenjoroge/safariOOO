"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  UserCircle,
  ChevronDown,
  LogOut,
  Settings,
  User,
} from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

const getPageTitle = (pathname: string) => {
  const titles: { [key: string]: string } = {
    "/d": "Dashboard",
    "/d/cars": "Car Management",
    "/d/category": "Car Categories",
    "/d/bookings": "Bookings",
    "/d/users": "Customers",
    "/d/owners": "Car Owners",
    "/d/messages": "Messages",
    "/d/test": "Test wewewe love dear",
  };
  return titles[pathname] || "Admin";
};

const Header = ({ onMenuClick }: HeaderProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  // Mock notifications data for car hire
  const notifications = [
    {
      id: 1,
      message: "New booking request from John Doe",
      time: "2 min ago",
      unread: true,
    },
    {
      id: 2,
      message: "Payment received for Toyota Camry",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      message: "Car maintenance due for KCA 123A",
      time: "3 hours ago",
      unread: false,
    },
    {
      id: 4,
      message: "New user registered: Mary Wanjiku",
      time: "5 hours ago",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="bg-light shadow-sm border-b border-secondary sticky top-0 z-30">
      <div className="px-4 py-3 bg-gradient-to-r from-light to-secondary/20">
        <div className="flex items-center justify-between">
          {/* Left Side - Menu Button & Page Title */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md hover:bg-secondary text-earth hover:text-primary transition-all duration-200 mr-3"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-semibold text-primary">{pageTitle}</h1>
          </div>

          {/* Right Side - Notifications & Profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 rounded-md hover:bg-secondary text-earth-light hover:text-primary transition-colors duration-200"
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-light text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-light rounded-lg shadow-lg border border-secondary-dark z-50">
                  <div className="p-4 border-b border-secondary bg-gradient-to-r from-primary/5 to-primary/10">
                    <h3 className="text-lg font-semibold text-primary">
                      Notifications
                    </h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-secondary hover:bg-secondary/50 transition-colors ${
                          notification.unread
                            ? "bg-accent/5 border-l-4 border-l-accent"
                            : ""
                        }`}
                      >
                        <p className="text-sm text-earth">
                          {notification.message}
                        </p>
                        <p className="text-xs text-earth-light mt-1">
                          {notification.time}
                        </p>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-accent rounded-full mt-1"></div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center border-t border-secondary bg-secondary/20">
                    <button className="text-sm text-primary hover:text-primary-dark transition-colors font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary transition-colors duration-200"
              >
                <UserCircle size={32} className="text-primary" />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-earth">John Kamau</p>
                  <p className="text-xs text-earth-light">Super Admin</p>
                </div>
                <ChevronDown size={20} className="text-earth-light" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-light rounded-lg shadow-lg border border-secondary-dark z-50">
                  <div className="p-2">
                    <button className="w-full flex items-center px-3 py-2 text-sm text-earth hover:bg-secondary hover:text-primary rounded-md transition-colors">
                      <User size={16} className="mr-3" />
                      Profile
                    </button>
                    <button className="w-full flex items-center px-3 py-2 text-sm text-earth hover:bg-secondary hover:text-primary rounded-md transition-colors">
                      <Settings size={16} className="mr-3" />
                      Settings
                    </button>
                    <hr className="my-1 border-secondary-dark" />
                    <button className="w-full flex items-center px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-md transition-colors">
                      <LogOut size={16} className="mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(isProfileOpen || isNotificationOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileOpen(false);
            setIsNotificationOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;
