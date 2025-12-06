module.exports = async (req, res) => {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { name, surname, group, score, quizType } = req.body;
    
    console.log('📊 Quiz Results Received:', {
      student: `${name} ${surname}`,
      group: group,
      score: score,
      quizType: quizType,
      time: new Date().toLocaleString()
    });
    
    // In a real app, you would send to Telegram here
    // For now, we'll just log and return success
    
    res.status(200).json({
      success: true,
      message: 'Results saved successfully!',
      data: {
        student: `${name} ${surname}`,
        score: score,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: error.message 
    });
  }
};
