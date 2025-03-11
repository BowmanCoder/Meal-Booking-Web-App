import React from "react";
import Header from "./Header";
import ContactUs from "./ContactUs";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <>
      <Header />
      <Outlet />
      {/* <ContactUs /> */}
    </>
  );
};

export default Layout;
