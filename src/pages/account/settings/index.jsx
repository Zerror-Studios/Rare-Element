import React from 'react'
import dynamic from 'next/dynamic'
import SeoHeader from '@/components/seo/SeoHeader'
import AccountLayout from '@/components/layouts/AccountLayout'
import AccountBreadcrumb from '@/components/account/AccountBreadcrumb'
const ProfileDetails = dynamic(() => import("@/components/account/settings/ProfileDetails"), { ssr: false });
const AddressBlock = dynamic(() => import("@/components/account/settings/AddressBlock"), { ssr: false });
const EmailPreference = dynamic(() => import("@/components/account/settings/EmailPreference"), { ssr: false });
const ChangePassword = dynamic(() => import("@/components/account/settings/ChangePassword"), { ssr: false });

const Settings = ({ meta }) => {
  return (
    <>
      <SeoHeader meta={meta} />
      <AccountLayout>
        <AccountBreadcrumb title={"Setting"} />
        <div className="settings__content">
          <h2 className="settings__title text-xl">Settings</h2>
          <div className="settings__sections text-base">
            <ProfileDetails />
            <AddressBlock />
            <EmailPreference />
            <ChangePassword />
          </div>
        </div>
      </AccountLayout>

    </>
  )
}

export default Settings

export async function getStaticProps() {
  const meta = {
    title: "Account Settings | Manage Profile & Preferences – Nahara",
    description:
      "Update your profile details, addresses, and communication preferences securely within your Nahara account.",
    keywords: [
      "account settings",
      "profile update",
      "edit account",
      "Nahara settings"
    ],
    primaryKeywords: ["account settings", "profile"],
    author: "Nahara",
    robots: "noindex,nofollow",
    og: {
      title: "Account Settings | Nahara",
      description:
        "Manage your personal information and preferences at Nahara.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Account Settings | Nahara",
      description:
        "Update your Nahara account profile and preferences.",
    }
  };

  return { props: { meta } };
}
