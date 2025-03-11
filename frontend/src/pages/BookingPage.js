import React, { useContext, useState } from "react";
import { Grid, Card, Typography, Tabs, Tab, Box } from "@mui/material";
// import pizza from "../assets/images/piz.jpg";
// import ChangePassword from "./auth/ChangePassword";
import ViewBookings from "../components/ViewBookings";
import BookingCal from "../components/BookingCal";
import CalBook from "../components/CalBook";

const TabPanel = (props) => {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const BookingPage = () => {
  const [value, setValue] = useState(0);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <>
      {/* BookingPage */}
      <Grid container sx={{ height: "90vh" }}>
        {/* <Grid
          item
          lg={8}
          sm={4}
          sx={{
            backgroundImage: `url(${pizza})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: { xs: "none", sm: "block" },
          }}
        ></Grid> */}
        <Grid item lg={12} sm={7} xs={12}>
          <Card
            sx={{
              width: "100%",
              height: "100%",
              background:
                "radial-gradient(circle at 94.02% 88.03%, #54a4ff, transparent 100%),radial-gradient(circle at 25.99% 27.79%, #ff94fb, transparent 100%),radial-gradient(circle at 50% 50%, #000000, #000000 100%)",
            }}
          >
            <Box sx={{ mx: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                  value={value}
                  textColor="secondary"
                  indicatorColor="secondary"
                  onChange={handleChange}
                >
                  <Tab
                    label="Calendar"
                    sx={{ textTransform: "none", fontWeight: "bold" }}
                  ></Tab>
                  <Tab
                    label="View Booking Details"
                    sx={{ textTransform: "none", fontWeight: "bold" }}
                  ></Tab>
                </Tabs>
              </Box>
              <Box>
                <TabPanel value={value} index={0}>
                  {/* <Login /> */}
                  <BookingCal />
                  {/* <CalBook /> */}
                </TabPanel>
                <TabPanel value={value} index={1}>
                  {/* <Registration /> */}
                  <ViewBookings />
                </TabPanel>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default BookingPage;
