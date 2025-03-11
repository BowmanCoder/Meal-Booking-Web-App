import React, { useContext, useState } from "react";
import { Grid, Card, Typography, Tabs, Tab, Box } from "@mui/material";
// import AuthContext from "../context/AuthContext";
import FoodGallery from "../components/FoodGallery";
import pizza from "../assets/images/piz.jpg";
import dine from "../assets/images/dining.jpg";
import happy from "../assets/images/happy.gif";
import slow from "../assets/images/slow.gif";
import Login from "./auth/Login";
import Registration from "./auth/Registration";

const TabPanel = (props) => {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const LoginPage = () => {
  const [value, setValue] = useState(0);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <>
      <Grid container sx={{ height: "90vh" }}>
        <Grid
          item
          lg={7}
          sm={5}
          sx={{
            backgroundImage: `url(${slow})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: { xs: "none", sm: "block" },
          }}
        ></Grid>
        <Grid item lg={5} sm={7} xs={12}>
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
                    label="Login"
                    sx={{ textTransform: "none", fontWeight: "bold" }}
                  ></Tab>
                  <Tab
                    label="Registration"
                    sx={{ textTransform: "none", fontWeight: "bold" }}
                  ></Tab>
                </Tabs>
              </Box>
              <Box>
                <TabPanel value={value} index={0}>
                  <Login />
                </TabPanel>
                <TabPanel value={value} index={1}>
                  <Registration />
                </TabPanel>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
      {/* <FoodGallery /> */}
    </>
  );
};

export default LoginPage;

// let { loginUser } = useContext(AuthContext);
//   return (

//     // <div>
//     //     <form onSubmit={loginUser}>
//     //         <input type="text" name="username" placeholder="Enter Username" />
//     //         <input type="password" name="password" placeholder="Enter Password" />
//     //         <input type="submit"/>
//     //     </form>
//     // </div>
//     // Previous beta version
//     <div
//       className="main"
//       data-spy="scroll"
//       data-target="#ftco-navbar"
//       data-offset="200"
//     >
//       {/* <nav
//         className="navbar navbar-expand-lg navbar-dark ftco_navbar bg-dark ftco-navbar-light"
//         id="ftco-navbar"
//       >
//         <div className="container">
//           <a className="navbar-brand" href="index.html">
//             BookMyMeal
//           </a>
//           <button
//             className="navbar-toggler"
//             type="button"
//             data-toggle="collapse"
//             data-target="#ftco-nav"
//             aria-controls="ftco-nav"
//             aria-expanded="false"
//             aria-label="Toggle navigation"
//           >
//             <span className="oi oi-menu"></span> Menu
//           </button>
//           <div className="collapse navbar-collapse" id="ftco-nav">
//             <ul className="navbar-nav ml-auto">
//               <li className="nav-item active">
//                 <a href="#section-home" className="nav-link">
//                   Home
//                 </a>
//               </li> */}
//       {/* <!--            <li class="nav-item"><a href="#section-about" class="nav-link">About</a></li>--> */}
//       {/* <li className="nav-item">
//                 <a href="#section-offer" className="nav-link">
//                   Offer
//                 </a>
//               </li> */}
//       {/* <!--            <li class="nav-item"><a href="#section-menu" class="nav-link">Menu</a></li>-->
// <!--            <li class="nav-item"><a href="#section-news" class="nav-link">News</a></li>--> */}
//       {/* <li className="nav-item">
//                 <a href="#section-gallery" className="nav-link">
//                   Gallery
//                 </a>
//               </li>
//               <li className="nav-item">
//                 <a href="#section-contact" className="nav-link">
//                   Contact
//                 </a>
//               </li>
//             </ul>
//           </div>
//         </div>
//       </nav> */}
//       {/* <!-- END nav --> */}
//       <section
//         className="ftco-cover"
//         style={{
//           backgroundImage:
//             "url(" + require("../assets/images/walrus.jpg") + ")",
//         }}
//         id="section-home"
//       >
//         <div className="container">
//           <div className="row align-items-center justify-content-center text-center ftco-vh-100">
//             <div className="col-md-12">
//               <br></br>
//               <h1
//                 className="ftco-heading ftco-animate mb-3"
//                 style={{ color: "#fff" }}
//               >
//                 BookMyMeal
//               </h1>
//               {/* <p>
//                 <a
//                   target="_blank"
//                   className="btn btn-outline-white btn-lg ftco-animate"
//                   data-toggle="modal"
//                   data-target="#reservationModal"
//                 >
//                   SignUp
//                 </a>
//               </p>
//               <p>
//                 <a
//                   target="_blank"
//                   className="btn btn-outline-white btn-lg ftco-animate"
//                   data-toggle="modal"
//                   data-target="#reservationMod"
//                 >
//                   SignIn
//                 </a>
//               </p> */}
//               {/* <!--    Login Modal--> */}
//               <div
//               // className="modal fade"
//               // id="reservationMod"
//               // tabindex="-1"
//               // role="dialog"
//               // aria-labelledby="reservationModalLabel"
//               //   aria-hidden="true"
//               >
//                 <div className="modal-dialog modal-lg" role="document">
//                   <div className="modal-content">
//                     <div className="modal-body">
//                       <div className="row">
//                         <div
//                           className="col-lg-4 bg-image"
//                           style={{
//                             backgroundImage:
//                               "url(" +
//                               require("../assets/images/piz.jpg") +
//                               ")",
//                           }}
//                         ></div>
//                         <div className="col-lg-8 p-5">
//                           {/* <button
//                             type="button"
//                             className="close"
//                             data-dismiss="modal"
//                             aria-label="Close"
//                           >
//                             <small>CLOSE </small>
//                             <span aria-hidden="true">&times;</span>
//                           </button> */}
//                           <h1 className="mb-4">User Login</h1>
//                           <form onSubmit={loginUser} method="post">
//                             {/* {% csrf_token %} */}
//                             {/* <!--                  <div class="row">-->
// <!--                    <div class="col-md-6 form-group">-->
// <!--                      <label for="m_fname">First Name</label>-->
// <!--                      <input type="text" class="form-control" id="m_fname">-->
// <!--                    </div>-->
// <!--                    <div class="col-md-6 form-group">-->
// <!--                      <label for="m_lname">Last Name</label>-->
// <!--                      <input type="text" class="form-control" id="m_lname">-->
// <!--                    </div>-->
// <!--                  </div>--> */}
//                             <div className="row">
//                               <div className="col-md-12 form-group">
//                                 {/* <label for="m_email">Username</label> */}
//                                 {/* {% if error %} */}
//                                 <div className="alert alert-danger" role="">
//                                   {/* {{ error }} */}
//                                 </div>
//                                 {/* {% endif %} */}
//                                 <input
//                                   type="text"
//                                   className="form-control"
//                                   id="m_people"
//                                   name="username"
//                                   placeholder="UserName"
//                                 />
//                               </div>
//                             </div>
//                             {/* <!--                  <div class="row">-->
// <!--&lt;!&ndash;                    <div class="col-md-6 form-group">&ndash;&gt;-->
// <!--&lt;!&ndash;                      <label for="m_people">How Many People</label>&ndash;&gt;-->
// <!--&lt;!&ndash;                      <select name="" id="m_people" class="form-control">&ndash;&gt;-->
// <!--&lt;!&ndash;                        <option value="1">1 People</option>&ndash;&gt;-->
// <!--&lt;!&ndash;                        <option value="2">2 People</option>&ndash;&gt;-->
// <!--&lt;!&ndash;                        <option value="3">3 People</option>&ndash;&gt;-->
// <!--&lt;!&ndash;                        <option value="4+">4+ People</option>&ndash;&gt;-->
// <!--&lt;!&ndash;                      </select>&ndash;&gt;-->
// <!--&lt;!&ndash;                    </div>&ndash;&gt;-->
// <!--                    <div class="col-md-6 form-group">-->
// <!--                      <label for="m_people">User-Name</label>-->
// <!--                      <input type="text" class="form-control" id="m_people">-->
// <!--                    </div>-->
// <!--                  </div>--> */}
//                             <div className="row">
//                               <div className="col-md-6 form-group">
//                                 {/* <label for="m_tim">Password</label> */}
//                                 <input
//                                   type="password"
//                                   className="form-control"
//                                   id="m_ti"
//                                   name="password"
//                                   placeholder="Password"
//                                 />
//                               </div>
//                             </div>
//                             <div className="row">
//                               <div className="col-md-12 form-group">
//                                 <input
//                                   type="submit"
//                                   className="btn btn-primary btn-lg btn-block"
//                                   value="Sign In Now"
//                                 />
//                               </div>
//                               <div>
//                                 <a href="forgotpass">Forgot Password?</a>
//                               </div>
//                             </div>
//                           </form>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <h2 className="h5 ftco-subheading mb-5 ftco-animate">
//               A goto website to Book your FAVORITE Meals.
//             </h2>
//           </div>
//         </div>
//       </section>
//       {/* // <!-- END section --> */}
//       {/* // <!--    <section class="ftco-section" id="section-about">-->
// // <!--      <div class="container">-->
// // <!--        <div class="row">-->
// // <!--          <div class="col-md-5 ftco-animate mb-5">-->
// // <!--            <h4 class="ftco-sub-title">Our Story</h4>-->
// // <!--            <h2 class="ftco-primary-title display-4">Welcome</h2>-->
// // <!--            <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// // <!--            <p class="mb-4">A small river named Duden flows by their place and supplies it with the necessary regelialia. It is a paradisematic country, in which roasted parts of sentences fly into your mouth.</p>-->
// // <!--            <p><a href="#" class="btn btn-secondary btn-lg">Our Story</a></p>-->
// // <!--          </div>-->
// // <!--          <div class="col-md-1"></div>-->
// // <!--          <div class="col-md-6 ftco-animate img" data-animate-effect="fadeInRight">-->
// // <!--            <img src="{% static 'images/menu-company_new.jpg' %}" alt="Free Template by Free-Template.co">-->
// // <!--          </div>-->
// // <!--        </div>-->
// // <!--      </div>-->
// // <!--    </section><br>-->
// //     <!-- END section --> */}
//       {/* <section className="ftco-section bg-light" id="section-offer">
//         <div className="container"> */}
//       {/* <div className="row">
//             <div className="col-md-12 text-center mb-5 ftco-animate">
//               <h4 className="ftco-sub-title">Our Offers</h4>
//               <h2 className="display-4">Offers &amp; Promos</h2>
//               <div className="row justify-content-center">
//                 <div className="col-md-7">
//                   <p className="lead">
//                     Far far away, behind the word mountains, far from the
//                     countries Vokalia and Consonantia, there live the blind
//                     texts.
//                   </p>
//                 </div>
//               </div>
//             </div>
//             <div className="col-md-12">
//               <div className="owl-carousel ftco-owl">
//                 <div className="item">
//                   <div className="media d-block mb-4 text-center ftco-media ftco-animate border-0">
//                     <img
//                       src={require("../assets/images/idli.jpg")}
//                       alt="offer 1"
//                       className="img-fluid"
//                     />
//                     <div className="media-body p-md-5 p-4">
//                       <h5 className="text-primary">Rs.39.50</h5>
//                       <h5 className="mt-0 h4">Breakfast</h5>
//                       <p className="mb-4">
//                         Far far away, behind the word mountains, far from the
//                         countries Vokalia and Consonantia, there live the blind
//                         texts.
//                       </p>
//                       <p className="mb-0">
//                         <a
//                           href=""
//                           target="_blank"
//                           className="btn btn-primary btn-sm"
//                           data-toggle="modal"
//                           data-target="#reservationMod"
//                         >
//                           Order Now!
//                         </a>
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="item">
//                   <div className="media d-block mb-4 text-center ftco-media ftco-animate border-0">
//                     <img
//                       src={require("../assets/images/dosa-offer.jpg")}
//                       alt="offer 2"
//                       className="img-fluid"
//                     />
//                     <div className="media-body p-md-5 p-4">
//                       <h5 className="text-primary">Rs.70.50</h5>
//                       <h5 className="mt-0 h4">Lunch</h5>
//                       <p className="mb-4">
//                         Far far away, behind the word mountains, far from the
//                         countries Vokalia and Consonantia, there live the blind
//                         texts.
//                       </p>
//                       <p className="mb-0">
//                         <a
//                           href=""
//                           target="_blank"
//                           className="btn btn-primary btn-sm"
//                           data-toggle="modal"
//                           data-target="#reservationMod"
//                         >
//                           Order Now!
//                         </a>
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="item">
//                   <div className="media d-block mb-4 text-center ftco-media ftco-animate border-0">
//                     <img
//                       src={require("../assets/images/tea-coffee.jpg")}
//                       alt="Free Template by Free-Template.co"
//                       className="img-fluid"
//                     />
//                     <div className="media-body p-md-5 p-4">
//                       <h5 className="text-primary">Rs.10</h5>
//                       <h5 className="mt-0 h4">Tea & Coffee</h5>
//                       <p className="mb-4">
//                         Far far away, behind the word mountains, far from the
//                         countries Vokalia and Consonantia, there live the blind
//                         texts.
//                       </p>
//                       <p className="mb-0">
//                         <a
//                           href=""
//                           target="_blank"
//                           className="btn btn-primary btn-sm"
//                           data-toggle="modal"
//                           data-target="#reservationMod"
//                         >
//                           Order Now!
//                         </a>
//                       </p>
//                     </div>
//                   </div> */}
//       {/* </div> */}
//       {/* <!--              <div class="item">-->
// <!--                <div class="media d-block mb-4 text-center ftco-media ftco-animate border-0">-->
// <!--                  <img src="{% static 'images/offer_1.jpg' %}" alt="Free Template by Free-Template.co" class="img-fluid">-->
// <!--                  <div class="media-body p-md-5 p-4">-->
// <!--                    <h5 class="text-primary">$39.50</h5>-->
// <!--                    <h5 class="mt-0 h4">Beef with Sauce</h5>-->
// <!--                    <p class="mb-4">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                    <p class="mb-0"><a href="#" class="btn btn-primary btn-sm">Order Now!</a></p>-->
// <!--                  </div>-->
// <!--                </div>-->
// <!--              </div>-->
// <!--              <div class="item">-->
// <!--                <div class="media d-block mb-4 text-center ftco-media ftco-animate border-0">-->
// <!--                  <img src="{% static 'images/offer_2.jpg' %}" alt="Free Template by Free-Template.co" class="img-fluid">-->
// <!--                  <div class="media-body p-md-5 p-4">-->
// <!--                    <h5 class="text-primary">$39.50</h5>-->
// <!--                    <h5 class="mt-0 h4">Fresh Salmon Fish</h5>-->
// <!--                    <p class="mb-4">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                    <p class="mb-0"><a href="#" class="btn btn-primary btn-sm">Order Now!</a></p>-->
// <!--                  </div>-->
// <!--                </div>-->
// <!--              </div>-->
// <!--              -->
// <!--              <div class="item">-->
// <!--                <div class="media d-block mb-4 text-center ftco-media ftco-animate border-0">-->
// <!--                  <img src="{% static 'images/offer_3.jpg' %}" alt="Free Template by Free-Template.co" class="img-fluid">-->
// <!--                  <div class="media-body p-md-5 p-4">-->
// <!--                    <h5 class="text-primary">$39.50</h5>-->
// <!--                    <h5 class="mt-0 h4">Beef Ribs</h5>-->
// <!--                    <p class="mb-4">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                    <p class="mb-0"><a href="#" class="btn btn-primary btn-sm">Order Now!</a></p>-->
// <!--                  </div>-->
// <!--                </div>-->
// <!--              </div>-->
// <!--              <div class="item">-->
// <!--                <div class="media d-block mb-4 text-center ftco-media ftco-animate border-0">-->
// <!--                  <img src="{% static 'images/offer_1.jpg' %}" alt="Free Template by Free-Template.co" class="img-fluid">-->
// <!--                  <div class="media-body p-md-5 p-4">-->
// <!--                    <h5 class="text-primary">$39.50</h5>-->
// <!--                    <h5 class="mt-0 h4">Beef with Sauce</h5>-->
// <!--                    <p class="mb-4">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                    <p class="mb-0"><a href="#" class="btn btn-primary btn-sm">Order Now!</a></p>-->
// <!--                  </div>-->
// <!--                </div>-->
// <!--              </div>-->
// <!--              <div class="item">-->
// <!--                <div class="media d-block mb-4 text-center ftco-media ftco-animate border-0">-->
// <!--                  <img src="{% static 'images/offer_2.jpg' %}" alt="Free Template by Free-Template.co" class="img-fluid">-->
// <!--                  <div class="media-body p-md-5 p-4">-->
// <!--                    <h5 class="text-primary">$39.50</h5>-->
// <!--                    <h5 class="mt-0 h4">Fresh Salmon Fish</h5>-->
// <!--                    <p class="mb-4">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                    <p class="mb-0"><a href="#" class="btn btn-primary btn-sm">Order Now!</a></p>-->
// <!--                  </div>-->
// <!--                </div>-->
// <!--              </div>-->
// <!--              -->
// <!--              <div class="item">-->
// <!--                <div class="media d-block mb-4 text-center ftco-media ftco-animate border-0">-->
// <!--                  <img src="{% static 'images/offer_3.jpg' %}" alt="Free Template by Free-Template.co" class="img-fluid">-->
// <!--                  <div class="media-body p-md-5 p-4">-->
// <!--                    <h5 class="text-primary">$39.50</h5>-->
// <!--                    <h5 class="mt-0 h4">Beef Ribs</h5>-->
// <!--                    <p class="mb-4">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                    <p class="mb-0"><a href="#" class="btn btn-primary btn-sm">Order Now!</a></p>-->
// <!--                  </div>-->
// <!--                </div>-->
// <!--              </div>--> */}
//       {/* </div>
//             </div>
//           </div>
//         </div>
//       </section> */}
//       {/* <!-- END section --> */}
//       {/* <!--    <section class="ftco-section" id="section-menu">-->
// <!--      <div class="container">-->
// <!--        <div class="row">-->
// <!--          <div class="col-md-12 text-center mb-5 ftco-animate">-->
// <!--            <h2 class="display-4" >Today's Menu</h2>-->
// <!--            <div class="row justify-content-center">-->
// <!--              <div class="col-md-7">-->
// <!--&lt;!&ndash;                <p class="lead">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>&ndash;&gt;-->
// <!--&lt;!&ndash;                <h1 style="color:#fff;font-family: Playfair Display, serif;">Today's Menu</h1>&ndash;&gt;-->
// <!--              </div>-->
// <!--            </div>-->
// <!--          </div>-->
// <!--          <div class="col-md-12 text-center">-->
// <!--            <ul class="nav ftco-tab-nav nav-pills mb-5" id="pills-tab" role="tablist">-->
// <!--              <li class="nav-item ftco-animate">-->
// <!--                <a class="nav-link active" id="pills-breakfast-tab" data-toggle="pill" href="#pills-breakfast" role="tab" aria-controls="pills-breakfast" aria-selected="true">Breakfast</a>-->
// <!--              </li>-->
// <!--              <li class="nav-item ftco-animate">-->
// <!--                <a class="nav-link" id="pills-lunch-tab" data-toggle="pill" href="#pills-lunch" role="tab" aria-controls="pills-lunch" aria-selected="false">Lunch</a>-->
// <!--              </li>-->
// <!--              <li class="nav-item ftco-animate">-->
// <!--                <a class="nav-link" id="pills-dinner-tab" data-toggle="pill" href="#pills-dinner" role="tab" aria-controls="pills-dinner" aria-selected="false">Dinner</a>-->
// <!--              </li>-->
// <!--            </ul>-->
// <!--            <div class="tab-content text-left">-->
// <!--              <div class="tab-pane fade show active" id="pills-breakfast" role="tabpanel" aria-labelledby="pills-breakfast-tab">-->
// <!--                <div class="row">-->
// <!--                  <div class="col-md-6 ftco-animate">-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_1.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Salted Fried Chicken</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$35.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_2.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Italian Sauce Mushroom</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$24.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_3.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Fried Potato w/ Garlic</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$14.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                  </div>-->
// <!--                  <div class="col-md-6 ftco-animate">-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_2.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Italian Sauce Mushroom</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$35.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_1.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Salted Fried Chicken</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$12.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_3.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Fried Potato w/ Garlic</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$18.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                  </div>-->
// <!--                </div>-->
// <!--              </div>-->
// <!--              <div class="tab-pane fade" id="pills-lunch" role="tabpanel" aria-labelledby="pills-lunch-tab">-->
// <!--                <div class="row">-->
// <!--                  <div class="col-md-6 ftco-animate">-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_3.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Fried Potato w/ Garlic</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$14.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_1.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Salted Fried Chicken</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$35.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_2.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Italian Sauce Mushroom</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$24.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                  </div>-->
// <!--                  <div class="col-md-6 ftco-animate">-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_3.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Fried Potato w/ Garlic</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$18.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_2.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Italian Sauce Mushroom</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$35.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_1.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Salted Fried Chicken</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$12.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                    -->
// <!--                  </div>-->
// <!--                </div>-->
// <!--              </div>-->
// <!--              <div class="tab-pane fade" id="pills-dinner" role="tabpanel" aria-labelledby="pills-dinner-tab">-->
// <!--                <div class="row">-->
// <!--                  <div class="col-md-6 ftco-animate">-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_2.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Italian Sauce Mushroom</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$24.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_1.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Salted Fried Chicken</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$35.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_3.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Fried Potato w/ Garlic</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$14.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                  </div>-->
// <!--                  <div class="col-md-6 ftco-animate">-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_3.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Fried Potato w/ Garlic</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$18.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_2.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Italian Sauce Mushroom</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$35.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                    <div class="media menu-item">-->
// <!--                      <img class="mr-3" src="{% static 'images/menu_1.jpg' %}" class="img-fluid" alt="Free Template by Free-Template.co">-->
// <!--                      <div class="media-body">-->
// <!--                        <h5 class="mt-0">Salted Fried Chicken</h5>-->
// <!--                        <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                        <h6 class="text-primary menu-price">$12.50</h6>-->
// <!--                      </div>-->
// <!--                    </div>-->
// <!--                    -->
// <!--                  </div>-->
// <!--                </div>-->
// <!--              </div>-->
// <!--            </div>-->
// <!--          </div>-->
// <!--        </div>-->
// <!--      </div>-->
// <!--    </section>--> */}
//       {/* <!-- END section --> */}
//       {/* <!--    <section class="ftco-section bg-light" id="section-news">-->
// <!--      <div class="container">-->
// <!--        <div class="row">-->
// <!--          <div class="col-md-12 text-center mb-5 ftco-animate">-->
// <!--            <h2 class="display-4">News &amp; Events</h2>-->
// <!--            <div class="row justify-content-center">-->
// <!--              <div class="col-md-7">-->
// <!--                <p class="lead">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--              </div>-->
// <!--            </div>-->
// <!--          </div>-->
// <!--          <div class="col-lg-4 col-md-6 col-sm-6">-->
// <!--            <div class="media d-block mb-4 text-center ftco-media ftco-animate">-->
// <!--              <img src="{% static 'images/offer_1.jpg' %}" alt="Free Template by Free-Template.co" class="img-fluid">-->
// <!--              <div class="media-body p-md-5 p-4">-->
// <!--                <h5 class="mt-0 h4">In Taste Restaurant</h5>-->
// <!--                <p class="mb-4">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                <p class="mb-0"><a href="#" class="btn btn-primary btn-sm">Read More</a></p>-->
// <!--              </div>-->
// <!--            </div>-->
// <!--          </div>-->
// <!--          <div class="col-lg-4 col-md-6 col-sm-6">-->
// <!--            <div class="media d-block mb-4 text-center ftco-media ftco-animate">-->
// <!--              <img src="{% static 'images/offer_2.jpg' %}" alt="Free Template by Free-Template.co" class="img-fluid">-->
// <!--              <div class="media-body p-md-5 p-4">-->
// <!--                <h5 class="mt-0 h4">Chef Special Menu</h5>-->
// <!--                <p class="mb-4">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                <p class="mb-0"><a href="#" class="btn btn-primary btn-sm">Read More</a></p>-->
// <!--              </div>-->
// <!--            </div>-->
// <!--          </div>-->
// <!--          <div class="col-lg-4 col-md-6 col-sm-6">-->
// <!--            <div class="media d-block mb-4 text-center ftco-media ftco-animate">-->
// <!--              <img src="{% static 'images/offer_3.jpg' %}" alt="Free Template by Free-Template.co" class="img-fluid">-->
// <!--              <div class="media-body p-md-5 p-4">-->
// <!--                <h5 class="mt-0 h4">Merriage Celebrations</h5>-->
// <!--                <p class="mb-4">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>-->
// <!--                <p class="mb-0"><a href="#" class="btn btn-primary btn-sm">Read More</a></p>-->
// <!--              </div>-->
// <!--            </div>-->
// <!--          </div>-->
// <!--        </div>-->
// <!--      </div>-->
// <!--    </section>--> */}
//       {/* <!-- END section --> */}
//       <FoodGallery />
//       {/* <!-- Registration Modal --> */}
//       {/* <div
//       class="modal fade"
//       id="reservationModal"
//       tabindex="-1"
//       role="dialog"
//       aria-labelledby="reservationModalLabel"
//       aria-hidden="true"
//     >
//       <div class="modal-dialog modal-lg" role="document">
//         <div class="modal-content">
//           <div class="modal-body">
//             <div class="row">
//               <div
//                 class="col-lg-4 bg-image"
//                 style="background-image: url('{% static 'images/burger.jpg' %}');"
//               ></div>
//               <div class="col-lg-8 p-5">
//                 <button
//                   type="button"
//                   class="close"
//                   data-dismiss="modal"
//                   aria-label="Close"
//                 >
//                   <small>CLOSE </small>
//                   <span aria-hidden="true">&times;</span>
//                 </button>
//                 <h1 class="mb-4">User Registration</h1>
//                 <form action="index" method="post">
//                   {/* {% csrf_token %} */}
//       {/* <div class="row">
//                     <div class="col-md-6 form-group">
//                       <label for="m_fname">First Name</label>
//                       <input
//                         type="text"
//                         class="form-control"
//                         id="m_fname"
//                         name="f_nm"
//                       />
//                     </div>
//                     <div class="col-md-6 form-group">
//                       <label for="m_lname">Last Name</label>
//                       <input
//                         type="text"
//                         class="form-control"
//                         id="m_lname"
//                         name="l_nm"
//                       />
//                     </div>
//                   </div>
//                   <div class="row">
//                     <div class="col-md-12 form-group">
//                       <label for="m_email">Email</label>
//                       <input
//                         type="email"
//                         class="form-control"
//                         id="m_email"
//                         name="email"
//                       />
//                     </div>
//                   </div>
//                   <div class="row"> */}
//       {/* <!--                    <div class="col-md-6 form-group">-->
// <!--                      <label for="m_people">How Many People</label>-->
// <!--                      <select name="" id="m_people" class="form-control">-->
// <!--                        <option value="1">1 People</option>-->
// <!--                        <option value="2">2 People</option>-->
// <!--                        <option value="3">3 People</option>-->
// <!--                        <option value="4+">4+ People</option>-->
// <!--                      </select>-->
// <!--                    </div>--> */}
//       {/* <div class="col-md-6 form-group">
//                       <label for="m_people">User-Name</label>
//                       <input
//                         type="text"
//                         class="form-control"
//                         id="m_people"
//                         name="usname"
//                       />
//                     </div>
//                     <div class="col-md-6 form-group">
//                       <label for="m_phone">Contact-Info</label>
//                       <input
//                         type="tel"
//                         class="form-control"
//                         id="m_phone"
//                         name="tel"
//                       />
//                     </div>
//                   </div>
//                   <div class="row">
//                     <div class="col-md-6 form-group">
//                       <label for="m_tim">Password</label>
//                       <input
//                         type="password"
//                         class="form-control"
//                         id="m_tim"
//                         name="pswd"
//                       />
//                     </div>
//                     <div class="col-md-6 form-group">
//                       <label for="m_date">Date of Birth</label>
//                       <input
//                         type="text"
//                         class="form-control"
//                         id="m_date"
//                         name="bd"
//                       />
//                     </div>
//                   </div>
//                   <div class="row">
//                     <div class="col-md-6 form-group">
//                       <label for="m_date">Gender</label>
//                       <br />
//                       Male
//                       <input type="radio" name="optradio" value="M" />
//                       Female
//                       <input type="radio" name="optradio" value="F" />
//                       Others
//                       <input type="radio" name="optradio" value="O" />
//                     </div>
//                   </div>
//                   <div class="row">
//                     <div class="col-md-12 form-group">
//                       <label for="m_message">Address</label>
//                       <textarea
//                         class="form-control"
//                         id="m_message"
//                         cols="30"
//                         rows="4"
//                         name="address"
//                       ></textarea>
//                     </div>
//                   </div>
//                   <div class="row">
//                     <div class="col-md-12 form-group">
//                       <input
//                         type="submit"
//                         class="btn btn-primary btn-lg btn-block"
//                         value="Register Now"
//                       />
//                     </div>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div> */}
//       {/* <!--    Login Modal--> */}
//       <div
//         className="modal fade"
//         id="reservationMod"
//         tabindex="-1"
//         role="dialog"
//         aria-labelledby="reservationModalLabel"
//         aria-hidden="true"
//       >
//         <div className="modal-dialog modal-lg" role="document">
//           <div className="modal-content">
//             <div className="modal-body">
//               <div className="row">
//                 <div
//                   className="col-lg-4 bg-image"
//                   style={{ backgroundImage: 'url("assets/images/piz.jpg")' }}
//                 ></div>
//                 <div className="col-lg-8 p-5">
//                   <button
//                     type="button"
//                     className="close"
//                     data-dismiss="modal"
//                     aria-label="Close"
//                   >
//                     <small>CLOSE </small>
//                     <span aria-hidden="true">&times;</span>
//                   </button>
//                   <h1 className="mb-4">User Login</h1>
//                   <form onSubmit={loginUser} method="post">
//                     {/* {% csrf_token %} */}
//                     {/* <!--                  <div class="row">-->
// <!--                    <div class="col-md-6 form-group">-->
// <!--                      <label for="m_fname">First Name</label>-->
// <!--                      <input type="text" class="form-control" id="m_fname">-->
// <!--                    </div>-->
// <!--                    <div class="col-md-6 form-group">-->
// <!--                      <label for="m_lname">Last Name</label>-->
// <!--                      <input type="text" class="form-control" id="m_lname">-->
// <!--                    </div>-->
// <!--                  </div>--> */}
//                     <div className="row">
//                       <div className="col-md-12 form-group">
//                         {/* <label for="m_email">Username</label> */}
//                         {/* {% if error %} */}
//                         <div className="alert alert-danger" role="">
//                           {/* {{ error }} */}
//                         </div>
//                         {/* {% endif %} */}
//                         <input
//                           type="text"
//                           className="form-control"
//                           id="m_people"
//                           name="username"
//                           placeholder="UserName"
//                         />
//                       </div>
//                     </div>
//                     {/* <!--                  <div class="row">-->
// <!--&lt;!&ndash;                    <div class="col-md-6 form-group">&ndash;&gt;-->
// <!--&lt;!&ndash;                      <label for="m_people">How Many People</label>&ndash;&gt;-->
// <!--&lt;!&ndash;                      <select name="" id="m_people" class="form-control">&ndash;&gt;-->
// <!--&lt;!&ndash;                        <option value="1">1 People</option>&ndash;&gt;-->
// <!--&lt;!&ndash;                        <option value="2">2 People</option>&ndash;&gt;-->
// <!--&lt;!&ndash;                        <option value="3">3 People</option>&ndash;&gt;-->
// <!--&lt;!&ndash;                        <option value="4+">4+ People</option>&ndash;&gt;-->
// <!--&lt;!&ndash;                      </select>&ndash;&gt;-->
// <!--&lt;!&ndash;                    </div>&ndash;&gt;-->
// <!--                    <div class="col-md-6 form-group">-->
// <!--                      <label for="m_people">User-Name</label>-->
// <!--                      <input type="text" class="form-control" id="m_people">-->
// <!--                    </div>-->
// <!--                  </div>--> */}
//                     <div className="row">
//                       <div className="col-md-6 form-group">
//                         {/* <label for="m_tim">Password</label> */}
//                         <input
//                           type="password"
//                           className="form-control"
//                           id="m_ti"
//                           name="password"
//                           placeholder="Password"
//                         />
//                       </div>
//                     </div>
//                     <div className="row">
//                       <div className="col-md-12 form-group">
//                         <input
//                           type="submit"
//                           className="btn btn-primary btn-lg btn-block"
//                           value="Sign In Now"
//                         />
//                       </div>
//                       <div>
//                         <p>
//                           <a href="forgotpass">Forgot Password?</a>
//                         </p>
//                       </div>
//                     </div>
//                   </form>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//       {/* <!-- END Modal --> */}
//       {/* <!-- loader --> */}
//       {/* <div id="ftco-loader" className="show fullscreen">
//         <svg className="circular" width="48px" height="48px">
//           <circle
//             className="path-bg"
//             cx="24"
//             cy="24"
//             r="22"
//             fill="none"
//             stroke-width="4"
//             stroke="#eeeeee"
//           />
//           <circle
//             className="path"
//             cx="24"
//             cy="24"
//             r="22"
//             fill="none"
//             stroke-width="4"
//             stroke-miterlimit="10"
//             stroke="#F96D00"
//           />
//         </svg>
//       </div> */}
//     </div>
//   );
