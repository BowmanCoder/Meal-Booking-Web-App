import React from "react";
import { Box, Grid } from "@mui/material";
import { FastfoodSharp } from "@mui/icons-material";

function FoodGallery() {
  return (
    <Grid container>
      <Box sx={{ m: 20 }}>
        <div>
          <section className="ftco-section" id="section-gallery">
            <div className="container">
              <div className="row ftco-custom-gutters">
                <div className="col-md-12 text-center mb-5 ftco-animate">
                  <h2 className="display-4">
                    BookMyMeal
                    <FastfoodSharp
                      sx={{ color: "purple", fontSize: 100, mx: 3 }}
                    />
                  </h2>
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

                <div className="col-md-4 ftco-animate">
                  <a
                    href={require("../assets/images/snacks.jpg")}
                    className="ftco-thumbnail image-popup"
                  >
                    <img
                      src={require("../assets/images/snacks.jpg")}
                      alt="Free Template by Free-Template.co"
                      className="img-fluid"
                    />
                  </a>
                </div>
                <div className="col-md-4 ftco-animate">
                  <a
                    href={require("../assets/images/in-food.jpeg")}
                    className="ftco-thumbnail image-popup"
                  >
                    <img
                      src={require("../assets/images/in-food.jpeg")}
                      alt="Free Template by Free-Template.co"
                      className="img-fluid"
                    />
                  </a>
                </div>
                <div className="col-md-4 ftco-animate">
                  <a
                    href={require("../assets/images/sth.jpg")}
                    className="ftco-thumbnail image-popup"
                  >
                    <img
                      src={require("../assets/images/sth.jpg")}
                      alt="Free Template by Free-Template.co"
                      className="img-fluid"
                    />
                  </a>
                </div>

                <div className="col-md-4 ftco-animate">
                  <a
                    href={require("../assets/images/aam.jpg")}
                    className="ftco-thumbnail image-popup"
                  >
                    <img
                      src={require("../assets/images/aam.jpg")}
                      alt="Free Template by Free-Template.co"
                      className="img-fluid"
                    />
                  </a>
                </div>
                <div className="col-md-4 ftco-animate">
                  <a
                    href={require("../assets/images/rice-1.jpg")}
                    className="ftco-thumbnail image-popup"
                  >
                    <img
                      src={require("../assets/images/rice-1.jpg")}
                      alt="Free Template by Free-Template.co"
                      className="img-fluid"
                    />
                  </a>
                </div>
                <div className="col-md-4 ftco-animate">
                  <a
                    href={require("../assets/images/full.jpg")}
                    className="ftco-thumbnail image-popup"
                  >
                    <img
                      src={require("../assets/images/full.jpg")}
                      alt="Free Template by Free-Template.co"
                      className="img-fluid"
                    />
                  </a>
                </div>
              </div>
            </div>
          </section>
          {/* <!-- END section --> */}
        </div>
      </Box>
    </Grid>
  );
}

export default FoodGallery;
