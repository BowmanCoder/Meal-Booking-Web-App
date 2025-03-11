import _ from "lodash";
import moment from "moment";
import { eventData } from "./demoData";

export const FETCH_EVENTS = "fetch_events";
export const CREATE_EVENT = "create_event";
export const UPDATE_EVENT = "update_event";
export const DELETE_EVENT = "delete_event";
export const PAST_EVENTS = "past_events";
export const UPCOMING_EVENTS = "upcoming_events";

export function fetchEvents() {
  if (!localStorage.getItem("events")) {
    localStorage.setItem("events", JSON.stringify(eventData));
  }
  let events = JSON.parse(localStorage.getItem("events"));
  return {
    type: FETCH_EVENTS,
    payload: events,
  };
}

// export function createEvent(values) {
//   let events = JSON.parse(localStorage.getItem("events"));
//   events.push(values);
//   localStorage.setItem("events", JSON.stringify(events));
//   return {
//     type: CREATE_EVENT,
//     payload: events,
//   };
// }
export function createEvent(values) {
  let events = JSON.parse(localStorage.getItem("events")) || []; // Assign an empty array if 'events' is null or undefined
  events.push(values);
  localStorage.setItem("events", JSON.stringify(events));
  return {
    type: CREATE_EVENT,
    payload: events,
  };
}

export function updateEvent(values) {
  let events = JSON.parse(localStorage.getItem("events"));
  let index = _.findIndex(events, { id: values.id });
  events[index] = values;
  localStorage.setItem("events", JSON.stringify(events));
  return {
    type: UPDATE_EVENT,
    payload: events,
  };
}

export function deleteEvent(id) {
  let events = JSON.parse(localStorage.getItem("events"));
  let index = _.findIndex(events, { id: id });
  events.splice(index, 1);
  localStorage.setItem("events", JSON.stringify(events));
  return {
    type: DELETE_EVENT,
    payload: events,
  };
}

export function pastEvents() {
  let events = JSON.parse(localStorage.getItem("events"));
  events = _.filter(events, (item) => moment().isAfter(item.start));
  return {
    type: PAST_EVENTS,
    payload: events,
  };
}

export function upcomingEvents() {
  let events = JSON.parse(localStorage.getItem("events"));
  events = _.filter(events, (item) => moment().isBefore(item.start));
  return {
    type: UPCOMING_EVENTS,
    payload: events,
  };
}

// action/index.js
