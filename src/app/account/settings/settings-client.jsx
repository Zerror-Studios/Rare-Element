"use client";

import dynamic from 'next/dynamic';

const ProfileDetails = dynamic(() => import("@/components/account/settings/ProfileDetails"), { ssr: false });
const AddressBlock = dynamic(() => import("@/components/account/settings/AddressBlock"), { ssr: false });
const EmailPreference = dynamic(() => import("@/components/account/settings/EmailPreference"), { ssr: false });
const ChangePassword = dynamic(() => import("@/components/account/settings/ChangePassword"), { ssr: false });

export default function SettingsClient() {
  return (
    <div className="settings__sections text-base">
      <ProfileDetails />
      <AddressBlock />
      <EmailPreference />
      <ChangePassword />
    </div>
  );
}
