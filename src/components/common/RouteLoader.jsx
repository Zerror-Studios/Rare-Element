import { useRouteLoaderStore } from "@/store/useRouteLoader-store";
import React from "react";

const RouteLoader = () => {
  const isLoading = useRouteLoaderStore((s) => s.isLoading);

  return (
    <div
      className={`routeloader_parent center ${
        isLoading ? "is-visible" : ""
      }`}
      aria-hidden={!isLoading}
    >
      <div className="loader_img">
        <img src="/green_logo.svg" alt="Logo"/>
      </div>
    </div>
  );
};

export default RouteLoader;
