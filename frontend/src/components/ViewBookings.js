import React, { useState, useEffect } from "react";
import { useGetBookingDetailsQuery } from "../services/userAuthAPI";
import { getToken, removeToken } from "../services/LocalStorageService";
import { useDispatch } from "react-redux";
import { setUserInfo, unsetUserInfo } from "../features/userSlice";
import axios from "axios";
import { Grid, Card } from "@mui/material";

const ViewBookings = () => {
  const { access_token } = getToken();
  const { data, isSuccess } = useGetBookingDetailsQuery(access_token);
  const dispatch = useDispatch();
  let [unis, setUnis] = useState([]);
  const [bookings, setBookings] = useState([]);

  // const [datas, setdata] = useState([]);

  // const [userData, setUserData] = useState({
  //   email: "",
  //   username: "",
  // });

  // Store User Data in Local State
  // useEffect(() => {
  //   if (data && isSuccess) {
  //     setUserData({
  //       email: data.email,
  //       username: data.username,
  //     });
  //   }
  // }, [data, isSuccess]);

  // Store User Data in Redux Store
  // useEffect(() => {
  //   if (data && isSuccess) {
  //     dispatch(
  //       setUserInfo({
  //         email: data.email,
  //         username: data.username,
  //       })
  //     );
  //   }
  // }, [data, isSuccess, dispatch]);

  useEffect(() => {
    getBooking();
  }, []);

  let getBooking = async () => {
    let response = await fetch("http://127.0.0.1:8000/api/bookdetail/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // 'Authorization':'Bearer ' + String(authTokens.access)
      },
    });
    let data = await response.json();
    setUnis(data);
  };
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/task-delete/${id}`);
      getBooking(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  return (
    <div className="container">
      <Grid container justifyContent="center">
        <Grid
          item
          //  sm={6} xs={12}
        >
          <Card sx={{ mt: 15, p: 5, background: "darkblue", color: "white" }}>
            <h1>ViewBookings</h1>
            <table>
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Email Id</th>
                  <th>StartDate</th>
                  <th>EndDate</th>
                  <th>Coupon Id</th>
                  <th>Created On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {unis.map((user, index) => (
                  <tr key={index}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>{user.startdate}</td>

                    <td>{user.enddate}</td>
                    <td>{user.couponid}</td>
                    <td>{user.created_at}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(user.id)}
                        // onClick={() => handleDelete(user.id)}
                      >
                        delete
                      </button>
                      <button>redeem</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default ViewBookings;
