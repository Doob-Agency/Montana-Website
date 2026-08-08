/* eslint-disable import/no-anonymous-default-export */
import { Swiper, SwiperSlide } from "swiper/react";
/**
 * Swiper's stylesheet belongs with the component that needs it, not with
 * whichever page happened to import it first. It used to be pulled in by the
 * homepage, so rebuilding that page silently unstyled every carousel on the
 * site — slides stacked vertically and the cart page grew to 60,000px tall.
 */
import "swiper/css/bundle";
import {
  Autoplay,
  Navigation,
  Pagination,
  Scrollbar,
  A11y,
} from "swiper/modules";

const defaultConfig = {};
defaultConfig.modules = [Autoplay, A11y, Scrollbar, Pagination, Navigation];
defaultConfig.navigation = true;
defaultConfig.spaceBetween = 28;
defaultConfig.slidesPerView = "auto";
defaultConfig.autoplay = false && {
  delay: 1500,
  pauseOnMouseEnter: true,
};
defaultConfig.scrollbar = {
  snapOnRelease: true,
  draggable: true,
};

export default function ({ customConfig, innerItems }) {
  const config = {},
    innerNodes = innerItems.map(swiperSlide);

  Object.assign(config, defaultConfig);
  !!customConfig && Object.assign(config, customConfig);
  return <Swiper {...config}>{innerNodes}</Swiper>;
}

function swiperSlide(Children, I) {
  return <SwiperSlide key={I}>{Children}</SwiperSlide>;
}
