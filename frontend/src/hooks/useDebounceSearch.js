import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for debounced data fetching with protection against unnecessary API calls
 * @param {Function} fetchFn - The fetch function to call
 * @param {Object} params - The parameters to pass to the fetch function
 * @param {number} delay - Delay in ms before triggering fetch
 * @returns {Object} State containing data, loading status and error
 */
export const useDebounceSearch = (fetchFn, params, delay = 300) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use refs to track state across renders
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);
  const lastParamsRef = useRef('');
  const timeoutRef = useRef(null);
  
  // Clean up when unmounting
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // The effect that handles fetching data
  useEffect(() => {
    // Skip if no params provided
    if (!params || Object.keys(params).length === 0) return;
    
    // Convert params to a string for comparison
    const paramsString = JSON.stringify(params);
    
    // Skip if we're already loading with these params
    if (isLoadingRef.current && paramsString === lastParamsRef.current) return;
    
    // Skip if params haven't changed
    if (paramsString === lastParamsRef.current) return;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Store the current params
    lastParamsRef.current = paramsString;
    
    // Set a timeout to trigger the fetch
    timeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;
      
      try {
        setLoading(true);
        isLoadingRef.current = true;
        
        console.log('Fetching data with params:', params);
        const response = await fetchFn(params);
        
        if (!isMountedRef.current) return;
        
        if (response.success) {
          setData(response.data);
          setError(null);
        } else {
          setError(response.error || 'Error fetching data');
          setData([]);
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        console.error('Error in fetch hook:', err);
        setError(err.message || 'An error occurred');
        setData([]);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          isLoadingRef.current = false;
        }
      }
    }, delay);
  }, [fetchFn, params, delay]);

  return { data, loading, error };
};
