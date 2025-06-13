# Custom Hooks

## useScrollToTop

A custom hook that provides scroll-to-top functionality for React components.

### Basic Usage

```jsx
import { useScrollToTop } from '../hooks/useScrollToTop';

const MyComponent = () => {
  // Scroll to top when component mounts
  useScrollToTop({ onMount: true });

  return <div>My Component</div>;
};
```

### Advanced Usage

```jsx
import { useScrollToTop } from '../hooks/useScrollToTop';

const MyComponent = () => {
  // Get the scroll function for manual use
  const scrollToTop = useScrollToTop({ 
    onMount: true,           // Scroll on component mount
    onLocationChange: false, // Don't scroll on route changes (handled by global ScrollToTop component)
    smooth: true,           // Use smooth scrolling
    dependencies: []        // Additional dependencies to trigger scroll
  });

  const handleButtonClick = () => {
    // Manually trigger scroll to top
    scrollToTop();
  };

  return (
    <div>
      <button onClick={handleButtonClick}>
        Scroll to Top
      </button>
    </div>
  );
};
```

### useScrollToTopOnStepChange

A specialized hook for multi-step forms or wizards.

```jsx
import { useScrollToTopOnStepChange } from '../hooks/useScrollToTop';

const MultiStepForm = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // Scroll to top whenever step changes
  useScrollToTopOnStepChange(currentStep, {
    smooth: true,
    delay: 100 // Optional delay in milliseconds
  });

  return (
    <div>
      <h2>Step {currentStep}</h2>
      <button onClick={() => setCurrentStep(currentStep + 1)}>
        Next Step
      </button>
    </div>
  );
};
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `smooth` | boolean | `true` | Whether to use smooth scrolling animation |
| `dependencies` | array | `[]` | Additional dependencies that trigger scroll |
| `onMount` | boolean | `true` | Whether to scroll when component mounts |
| `onLocationChange` | boolean | `false` | Whether to scroll on route changes |
| `delay` | number | `0` | Delay before scrolling (useScrollToTopOnStepChange only) |

### Global ScrollToTop Component

The app also includes a global `ScrollToTop` component that automatically scrolls to the top when navigating between routes. This component is already included in the main App component.

```jsx
// Already included in App.js
import ScrollToTop from './components/ScrollToTop';

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      {/* Your routes */}
    </Router>
  );
};
```

### Best Practices

1. **Use the global ScrollToTop component** for general route navigation
2. **Use useScrollToTop hook** for component-specific scroll behavior
3. **Use useScrollToTopOnStepChange** for multi-step processes
4. **Set onLocationChange to false** in component hooks to avoid conflicts with the global component
5. **Add delays when necessary** to ensure DOM is ready before scrolling 