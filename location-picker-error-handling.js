
window.gm_authFailure = () => {
  setError('Google Maps API key is invalid or has expired. Please contact support.');
  setIsLoading(false);
};

} catch (err) {
  if (!isMounted) return;

  console.error('Error initializing map:', err);
  setError(
    err.message === 'Google Maps JavaScript API error: ApiNotActivatedMapError'
      ? 'The Google Maps API is not properly activated. Please contact support.'
      : 'Failed to load Google Maps. Please try again later.'
  );
  setIsLoading(false);
}
