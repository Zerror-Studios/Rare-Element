import React, { useEffect } from "react";
import gsap from "gsap";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@apollo/client/react";
import { CREATE_CONTACT_FORM } from "@/graphql";
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
  const [createContact, { loading }] = useMutation(CREATE_CONTACT_FORM);

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
      const { data: response } = await createContact({ variables: { input } });
      const message = response?.createContact || {};
      if (message) {
        toast.success(message);
        reset();
      } else {
        toast.error("Failed to submit the form.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to submitted contact form");
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
            <GreenBoxBtn title="submit" />
          </div>

        </form>
      </div>
    </div>
  );
};

export default ContactForm;