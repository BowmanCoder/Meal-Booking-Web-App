import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import { useSelector } from "react-redux";

import "./assets/css/bootstrap.min.css";
import "./assets/css/open-iconic-bootstrap.min.css";
import "./assets/css/animate.css";

import "./assets/css/owl.carousel.min.css";
import "./assets/css/owl.theme.default.min.css";
import "./assets/css/magnific-popup.css";
import "./assets/css/bootstrap-datepicker.css";
import "./assets/css/jquery.timepicker.css";
import "./assets/css/icomoon.css";
import "./assets/css/sidebar.css";
import "./assets/css/rick.css";
import "./assets/css/bootstrap.css";
import ContactUs from "./components/ContactUs";
import ChangePassword from "./pages/auth/ChangePassword";
import BookingPage from "./pages/BookingPage";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsCond from "./pages/TermsCond";
import SendPassResetEmail from "./pages/auth/SendPassResetEmail";
import ResetPassword from "./pages/auth/ResetPassword";

function App() {
  const { access_token } = useSelector((state) => state.auth);
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="contact" element={<ContactUs />} />
            <Route
              path="login"
              element={
                !access_token ? <LoginPage /> : <Navigate to="/dashboard" />
              }
            ></Route>
            <Route path="resetpasswordemail" element={<SendPassResetEmail />} />
            <Route
              path="api/resetpassword/:id/:token"
              element={<ResetPassword />}
            />
          </Route>
          <Route
            path="/dashboard"
            element={access_token ? <Dashboard /> : <Navigate to="/login" />}
          >
            <Route index element={<BookingPage />} />
            <Route path="aboutus" element={<AboutUs />} />
            <Route path="privacypolicy" element={<PrivacyPolicy />} />
            <Route path="termsandconditions" element={<TermsCond />} />
            <Route path="changepassword" element={<ChangePassword />} />
          </Route>
          <Route path="*" element={<h1>Error 404 Page Not Found!!</h1>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
