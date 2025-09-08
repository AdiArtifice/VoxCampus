import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

export function IconComment(props: SvgProps) {
  return (
    <Svg
      width={30}
      height={30}
      viewBox="0 0 30 30"
      fill="none"
      {...props}
    >
      <Path
        d="M26.25 14.0625C26.2515 15.6846 25.8746 17.2845 25.1484 18.75C24.2951 20.4761 22.9912 21.9363 21.3726 22.9895C19.7541 24.0426 17.8855 24.6505 15.9703 24.75C14.3482 24.7515 12.7483 24.3746 11.2828 23.6484L3.75 26.25L6.35156 18.7172C5.62537 17.2517 5.24855 15.6518 5.25 14.0297C5.34949 12.1145 5.95738 10.2459 7.01054 8.62736C8.0637 7.00882 9.52393 5.70492 11.25 4.85156C12.7155 4.12537 14.3154 3.74855 15.9375 3.75H16.875C19.4289 3.89062 21.8405 4.89551 23.6935 6.60649C25.5465 8.31747 26.6093 10.6711 26.25 13.125V14.0625Z"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default IconComment;
