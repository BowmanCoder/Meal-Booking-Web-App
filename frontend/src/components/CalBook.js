import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Calendar, momentLocalizer } from "react-big-calendar";
import CustomToolbar from "./Toolbar";
import moment from "moment";
import Modal from "react-modal";
import Input from "../services/input";
import Popup from "react-popup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../services/index";
import "../assets/css/Popup.css";
import "../assets/css/Calendar.css";
import "../assets/css/Styles.css";
import BookingCal from "./BookingCal";
import CalendarInput from "./CalendarInput";
// import ResponsiveAppBar from "./ResponsiveNavbar";
const localizer = momentLocalizer(moment);
const MyCalendarComponent = (props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    props.fetchEvents();
  }, []);
  const renderEventContent = (slotInfo) => {
    const startdate = moment(slotInfo.startdate).format("YYYY-MM-DD");
    const enddate = moment(slotInfo.enddate).format("YYYY-MM-DD");
    return (
      <div>
        <p>
          Start Date: <strong>{startdate + 1}</strong>
        </p>
        <p>
          End Date: <strong>{enddate}</strong>
        </p>
      </div>
    );
  };
  const onSelectEventHandler = (slotInfo) => {
    Popup.create({
      title: slotInfo.title,
      content: renderEventContent(slotInfo),
      buttons: {
        right: [
          {
            text: "Edit",
            className: "info",
            action: function () {
              Popup.close();
              openPopupForm(slotInfo);
            }.bind(this),
          },
          {
            text: "Delete",
            className: "danger",
            action: function () {
              props.deleteEvent(slotInfo.id);
              Popup.close();
            }.bind(this),
          },
        ],
      },
    });
  };
  const onSelectEventSlotHandler = (slotInfo) => {
    openPopupForm(slotInfo);
  };
  const openPopupForm = (slotInfo) => {
    const currentDateTime = moment();
    if (slotInfo.startdate < currentDateTime.startOf("day")) {
      return; // Ignore slots from previous days
    }
    let newEvent = false;
    let popupTitle = "Update Event";
    if (!slotInfo.hasOwnProperty("id")) {
      slotInfo.id = moment().format("x");
      slotInfo.title = "Booked"; // Set the title directly
      popupTitle = "Create Event";
      newEvent = true;
    }
    Popup.create({
      title: popupTitle,
      content: (
        <div>
          <CalendarInput />
          {/* <p>Event Title: Booked</p>  */}
          {/* Display the fixed title */}
        </div>
      ),
      buttons: {
        left: ["cancel"],
        right: [
          {
            text: "Save",
            className: "success",
            action: function () {
              if (newEvent) {
                props.createEvent(slotInfo);
              } else {
                props.updateEvent(slotInfo);
              }
              saveEvent(slotInfo); // Save the event via API
              Popup.close();
            }.bind(this),
          },
        ],
      },
    });
  };
  const eventStyleGetter = (event, startdate, enddate, isSelected) => {
    let current_time = moment().format("YYYY MM DD");
    let event_time = moment(event.startdate).format("YYYY MM DD");
    let background = current_time > event_time ? "#DE6987" : "#8CBD4C";
    return {
      style: {
        backgroundColor: background,
      },
    };
  };
  const navigateToBookingList = () => {
    const startdate = "2023-05-25"; // Replace with the actual start date
    const enddate = "2023-05-30"; // Replace with the actual end date
    navigate(`/booking-list/`);
  };
  const saveEvent = (eventData) => {
    axios
      .post("http://127.0.0.1:8000/api/event/save/", eventData)
      .then((response) => {
        console.log(response.data); // Handle the response from the server
      })
      .catch((error) => {
        console.error(error); // Handle any error that occurs during the request
      });
  };
  const openModal = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };
  return (
    <>
      <div className="calendar-container">
        <Calendar
          popup
          selectable
          localizer={localizer}
          events={props.events}
          views={["month", "week", "day"]}
          defaultView="month"
          components={{
            toolbar: CustomToolbar,
          }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={onSelectEventHandler}
          onSelectSlot={onSelectEventSlotHandler}
        />
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          contentLabel="Booking Form"
        >
          {/* <BookingForm closeModal={closeModal} /> */}
        </Modal>
        <Popup />
      </div>
    </>
  );
};
const mapStateToProps = (state) => {
  return {
    events: state.events,
  };
};
const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      fetchEvents,
      createEvent,
      updateEvent,
      deleteEvent,
    },
    dispatch
  );
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyCalendarComponent);
