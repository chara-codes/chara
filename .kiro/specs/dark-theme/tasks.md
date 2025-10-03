# Implementation Plan

- [x] 1. Create theme store with state management
  - Create `packages/frontend/core/src/stores/theme-store.ts` with Zustand store
  - Implement theme state ('light' | 'dark')
  - Add setTheme and toggleTheme actions
  - Configure localStorage persistence with 'app-theme-storage' key
  - Add devtools middleware for debugging
  - Export store from `packages/frontend/core/src/stores/index.ts`
  - _Requirements: 1.2, 1.3, 1.4, 4.4_

- [x] 2. Define dark theme color palette
  - Modify `packages/frontend/design-system/src/theme/theme.tsx`
  - Create `darkTheme` object with dark color palette
  - Define background colors (#1a1a1a, #2a2a2a, #333333)
  - Define text colors (#e5e5e5, #a0a0a0, #808080) with WCAG AA contrast
  - Define border colors (#404040, #505050)
  - Adjust shadow values for dark backgrounds
  - Add theme transition property (300ms ease-in-out)
  - Keep existing `theme` as `lightTheme`
  - Export both `lightTheme` and `darkTheme`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Create theme provider component
  - Create `packages/frontend/design-system/src/theme/theme-provider.tsx`
  - Implement AppThemeProvider component that subscribes to theme store
  - Select appropriate theme object (lightTheme or darkTheme) based on store state
  - Wrap children with styled-components ThemeProvider
  - Apply global styles for CSS transitions
  - Export from `packages/frontend/design-system/src/theme/index.ts`
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_

- [x] 4. Create theme toggle component
  - Create `packages/frontend/design-system/src/molecules/theme-toggle.tsx`
  - Implement toggle switch UI component
  - Connect to theme store (useThemeStore)
  - Add click handler to toggle theme
  - Display current theme state visually
  - Add ARIA labels for accessibility
  - Style with smooth transitions
  - Export from `packages/frontend/design-system/src/molecules/index.ts`
  - _Requirements: 1.1, 3.3, 5.4_

- [x] 5. Integrate theme toggle into settings view
  - Modify `packages/frontend/design-system/src/organisms/settings-view.tsx`
  - Update the "theme" setting item control to use ThemeToggle component
  - Remove placeholder toggle div
  - Ensure toggle reflects current theme state
  - Test immediate visual feedback on theme change
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 6. Update application root to use theme provider
  - Identify main application entry point/root component
  - Wrap application with AppThemeProvider
  - Ensure ThemeProvider is above all UI components
  - Verify theme context is available throughout component tree
  - _Requirements: 4.1, 6.4_

- [x] 7. Update existing styled components to use theme values
  - Review `packages/frontend/design-system/src/organisms/settings-view.tsx`
  - Replace hardcoded color values with theme properties
  - Update SettingsContainer, SettingsGroup, SettingItem, etc.
  - Ensure all components use `props.theme.colors.*` for colors
  - Verify components re-render correctly on theme change
  - _Requirements: 1.5, 6.3, 6.4_

- [ ] 8. Add error handling and fallbacks
  - Add try-catch for localStorage operations in theme store
  - Implement fallback to in-memory state if localStorage fails
  - Add theme value validation on load
  - Default to 'light' theme if invalid value found
  - Add console warnings for errors
  - _Requirements: 1.4_

- [ ]* 9. Write unit tests for theme functionality
  - Create `packages/frontend/core/src/stores/__tests__/theme-store.test.ts`
  - Test theme switching (setTheme, toggleTheme)
  - Test localStorage persistence
  - Test default theme selection
  - Create `packages/frontend/design-system/src/molecules/__tests__/theme-toggle.test.tsx`
  - Test toggle component interactions
  - Test accessibility attributes
  - _Requirements: All_

- [ ]* 10. Verify WCAG AA color contrast compliance
  - Test dark theme text/background contrast ratios
  - Verify primary text meets 4.5:1 ratio
  - Verify large text meets 3:1 ratio
  - Test focus indicators visibility in both themes
  - Document any contrast issues and adjustments
  - _Requirements: 2.2_
