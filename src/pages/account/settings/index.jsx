import AccountLeftSlide from '@/components/account/AccountLeftSlide'
import AddressForm from '@/components/forms/AddressForm'
import DetailsForm from '@/components/forms/DetailsForm'
import PasswordForm from '@/components/forms/PasswordForm'
import SubscriptionForm from '@/components/forms/SubscriptionForm'
import { RiArrowRightSLine, RiCheckLine } from '@remixicon/react'
import Link from 'next/link'
import React, { useState } from 'react'

const user = {
    email: "tiwarirohit159@gmail.com",
    phone: "+91 7039446638",
    name: "Rohit Tiwari",
    dob: "21/10/2000",
    address: {
        line1: "Sayba Emerald, Station Road, Bandra West A/503, Near Burger King",
        line2: "400050, Mumbai",
        country: "India",
    },
    subscriptions: {
        newsletter: "Not subscribed",
        directMail: "Subscribed",
    },
}

const Settings = () => {
    const [expandDetailForm, setExpandDetailForm] = useState(false)
    const [expandAddressForm, setExpandAddressForm] = useState(false)
    const [expandPasswordForm, setExpandPasswordForm] = useState(false)
    const [expandSubscribeForm, setExpandSubscribeForm] = useState(false)

    return (
        <div className="settings">
            <div className="settings__left">
                <AccountLeftSlide />
            </div>

            <div className="settings__breadcrumb">
                <Link href={"/account"}>
                    <p className="settings__breadcrumb_faded text-sm">Account</p>
                </Link>
                <RiArrowRightSLine size={14} />
                <p className='text-sm'>Settings</p>
            </div>

            <div className="settings__content">
                <h2 className="settings__title text-xl">Settings</h2>

                <div className="settings__sections text-base">
                    {/* User details */}
                    <div className="checkout_thin_line"></div>
                    <div className="settings__block ">
                        <div>
                            <p>{user.email}</p>
                            <p>{user.phone}</p>
                            <p>{user.name}</p>
                            <p>{user.dob}</p>
                        </div>
                        {!expandDetailForm && (
                            <div onClick={() => setExpandDetailForm(true)} className="settings__link">
                                <p>Edit My details</p>
                            </div>
                        )}
                        <DetailsForm user={user} expandDetailForm={expandDetailForm} setExpandDetailForm={setExpandDetailForm} />
                    </div>

                    {/* Address */}
                    <div className="checkout_thin_line"></div>
                    <div className="settings__block ">
                        <div>
                            <p>{user.address.line1}</p>
                            <p>{user.address.line2}</p>
                            <p>{user.address.country}</p>
                        </div>
                        {!expandAddressForm && (
                            <div onClick={() => setExpandAddressForm(true)} className="settings__link">
                                <p>Edit Address</p>
                            </div>
                        )}
                        <AddressForm user={user} expandAddressForm={expandAddressForm} setExpandAddressForm={setExpandAddressForm} />
                    </div>

                    {/* Subscriptions */}
                    <div className="checkout_thin_line"></div>
                    <div className="settings__block">
                        <div>
                            <p>Newsletter Subscription - {user.subscriptions.newsletter}</p>
                            <p>Direct Mail Marketing - {user.subscriptions.directMail}</p>
                        </div>
                        {!expandSubscribeForm && (
                            <div onClick={() => setExpandSubscribeForm(true)} className="settings__link">
                                <p>Edit Subscription</p>
                            </div>
                        )}
                        <SubscriptionForm user={user} expandSubscribeForm={expandSubscribeForm} setExpandSubscribeForm={setExpandSubscribeForm} />

                    </div>

                    {/* Change Password */}
                    <div className="checkout_thin_line"></div>
                    <div className="settings__block ">
                        {expandPasswordForm && (
                            <p>Change Your Password </p>
                        )}
                        {!expandPasswordForm && (
                            <div onClick={() => setExpandPasswordForm(true)} className="settings__link">
                                <p>Change Password</p>
                            </div>
                        )}
                        <PasswordForm user={user} expandPasswordForm={expandPasswordForm} setExpandPasswordForm={setExpandPasswordForm} />
                    </div>

                    {/* Sign out */}
                    <div className="checkout_thin_line"></div>
                    <div className="settings__link">
                        <p>Sign out</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings
