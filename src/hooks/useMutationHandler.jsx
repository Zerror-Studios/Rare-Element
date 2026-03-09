"use client";
import { useMutation } from '@apollo/client/react';
import { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for handling GraphQL mutations with built-in error handling,
 * loading states, and customizable notifications
 * 
 * @param {DocumentNode} mutation - GraphQL mutation
 * @param {Object} options - Configuration options
 * @returns {Array} - [mutationFunction, { loading, error, data, reset }]
 */
export const useMutationHandler = (mutation, options = {}) => {
  const {
    // Toast notification options
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'Operation completed successfully!',
    errorMessage = 'An error occurred. Please try again.',
    
    // Custom handlers
    onSuccess,
    onError,
    onCompleted,
    
    // Apollo options
    refetchQueries = [],
    updateCache,
    optimisticResponse,
    
    // Loading state options
    resetOnSuccess = true,
    
    // Error handling options
    logErrors = true,
    
    // Custom toast options
    toastOptions = {},
    
    ...apolloOptions
  } = options;

  const [customError, setCustomError] = useState(null);
  const [isCustomLoading, setIsCustomLoading] = useState(false);

  const [mutationFn, { data, loading, error, reset: apolloReset }] = useMutation(mutation, {
    refetchQueries,
    optimisticResponse,
    update: updateCache,
    
    onCompleted: (data) => {
      setIsCustomLoading(false);
      setCustomError(null);
      
      // Show success toast
      if (showSuccessToast) {
        const message = typeof successMessage === 'function' 
          ? successMessage(data) 
          : successMessage;
        
        toast.success(message, {
          duration: 4000,
          position: 'top-right',
          ...toastOptions.success
        });
      }
      
      // Call custom success handler
      if (onSuccess) {
        onSuccess(data);
      }
      
      // Call custom completed handler
      if (onCompleted) {
        onCompleted(data);
      }
      
      // Reset state if configured
      if (resetOnSuccess) {
        setTimeout(() => {
          apolloReset();
        }, 100);
      }
    },
    
    onError: (error) => {
      setIsCustomLoading(false);
      setCustomError(error);
      
      // Log errors if enabled
      if (logErrors) {
        console.error('Mutation Error:', error);
      }
      
      // Show error toast
      if (showErrorToast) {
        const message = typeof errorMessage === 'function' 
          ? errorMessage(error) 
          : getErrorMessage(error, errorMessage);
        
        toast.error(message, {
          duration: 6000,
          position: 'top-right',
          ...toastOptions.error
        });
      }
      
      // Call custom error handler
      if (onError) {
        onError(error);
      }
    },
    
    ...apolloOptions
  });

  // Enhanced mutation function with additional features
  const executeMutation = async (variables = {}, executionOptions = {}) => {
    const {
      showLoading = true,
      customSuccessMessage,
      customErrorMessage,
      skipToast = false,
    } = executionOptions;

    try {
      if (showLoading) {
        setIsCustomLoading(true);
      }
      
      setCustomError(null);

      const result = await mutationFn({
        variables,
        onCompleted: skipToast ? undefined : (data) => {
          if (showSuccessToast && !skipToast) {
            const message = customSuccessMessage || 
              (typeof successMessage === 'function' ? successMessage(data) : successMessage);
            
            toast.success(message, {
              duration: 4000,
              position: 'top-right',
              ...toastOptions.success
            });
          }
          
          if (onSuccess) onSuccess(data);
          if (onCompleted) onCompleted(data);
        },
        onError: skipToast ? undefined : (error) => {
          if (showErrorToast && !skipToast) {
            const message = customErrorMessage || 
              (typeof errorMessage === 'function' ? errorMessage(error) : getErrorMessage(error, errorMessage));
            
            toast.error(message, {
              duration: 6000,
              position: 'top-right',
              ...toastOptions.error
            });
          }
          
          if (onError) onError(error);
        }
      });

      if (showLoading) {
        setIsCustomLoading(false);
      }

      return result;
    } catch (err) {
      if (showLoading) {
        setIsCustomLoading(false);
      }
      throw err;
    }
  };

  // Reset function
  const reset = () => {
    apolloReset();
    setCustomError(null);
    setIsCustomLoading(false);
  };

  return [
    executeMutation,
    {
      loading: loading || isCustomLoading,
      error: error || customError,
      data,
      reset,
      // Additional utilities
      isLoading: loading || isCustomLoading,
      hasError: !!(error || customError),
      isSuccess: !!data && !error && !customError,
    }
  ];
};

/**
 * Extract meaningful error message from GraphQL error
 */
const getErrorMessage = (error, fallbackMessage) => {
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    return error.graphQLErrors[0].message;
  }
  
  if (error.networkError) {
    if (error.networkError.statusCode === 401) {
      return 'Authentication required. Please log in.';
    }
    if (error.networkError.statusCode === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.networkError.statusCode >= 500) {
      return 'Server error. Please try again later.';
    }
    return error.networkError.message || 'Network error occurred.';
  }
  
  return error.message || fallbackMessage;
};

export default useMutationHandler;
