import React, { useState } from "react";
import { useUserBookingMutation } from "../services/userAuthAPI";
// import { useNavigate } from "react-router-dom";
import { storeToken } from "../services/LocalStorageService";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  Checkbox,
} from "@mui/material";
import CalBook from "./CalBook";

const locales = {
  "en-IN": require("date-fns/locale/en-IN"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const events = [
  {
    title: "9",
    allDay: true,
    startdate: new Date(2023, 4, 31),
    enddate: new Date(2023, 5, 5),
  },
  {
    title: "10",

    startdate: new Date(2023, 5, 2),
    enddate: new Date(2023, 5, 6),
  },
  {
    title: "10",

    startdate: new Date(2023, 6, 31),
    enddate: new Date(2023, 7, 10),
  },
];

const CalendarInput = () => {
  const [newEvent, setNewEvent] = useState({
    title: "",
    startdate: "",
    enddate: "",
  });
  const [allEvents, setAllEvents] = useState(events);

  function handleAddEvent() {
    setAllEvents([...allEvents, newEvent]);
  }

  const [server_error, setServerError] = useState({});

  // const Navigate = useNavigate();

  const [userBooking, { isLoading }] = useUserBookingMutation();

  const [server_msg, setServerMsg] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const actualData = {
      startdate: data.get("startdate"),
      enddate: data.get("enddate"),
      email: data.get("email"),
      couponredeem: data.get("couponredeem"),
    };
    /* */
    const res = await userBooking(actualData);
    if (res.error) {
      setServerError(res.error.data.errors);
    }
    if (res.data) {
      console.log(typeof res.data);
      console.log(res.data);
      storeToken(res.data.token);
      // Navigate("/dashboard");
    }
  };

  return (
    <div>
      <Box
        component="form"
        noValidate
        sx={{
          mt: 1,
          // mx: 18
        }}
        id="booking-form"
        onSubmit={handleSubmit}
      >
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          name="email"
          label="Email Id"
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
          id="startdate"
          name="startdate"
          label="Start Date"
          color="secondary"
          InputLabelProps={{ shrink: true }}
          sx={{ flexGrow: 1 }}
          type="date"
          size="small"
          format="YYYY-MM-DD"
        />
        {server_error.startdate ? (
          <Typography style={{ fontSize: 12, color: "red", paddingLeft: 10 }}>
            {server_error.startdate[0]}
          </Typography>
        ) : (
          ""
        )}
        <TextField
          margin="normal"
          required
          fullWidth
          id="enddate"
          name="enddate"
          label="End Date"
          color="secondary"
          InputLabelProps={{ shrink: true }}
          sx={{ flexGrow: 1 }}
          type="date"
          size="small"
          format="YYYY-MM-DD"
          selected={newEvent.enddate}
          onChange={(enddate) => setNewEvent({ ...newEvent, enddate })}
        />
        {server_error.enddate ? (
          <Typography style={{ fontSize: 12, color: "red", paddingLeft: 10 }}>
            {server_error.enddate[0]}
          </Typography>
        ) : (
          ""
        )}

        <FormControlLabel
          control={
            <Checkbox
              value={true}
              color="primary"
              name="couponredeem"
              id="couponredeem"
            />
          }
          label="Will redeem coupon"
        />
        {server_error.tc ? (
          <span style={{ fontSize: 12, color: "red", paddingLeft: 10 }}>
            {server_error.couponredeem[0]}
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
              Submit Booking
            </Button>
          )}
        </Box>
        {server_error.non_field_errors ? (
          <Alert severity="error">{server_error.non_field_errors[0]}</Alert>
        ) : (
          ""
        )}
        {server_msg.msg ? (
          <Alert severity="success">{server_msg.msg}</Alert>
        ) : (
          ""
        )}
        <Box textAlign="center"></Box>
      </Box>
    </div>
  );
};

export default CalendarInput;

// import * as React from "react";
// import dayjs from "dayjs";
// import isBetweenPlugin from "dayjs/plugin/isBetween";
// import { styled } from "@mui/material/styles";
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
// import { PickersDay } from "@mui/x-date-pickers/PickersDay";
// import CssBaseline from "@mui/material/CssBaseline";
// import Box from "@mui/material/Box";
// import Container from "@mui/material/Container";
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// dayjs.extend(isBetweenPlugin);

// const CustomPickersDay = styled(PickersDay, {
//   shouldForwardProp: (prop) =>
//     prop !== "dayIsBetween" && prop !== "isFirstDay" && prop !== "isLastDay",
// })(({ theme, dayIsBetween, isFirstDay, isLastDay }) => ({
//   ...(dayIsBetween && {
//     borderRadius: 0,
//     backgroundColor: theme.palette.primary.main,
//     color: theme.palette.common.white,
//     "&:hover, &:focus": {
//       backgroundColor: theme.palette.primary.dark,
//     },
//   }),
//   ...(isFirstDay && {
//     borderTopLeftRadius: "50%",
//     borderBottomLeftRadius: "50%",
//   }),
//   ...(isLastDay && {
//     borderTopRightRadius: "50%",
//     borderBottomRightRadius: "50%",
//   }),
// }));

// function Day(props) {
//   const { day, selectedDay, ...other } = props;

//   if (selectedDay == null) {
//     return <PickersDay day={day} {...other} />;
//   }

//   const start = selectedDay.startOf("week");
//   const end = selectedDay.endOf("week");

//   const dayIsBetween = day.isBetween(start, end, null, "[]");
//   const isFirstDay = day.isSame(start, "day");
//   const isLastDay = day.isSame(end, "day");

//   return (
//     <CustomPickersDay
//       {...other}
//       day={day}
//       sx={dayIsBetween ? { px: 2.5, mx: 0 } : {}}
//       dayIsBetween={dayIsBetween}
//       isFirstDay={isFirstDay}
//       isLastDay={isLastDay}
//     />
//   );
// }

// export default function CustomDay() {
//   const [value, setValue] = React.useState(dayjs("2023-05-28"));

//   return (
//     <React.Fragment>
//       <CssBaseline />
//       <Container maxWidth="sm" sx={{ m: 3 }}>
//         <Box
//           sx={{
//             bgcolor: "#cfe8fc",
//             height: "75vh",
//             // width: "100vh",
//             wordSpacing: 3,
//           }}
//         >
//           <LocalizationProvider dateAdapter={AdapterDayjs}>
//             <DatePicker
//               sx={{ m: 2 }}
//               label="Start Date"
//               className="start"
//               value={value}
//               onChange={(newValue) => setValue(newValue)}
//             />

//             <DatePicker
//               sx={{ m: 2 }}
//               label="End Date"
//               className="end"
//               value={value}
//               // value={(newValue) => setValue(newValue)}
//               onChange={(newValue) => setValue(newValue)}
//             />

//             <DateCalendar
//               value={value}
//               onChange={(newValue) => setValue(newValue)}
//               slots={{ day: Day }}
//               slotProps={{
//                 day: {
//                   selectedDay: value,
//                 },
//               }}
//             />
//           </LocalizationProvider>
//         </Box>
//       </Container>
//     </React.Fragment>
//   );
// }
