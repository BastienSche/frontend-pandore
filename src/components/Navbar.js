import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, User, LogOut, Home, Library, PlusCircle, Disc, GripHorizontal, X, Menu, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion, useDragControls } from 'framer-motion';
import KloudLogo from '@/components/KloudLogo';

const userInitial = (u) => {
  if (!u) return '?';
  const s = String(u.name || u.email || u.artist_name || '').trim();
  return s ? s.charAt(0).toUpperCase() : '?';
};

const Navbar = () => {
  const { user, logout, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRoleSwitch = async () => {
    const currentRole = user.role;
    const newRole = currentRole === 'artist' ? 'user' : 'artist';
    
    if (newRole === 'artist' && !user.artist_name) {
      const artistName = prompt('Entrez votre nom d\'artiste:');
      if (!artistName) return;
      await switchRole(artistName);
    } else {
      await switchRole(newRole === 'artist' ? user.artist_name : null);
    }
  };

  const isActive = (path) => {
    const pathname = location.pathname;
    if (path === '/') return pathname === '/';
    if (path === '/playlists') return pathname === '/playlists' || pathname.startsWith('/playlist/');
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const NavLink = ({ to, icon: Icon, children, testId }) => (
    <Link to={to} data-testid={testId}>
      <Button 
        variant="ghost" 
        className={`
          rounded-full px-4 py-2 h-auto text-sm
          transition-colors duration-300
          ${isActive(to) 
            ? 'bg-white/10 text-cyan-400 border border-cyan-500/30' 
            : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
          }
        `}
        data-testid={`${testId}-button`}
      >
        <Icon className="w-4 h-4 mr-1.5" />
        {children}
      </Button>
    </Link>
  );

  const mobileItems = user
    ? [
        { to: '/browse', icon: Home, label: 'Découvrir', testId: 'mobile-nav-browse' },
        { to: '/library', icon: Library, label: 'Bibliothèque', testId: 'mobile-nav-library' },
        { to: '/playlists', icon: Disc, label: 'Playlists', testId: 'mobile-nav-playlists' },
        user.role === 'artist'
          ? { to: '/artist-dashboard', icon: PlusCircle, label: 'Dashboard', testId: 'mobile-nav-dashboard' }
          : { to: '/settings', icon: Settings, label: 'Compte', testId: 'mobile-nav-settings' },
      ]
    : [
        { to: '/', icon: Home, label: 'Accueil', testId: 'mobile-nav-home' },
        { to: '/login', icon: User, label: 'Connexion', testId: 'mobile-nav-login' },
        { to: '/register', icon: PlusCircle, label: 'Inscription', testId: 'mobile-nav-register' },
      ];

  const MobileBottomNav = () => (
    <nav
      className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 md:hidden w-[calc(100%-0.75rem)] max-w-lg pb-[env(safe-area-inset-bottom)]"
      data-testid="mobile-bottom-navbar"
    >
      <div className="glass-heavy rounded-2xl border border-white/10 px-1.5 py-1.5 shadow-[0_0_30px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between gap-1">
          {mobileItems.map(({ to, icon: Icon, label, testId }) => (
            <Button
              key={to}
              asChild
              variant="ghost"
              className={`h-auto min-h-11 w-full flex-1 rounded-xl px-1 py-2 flex-col gap-0.5 text-[10px] leading-tight whitespace-normal ${
                isActive(to)
                  ? 'bg-white/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
              data-testid={`${testId}-button`}
            >
              <Link to={to} data-testid={testId}>
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="leading-tight text-center">{label}</span>
              </Link>
            </Button>
          ))}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-xl w-10 h-10 p-0 border border-white/10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5"
                  data-testid="mobile-user-menu-trigger"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.picture} />
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-xs">
                      {userInitial(user)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 glass-heavy border-white/10 rounded-2xl p-2 md:hidden"
              >
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={user.picture} />
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-xs">
                      {userInitial(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user.name || user.email || 'Utilisateur'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>

                <DropdownMenuSeparator className="bg-white/10 my-2" />

                <DropdownMenuItem
                  onClick={() => navigate('/settings')}
                  className="rounded-xl cursor-pointer"
                  data-testid="mobile-settings-button"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Réglages du compte
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={toggleTheme}
                  className="rounded-xl cursor-pointer"
                  data-testid="mobile-theme-toggle-menu-item"
                >
                  {theme === 'light' ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2 text-yellow-400" />}
                  Thème {theme === 'light' ? 'clair' : 'sombre'}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleRoleSwitch}
                  className="rounded-xl cursor-pointer"
                  data-testid="mobile-role-switch-button"
                >
                  <User className="w-4 h-4 mr-2" />
                  Mode {user.role === 'artist' ? 'Auditeur' : 'Artiste'}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-white/10 my-2" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                  data-testid="mobile-logout-button"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl w-10 h-10 border border-white/10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5"
              data-testid="mobile-theme-toggle-button"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-yellow-400" />}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );

  // Minimized navbar (just a floating button)
  if (!isExpanded) {
    return (
      <>
        <div className="hidden md:block">
          <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />
          <motion.div
            drag
            dragControls={dragControls}
            dragMomentum={false}
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed z-50 cursor-grab active:cursor-grabbing"
            style={{ top: 20, left: '50%', x: '-50%' }}
          >
            <Button
              onClick={() => setIsExpanded(true)}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] border-0"
              data-testid="navbar-expand-button"
            >
              <Menu className="w-6 h-6 text-white" />
            </Button>
          </motion.div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  return (
    <>
      {/* Drag constraints container */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40 hidden md:block" />
      
      <motion.nav
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed z-50 cursor-grab active:cursor-grabbing hidden md:block"
        style={{ top: 16, left: '50%', x: '-50%' }}
        data-testid="draggable-navbar"
      >
        <div className="glass-heavy rounded-full px-3 py-2 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2">
            {/* Drag Handle */}
            <div 
              className="p-2 rounded-full hover:bg-white/10 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
              onPointerDown={(e) => dragControls.start(e)}
              data-testid="navbar-drag-handle"
            >
              <GripHorizontal className="w-4 h-4" />
            </div>

            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-2 group px-2" 
              data-testid="navbar-logo-link"
            >
              <motion.div whileHover={{ rotate: 8 }} transition={{ duration: 0.25 }}>
                <KloudLogo className="w-8 h-8 shrink-0 text-zinc-900 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.12)]" />
              </motion.div>
              <span className="text-lg font-bold tracking-tight text-foreground hidden sm:block">
                Kloud
              </span>
            </Link>

            {/* Separator */}
            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Navigation Links */}
            {user && (
              <>
                <NavLink to="/browse" icon={Home} testId="navbar-browse-link">
                  Découvrir
                </NavLink>
                
                <NavLink to="/library" icon={Library} testId="navbar-library-link">
                  Bibliothèque
                </NavLink>

                <NavLink to="/playlists" icon={Disc} testId="navbar-playlists-link">
                  Playlists
                </NavLink>

                {user.role === 'artist' && (
                  <NavLink to="/artist-dashboard" icon={PlusCircle} testId="navbar-dashboard-link">
                    Dashboard
                  </NavLink>
                )}

                {/* Separator */}
                <div className="w-px h-6 bg-white/10 mx-1" />
              </>
            )}

            {/* Theme Toggle */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10"
                data-testid="theme-toggle-button"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4 text-yellow-400" />
                )}
              </Button>
            </motion.div>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="rounded-full p-0 w-9 h-9 bg-white/5 hover:bg-white/10 border-0 transition-colors"
                    data-testid="user-menu-trigger"
                  >
                    <Avatar className="w-8 h-8 border border-white/10">
                      <AvatarImage src={user.picture} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-sm">
                        {userInitial(user)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-64 glass-heavy border-white/10 rounded-2xl p-2"
                >
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.picture} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                        {userInitial(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm truncate">{user.name || user.email || 'Utilisateur'}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator className="bg-white/10 my-2" />
                  
                  <DropdownMenuItem 
                    onClick={handleRoleSwitch} 
                    className="rounded-xl cursor-pointer"
                    data-testid="role-switch-button"
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span className="flex-1">Mode {user.role === 'artist' ? 'Auditeur' : 'Artiste'}</span>
                    <Badge 
                      className={`ml-2 text-xs ${
                        user.role === 'artist' 
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                      }`}
                    >
                      {user.role === 'artist' ? 'Artiste' : 'User'}
                    </Badge>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate('/settings')}
                    className="rounded-xl cursor-pointer"
                    data-testid="settings-button"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Réglages du compte
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-white/10 my-2" />
                  
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                    data-testid="logout-button"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" data-testid="login-link">
                <Button 
                  className="rounded-full px-5 text-sm bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                  data-testid="login-button"
                >
                  Connexion
                </Button>
              </Link>
            )}

            {/* Minimize Button */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="rounded-full w-8 h-8 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                data-testid="navbar-minimize-button"
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav>
      <MobileBottomNav />
    </>
  );
};

export default Navbar;
