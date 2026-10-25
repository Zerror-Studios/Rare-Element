"use client";

import dynamic from 'next/dynamic';

const ProfileDetails = dynamic(() => import("@/components/account/settings/ProfileDetails"), { ssr: false });
const AddressBlock = dynamic(() => import("@/components/account/settings/AddressBlock"), { ssr: false });
const EmailPreference = dynamic(() => import("@/components/account/settings/EmailPreference"), { ssr: false });
// Password change has no customer operation in the backend yet (contract
// doc §2), so the ChangePassword block is not shown.

export default function SettingsClient() {
  return (
    <div className="settings__sections text-base">
      <ProfileDetails />
      <AddressBlock />
      <EmailPreference />
    </div>
  );
}
