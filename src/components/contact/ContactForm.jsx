"use client";

import React, { useEffect } from "react";
import gsap from "gsap";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@apollo/client/react";
import { SUBMIT_CONTACT_FORM } from "@/graphql";
import { getErrorMessage } from "@/utils/errors";
import GreenBoxBtn from "../buttons/GreenBoxBtn";

// Contact Form Validation
const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  subject: z.string().min(1, "Topic is required"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 10, {
      message: "Phone number must be exactly 10 digits",
    }),

  message: z.string().min(5, "Message must be at least 5 characters"),
});

const ContactForm = () => {
  const [submitContactForm, { loading }] = useMutation(SUBMIT_CONTACT_FORM);

  useEffect(() => {
    // SF-20: every listener is removed (and tweens killed) on unmount.
    const cleanups = [];
    const listen = (element, type, handler) => {
      element.addEventListener(type, handler);
      cleanups.push(() => element.removeEventListener(type, handler));
    };

    // Handle input and textarea focus and blur
    document
      .querySelectorAll("#right form .input, #right form .textarea")
      .forEach((i) => {
        const field = i.querySelector("input, textarea");
        if (!field) return;
        listen(field, "focus", () => {
          i.classList.add("label_active");
        });
        listen(field, "blur", () => {
          if (field.value === "") {
            i.classList.remove("label_active");
          }
        });
      });

    // Handle line animation
    document.querySelectorAll(".lineanime").forEach((i) => {
      const line = i.querySelector(".linei");
      if (!line) return;
      listen(i, "mouseenter", () => {
        gsap.to(line, {
          scaleX: 1,
          duration: 0.3,
          ease: "power1.out",
        });
      });

      listen(i, "mouseleave", () => {
        gsap.set(line, { transformOrigin: "right" });
        gsap.to(line, {
          scaleX: 0,
          duration: 0.3,
          ease: "power1.in",
          onComplete: () => {
            gsap.set(line, { transformOrigin: "left" });
          },
        });
      });
      cleanups.push(() => gsap.killTweensOf(line));
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data) => {
    try {
      const input = {
        ...data,
      };
      const { data: response } = await submitContactForm({ variables: { input } });
      if (response?.submitContactForm?._id) {
        toast.success("Thank you! We'll get back to you soon.");
        reset();
      } else {
        toast.error("Failed to submit the form.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit the contact form"));
    }
  };


  return (
    <div id="form">
      <div id="right" className="text-base">
        <div className="form_header">
          <p className='  uppercase '> get in touch </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="input lineanime">
            <input type="text" className="text-base" error={errors.name} {...register("name")} />
            <p className="text-sm">name*</p>
            <div className="linei"></div>
            {errors.name && (
              <span
                className="error-p"
                style={{ bottom: "-20px", marginTop: "5px" }}
              >
                {errors.name.message}
              </span>
            )}
          </div>

          <div className="input lineanime">
            <input type="email" className="text-base" error={errors.email} {...register("email")} />
            <p className="text-sm">email*</p>
            <div className="linei"></div>
            {errors.email && (
              <span
                className="error-p"
                style={{ bottom: "-20px", marginTop: "5px" }}
              >
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="input lineanime">
            <input type="text" className="text-base" error={errors.subject} {...register("subject")} />
            <p className="text-sm">topic*</p>
            <div className="linei"></div>
            {errors.subject && (
              <span
                className="error-p"
                style={{ bottom: "-20px", marginTop: "5px" }}
              >
                {errors.subject.message}
              </span>
            )}
          </div>

          <div className="input lineanime">
            <input type="number" className="text-base" error={errors.subject} {...register("phoneNumber")} />
            <p className="text-sm">phone number*</p>
            <div className="linei"></div>
            {errors.phoneNumber && (
              <span
                className="error-p"
                style={{ bottom: "-20px", marginTop: "5px" }}
              >
                {errors.phoneNumber.message}
              </span>
            )}
          </div>

          <div className="textarea lineanime">
            <p className="text-sm">message*</p>
            <div className="linei"></div>
            <textarea className="text-base" {...register("message")} />
            {errors.message && (
              <span className="error-p">{errors.message.message}</span>
            )}
          </div>
          <div className="submit_form_btn_paren">
            <GreenBoxBtn title="submit" loading={loading} />
          </div>

        </form>
      </div>
    </div>
  );
};

export default ContactForm;