import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { AppBar, Box, Toolbar, Typography, Button } from "@mui/material";
import { getToken } from "../services/LocalStorageService";
import { FastfoodSharp } from "@mui/icons-material";

// import AuthContext from "../context/AuthContext";

const Header = () => {
  // let { user, logoutUser } = useContext(AuthContext);
  const { access_token } = getToken();
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        style={{
          color:
            "radial-gradient(circle at 94.02% 88.03%, #54a4ff, transparent 100%),radial-gradient(circle at 25.99% 27.79%, #ff94fb, transparent 100%),radial-gradient(circle at 50% 50%, #000000, #000000 100%);",
        }}
      >
        <Toolbar>
          <FastfoodSharp sx={{ color: "purple", fontSize: 70, mr: 3 }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
            BookMyMeal
          </Typography>

          <Button
            component={NavLink}
            to="/"
            style={({ isActive }) => {
              return { backgroundColor: isActive ? "#6d1b7b" : "" };
            }}
            sx={{ color: "white", textTransform: "none" }}
          >
            Home
          </Button>

          <Button
            component={NavLink}
            to="/contact"
            style={({ isActive }) => {
              return { backgroundColor: isActive ? "#6d1b7b" : "" };
            }}
            sx={{ color: "white", textTransform: "none" }}
          >
            Contact
          </Button>
          {access_token ? (
            <Button
              component={NavLink}
              to="/dashboard"
              style={({ isActive }) => {
                return { backgroundColor: isActive ? "#6d1b7b" : "" };
              }}
              sx={{ color: "white", textTransform: "none" }}
            >
              <>DashBoard</>
            </Button>
          ) : (
            <Button
              component={NavLink}
              to="/login"
              style={({ isActive }) => {
                return { backgroundColor: isActive ? "#6d1b7b" : "" };
              }}
              sx={{ color: "white", textTransform: "none" }}
            >
              <>Login/Registration</>
            </Button>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;

{
  /* <Button
          component={NavLink}
          to="/login"
          style={({ isActive }) => {
            return { backgroundColor: isActive ? "#6d1b7b" : "" };
          }}
          sx={{ color: "white", textTransform: "none" }}
        >
          {user ? (
            <a className="nav-link">
              <p onClick={logoutUser}>Logout</p>
            </a>
          ) : (
          <>Login/Registration</>
          
        </Button>
         <Button>
          {" "}
          {user && (
            <p>
              <a className="nav-link">Hello {user.username}</a>
            </p>
          )}
        </Button>  */
}

// <div>
//     <Link to="/" >Home</Link>
//     <span> | </span>
//     {user ? (
//          <p  onClick={logoutUser}>Logout</p>
//     ): (
//         <Link to="/login" >Login</Link>
//     )}

//     {user &&   <p>Hello {user.username}</p>}

// </div>

// <nav
//   className="navbar navbar-expand-lg navbar-dark ftco_navbar bg-dark ftco-navbar-light"
//   id="ftco-navbar"
// >
//   <div className="container">
//     <a className="navbar-brand" href="index.html">
//       BookMyMeal
//     </a>
//     <button
//       className="navbar-toggler"
//       type="button"
//       data-toggle="collapse"
//       data-target="#ftco-nav"
//       aria-controls="ftco-nav"
//       aria-expanded="false"
//       aria-label="Toggle navigation"
//     >
//       <span className="oi oi-menu"></span> Menu
//     </button>

//     <div className="collapse navbar-collapse" id="ftco-nav">
//       <ul className="navbar-nav ml-auto">
//         <li className="nav-item active">
//           <Link to="/">
//             <a className="nav-link">Home</a>
//           </Link>
//         </li>

//         <li className="nav-item">
//           {user ? (
//             <a className="nav-link">
//               <p onClick={logoutUser}>Logout</p>
//             </a>
//           ) : (
//             <Link to="/login">
//               <a className="nav-link">Login</a>
//             </Link>
//           )}
//         </li>

//         <li className="nav-item">
//           <a href="#section-contact" className="nav-link">
//             Contact
//           </a>
//         </li>
//         <li className="nav-item">
//           {user && (
//             <p>
//               <a className="nav-link">Hello {user.username}</a>
//             </p>
//           )}
//         </li>
//       </ul>
//     </div>
//   </div>
// </nav>
