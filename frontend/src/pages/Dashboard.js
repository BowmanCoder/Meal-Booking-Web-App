import { Button, CssBaseline, Grid, Link, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { unSetUserToken } from "../features/authSlice";
import { getToken, removeToken } from "../services/LocalStorageService";
import ChangePassword from "./auth/ChangePassword";
import { useGetLoggedUserQuery } from "../services/userAuthAPI";
import { useEffect, useState } from "react";
import { setUserInfo, unsetUserInfo } from "../features/userSlice";
import BookingPage from "./BookingPage";

import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
// import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
// import Typography from '@mui/material/Typography';
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";
import LogoutIcon from "@mui/icons-material/Logout";
import { FastfoodSharp } from "@mui/icons-material";
import FeedIcon from "@mui/icons-material/Feed";
import PolicyIcon from "@mui/icons-material/Policy";
import HouseIcon from "@mui/icons-material/House";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import LockIcon from "@mui/icons-material/Lock";

const drawerWidth = 240;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  })
);

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const Dashboard = () => {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleLogout = () => {
    dispatch(unsetUserInfo({ username: "", email: "" }));
    dispatch(unSetUserToken({ access_token: null }));
    removeToken();
    navigate("/login");
  };
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { access_token } = getToken();
  const { data, isSuccess } = useGetLoggedUserQuery(access_token);

  const [userData, setUserData] = useState({
    email: "",
    username: "",
  });

  // Store User Data in Local State
  useEffect(() => {
    if (data && isSuccess) {
      setUserData({
        email: data.email,
        username: data.username,
      });
    }
  }, [data, isSuccess]);

  // Store User Data in Redux Store
  useEffect(() => {
    if (data && isSuccess) {
      dispatch(
        setUserInfo({
          email: data.email,
          username: data.username,
        })
      );
    }
  }, [data, isSuccess, dispatch]);
  return (
    <div>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar position="fixed" open={open}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={{ mr: 2, ...(open && { display: "none" }) }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Book My Meal
            </Typography>
            <FastfoodSharp sx={{ color: "purple", fontSize: 55, ml: 1.5 }} />
            <Typography variant="h6" noWrap component="div" sx={{ m: 2 }}>
              {userData.email}
            </Typography>
            <Typography variant="h6" noWrap component="div">
              Hello {userData.username}
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: "skyblue",
            },
          }}
          variant="persistent"
          anchor="left"
          open={open}
        >
          <DrawerHeader>
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === "ltr" ? (
                <ChevronLeftIcon />
              ) : (
                <ChevronRightIcon />
              )}
            </IconButton>
          </DrawerHeader>
          <Divider />
          <List>
            {[
              "Booking",
              // "Starred", "Send email", "Drafts"
            ].map((text, index) => (
              <ListItem key={text} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to="/dashboard"
                  style={({ isActive }) => {
                    return { backgroundColor: isActive ? "#6d1b7b" : "" };
                  }}
                  sx={{ color: "white", textTransform: "none" }}
                >
                  <ListItemIcon>
                    {index % 2 === 0 ? <HouseIcon /> : <MailIcon />}
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            {[
              "AboutUs",
              // "Starred", "Send email", "Drafts"
            ].map((text, index) => (
              <ListItem key={text} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to="aboutus"
                  style={({ isActive }) => {
                    return { backgroundColor: isActive ? "#6d1b7b" : "" };
                  }}
                  sx={{ color: "white", textTransform: "none" }}
                >
                  <ListItemIcon>
                    {index % 2 === 0 ? <FeedIcon /> : <MailIcon />}
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            {[
              "Privacy Policy",
              // "Starred", "Send email", "Drafts"
            ].map((text, index) => (
              <ListItem key={text} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to="privacypolicy"
                  style={({ isActive }) => {
                    return { backgroundColor: isActive ? "#6d1b7b" : "" };
                  }}
                  sx={{ color: "white", textTransform: "none" }}
                >
                  <ListItemIcon>
                    {index % 2 === 0 ? <PolicyIcon /> : <MailIcon />}
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            {[
              "Terms & Conditions",
              // "Starred", "Send email", "Drafts"
            ].map((text, index) => (
              <ListItem key={text} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to="termsandconditions"
                  style={({ isActive }) => {
                    return { backgroundColor: isActive ? "#6d1b7b" : "" };
                  }}
                  sx={{ color: "white", textTransform: "none" }}
                >
                  <ListItemIcon>
                    {index % 2 === 0 ? <AutoStoriesIcon /> : <MailIcon />}
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            {[
              "Change Password ?",
              // "Starred", "Send email", "Drafts"
            ].map((text, index) => (
              <ListItem key={text} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to="changepassword"
                  style={({ isActive }) => {
                    return { backgroundColor: isActive ? "#6d1b7b" : "" };
                  }}
                  sx={{ color: "white", textTransform: "none" }}
                >
                  <ListItemIcon>
                    {index % 2 === 0 ? <LockIcon /> : <MailIcon />}
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            {[
              "Logout",
              //  "Trash", "Spam"
            ].map((text, index) => (
              <ListItem key={text} disablePadding>
                <ListItemButton
                  variant="contained"
                  color="warning"
                  size="large"
                  onClick={handleLogout}
                  sx={{ mt: 8 }}
                >
                  <ListItemIcon>
                    {index % 2 === 0 ? <LogoutIcon /> : <MailIcon />}
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>
        <Main open={open}>
          <DrawerHeader />
          <Typography paragraph>
            <Outlet />
          </Typography>
          <Typography paragraph></Typography>
        </Main>
      </Box>

      {/* New SideMenu */}

      {/* <CssBaseline /> */}
      {/* <Grid container>
        <Grid item sm={2.0} sx={{ backgroundColor: "#934A8B", color: "white" }}> */}
      {/* // <!--        side-menu-->// */}

      {/* <div class="top">
            <div class="side-tops">
              <div class="usar">
                <img
                  src={require("../assets/images/side-bar/BM logo.jpg")}
                  alt="Parth"
                  class="usar-img"
                />
                <div class="usar-detail">
                  <p>
                    <h2 class="nam"> {userData.email}</h2>
                  </p>

                  <p>
                    <h2 className="nam">Hello {userData.username}</h2>
                  </p>
                </div>
                <img
                  src={require("../assets/images/side-bar/star.png")}
                  alt="starry"
                  class="star-img"
                />
              </div>
              <ul class="symbols">
                <li class="listing">
                  <img src={require("../assets/images/side-bar/setting.png")} />
                  <p class="multi-para">
                    <Link href="/changepassword">Change Password</Link>
                  </p>
                </li>
                <li class="listing">
                  <img
                    src={require("../assets/images/side-bar/dashboard.png")}
                  />
                  <p class="multi-para">
                    <a href="#section-about" class="nav-link">
                      About
                    </a>
                  </p>
                </li>
                <li class="listing">
                  <img
                    src={require("../assets/images/side-bar/projects.png")}
                  />
                  <p class="multi-para">
                    <a href="" class="nav-link">
                      Terms &amp; Cond.
                    </a>
                  </p>
                </li>
                <li class="listing">
                  <img src={require("../assets/images/side-bar/members.png")} />
                  <p class="multi-para">
                    <a href="" class="nav-link">
                      Privacy-Policy
                    </a>
                  </p>
                </li>
              </ul>
              <ul class="symbols">
                <li class="listing">
                  <img src={require("../assets/images/side-bar/logout.png")} />
                  <p class="multi-para">
                    <a class="nav-link">
                      <Button
                        variant="contained"
                        color="warning"
                        size="large"
                        onClick={handleLogout}
                        sx={{ mt: 8 }}
                      >
                        Logout
                      </Button>
                    </a>
                  </p>
                </li>
              </ul>
            </div>
          </div> */}
      {/* <!--        side-menu--> */}

      {/* <h1>DashBoard</h1> */}
      {/* <Typography variant="h5">Email: {userData.email}</Typography>
          <Typography variant="h6">Hello {userData.username}</Typography> */}
      {/* </Grid>
        <Grid item sm={8} mt={4}> */}
      {/* </Grid> */}
      {/* <Outlet /> */}
      {/* <ChangePassword />  */}
      {/* </Grid> */}
    </div>
  );
};

export default Dashboard;
