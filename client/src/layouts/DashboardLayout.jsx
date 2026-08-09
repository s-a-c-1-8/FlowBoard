import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelsTopLeft,
  X,
} from "lucide-react";

import { logout } from "../features/auth/authSlice.js";

import { getNotifications } from "../features/notifications/notificationService.js";

import { setNotifications } from "../features/notifications/notificationSlice.js";

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const mainRef = useRef(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = useSelector((state) => state.auth.user);

  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await getNotifications();

        dispatch(setNotifications(response.data.notifications || []));
      } catch (error) {
        throw new Error("Failed to load notifications", error);
      }
    };

    loadNotifications();
  }, [dispatch]);

  useLayoutEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }

    window.scrollTo(0, 0);

    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());

    setMobileMenuOpen(false);

    navigate("/login");
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  const navigation = (
    <>
      <NavLink to="/dashboard" className={navItemClass}>
        <LayoutDashboard size={18} />
        Dashboard
      </NavLink>

      <NavLink to="/workspaces" className={navItemClass}>
        <PanelsTopLeft size={18} />
        Workspaces
      </NavLink>

      <NavLink to="/notifications" className={navItemClass}>
        <Bell size={18} />

        <span className="flex flex-1 items-center justify-between">
          Notifications
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </span>
      </NavLink>
    </>
  );

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <div className="flex h-full">
        {/* Desktop Sidebar */}
        <aside className="hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-16 items-center border-b border-slate-200 px-6">
            <Link to="/dashboard" className="text-xl font-bold text-slate-900">
              FlowBoard
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-4">{navigation}</nav>

          <div className="border-t border-slate-200 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:hidden ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
            <Link to="/dashboard" className="text-xl font-bold text-slate-900">
              FlowBoard
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-4">{navigation}</nav>

          <div className="border-t border-slate-200 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          {/* Topbar */}
          <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              >
                <Menu size={21} />
              </button>

              <div>
                <p className="hidden text-sm text-slate-500 sm:block">
                  Welcome back
                </p>

                <p className="max-w-40 truncate font-semibold text-slate-900 sm:max-w-none">
                  {user?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/notifications"
                className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Bell size={20} />

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold leading-none text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main
            key={location.pathname}
            ref={mainRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6"
          >
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
