import React, { useLayoutEffect, useState } from "react";
import gsap from "gsap";
import GreenBoxBtn from '@/components/buttons/GreenBoxBtn';

const EmailPreference = () => {
  const [isEdit, setIsEdit] = useState(false);

  useLayoutEffect(() => {
    if (isEdit) {
      gsap.to(".subscription_form_paren", { height: "auto", duration: 0.5, ease: "power2.out" })
    } else {
      gsap.to(".subscription_form_paren", { height: "0vh",  duration: 0.5, ease: "power2.out" })
    }
  }, [isEdit])

  return (
    <>
      <div className="checkout_thin_line"></div>
      <div className="settings__block">
        <div>
          <p>Newsletter Subscription - {"Not Subscribed"}</p>
          <p>Direct Mail Marketing - {"Not Subscribed"}</p>
        </div>
        {!isEdit && (
          <div onClick={() => setIsEdit(true)} className="settings__link">
            <p>Edit Subscription</p>
          </div>
        )}
        <div className="subscription_form_paren">
          <div className="subscription_div">
            <p> Newsletter</p>
            <div className="subscription_btn_paren">
              {/* 
              {
                user.subscriptions.newsletter === "Subscribed" ?
                  <button className='subscribe_btn'>
                    <p className='text-xs'>
                      Remove
                    </p>
                  </button>
                  : */}
              <button className='unSubscribe_btn'>
                <p className='text-xs'>
                  Add
                </p>
              </button>
              {/* } */}
            </div>
          </div>
          <div className="subscription_div">
            <p> Direct Mail Marketing</p>
            <div className="subscription_btn_paren">

              {/* {
                user.subscriptions.directMail === "Subscribed" ?
                  <button className='subscribe_btn'>
                    <p className='text-xs'>
                      remove
                    </p>
                  </button>
                  : */}
              <button className='unSubscribe_btn'>
                <p className='text-xs'>
                  add
                </p>
              </button>
              {/* } */}
            </div>
          </div>

          <div className="settings_btn">

            <GreenBoxBtn title='Save' />

            <button onClick={() => setIsEdit(false)} className='cancel_form_btn'>
              <p>
                Cancel
              </p>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default EmailPreference