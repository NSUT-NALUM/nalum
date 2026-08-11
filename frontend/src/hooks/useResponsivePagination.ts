import { useState, useEffect } from "react";
export const useResponsivePagination = () => {
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    const calculateItemsPerPage = () => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Layout offsets (px)
      const headerHeight = 80;
      const searchBarHeight = 120;
      const paginationHeight = 80;
      const footerMargin = 40;

      const availableHeight =
        viewportHeight -
        headerHeight -
        searchBarHeight -
        paginationHeight -
        footerMargin;

      // Card dimensions (approx)
      const cardHeight = 240;
      const cardGap = 24;

      // Grid columns by breakpoint
      let columns = 1;
      if (viewportWidth >= 1024) {
        columns = 3;
      } else if (viewportWidth >= 768) {
        columns = 2;
      }

      const rows = Math.max(
        2,
        Math.floor((availableHeight + cardGap) / (cardHeight + cardGap))
      );

      const calculatedItems = rows * columns;

      // Clamp reasonable bounds
      const finalItems = Math.max(3, Math.min(calculatedItems, 50));

      setItemsPerPage(finalItems);
    };

    calculateItemsPerPage();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(calculateItemsPerPage, 200);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return itemsPerPage;
};
