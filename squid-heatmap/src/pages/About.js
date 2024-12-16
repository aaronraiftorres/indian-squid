import React, { useEffect } from 'react';
import './about.css';

function About() {
  useEffect(() => {
    const cards = document.querySelectorAll('.card');

    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        card.classList.add('hovered');
      });
      card.addEventListener('mouseleave', () => {
        card.classList.remove('hovered');
      });
      card.addEventListener('click', () => {
        card.classList.toggle('clicked');
      });
    });

    return () => {
      cards.forEach((card) => {
        card.removeEventListener('mouseenter', () => {
          card.classList.add('hovered');
        });
        card.removeEventListener('mouseleave', () => {
          card.classList.remove('hovered');
        });
        card.removeEventListener('click', () => {
          card.classList.toggle('clicked');
        });
      });
    };
  }, []);

  return (
    <div className="about-container">
      <div className="about-text">
        <h2>Abstract</h2>
        <p>
          This system leverages advanced machine learning techniques and 
          geospatial data to provide insights into the behavior and 
          population dynamics of squid in the Iloilo Sea. By employing 
          an LSTM model, it can predict future trends and movements, 
          aiding in the sustainable management of marine resources.
        </p>
      </div>

      <div className="authors-section">
        <h2>Authors</h2>
        <p>
          Lokus is developed by B.S. in Computer Science students at West 
          Visayas State University for their Undergraduate Thesis.
        </p>
        <div className="authors-container">
          <div className="card">
            <img src='/assets/rigi.png' alt="regie" />
            <div>Regie</div>
          </div>
          <div className="card">
            <img src='/assets/Kyla.png' alt="Kyla" />
            <div>Kyla</div>
          </div>
          <div className="card">
            <img src='/assets/journ.png' alt="journ" />
            <div>Journ</div>
          </div>
          <div className="card">
            <img src='/assets/iron.jpg' alt="aaron" />
            <div>Aaron</div>
          </div>
        </div>
      </div>

      <div className="special-thanks">
        <h2>Special Thanks To</h2>
        <p>
          <strong>Mr. John Christopher Mateo</strong> - Thesis Adviser
        </p>
        <p>
          <strong>Mrs. Gency</strong> - For her expertise in Uroteuthis Duvaucelii (Indian Squid)
        </p>
      </div>

      <div className="authorship">
        <h2>Authorship Acknowledgement</h2>
        <p>
          This segment is excerpted from an undergraduate research paper <br></br>
          authored by <strong>Gallena, Rapita, Sermonia, and Torres</strong> at <br></br>
          West Visayas State University - College of Information and 
          Communications Technology. <br></br>All rights are reserved.
          <div className="logos-section"> {/* New section for logos */}
            <img src="/assets/logoo1.png" alt="Logo 1" className="bottom-logo" />
            <img src="/assets/logoo2.png" alt="Logo 2" className="bottom-logo" />
          </div>
        </p>
        
      </div>
    </div>
  );
}

export default About;
