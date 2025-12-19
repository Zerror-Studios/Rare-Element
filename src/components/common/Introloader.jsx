import gsap from "gsap";
import React, { useEffect } from "react";

const Introloader = () => {
  useEffect(() => {
    const handleLoad = () => {
      gsap.to(".introloader_paren", {
        opacity: 0,
        duration: .5,
        delay:1,
        ease: "power3.out",
        onComplete: () => {
          gsap.set(".introloader_paren", { display: "none" });
        },
      });
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }

    return () => {
      window.removeEventListener("load", handleLoad);
    };
  }, []);

  return (
    <div className="introloader_paren center">
      <img src="/green_logo.svg" alt="Logo" />

      <div className="intro_loaderparen">
        <span className="intro_loader"></span>
      </div>
    </div>
  );
};

export default Introloader;
