import { useState } from "react";
import { FaBars, FaTimes, FaUsers, FaClock, FaTachometerAlt } from "react-icons/fa";
import { auth } from "../services/firebase";
import { LuLogOut } from "react-icons/lu";

type Props = {
  children: React.ReactNode;
};

const handleLogout = () => {
    auth.signOut();
    window.location.href = "/";
  };

const DashboardLayout = ({ children }: Props) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside
        className={`
          bg-linear-to-b from-gray-900 to-gray-800 text-white p-6
          fixed md:relative top-0 left-0 h-full z-20
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 w-64
        `}
      >
        <div className="flex justify-between items-center mb-6 md:hidden">
          <h2 className="text-2xl font-bold text-yellow-400">HR System</h2>
          <button onClick={() => setSidebarOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-8 hidden md:block text-yellow-400">HR System</h2>

        <nav className="space-y-4">
          <a href="/dashboard" className="flex items-center gap-2 py-2 px-4 rounded hover:bg-yellow-400 hover:text-gray-900 transition">
            <FaTachometerAlt /> الرئيسية
          </a>
          <a href="/employees" className="flex items-center gap-2 py-2 px-4 rounded hover:bg-yellow-400 hover:text-gray-900 transition">
            <FaUsers /> الموظفين
          </a>
          <a href="/attendance" className="flex items-center gap-2 py-2 px-4 rounded hover:bg-yellow-400 hover:text-gray-900 transition">
            <FaClock /> الحضور
          </a>
          <a onClick={handleLogout} className="flex items-center gap-2 py-2 px-4 rounded hover:bg-red-400 hover:text-gray-900 transition">
            <LuLogOut />  تسجيل الخروج
          </a>
         
        </nav>
      </aside>

      {/* Overlay لإغلاق Sidebar على الشاشات الصغيرة */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Toggle button for mobile */}
      {!sidebarOpen && (
        <button
          className="fixed top-4 left-4 z-30 md:hidden bg-gray-900 text-white p-2 rounded"
          onClick={() => setSidebarOpen(true)}
        >
          <FaBars />
        </button>
      )}

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
