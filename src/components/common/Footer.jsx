import React from 'react';

const Footer = () => {
  return (
    <div className="footer_classname_wrapper">
      <div className="footer_classname_container">
        {/* Secure Payment Section */}
        <div className="footer_classname_features">
          {[1, 2, 3, 4].map((item, i) => (
            <div key={i} className="footer_classname_featureCard">
              <img src="/icons/lock.svg" alt="Feature Icon" />
              <p className="footer_classname_featureTitle  uppercase">Secure Payment</p>
              <p className="footer_classname_featureDesc">
                Your payments are protected with top-grade security and encryption.
              </p>
            </div>
          ))}
        </div>

        {/* Footer Links Section */}
        <div className="footer_classname_linksGrid">
          <div className="footer_classname_about">
            <p className='text-lg'>
              Rare Element is where timeless design meets modern craftsmanship — every piece a statement of individuality.
            </p>
          </div>

          <div className="footer_classname_column">
            <p className="footer_classname_heading">Category</p>
            <ul>
              <li>Rings</li>
              <li>Earrings</li>
              <li>Bracelet</li>
              <li>Necklace</li>
              <li>Anklets</li>
            </ul>
          </div>

          <div className="footer_classname_column">
            <p className="footer_classname_heading">Brand</p>
            <ul>
              <li>Home</li>
              <li>Shop</li>
              <li>About Rare Element</li>
            </ul>
          </div>

          <div className="footer_classname_column">
            <p className="footer_classname_heading">Support</p>
            <ul>
              <li>Shipping & Returns</li>
              <li>FAQs</li>
              <li>Care Guide</li>
            </ul>
          </div>

          <div className="footer_classname_column">
            <p className="footer_classname_heading">Contact Us</p>
            <ul>
              <li>hello@rareelement.in</li>
              <li>Instagram</li>
              <li>WhatsApp</li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Section */}
        <div className="footer_classname_bottom">
          <img className='footer_logo' src="/logo.svg" alt="Rare Element Logo" />
          <p className='uppercase'>© 2025 Rare Element. All rights reserved. Crafted in India with timeless artistry.</p>
        </div>
      </div>
    </div>
  );
};

export default Footer;
