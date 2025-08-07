'use client';
import { useState } from "react";
import Header from "../components/Header";
import SideBar from "../components/SideBar";
import { Toaster } from "react-hot-toast";
import Footer from "../components/Footer";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    
      
        <div className="flex h-screen bg-gray-50">
          <SideBar isOpen={isSidebarOpen} onClose={closeSidebar} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header onMenuClick={toggleSidebar} />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
              <div className="p-6">
                <Toaster position="top-right" />
                {children}
              </div>
            </main>
            <Footer/>
          </div>
        </div>
      
    
  );
}