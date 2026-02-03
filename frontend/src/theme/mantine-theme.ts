import { createTheme, type MantineTheme } from '@mantine/core';

export const mantineTheme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 6 },
  colors: {
    brand: [
      '#EFF6FF',
      '#DBEAFE',
      '#BFDBFE',
      '#93C5FD',
      '#60A5FA',
      '#3B82F6',
      '#2563EB',
      '#1D4ED8',
      '#1E40AF',
      '#1E3A8A',
    ],
  },
  fontFamily:
    'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily:
      'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  },
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        color: 'brand',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
      styles: (_theme: MantineTheme) => ({
        label: {
          color: '#374151',
          fontWeight: 600,
        },
      }),
    },
    PasswordInput: {
      defaultProps: {
        radius: 'md',
      },
      styles: (_theme: MantineTheme) => ({
        label: {
          color: '#374151',
          fontWeight: 600,
        },
      }),
    },
    Paper: {
      defaultProps: {
        radius: 'lg',
        p: 'xl',
        withBorder: true,
      },
    },
    Title: {
      styles: (_theme: MantineTheme) => ({
        root: {
          color: '#111827',
          fontWeight: 700,
        },
      }),
    },
  },
});
