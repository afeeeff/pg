// src/theme.js
import { extendTheme } from '@chakra-ui/react';

// 1. Define your custom fonts
// For Google Fonts, you'd typically link them in your public/index.html
// or import them via CSS @import. Here we just define the family name.
const fonts = {
  heading: `'Poppins', sans-serif`, // A modern, friendly sans-serif font
  body: `'Inter', sans-serif`,     // A clean and highly readable body font
};

// 2. Define your color palette
const colors = {
  brand: {
    50: "#e6f8fa",
    100: "#b3e9f2",
    200: "#80daea",
    300: "#4dccdc",
    400: "#1ac2d4",
    500: "#00b2c6", // Primary brand color
    600: "#008c99",
    700: "#00666c",
    800: "#004045",
    900: "#001a1c",
  },
  accent: {
    500: "#FF6B6B", // A vibrant accent color
  },
  dark: "#1A202C", // Dark mode background or text color
  light: "#F7FAFC", // Light mode background or text color
};

// 3. Define global styles and component specific styles
const styles = {
  global: (props) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'dark' : 'light',
      color: props.colorMode === 'dark' ? 'whiteAlpha.900' : 'gray.800',
      lineHeight: 'base',
      scrollBehavior: 'smooth',
    },
    'html, body, #root': {
      height: '100%',
    },
    '#root': {
      display: 'flex',
      flexDirection: 'column',
    },
    // Custom scrollbar for a sleek look
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '::-webkit-scrollbar-track': {
      background: 'rgba(0,0,0,0.1)',
      borderRadius: '10px',
    },
    '::-webkit-scrollbar-thumb': {
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '10px',
      '&:hover': {
        background: 'rgba(0,0,0,0.5)',
      },
    },
  }),
  
};

// 4. Configure components (optional, but good for consistent styles)
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'bold',
      borderRadius: 'md',
      transition: 'all 0.2s ease-in-out',
      _hover: {
        transform: 'translateY(-2px)',
        boxShadow: 'lg',
      },
    },
    variants: {
      solid: (props) => ({
        bg: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        color: 'white',
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.600' : `${props.colorScheme}.600`,
        },
        _active: {
          bg: props.colorScheme === 'brand' ? 'brand.700' : `${props.colorScheme}.700`,
        },
      }),
      outline: (props) => ({
        borderColor: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        color: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.50' : `${props.colorScheme}.50`,
        },
      }),
    },
  },
  Input: {
    variants: {
      outline: {
        field: {
          borderColor: 'gray.300',
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
      },
    },
  },
  Textarea: {
    variants: {
      outline: {
        borderColor: 'gray.300',
        _focus: {
          borderColor: 'brand.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
        },
      },
    },
  },
  Select: {
    variants: {
      outline: {
        field: {
          borderColor: 'gray.300',
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
      },
    },
  },
  Link: {
    baseStyle: {
      color: 'brand.500',
      _hover: {
        textDecoration: 'underline',
        color: 'brand.600',
      },
    },
  },
};

const theme = extendTheme({
  fonts,
  colors,
  styles,
  components,
  // Custom transitions
  transition: {
    property: {
      common: 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
      colors: 'background-color, border-color, color, fill, stroke',
      dimensions: 'width, height',
      position: 'left, right, top, bottom',
      spacing: 'margin, padding',
      transform: 'transform',
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    duration: {
      'ultra-fast': '50ms',
      'fast': '100ms',
      'normal': '200ms',
      'slow': '400ms',
      'ultra-slow': '600ms',
    },
  },
});


export default theme;