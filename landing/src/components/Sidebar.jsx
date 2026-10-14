import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  FileQuestion,
  BookOpen,
  Award,
  Trophy,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Users,
  UserCog,
  Shield,
  ScrollText,
} from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState("");
  const [activeItem, setActiveItem] = useState("/dashboard");
  const navigate = useNavigate();

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      name: "Student Management",
      icon: Users,
      path: "/student-management",
      children: [
        {
          name: "Student Profile View",
          path: "/student-management/profile-view",
          icon: UserCog,
        },
        {
          name: "Student Enrollment",
          path: "/student-management/enrollment",
          icon: GraduationCap,
        },
      ],
    },
    {
      name: "My Exam",
      icon: FileQuestion,
      path: "/exam-management",
    },
    {
      name: "Course Management",
      icon: BookOpen,
      path: "/course-management",
      children: [
        {
          name: "All Courses",
          path: "/course-management/all-courses",
          icon: BookOpen, // ✅ Added icon to fix "undefined element" error
        },
      ],
    },
    {
      name: "Question Papers",
      icon: ScrollText,
      path: "/question-papers",
    },
    {
      name: "Rewards & Awards",
      icon: Award,
      path: "/rewards-awards",
    },
    {
      name: "Leader Board",
      icon: Trophy,
      path: "/leader-board",
    },
    {
      name: "Analytics",
      icon: BarChart3,
      path: "/analytics",
    },
    {
      name: "Transaction",
      icon: CreditCard,
      path: "/transaction",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
      children: [
        { name: "Account", path: "/settings/account", icon: UserCog },
        { name: "Manage Role", path: "/settings/manage-role", icon: Shield },
        { name: "Logs", path: "/settings/logs", icon: ScrollText },
      ],
    },
    {
      name: "Logout",
      icon: LogOut,
      path: "/logout",
    },
  ];

  // Check if the parent menu is active
  const isParentActive = (item) =>
    item.path === activeItem ||
    (item.children || []).some((c) => c.path === activeItem);

  // Toggle open menu — closes others
  const toggleMenu = (name) => {
    setOpenMenu((prev) => (prev === name ? "" : name));
  };

  const handleNavigation = (item) => {
    if (item.children && item.children.length > 0) {
      toggleMenu(item.name);
    } else {
      setActiveItem(item.path);
      setOpenMenu("");
      if (window.innerWidth < 768) setIsOpen(false);
      navigate(item.path);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden text-white bg-orange-500 p-2.5 rounded-lg shadow-lg hover:bg-orange-600 transition-colors"
        onClick={() => setIsOpen((s) => !s)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white text-gray-800 shadow-xl flex flex-col transition-transform duration-300 z-40 border-r border-gray-200
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Header */}
        <div className="px-3 py-4 mb-2 bg-gradient-to-r from-orange-500 to-orange-600 mx-3 mt-3 rounded-xl shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Right Edu Tech
              </h2>
              <p className="text-[10px] text-orange-100">Education Platform</p>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-5 mb-2 mt-1">
          <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">
            Main Menu
          </p>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">
          <ul className="text-sm flex flex-col space-y-1">
            {menuItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const parentActive = isParentActive(item);
              const isOpenThis = openMenu === item.name;
              const Icon = item.icon;

              return (
                <li key={item.name} className="flex flex-col">
                  {/* Parent button */}
                  <button
                    onClick={() => handleNavigation(item)}
                    className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 w-full text-left
                      ${
                        isOpenThis || parentActive
                          ? "bg-orange-500 text-white shadow-md"
                          : "hover:bg-orange-50 text-gray-700"
                      }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon
                        size={17}
                        className={
                          isOpenThis || parentActive
                            ? "text-white"
                            : "text-gray-600"
                        }
                      />
                      <span className="text-[13px]">{item.name}</span>
                    </span>
                    {hasChildren && (
                      <ChevronDown
                        size={16}
                        className={`transform transition-transform duration-300 ${
                          isOpenThis ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>

                  {/* Submenu */}
                  {hasChildren && (
                    <div
                      className={`ml-6 mt-1 overflow-hidden transition-all duration-300 ${
                        isOpenThis
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <ul className="flex flex-col space-y-0.5 pb-1 border-l-2 border-orange-200 pl-3">
                        {item.children.map((sub) => {
                          const subActive = activeItem === sub.path;
                          const SubIcon = sub.icon || BookOpen; // ✅ Fallback icon
                          return (
                            <li key={sub.name}>
                              <button
                                onClick={() => {
                                  setActiveItem(sub.path);
                                  setOpenMenu(item.name);
                                  if (window.innerWidth < 768) setIsOpen(false);
                                  navigate(sub.path);
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-medium transition-all duration-200 w-full text-left
                                  ${
                                    subActive
                                      ? "bg-orange-100 text-orange-600"
                                      : "hover:bg-gray-50 text-gray-600"
                                  }`}
                              >
                                <SubIcon size={14} />
                                <span>{sub.name}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer */}
        <div className="mx-3 mb-3 px-3 py-2.5 bg-orange-50 rounded-lg border border-orange-100">
          <p className="text-[11px] font-semibold text-gray-700 mb-0.5">
            Need Help?
          </p>
          <p className="text-[10px] text-gray-500">Contact Support</p>
        </div>
      </aside>

      {/* Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Scrollbar Styling */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #fed7aa;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #fdba74;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
