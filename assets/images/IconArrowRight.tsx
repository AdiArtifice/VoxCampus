import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

export function IconArrowRight(props: SvgProps) {
  return (
    <Svg
      width={57}
      height={24}
      viewBox="0 0 57 24"
      fill="none"
      {...props}
    >
      <Path
        d="M2 12H54.5M54.5 12L44.5 2M54.5 12L44.5 22"
        stroke={props.color || "#FFFFFF"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default IconArrowRight;
