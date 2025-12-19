import React, { useEffect, useState } from "react";
import AccountAside from "../account/AccountAside";
import { usePathname } from "next/navigation";

const AccountLayout = ({ children }) => {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth < 750);

    checkWidth();
    window.addEventListener("resize", checkWidth);

    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const shouldShowAside =
    !isMobile || (isMobile && pathname === "/account"); 

    return (
    <div className="account_wrapper">
      {shouldShowAside && (
        <div className="settings__left">
          <AccountAside />
        </div>
      )}
      {children}
    </div>
  );
};

export default AccountLayout;
