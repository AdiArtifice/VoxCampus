export const COLORS = {
  primary: '#4682B4', // SteelBlue
  secondary: '#FEAE01', // Golden Yellow
  white: '#FFFFFF',
  black: '#000000',
  gray: '#D9D9D9',
  lightGray: '#EDEDF0',
  background: '#FAFAFB',
  text: '#000000',
  textDark: '#333333', // Added for guest session modal
  error: '#C62828',
  success: '#1B5E20',
  darkBlue: '#1F6FEB',
  profileBlue: '#3B82F6'
};

// Use available fonts from the project
export const FONTS = {
  heading: 'Inter_400Regular',
  body: 'Inter_400Regular',
  stencil: 'Inter_400Regular',
  regular: 'Inter_400Regular',
  light: 'Inter_300Light',
  poppins: 'Poppins_300Light'
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  iconSm: 25,
  iconMd: 30,
  iconLg: 42,
  tabBarHeight: 71,
  headerHeight: 67,
  borderRadius: {
    sm: 5,
    md: 8,
    lg: 10
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
};

const theme = { COLORS, FONTS, SIZES, SPACING };

export default theme;
