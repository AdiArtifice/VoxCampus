import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

export function IconSave(props: SvgProps) {
  return (
    <Svg
      width={25}
      height={25}
      viewBox="0 0 25 25"
      fill="none"
      {...props}
    >
      <Path
        d="M19.7917 21.875L12.5 16.6667L5.20834 21.875V5.20833C5.20834 4.6558 5.42664 4.12589 5.81609 3.73644C6.20554 3.34699 6.73546 3.12869 7.29167 3.12869H17.7083C18.2646 3.12869 18.7945 3.34699 19.1839 3.73644C19.5734 4.12589 19.7917 4.6558 19.7917 5.20833V21.875Z"
        stroke={props.color || "#000000"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default IconSave;
