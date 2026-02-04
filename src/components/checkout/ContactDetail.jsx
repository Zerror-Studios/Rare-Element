import React from 'react'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import { useAuthStore } from "@/store/auth-store";
import { EmailSubscribedStatus } from "@/utils/Constant";
import Checkbox from '../ui/Checkbox';

const ContactDetail = ({ register, setValue, watch, errors }) => {
    const { isLoggedIn } = useAuthStore((state) => state);
    const isSubscribed = watch("emailSubscribedStatus") === EmailSubscribedStatus.SUBSCRIBED;
    return (
        <>
            <div className="checkout_user_details">
                <div className="checkout_user_detailsHeader">
                    <p className="checkout_subHeading text-lg uppercase">Email</p>
                    {!isLoggedIn &&
                        <Link scroll={false} href="/login">
                            <div className="settings__link">
                                <p className="underline uppercase text-base">Login</p>
                            </div>
                        </Link>
                    }
                </div>
                <Input
                    type="email"
                    placeholder="Email"
                    error={errors?.email}
                    {...register("email")}
                />
                <Checkbox
                    label="Email me with news and offers"
                    checked={isSubscribed}
                    onChange={(e) =>
                        setValue(
                            "emailSubscribedStatus",
                            e.target.checked
                                ? EmailSubscribedStatus.SUBSCRIBED
                                : EmailSubscribedStatus.UNSUBSCRIBED,
                            { shouldDirty: true } // important for RHF
                        )
                    }
                />
            </div>
        </>
    )
}

export default ContactDetail