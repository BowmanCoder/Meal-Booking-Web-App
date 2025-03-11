import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { NavLink, useNavigate } from "react-router-dom";
import { FastfoodSharp } from "@mui/icons-material";
import { useLoginUserMutation } from "../../services/userAuthAPI";
import { getToken, storeToken } from "../../services/LocalStorageService";
import { useDispatch } from "react-redux";
import { setUserToken } from "../../features/authSlice";

const Login = () => {
  // const [error, setError] = useState({
  //   status: false,
  //   msg: "",
  //   type: "",
  // });
  const [server_error, setServerError] = useState({});

  const Navigate = useNavigate();

  const [loginUser, { isLoading }] = useLoginUserMutation();

  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const actualData = {
      email: data.get("email"),
      password: data.get("password"),
    };

    const res = await loginUser(actualData);

    if (res.error) {
      // console.log(typeof res.error.data.errors);
      // console.log(res.error.data.errors);
      setServerError(res.error.data.errors);
    }
    if (res.data) {
      // console.log(typeof res.data);
      // console.log(res.data);
      storeToken(res.data.token);
      let { access_token } = getToken();
      dispatch(setUserToken({ access_token: access_token }));
      Navigate("/dashboard");
    }

    // if (actualData.email && actualData.password) {
    //   console.log(actualData);

    //   document.getElementById("login-form").reset();
    //   setError({ status: true, msg: "Login Success", type: "success" });
    //   Navigate("/dashboard");
    // } else {
    //   setError({ status: true, msg: "All Fields are Required", type: "error" });
    // }
  };
  let { access_token } = getToken();
  useEffect(() => {
    dispatch(setUserToken({ access_token: access_token }));
  }, [access_token, dispatch]);
  return (
    <>
      {server_error.email ? console.log(server_error.email[0]) : ""}
      {server_error.password ? console.log(server_error.password[0]) : ""}
      <Box
        component="form"
        noValidate
        sx={{ mt: 1, height: 360 }}
        id="login-form"
        onSubmit={handleSubmit}
      >
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          name="email"
          label="Email Address"
          Color="secondary"
        />
        {server_error.email ? (
          <Typography style={{ fontSize: 12, color: "red", paddingLeft: 10 }}>
            {server_error.email[0]}
          </Typography>
        ) : (
          ""
        )}
        <TextField
          margin="normal"
          required
          fullWidth
          id="password"
          name="password"
          label="Password"
          type="password"
        />
        {server_error.password ? (
          <Typography style={{ fontSize: 12, color: "red", paddingLeft: 10 }}>
            {server_error.password[0]}
          </Typography>
        ) : (
          ""
        )}
        <Box textAlign="center">
          {isLoading ? (
            <CircularProgress />
          ) : (
            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 3, mb: 2, px: 5 }}
            >
              Login
            </Button>
          )}
        </Box>
        <NavLink
          to="/resetpasswordemail"
          style={{ color: "aquamarine" }}
          variant
        >
          Forgot Password ?
        </NavLink>
        {/* <NavLink to='/sendpasswordresetemail' >Forgot Password ?</NavLink> */}
        {/* {error.status ? (
          <Alert severity={error.type} sx={{ mt: 3 }}>
            {error.msg}
          </Alert>
        ) : (
          ""
        )} */}
        {server_error.non_field_errors ? (
          <Alert severity="error">{server_error.non_field_errors[0]}</Alert>
        ) : (
          ""
        )}
      </Box>
      <Box textAlign="center" sx={{ mt: 2 }}>
        <FastfoodSharp sx={{ color: "purple", fontSize: 100 }} />
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          BookMyMeal
        </Typography>
      </Box>
    </>
  );
};

export default Login;

// <div className="container">
//   <div className="row align-items-center justify-content-center text-center ftco-vh-100">
//     <div className="col-md-12">
//       <br></br>

//       <div>
//         <div className="modal-dialog modal-lg" role="document">
//           <div className="modal-content">
//             <div className="modal-body">
//               <div className="row">
//                 <div
//                   className="col-lg-4 bg-image"
//                   //   style={{
//                   //     backgroundImage:
//                   //       "url(" +
//                   //       require("../assets/images/piz.jpg") +
//                   //       ")",
//                   //   }}
//                 ></div>

//                 <form onSubmit={{}} method="post">
//                   <h1 className="mb-4">User Login</h1>

//                   <div className="row">
//                     <div className="col-md-12 form-group">
//                       {/* <label for="m_email">Username</label> */}
//                       {/* {% if error %} */}
//                       <div className="alert alert-danger" role="">
//                         {/* {{ error }} */}
//                       </div>
//                       {/* {% endif %} */}
//                       <input
//                         type="text"
//                         className="form-control"
//                         id="m_people"
//                         name="username"
//                         placeholder="UserName"
//                       />
//                     </div>
//                   </div>
//                   <div className="row">
//                     <div className="col-md-6 form-group">
//                       {/* <label for="m_tim">Password</label> */}
//                       <input
//                         type="password"
//                         className="form-control"
//                         id="m_ti"
//                         name="password"
//                         placeholder="Password"
//                       />
//                     </div>
//                   </div>

//                   <div className="row">
//                     <div className="col-md-12 form-group">
//                       <input
//                         type="submit"
//                         className="btn btn-primary btn-lg btn-block"
//                         value="Sign In Now"
//                       />
//                     </div>
//                     <div>
//                       <a href="forgotpass">Forgot Password?</a>
//                     </div>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// </div>
