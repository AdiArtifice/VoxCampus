import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

export function IconAssociations(props: SvgProps) {
  return (
    <Svg
      width={30}
      height={30}
      viewBox="0 0 30 30"
      fill="none"
      {...props}
    >
      <Path
        d="M15 26.25V22.5"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M26.25 26.25V18.75C26.25 17.7554 25.8549 16.8016 25.1517 16.0983C24.4484 15.3951 23.4946 15 22.5 15H7.5C6.50544 15 5.55161 15.3951 4.84835 16.0983C4.14509 16.8016 3.75 17.7554 3.75 18.75V26.25"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 15C18.4518 15 21.25 12.2018 21.25 8.75C21.25 5.29822 18.4518 2.5 15 2.5C11.5482 2.5 8.75 5.29822 8.75 8.75C8.75 12.2018 11.5482 15 15 15Z"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default IconAssociations;
