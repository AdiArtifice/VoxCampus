import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

export function IconConnect(props: SvgProps) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 30 30"
      fill="none"
      {...props}
    >
      <Path
        d="M7.5 19.6875C9.57107 19.6875 11.25 18.0086 11.25 15.9375C11.25 13.8664 9.57107 12.1875 7.5 12.1875C5.42893 12.1875 3.75 13.8664 3.75 15.9375C3.75 18.0086 5.42893 19.6875 7.5 19.6875Z"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.625 28.125C22.6961 28.125 24.375 26.4461 24.375 24.375C24.375 22.3039 22.6961 20.625 20.625 20.625C18.5539 20.625 16.875 22.3039 16.875 24.375C16.875 26.4461 18.5539 28.125 20.625 28.125Z"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.625 9.375C22.6961 9.375 24.375 7.69607 24.375 5.625C24.375 3.55393 22.6961 1.875 20.625 1.875C18.5539 1.875 16.875 3.55393 16.875 5.625C16.875 7.69607 18.5539 9.375 20.625 9.375Z"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.6367 7.40625L10.4883 14.1562"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.4883 17.7188L17.6367 22.2938"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default IconConnect;
