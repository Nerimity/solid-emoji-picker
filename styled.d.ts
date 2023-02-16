// import original module declarations
import "solid-styled-components";

// and extend them!
declare module "solid-styled-components" {
  export interface DefaultTheme {
    primary: string;
  }
}