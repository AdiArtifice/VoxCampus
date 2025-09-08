import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

export function IconLike(props: SvgProps) {
  return (
    <Svg
      width={30}
      height={30}
      viewBox="0 0 30 30"
      fill="none"
      {...props}
    >
      <Path
        d="M8.75 12.5H4.375C3.75 12.5 3.125 13.125 3.125 13.75V25C3.125 25.625 3.75 26.25 4.375 26.25H8.75C9.375 26.25 10 25.625 10 25V13.75C10 13.125 9.375 12.5 8.75 12.5Z"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 13.75L15.625 5.625C16.4375 4.8125 17.8125 4.6875 18.75 5.3125C19.6875 5.9375 20 7.1875 19.6875 8.125L18.125 12.5H24.375C25 12.5 25.625 12.8125 25.9375 13.125C26.25 13.4375 26.5625 14.0625 26.5625 14.6875L25 23.4375C24.6875 25 23.4375 26.25 21.875 26.25H13.125C12.5 26.25 11.875 26.25 11.25 26.25H10"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default IconLike;
