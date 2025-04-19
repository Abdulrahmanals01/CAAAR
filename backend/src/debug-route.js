
// Add debug route for images with full error handling
app.get('/debug-image/:filename', (req, res) => {
  const filename = req.params.filename;
  console.log('Debug image request for:', filename);
  
  const filepath = path.join(__dirname, '../uploads/cars/', filename);
  console.log('Full filepath:', filepath);
  
  // Check if the file exists
  fs.access(filepath, fs.constants.R_OK, (err) => {
    if (err) {
      console.error('File access error:', err.message);
      return res.status(404).send('Image not found');
    }
    
    // If it exists, send the file
    res.sendFile(filepath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        return res.status(500).send('Error loading image');
      }
      console.log('File sent successfully:', filename);
    });
  });
});
