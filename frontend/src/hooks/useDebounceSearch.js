import { useState, useEffect, useRef } from 'react';

export const useDebounceSearch = (fetchFn, params, delay = 300) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);
  const lastParamsRef = useRef('');
  const timeoutRef = useRef(null);
  
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  
  useEffect(() => {
    
    if (!params || Object.keys(params).length === 0) return;
    
    
    const paramsString = JSON.stringify(params);
    
    
    if (isLoadingRef.current && paramsString === lastParamsRef.current) return;
    
    
    if (paramsString === lastParamsRef.current) return;
    
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    
    lastParamsRef.current = paramsString;
    
    
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
