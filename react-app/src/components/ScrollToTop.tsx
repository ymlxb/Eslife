import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Try to find the main content area. 
    // Adjust selector based on your layout (e.g., .ant-layout-content, .el-main, or window)
    const elMain = document.querySelector(".ant-layout-content") || document.querySelector(".el-main") || document.querySelector("main") || window;
    
    elMain.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [pathname]);

  return null;
}
