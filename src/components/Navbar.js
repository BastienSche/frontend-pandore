import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Music, Moon, Sun, User, LogOut, Home, Library, PlusCircle, Disc, GripHorizontal, X, Menu } from 'lucide-react';
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

  const isActive = (path) => location.pathname === path;

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

  // Minimized navbar (just a floating button)
  if (!isExpanded) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
      {/* Drag constraints container */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />
      
      <motion.nav 
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed z-50 cursor-grab active:cursor-grabbing"
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
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              >
                <Music className="w-4 h-4 text-white" />
              </motion.div>
              <span className="text-lg font-bold tracking-tight hidden sm:block">
                Pandore
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
                    className="rounded-full p-1 border border-white/10 hover:border-cyan-500/50 transition-colors"
                    data-testid="user-menu-trigger"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.picture} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-sm">
                        {user.name[0]}
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
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm truncate">{user.name}</span>
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
    </>
  );
};

export default Navbar;
