import React from "react";
import {
  Grid,
  TextField,
  Button,
  Box,
  Alert,
  Card,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useResetPasswordMutation } from "../../services/userAuthAPI";

const ResetPassword = () => {
  const [server_error, setServerError] = useState({});
  const [server_msg, setServerMsg] = useState({});
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const { id, token } = useParams();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const actualData = {
      password: data.get("password"),
      password2: data.get("password2"),
    };
    const res = await resetPassword({ actualData, id, token });
    if (res.error) {
      setServerMsg({});
      setServerError(res.error.data.errors);
    }
    if (res.data) {
      setServerError({});
      setServerMsg(res.data);
      document.getElementById("password-reset-form").reset();
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    }
  };
  return (
    <>
      <Grid container justifyContent="center">
        <Grid item sm={6} xs={12}>
          <Card sx={{ mt: 15, p: 5, background: "skyblue", color: "white" }}>
            <h1>Reset Password</h1>
            <Box
              component="form"
              noValidate
              sx={{ mt: 1 }}
              id="password-reset-form"
              onSubmit={handleSubmit}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="password"
                name="password"
                label="New Password"
                type="password"
              />
              {server_error.password ? (
                <Typography
                  style={{ fontSize: 12, color: "red", paddingLeft: 10 }}
                >
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
                label="Confirm New Password"
                type="password"
              />
              {server_error.password2 ? (
                <Typography
                  style={{ fontSize: 12, color: "red", paddingLeft: 10 }}
                >
                  {server_error.password2[0]}
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
                    Save
                  </Button>
                )}
              </Box>
              {server_error.non_field_errors ? (
                <Alert severity="error">
                  {server_error.non_field_errors[0]}
                </Alert>
              ) : (
                ""
              )}
              {server_msg.msg ? (
                <Alert severity="success">{server_msg.msg}</Alert>
              ) : (
                ""
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default ResetPassword;
