import React, { useState, useEffect } from "react";
import "./style.css";

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentJiggingSlide, setCurrentJiggingSlide] = useState(0);

  const slides = [
    "/assets/main.png",
    "/assets/main1.png",
    "/assets/main2.png",
  ];

  const jiggingSlides = [
    "/assets/jigging.png",
    "/assets/jigging1.png",
    "/assets/jigging2.png",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 3000);

    const jiggingInterval = setInterval(() => {
      setCurrentJiggingSlide((prevSlide) => (prevSlide + 1) % jiggingSlides.length);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(jiggingInterval);
    };
  }, []);

  return (
    <div className="home-container">
      <div className="section text-image-section">
        <div className="slideshow-container">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`mySlides fade ${index === currentSlide ? "active" : ""
                }`}
            >
              <img src={slide} alt={`Slide ${index + 1}`} />
            </div>
          ))}
        </div>
        <div className="text-content">
          <h1>Welcome to Lokus!</h1>
          <p>
            Lokus is an advanced predictive web application that employs a Long
            Short-Term Memory (LSTM) model in conjunction with geospatial
            analysis to forecast the abundance and movement patterns of Indian
            squid in the northern Iloilo Sea. The application utilizes
            historical environmental data, which includes Sea Surface
            Temperature (SST), Sea Surface Height (SSH), and Chlorophyll (CHL)
            concentrations. Additionally, the squid catch rate data is derived
            from firsthand interviews conducted with jiggler fishermen in
            Estancia, Iloilo. The output of the predictions is expressed in
            terms of jiggler-based catch rates, with forecasts generated on a
            monthly basis. Lokus features two primary components: heatmap
            visualizations and graphical representations of the data.
          </p>
        </div>
      </div>

      <div className="section jigging-section">
        {/* Jigging Section */}
        <div className="text-content">
          {/* Text first */}
          <h2>What is Jigging?</h2>
          <p>
            Traditional squid jigging is a popular fishing technique in the
            Philippines, especially in coastal areas like Iloilo, where squid
            populations thrive. This method involves using specialized lures
            called "jigs," which are typically made of plastic and feature
            barbless spines designed to catch squid when they strike. Fishermen
            often fish at night, utilizing bright lights to attract squid to the
            surface. The jigs are dropped into the water and then jerked upward
            in a rhythmic motion to mimic the movement of prey, enticing the
            squid to bite. Once hooked, the squid is carefully reeled in to
            prevent it from escaping.
          </p>
          <p>
            This fishing practice is not only a vital source of income for many
            local fishermen but also an important aspect of cultural heritage in
            the Philippines. It fosters community connections and promotes
            sustainable fishing practices, as techniques and knowledge are
            often shared among generations. Traditional squid jigging exemplifies
            the balance between cultural tradition and the need for responsible
            resource management in the face of changing marine environments.
          </p>
        </div>
        <div className="slideshow-container">
          {/* Slideshow container for Jigging section */}
          {jiggingSlides.map((slide, index) => (
            <div
              key={index}
              className={`mySlides fade ${index === currentJiggingSlide ? "active" : ""
                }`}
            >
              <img src={slide} alt={`Slide ${index + 1}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="section features-section">
        {/* Feature Section */}
        <h2>Features</h2>
        <div className="feature-container">
          <div className="feature-box">
            {/* Heatmap Feature */}
            <h3>Heatmap</h3>
            <p>
              The heatmap feature is a valuable tool for visualizing squid
              abundance, allowing users to identify areas with high and low
              concentrations of squid catches. To use this feature, simply
              select the specific month and year you wish to predict. This
              selection focuses the analysis on relevant historical data,
              enabling the heatmap to display the density of squid catches
              during that time period. Warmer colors on the heatmap indicate
              higher concentrations of squid, helping you quickly identify
              hotspots for fishing and make informed decisions about where to
              target your efforts.
            </p>
            <button
              className="myButton"
              onClick={() => (window.location.href = "/heatmap")}
            >
              Go to Heatmap
            </button>
          </div>

          <div className="feature-box">
            {/* Graph Feature */}
            <h3>Graph</h3>
            <p>
              The graph feature is an essential tool for visualizing squid
              abundance, enabling users to analyze trends and patterns in squid
              catches over time. To utilize this feature, simply select the
              specific month and year for which you want to generate predictions.
              This selection allows the graph to focus on pertinent historical
              data, displaying the changes in squid abundance during that
              timeframe. The graph will illustrate the fluctuations in squid
              catches, making it easier to identify trends and make informed
              decisions about fishing strategies.
            </p>
            <button
              className="myButton"
              onClick={() => (window.location.href = "/graph")}
            >
              Go to Graph
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;