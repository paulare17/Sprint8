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

const pages = ["Calendari", "Gràfics", "Mapa", "Pendents"];
const settings = ["Perfil", "Account", "Dashboard", "Logout"];

function Navbar() {
//navegació entre pàgines
const navigate = useNavigate();

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
    if (page === "Caledari") {
      navigate('/calendari')
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

  const handleSettingClick = (setting: string) => {
    handleCloseUserMenu();
    if (setting === "Perfil") {
      navigate('/profile');
    }
    // Aquí pots afegir més navegació per altres settings
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
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
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
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={() => handleSettingClick(setting)}>
                  <Typography sx={{ textAlign: "center" }}>
                    {setting}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default Navbar;
