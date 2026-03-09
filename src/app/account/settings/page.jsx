import AccountBreadcrumb from '@/components/account/AccountBreadcrumb'
import SettingsClient from './settings-client';

export const metadata = {
  title: "Account Settings | Manage Profile & Preferences – Nahara",
  description: "Update your profile details, addresses, and communication preferences securely within your Nahara account.",
  keywords: ["account settings", "profile update", "edit account", "Nahara settings"],
  robots: "noindex,nofollow",
};

export default function Page() {
  return (
    <>
      <AccountBreadcrumb title={"Setting"} />
      <div className="settings__content">
        <h1 className="settings__title text-xl">Settings</h1>
        <SettingsClient />
      </div>
    </>
  )
}
