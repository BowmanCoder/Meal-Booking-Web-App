import React from "react";

function ContactUs() {
  return (
    <div>
      <section className="ftco-section bg-light" id="section-contact">
        <div className="container">
          <div className="row">
            <div className="col-md-12 text-center mb-5 ftco-animate">
              <h2 className="display-4">Contact Us</h2>
              <div className="row justify-content-center">
                <div className="col-md-7">
                  <p className="lead">
                    Far far away, behind the word mountains, far from the
                    countries Vokalia and Consonantia, there live the blind
                    texts.
                  </p>
                </div>
              </div>
            </div>

            {/* <div className="col-md mb-5 ftco-animate">
              <form action="" method="post">
                <div className="form-group">
                  <label for="name" className="sr-only">
                    Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="form-group">
                  <label for="email" className="sr-only">
                    Email
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="email"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-group">
                  <label for="message" className="sr-only">
                    Message
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    cols="30"
                    rows="10"
                    className="form-control"
                    placeholder="Write your message"
                  ></textarea>
                </div>
                <div className="form-group">
                  <input
                    type="submit"
                    className="btn btn-primary btn-lg"
                    value="Send Message"
                  />
                </div>
              </form>
            </div> */}
          </div>
        </div>
      </section>
      <div id="map"></div>
      {/* <!-- END section --> */}
      <footer className="ftco-footer ftco-bg-dark ftco-section">
        <div className="container">
          <div className="row mb-5">
            {/* <div className="col-md-4">
              
            </div> */}
            <div className="col-md-8">
              <div className="row">
                <div className="col-md ftco-animate">
                  <div className="ftco-footer-widget mb-4">
                    <div className="ftco-footer-widget mb-4">
                      <ul className="ftco-footer-social list-unstyled float-md-right float-lft">
                        <li className="ftco-animate">
                          <a href="#">
                            <span className="icon-twitter"></span>
                          </a>
                        </li>
                        <li className="ftco-animate">
                          <a href="#">
                            <span className="icon-facebook"></span>
                          </a>
                        </li>
                        <li className="ftco-animate">
                          <a href="#">
                            <span className="icon-instagram"></span>
                          </a>
                        </li>
                      </ul>
                    </div>

                    <h2 className="ftco-heading-2">The Restaurant</h2>
                    <ul className="list-unstyled">
                      <li>
                        <a href="#" className="py-2 d-block">
                          About Us
                        </a>
                      </li>
                      <li>
                        <a href="#" className="py-2 d-block">
                          Chefs
                        </a>
                      </li>
                      <li>
                        <a href="#" className="py-2 d-block">
                          Events
                        </a>
                      </li>
                      <li>
                        <a href="#" className="py-2 d-block">
                          Contact
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row ftco-animate">
            <div className="col-md text-left">
              <p>
                &copy; BookMyMeal 2023. All Rights Reserved. Made with{" "}
                <span className="icon-heart text-danger"></span> by{" "}
                <a href="https://www.linkedin.com/in/parth-bhatt-732bb1229/">
                  Parth Bhatt
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ContactUs;
