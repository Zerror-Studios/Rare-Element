import React, { useEffect } from "react";
import gsap from "gsap";
import GreenBoxBtn from "../buttons/GreenBoxBtn";

const ContactForm = () => {


  useEffect(() => {
    // Handle input focus and blur
    document.querySelectorAll("#right form .input").forEach((i) => {
      const input = i.querySelector("input");
      input.addEventListener("focus", () => {
        i.classList.add("label_active");
      });
      input.addEventListener("blur", function () {
        if (this.value === "") {
          i.classList.remove("label_active");
        }
      });
    });

    // Handle textarea focus and blur
    document.querySelectorAll("#right form .textarea").forEach((i) => {
      const textarea = i.querySelector("textarea");
      textarea.addEventListener("focus", () => {
        i.classList.add("label_active");
      });
      textarea.addEventListener("blur", function () {
        if (this.value === "") {
          i.classList.remove("label_active");
        }
      });
    });

    // Handle line animation
    document.querySelectorAll(".lineanime").forEach((i) => {
      i.addEventListener("mouseenter", () => {
        gsap.to(i.querySelector(".linei"), {
          scaleX: 1,
          duration: 0.3,
          ease: "power1.out",
        });
      });

      i.addEventListener("mouseleave", () => {
        gsap.set(i.querySelector(".linei"), { transformOrigin: "right" });
        gsap.to(i.querySelector(".linei"), {
          scaleX: 0,
          duration: 0.3,
          ease: "power1.in",
          onComplete: () => {
            gsap.set(i.querySelector(".linei"), { transformOrigin: "left" });
          },
        });
      });
    });
  }, []);

  return (
    <div id="form">
      <div id="left"></div>
      <div id="right" className="text-base">
        <form >
          <div className="input lineanime">
            <input type="text" className="text-base" />
            <p className="text-sm">name*</p>
            <div className="linei"></div>
          </div>

          <div className="input lineanime">
            <input type="text" className="text-base" />
            <p className="text-sm">email*</p>
            <div className="linei"></div>
          </div>

          <div className="input lineanime">
            <input type="text" className="text-base" />
            <p className="text-sm">topic*</p>
            <div className="linei"></div>
          </div>

          <div className="input lineanime">
            <input type="number" className="text-base" />
            <p className="text-sm">phone number*</p>
            <div className="linei"></div>
          </div>

          <div className="textarea lineanime">
            <p className="text-sm">message*</p>
            <div className="linei"></div>
            <textarea className="text-base" />
          </div>
          <div className="submit_form_btn_paren">
             <GreenBoxBtn text="submit" />
          </div>

        </form>
      </div>
    </div>
  );
};

export default ContactForm;
