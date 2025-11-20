import React, { useRef, useState } from "react";
import Footer from "../common/Footer";
import Header from "../common/Header";
import MobileHeader from "../common/MobileHeader";
import CartBag from "../common/CartBag";
const Layout = ({ children }) => {
  const [openCartBag, setOpenCartBag] = useState(false)
  const overlayRef = useRef()

  return (
    <>
      <div ref={overlayRef} className="header_overlay scroller_none" />

      <CartBag
        openCartBag={openCartBag}
        setOpenCartBag={setOpenCartBag}
        headerOverlayRef={overlayRef}
      />

      <Header setOpenCartBag={setOpenCartBag} />
      <MobileHeader setOpenCartBag={setOpenCartBag} />

      {children}
      <Footer />
    </>
  );
};

export default Layout;
