const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { studentName, surname, group, articleId, quizType, score, answers } = req.body;
    
    // Telegram bot configuration
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    const message = `
📊 *Quiz Results Submitted*
👤 *Student:* ${studentName} ${surname}
👥 *Group:* ${group}
📚 *Article:* ${articleId}
🧠 *Quiz Type:* ${quizType}
⭐ *Score:* ${score}/15
⏰ *Time:* ${new Date().toLocaleString()}
    
📝 *Answers Summary:*
${answers.map((answer, index) => 
  `${index + 1}. ${answer.question.substring(0, 50)}...
  ✅ Student's Answer: ${answer.studentAnswer}
  ${answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}`
).join('\n\n')}
    `;
    
    // Send to Telegram
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      }
    );
    
    // Store in database (simulated)
    const resultId = `result_${Date.now()}`;
    
    res.status(200).json({
      success: true,
      resultId,
      message: 'Results sent successfully'
    });
    
  } catch (error) {
    console.error('Telegram API error:', error);
    res.status(500).json({ 
      error: 'Failed to send results',
      details: error.message 
    });
  }
};
