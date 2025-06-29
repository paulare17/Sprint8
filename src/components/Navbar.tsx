import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import AddHomeIcon from "@mui/icons-material/AddHome";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const pages = ["Calendari", "Gràfics", "Mapa", "Pendents", "Llistes"];
const settings = ["Perfil", "Tancar sessió"];

function Navbar() {
//navegació entre pàgines
const navigate = useNavigate();
const { currentUser, userProfile, logout } = useAuth();

const handleNavClick = (page: string) => {
    handleCloseNavMenu();
    if (page === "Pendents") {
      navigate('/pendents');
    };
    if (page === "Gràfics") {
      navigate('/grafics')
    };
    if (page === "Mapa") {
      navigate('/mapa')
    };
    if (page === "Calendari") {
      navigate('/calendari')
    };
    if (page === "Llistes") {
      navigate('/lists')
    };
  };


  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
    null
  );
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleSettingClick = async (setting: string) => {
    handleCloseUserMenu();
    if (setting === "Perfil") {
      navigate('/profile');
    } else if (setting === "Tancar sessió") {
      try {
        await logout();
        navigate('/');
      } catch {
        // Error handled by AuthContext
      }
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <AppBar
      className="navbar"
      position="fixed"
      sx={{
        fontFamily: '"Sour Gummy", sans-serif',
        "& .MuiTypography-root": {
          fontFamily: '"Sour Gummy", sans-serif',
        },
        "& .MuiButton-root": {
          fontFamily: '"Sour Gummy", sans-serif',
        },
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <AddHomeIcon 
            onClick={handleHomeClick}
            sx={{ 
              display: { xs: "none", md: "flex" }, 
              mr: 1, 
              transform: "scale(1.5)",
              cursor: "pointer",
              "&:hover": {
                opacity: 0.8,
              },
            }} 
          />
          <Typography
            className="logo"
            variant="h6"
            noWrap
            component="a"
            onClick={handleHomeClick}
            sx={{
              display: { xs: "none", md: "flex" },
              cursor: "pointer",
              textDecoration: "none",
              "&:hover": {
                opacity: 0.8,
              },
            }}
          >
            Inprocode
          </Typography>

          <Box
            sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}
          >
            <IconButton
              size="large"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              {pages.map((page) => (
                <MenuItem key={page} onClick={() => handleNavClick(page)}>
                  <Typography sx={{ textAlign: "center" }}>{page}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <AddHomeIcon 
            onClick={handleHomeClick}
            sx={{ 
              display: { xs: "flex", md: "none" }, 
              mr: 1,
              cursor: "pointer",
              "&:hover": {
                opacity: 0.8,
              },
            }} 
          />
          <Typography
            className="logo"
            variant="h5"
            noWrap
            component="a"
            onClick={handleHomeClick}
            sx={{
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              cursor: "pointer",
              textDecoration: "none",
              "&:hover": {
                opacity: 0.8,
              },
            }}
          >
            Inprocode
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {pages.map((page) => (
              <Button
              className="navbar-menu"
                key={page}
                onClick={() => handleNavClick(page)}
                sx={{ my: 2, color: "white", display: "block", mx: 2 }}
              >
                {page}
              </Button>
            ))}
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            {currentUser ? (
              // Mostrar dropdown d'usuari si està autenticat
              <>
                <Tooltip title="Configuració d'usuari">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar 
                      alt={userProfile?.displayName || 'Usuari'} 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        fontSize: 14,
                        fontWeight: 'bold',
                        backgroundColor: '#1976d2'
                      }}
                    >
                      {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: "45px" }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  {/* Informació de l'usuari */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#333' }}>
                      {userProfile?.displayName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '12px' }}>
                      {userProfile?.email}
                    </Typography>
                    <br />
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '12px' }}>
                      📍 {userProfile?.postalCode}
                    </Typography>
                  </div>
                  
                  {/* Opcions del menú */}
                  {settings.map((setting) => (
                    <MenuItem key={setting} onClick={() => handleSettingClick(setting)}>
                      <Typography sx={{ textAlign: "center" }}>
                        {setting === "Perfil" ? "👤 Perfil" : "🚪 Tancar sessió"}
                      </Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </>
            ) : (
              // Mostrar botó d'inici de sessió si no està autenticat
              <Button
                onClick={() => navigate('/register')}
                sx={{
                  color: 'white',
                  textTransform: 'none',
                  fontFamily: '"Sour Gummy", sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Inicia sessió
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default Navbar;
