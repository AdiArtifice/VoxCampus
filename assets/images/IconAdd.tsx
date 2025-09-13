import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

export function IconAdd(props: SvgProps) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 30 30"
      fill="none"
      {...props}
    >
      <Path
        d="M15 6.25V23.75"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.25 15H23.75"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default IconAdd;
