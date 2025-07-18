# Actions Test Suite

This directory contains comprehensive tests for the action-based architecture of the Chara CLI. The test suite validates the complete functionality of the action system including the factory pattern, registry, type safety, and all action enhancers.

## Test Files Overview

### `factory.test.ts`
Tests the core action factory functionality:
- **Action Registration**: Registering, retrieving, and managing actions
- **Action Execution**: Executing actions with various options and error handling
- **Action Enhancers**: Testing `withErrorHandling`, `withLogging`, `withValidation`, and `compose`
- **Context Management**: Creating and managing action contexts
- **Edge Cases**: Null/undefined handling, error propagation, timing

**Coverage**: 33 tests covering all factory methods and enhancers

### `registry.test.ts`
Tests the action registry and integration:
- **Auto Registration**: Automatic registration of actions on module import
- **Factory Integration**: Testing actions through the factory pattern
- **Enhancer Composition**: Verifying correct application of enhancers
- **Performance**: Rapid execution, large objects, memory management
- **Configuration**: Metadata validation and registry completeness

**Coverage**: 35 tests covering registry functionality and integration

### `types.test.ts`
Tests TypeScript type definitions and interfaces:
- **Base Types**: `ActionOptions`, `ActionResult`, `ActionContext`
- **Extended Types**: `InitActionOptions`, `ResetActionOptions`, `ShowActionOptions`
- **Type Safety**: Interface compatibility, type inference, union types
- **Extensibility**: Custom interfaces, builder patterns, metadata
- **Real-world Patterns**: Validation, builder pattern, complex scenarios

**Coverage**: 30 tests ensuring type safety and interface correctness

### `test-utils.ts`
Provides testing utilities and helpers:
- **Mock Actions**: Configurable mock implementations
- **Test Data Generators**: Factory functions for test data
- **Mock Factories**: Spy functions, mock logger, mock factory
- **Assertion Helpers**: Type validation utilities
- **Performance Utils**: Timing, load testing, memory estimation

## Test Statistics

- **Total Tests**: 98 tests
- **Test Files**: 3 main test files + 1 utility file
- **Coverage Areas**: Factory, Registry, Types, Utils
- **Assertion Count**: 206 expect() calls
- **Execution Time**: ~350ms (including timing tests)

## Running Tests

### Run All Action Tests
```bash
bun test src/actions/__tests__/
```

### Run Individual Test Files
```bash
# Factory tests
bun test src/actions/__tests__/factory.test.ts

# Registry tests  
bun test src/actions/__tests__/registry.test.ts

# Type tests
bun test src/actions/__tests__/types.test.ts
```

### Run with Extended Timeout
```bash
bun test src/actions/__tests__/ --timeout 30000
```

## Test Categories

### Unit Tests
- Factory method testing
- Individual enhancer testing
- Type validation
- Error handling

### Integration Tests
- Registry-factory integration
- Action composition
- End-to-end workflows
- Cross-cutting concerns

### Performance Tests
- Concurrent execution
- Memory usage
- Execution timing
- Load testing

### Type Safety Tests
- Interface compliance
- Generic constraints
- Union type handling
- Custom extensions

## Mock Strategy

The test suite uses a comprehensive mocking strategy:

### Logger Mocking
```typescript
const mockLogger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
  setLevel: mock(() => {}),
};
```

### Action Mocking
```typescript
const mockInitAction = mock(async (options?: any) => {
  if (options?.shouldFail) {
    throw new Error("Init action failed");
  }
  return;
});
```

### Module Mocking
Uses Bun's `mock.module()` to mock dependencies:
- `@chara-codes/logger`
- Individual action modules
- External dependencies

## Test Data Patterns

### Action Options Generation
```typescript
testData.initOptions({ force: true, verbose: false })
testData.resetOptions({ confirm: true })
testData.showOptions({ format: 'json' })
```

### Mock Factory Usage
```typescript
const spy = mockFactories.createSpy(implementation);
const mockLogger = mockFactories.createMockLogger();
const mockFactory = mockFactories.createMockActionFactory();
```

## Assertions and Validations

### Type Validation
```typescript
assertions.isValidAction(action)
assertions.isValidActionOptions(options)
assertions.isValidActionResult(result)
```

### Test Patterns
```typescript
testPatterns.testBasicAction(action, options)
testPatterns.testActionErrorHandling(action, errorOptions, expectedError)
testPatterns.testActionTiming(action, options)
```

## Performance Testing

### Execution Timing
```typescript
const duration = await performanceUtils.measureExecutionTime(action, options);
```

### Load Testing
```typescript
const times = await performanceUtils.testActionLoad(action, 10, options);
```

### Memory Monitoring
```typescript
const memoryUsage = performanceUtils.estimateMemoryUsage();
```

## Error Scenarios Tested

### Standard Errors
- Action not found
- Validation failures
- Execution errors
- Network timeouts

### Edge Cases
- Null/undefined options
- Non-Error objects thrown
- String errors
- Empty responses

### Enhancer Errors
- Validation rejections
- Logging failures
- Error handling loops
- Composition issues

## Best Practices Demonstrated

### Test Organization
- Descriptive test names
- Grouped by functionality
- Clear setup/teardown
- Isolated test cases

### Mock Management
- Reset between tests
- Clear implementations
- Proper cleanup
- Consistent state

### Assertion Quality
- Specific expectations
- Error message validation
- Timing assertions
- Type safety checks

## Continuous Integration

Tests are designed to be:
- **Fast**: Most tests complete in <1ms
- **Reliable**: No flaky tests or race conditions
- **Deterministic**: Consistent results across runs
- **Isolated**: No shared state between tests

## Coverage Goals

The test suite aims for:
- ✅ **100% Function Coverage**: All functions tested
- ✅ **95%+ Branch Coverage**: Most code paths tested
- ✅ **100% Type Coverage**: All interfaces validated
- ✅ **Error Path Coverage**: All error scenarios tested

## Contributing to Tests

When adding new actions or modifying existing ones:

1. **Add Unit Tests**: Test individual functions
2. **Add Integration Tests**: Test interactions
3. **Update Mock Data**: Add new test data generators
4. **Test Error Cases**: Verify error handling
5. **Validate Types**: Ensure type safety
6. **Performance Test**: Check timing and memory

## Future Enhancements

Planned test improvements:
- Visual regression testing
- Property-based testing
- Mutation testing
- Browser compatibility testing
- Real integration testing with external services

This comprehensive test suite ensures the reliability, performance, and maintainability of the action-based architecture while providing a solid foundation for future development.