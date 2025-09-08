import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

export function IconHome(props: SvgProps) {
  return (
    <Svg
      width={30}
      height={30}
      viewBox="0 0 30 30"
      fill="none"
      {...props}
    >
      <Path
        d="M25.5 12.8572L15 4.28577L4.5 12.8572V25.7143C4.5 26.3259 4.74364 26.9121 5.17873 27.3472C5.61381 27.7823 6.20001 28.0259 6.81165 28.0259H23.1883C23.8 28.0259 24.3862 27.7823 24.8213 27.3472C25.2564 26.9121 25.5 26.3259 25.5 25.7143V12.8572Z"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11.25 28.0259V16.1687H18.75V28.0259"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default IconHome;
