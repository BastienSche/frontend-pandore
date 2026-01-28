import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Music, Moon, Sun, User, LogOut, Home, Library, PlusCircle, Disc } from 'lucide-react';
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
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

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
          rounded-full px-5 py-2 h-auto
          transition-colors duration-300
          ${isActive(to) 
            ? 'bg-white/10 text-cyan-400 border border-cyan-500/30' 
            : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
          }
        `}
        data-testid={`${testId}-button`}
      >
        <Icon className="w-4 h-4 mr-2" />
        {children}
      </Button>
    </Link>
  );

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl"
    >
      <div className="glass-heavy rounded-full px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 group" 
            data-testid="navbar-logo-link"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)]"
            >
              <Music className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">
              Pandore
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
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
              </>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10"
                data-testid="theme-toggle-button"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-400" />
                )}
              </Button>
            </motion.div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="rounded-full p-1 border border-white/10 hover:border-cyan-500/50 transition-colors"
                    data-testid="user-menu-trigger"
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={user.picture} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
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
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.picture} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{user.name}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator className="bg-white/10 my-2" />
                  
                  {/* Mobile Navigation */}
                  <div className="md:hidden space-y-1 mb-2">
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link to="/browse" className="flex items-center gap-2 cursor-pointer">
                        <Home className="w-4 h-4" />
                        Découvrir
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link to="/library" className="flex items-center gap-2 cursor-pointer">
                        <Library className="w-4 h-4" />
                        Bibliothèque
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link to="/playlists" className="flex items-center gap-2 cursor-pointer">
                        <Disc className="w-4 h-4" />
                        Playlists
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'artist' && (
                      <DropdownMenuItem asChild className="rounded-xl">
                        <Link to="/artist-dashboard" className="flex items-center gap-2 cursor-pointer">
                          <PlusCircle className="w-4 h-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-white/10 my-2" />
                  </div>
                  
                  <DropdownMenuItem 
                    onClick={handleRoleSwitch} 
                    className="rounded-xl cursor-pointer"
                    data-testid="role-switch-button"
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span className="flex-1">Mode {user.role === 'artist' ? 'Auditeur' : 'Artiste'}</span>
                    <Badge 
                      className={`ml-2 ${
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
                  className="rounded-full px-6 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-0 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                  data-testid="login-button"
                >
                  Connexion
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
