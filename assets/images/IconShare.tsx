import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

export function IconShare(props: SvgProps) {
  return (
    <Svg
      width={30}
      height={30}
      viewBox="0 0 30 30"
      fill="none"
      {...props}
    >
      <Path
        d="M22.5 10C24.5711 10 26.25 8.32107 26.25 6.25C26.25 4.17893 24.5711 2.5 22.5 2.5C20.4289 2.5 18.75 4.17893 18.75 6.25C18.75 8.32107 20.4289 10 22.5 10Z"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.5 18.75C9.57107 18.75 11.25 17.0711 11.25 15C11.25 12.9289 9.57107 11.25 7.5 11.25C5.42893 11.25 3.75 12.9289 3.75 15C3.75 17.0711 5.42893 18.75 7.5 18.75Z"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22.5 27.5C24.5711 27.5 26.25 25.8211 26.25 23.75C26.25 21.6789 24.5711 20 22.5 20C20.4289 20 18.75 21.6789 18.75 23.75C18.75 25.8211 20.4289 27.5 22.5 27.5Z"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.8984 16.7188L19.1016 22.0312"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.1016 7.96875L10.8984 13.2812"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default IconShare;
