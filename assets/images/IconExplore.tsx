import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

export function IconExplore(props: SvgProps) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 30 30"
      fill="none"
      {...props}
    >
      <Path
        d="M13.125 22.5C18.3032 22.5 22.5 18.3032 22.5 13.125C22.5 7.94683 18.3032 3.75 13.125 3.75C7.94683 3.75 3.75 7.94683 3.75 13.125C3.75 18.3032 7.94683 22.5 13.125 22.5Z"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.8047 19.8047L26.2547 26.2547"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default IconExplore;
