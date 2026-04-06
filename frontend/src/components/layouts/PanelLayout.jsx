import React, { useMemo, useState } from 'react';
import {
  FiBarChart2,
  FiBox,
  FiClipboard,
  FiGrid,
  FiLock,
  FiLogOut,
  FiMenu,
  FiRefreshCcw,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiShoppingCart,
  FiTool,
  FiTruck,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { APP_LOGO, APP_NAME } from '../../constants/branding';

const iconMap = {
  box: FiBox,
  cart: FiShoppingCart,
  chart: FiBarChart2,
  dashboard: FiGrid,
  gear: FiSettings,
  lock: FiLock,
  logout: FiLogOut,
  refresh: FiRefreshCcw,
  settings: FiSettings,
  store: FiShoppingBag,
  ticket: FiClipboard,
  tool: FiTool,
  truck: FiTruck,
  users: FiUsers,
};

const getItemIcon = (icon) => {
  const Icon = typeof icon === 'string' ? iconMap[icon] : icon;

  if (!Icon) {
    return <FiGrid className="h-4 w-4" />;
  }

  if (React.isValidElement(Icon)) {
    return Icon;
  }

  return <Icon className="h-4 w-4" />;
};

const isSystemSection = (section) => section.heading?.toLowerCase() === 'system';

const renderMenuBlock = ({
  sections,
  activeItem,
  collapsed,
  onSelectItem,
}) =>
  sections.map((section) => (
    <div key={section.heading} className="space-y-1.5">
      {!collapsed ? (
        <p className="px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-400">
          {section.heading}
        </p>
      ) : null}

      <div className="space-y-1">
        {section.items.map((item) => {
          const isActive = activeItem === item.id;

          return (
            <div key={item.id} className="group relative">
              <button
                type="button"
                onClick={() => onSelectItem(item)}
                className={`flex w-full items-center rounded-xl py-2.5 text-sm transition-all duration-200 ${
                  collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                } ${
                  isActive
                    ? 'bg-black text-white'
                    : 'panel-hover-nav text-gray-700'
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center text-base">
                  {getItemIcon(item.icon)}
                </span>
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </button>

              {collapsed ? (
                <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 rounded-md bg-black px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition md:block group-hover:opacity-100">
                  {item.label}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  ));

const PanelLayout = ({
  panelLabel,
  title,
  subtitle,
  menuSections,
  activeItem,
  onSelectItem,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search',
  headerActions = null,
  userName,
  userEmail,
  userInitial,
  profileActions = [],
  onLogout,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const primarySections = useMemo(
    () => menuSections.filter((section) => !isSystemSection(section)),
    [menuSections]
  );
  const systemSections = useMemo(
    () => menuSections.filter((section) => isSystemSection(section)),
    [menuSections]
  );

  const resolvedInitial = userInitial || userName?.charAt(0)?.toUpperCase() || 'U';

  const handleItemSelect = (item) => {
    setMobileSidebarOpen(false);
    setProfileOpen(false);
    onSelectItem(item);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    onLogout();
  };

  const handleDesktopToggle = () => {
    setIsCollapsed((current) => !current);
    setProfileOpen(false);
  };

  const handleMobileToggle = () => {
    setMobileSidebarOpen((current) => !current);
    setProfileOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {mobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-[55] bg-black/30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex h-screen flex-col border-r border-gray-200 bg-white shadow-sm transition-all duration-300 ${
          isCollapsed ? 'w-[72px]' : 'w-[240px]'
        } ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div
          className={`flex h-16 items-center border-b border-gray-200 px-4 ${
            isCollapsed ? 'justify-center' : 'gap-3'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-2">
            <img src={APP_LOGO} alt={`${APP_NAME} logo`} className="h-full w-full object-contain" />
          </div>

          {!isCollapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{APP_NAME}</p>
              <p className="truncate text-xs text-gray-500">{panelLabel}</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="panel-hover-icon ml-auto rounded-lg p-2 text-gray-500 transition md:hidden"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            {renderMenuBlock({
              sections: primarySections,
              activeItem,
              collapsed: isCollapsed,
              onSelectItem: handleItemSelect,
            })}
          </nav>

          {systemSections.length ? (
            <div className="border-t border-gray-200 px-3 py-4">
              {renderMenuBlock({
                sections: systemSections,
                activeItem,
                collapsed: isCollapsed,
                onSelectItem: handleItemSelect,
              })}
            </div>
          ) : null}
        </div>
      </aside>

      <header
        className={`fixed left-0 right-0 top-0 z-50 h-16 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur transition-all duration-300 ${
          isCollapsed ? 'md:left-[72px]' : 'md:left-[240px]'
        }`}
      >
        <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={handleMobileToggle}
              className="panel-hover-icon flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition md:hidden"
            >
              <FiMenu className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleDesktopToggle}
              className="panel-hover-icon hidden h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition md:flex"
            >
              <FiMenu className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-gray-900">{title}</h1>
              {subtitle ? <p className="hidden truncate text-xs text-gray-500 sm:block">{subtitle}</p> : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onSearchChange ? (
              <div className="panel-hover-surface hidden w-64 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 md:flex lg:w-72">
                <FiSearch className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            ) : null}

            {headerActions}

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                className="panel-hover-button-dark flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-semibold text-white transition"
              >
                {resolvedInitial}
              </button>

              {profileOpen ? (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-200 p-4">
                    <p className="text-sm font-semibold text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500">{userEmail}</p>
                  </div>

                  {profileActions.length ? (
                    <div className="space-y-1 p-2">
                      {profileActions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            action.onClick();
                          }}
                          className="panel-hover-menu-item w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className="border-t border-gray-200 p-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="panel-hover-menu-item w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div
        className={`transition-all duration-300 ${
          isCollapsed ? 'md:pl-[72px]' : 'md:pl-[240px]'
        }`}
      >
        <main className="px-4 pb-6 pt-20 md:px-6 md:pb-8">{children}</main>
      </div>
    </div>
  );
};

export default PanelLayout;
