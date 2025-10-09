# Loading System Implementation

This document outlines the comprehensive loading system implemented in the Human-in-the-Loop Web App.

## Components

### 1. LoadingComponents.tsx
Contains all reusable loading UI components:

- **LoadingSpinner**: Animated spinner with customizable size and text
- **LoadingPage**: Full-page loading screen
- **LoadingCard**: Card-based loading placeholder
- **LoadingDashboardStats**: Skeleton for dashboard statistics
- **LoadingTable**: Skeleton for table data
- **LoadingForm**: Skeleton for form elements
- **LoadingChart**: Skeleton for chart components
- **LoadingButton**: Button with loading state
- **LoadingOverlay**: Overlay loader for modals/dialogs
- **LoadingProgress**: Progress bar with percentage
- **LoadingInline**: Inline loading indicator

### 2. useLoading.ts Hook
Custom hook for managing loading states:

```typescript
const { loading, startLoading, stopLoading, withLoading } = useLoading({
  initialLoading: false,
  delay: 200,
  timeout: 5000
});
```

Features:
- Automatic loading state management
- Delay before showing loading (prevents flicker)
- Timeout for automatic loading stop
- `withLoading` wrapper for async operations

### 3. LazyComponents.tsx
React Suspense implementation for code splitting:

- Lazy loads all major components
- Provides loading fallbacks
- Improves initial bundle size
- Better performance through code splitting

### 4. LoadingContext.tsx
Global loading state management:

```typescript
const { isLoading, showLoading, hideLoading, withLoading } = useGlobalLoading();
```

### 5. LoadingProgressContext.tsx
Progress-based loading with visual feedback:

```typescript
const { progress, setProgress, isLoading, setIsLoading } = useLoadingProgress();
```

## Implementation Examples

### Basic Loading State
```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await submitData();
  } finally {
    setLoading(false);
  }
};

return (
  <Button loading={loading} onClick={handleSubmit}>
    Submit
  </Button>
);
```

### Using withLoading Hook
```typescript
const { withLoading } = useLoading();

const handleSubmit = () => {
  withLoading(async () => {
    await submitData();
  });
};
```

### Global Loading
```typescript
const { withLoading } = useGlobalLoading();

const handleLogin = () => {
  withLoading(async () => {
    await authenticateUser();
  }, "Authenticating...");
};
```

### Progress Loading
```typescript
const { setProgress, setIsLoading } = useLoadingProgress();

const handleUpload = () => {
  setIsLoading(true);
  setProgress(0);
  
  // Simulate upload progress
  const interval = setInterval(() => {
    setProgress(prev => prev + 10);
  }, 100);
  
  setTimeout(() => {
    clearInterval(interval);
    setProgress(100);
    setIsLoading(false);
  }, 1000);
};
```

## Loading States by Component

### App.tsx
- Initial app loading (1 second)
- Login process loading (800ms)
- Document loading (500ms)
- Navigation loading (200ms delay)

### Dashboard.tsx
- Data loading (1 second)
- Skeleton placeholders for stats and table

### ValidationScreen.tsx
- Submit button loading state
- Form validation loading

### All Components
- Lazy loading with Suspense fallbacks
- Smooth transitions between states

## Performance Benefits

1. **Code Splitting**: Reduces initial bundle size
2. **Lazy Loading**: Components load only when needed
3. **Skeleton Loading**: Better perceived performance
4. **Debounced Loading**: Prevents loading flicker
5. **Progress Feedback**: User knows operation status

## Best Practices

1. Always provide loading feedback for async operations
2. Use skeleton loading for better UX
3. Implement proper error handling with loading states
4. Use debounced loading to prevent flicker
5. Provide progress feedback for long operations
6. Test loading states in different network conditions

## Future Enhancements

1. **Offline Loading States**: Handle offline scenarios
2. **Retry Mechanisms**: Allow retry on failed operations
3. **Caching**: Implement smart caching with loading indicators
4. **Analytics**: Track loading performance metrics
5. **Accessibility**: Improve screen reader support for loading states
