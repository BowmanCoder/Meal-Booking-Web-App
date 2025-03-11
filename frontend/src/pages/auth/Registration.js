import React, { useState } from "react";
import {
  TextField,
  Button,
  Alert,
  Box,
  form,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useRegisterUserMutation } from "../../services/userAuthAPI";
import { useNavigate } from "react-router-dom";
import { storeToken } from "../../services/LocalStorageService";

const Registration = () => {
  // const [error, setError] = useState({
  //   status: false,
  //   msg: "",
  //   type: "",
  // });
  /* */
  const [server_error, setServerError] = useState({});
  /* */
  const Navigate = useNavigate();
  /* */
  const [registerUser, { isLoading }] = useRegisterUserMutation();
  /* */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const actualData = {
      fullname: data.get("fullname"),
      username: data.get("username"),
      date_of_birth: data.get("date_of_birth"),
      contact: data.get("contact"),
      gender: data.get("gender"),
      address: data.get("address"),
      email: data.get("email"),
      password: data.get("password"),
      password2: data.get("password2"),
    };
    /* */
    const res = await registerUser(actualData);
    if (res.error) {
      // console.log(typeof res.error.data.errors);
      // console.log(res.error.data.errors);
      setServerError(res.error.data.errors);
    }
    if (res.data) {
      console.log(typeof res.data);
      console.log(res.data);
      storeToken(res.data.token);
      Navigate("/dashboard");
    }
    /* */
    // if (
    //   actualData.fullname &&
    //   actualData.username &&
    //   actualData.email &&
    //   actualData.password !== null
    // ) {
    //   if (actualData.password === actualData.password2) {
    //     console.log(actualData);

    //     document.getElementById("registration-form").reset();
    //     setError({
    //       status: true,
    //       msg: "User Registration Successful",
    //       type: "success",
    //     });
    //     Navigate("/dashboard");
    //   } else {
    //     setError({
    //       status: true,
    //       msg: "Passwords Don't Match!!!",
    //       type: "error",
    //     });
    //   }
    // } else {
    //   setError({ status: true, msg: "All Fields are Required", type: "error" });
    // }
  };
  return (
    <>
      {/* {server_error.fullname ? console.log(server_error.fullname[0]) : ""} */}
      <Box
        component="form"
        noValidate
        sx={{ mt: 1 }}
        id="registration-form"
        onSubmit={handleSubmit}
      >
        <TextField
          margin="normal"
          required
          fullWidth
          id="fullname"
          name="fullname"
          label="Full Name"
          Color="secondary"
          sx={{ flexGrow: 1 }}
          size="small"
        />
        {server_error.fullname ? (
          <Typography style={{ fontSize: 12, color: "red", paddingLeft: 10 }}>
            {server_error.fullname[0]}
          </Typography>
        ) : (
          ""
        )}
        <TextField
          margin="normal"
          required
          fullWidth
          id="username"
          name="username"
          label="Username"
          Color="secondary"
          sx={{ flexGrow: 1 }}
          size="small"
        />
        {server_error.username ? (
          <Typography style={{ fontSize: 12, color: "red", paddingLeft: 10 }}>
            {server_error.username[0]}
          </Typography>
        ) : (
          ""
        )}

        <TextField
          margin="normal"
          required
          fullWidth
          id="date_of_birth"
          name="date_of_birth"
          label="Date of Birth"
          color="secondary"
          InputLabelProps={{ shrink: true }}
          sx={{ flexGrow: 1 }}
          type="date"
          size="small"
          format="YYYY-MM-DD"
        />
        {server_error.date_of_birth ? (
          <Typography style={{ fontSize: 12, color: "red", paddingLeft: 10 }}>
            {server_error.date_of_birth[0]}
          </Typography>
        ) : (
          ""
        )}

        <TextField
          margin="normal"
          required
          fullWidth
          id="contact"
          name="contact"
          label="Contact Info"
          Color="secondary"
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
          sx={{ flexGrow: 1 }}
          size="small"
        />
        {server_error.contact ? (
          <Typography style={{ fontSize: 12, color: "red", paddingLeft: 10 }}>
            {server_error.contact[0]}
          </Typography>
        ) : (
          ""
        )}
        <FormLabel>Gender</FormLabel>
        <RadioGroup
          row
          aria-labelledby="gender"
          id="gender"
          name="gender"
          sx={{ flexGrow: 1 }}
        >
          <FormControlLabel
            value="female"
            control={<Radio size="small" />}
            label="Female"
          />
          <FormControlLabel
            value="male"
            control={<Radio size="small" />}
            label="Male"
          />
          <FormControlLabel
            value="other"
            control={<Radio size="small" />}
            label="Other"
          />
          {/* <FormControlLabel
            value="disabled"
            disabled
            control={<Radio />}
            label="other"
          /> */}
        </RadioGroup>
        {server_error.gender ? (
          <Typography style={{ fontSize: 12, color: "red", paddingLeft: 10 }}>
            {server_error.gender[0]}
          </Typography>
        ) : (
          ""
        )}

        <TextField
          margin="normal"
          required
          fullWidth
          id="address"
          name="address"
          label="Address"
          Color="secondary"
          size="small"
        />
        {server_error.address ? (
          <Typography style={{ fontSize: 12, color: "red", paddingLeft: 10 }}>
            {server_error.address[0]}
          </Typography>
        ) : (
          ""
        )}

        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          name="email"
          label="Email Address"
          Color="secondary"
          size="small"
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
          size="small"
        />
        {server_error.password ? (
          <Typography style={{ fontSize: 12, color: "red", paddingLeft: 10 }}>
            {server_error.password[0]}
          </Typography>
        ) : (
          ""
        )}
        <TextField
          margin="normal"
          required
          fullWidth
          id="password2"
          name="password2"
          label="Password Confirmation"
          type="password"
          size="small"
        />
        {server_error.password2 ? (
          <span style={{ fontSize: 12, color: "red", paddingLeft: 10 }}>
            {server_error.password2[0]}
          </span>
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
              size="small"
            >
              SignUp
            </Button>
          )}
        </Box>
        {server_error.non_field_errors ? (
          <Alert severity="error">{server_error.non_field_errors[0]}</Alert>
        ) : (
          ""
        )}
        {/* {error.status ? (
          <Alert severity={error.type} >
            {error.msg}
          </Alert>
        ) : (
          ""
        )} */}
      </Box>
    </>
  );
};

export default Registration;
