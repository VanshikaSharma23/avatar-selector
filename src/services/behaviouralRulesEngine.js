/**
 * Behavioural Rules Execution Engine
 * 
 * Applies behavioural rules to transform text responses based on
 * teaching style, language level, behaviour rules, and response structure.
 */

/**
 * Simplify complex terms in text
 */
const simplifyComplexTerms = (text) => {
  // Simple word replacement for common complex terms
  const replacements = {
    'utilize': 'use',
    'facilitate': 'help',
    'implement': 'do',
    'demonstrate': 'show',
    'comprehend': 'understand',
    'acquire': 'get',
    'endeavor': 'try',
    'substantial': 'big',
    'approximately': 'about',
    'subsequently': 'then',
  };
  
  let simplified = text;
  Object.entries(replacements).forEach(([complex, simple]) => {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    simplified = simplified.replace(regex, simple);
  });
  
  return simplified;
};

/**
 * Adjust language level
 */
const adjustLanguageLevel = (text, languageLevel) => {
  if (!languageLevel) return text;
  
  switch (languageLevel) {
    case 'simple-english':
      // Use simpler sentence structures and shorter sentences
      return text
        .replace(/\.\s+/g, '. ')
        .replace(/,\s+and\s+/gi, ' and ')
        .replace(/\bhowever\b/gi, 'but')
        .replace(/\btherefore\b/gi, 'so')
        .replace(/\bnevertheless\b/gi, 'but');
        
    case 'intermediate-english':
      // Keep moderate complexity
      return text;
      
    case 'advanced-english':
      // Allow more complex structures
      return text;
      
    case 'hinglish':
      // Add some Hinglish flavor (light touch)
      return text
        .replace(/\bvery\s+good\b/gi, 'bahut achha')
        .replace(/\bokay\b/gi, 'theek hai')
        .replace(/\bunderstand\b/gi, 'samajh');
        
    case 'indian-friendly':
      // Use Indian English patterns
      return text
        .replace(/\bplease\s+do\s+the\s+needful\b/gi, 'please do the needful')
        .replace(/\brevert\b/gi, 'reply');
        
    default:
      return text;
  }
};

/**
 * Apply teaching style transformations
 */
const applyTeachingStyle = (text, teachingStyle) => {
  if (!teachingStyle) return text;
  
  switch (teachingStyle) {
    case 'step-by-step':
      // Add step indicators if not present
      if (!text.match(/step\s*\d+/i) && text.length > 100) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length > 2) {
          return sentences.map((s, i) => 
            i === 0 ? s.trim() : `Step ${i}: ${s.trim()}`
          ).join('. ') + '.';
        }
      }
      return text;
      
    case 'activity-based':
      // Add activity suggestions
      if (!text.toLowerCase().includes('try this') && !text.toLowerCase().includes('activity')) {
        return text + ' Try this: Practice what you just learned!';
      }
      return text;
      
    case 'short-direct':
      // Keep it concise - truncate if too long
      if (text.length > 200) {
        const sentences = text.split(/[.!?]+/);
        return sentences.slice(0, 2).join('. ') + '.';
      }
      return text;
      
    case 'storytelling':
      // Add narrative elements
      if (!text.toLowerCase().includes('imagine') && !text.toLowerCase().includes('story')) {
        return `Imagine this: ${text}`;
      }
      return text;
      
    case 'socratic':
      // Add questions
      if (!text.includes('?')) {
        return text + ' What do you think about this?';
      }
      return text;
      
    case 'visual':
      // Add visual cues
      if (!text.toLowerCase().includes('see') && !text.toLowerCase().includes('visual')) {
        return `Picture this: ${text}`;
      }
      return text;
      
    default:
      return text;
  }
};

/**
 * Apply individual behaviour rules
 */
const applyBehaviourRules = (text, behaviourRules) => {
  if (!behaviourRules || behaviourRules.length === 0) return text;
  
  let transformed = text;
  
  behaviourRules.forEach((rule) => {
    switch (rule) {
      case 'Simplify complex terms':
        transformed = simplifyComplexTerms(transformed);
        break;
        
      case 'Use relatable real-life examples':
        if (!transformed.toLowerCase().includes('example') && 
            !transformed.toLowerCase().includes('like') &&
            transformed.length > 50) {
          transformed += ' For example, think about everyday situations.';
        }
        break;
        
      case 'Encourage learner at every step':
        if (!transformed.toLowerCase().includes('great') && 
            !transformed.toLowerCase().includes('well done') &&
            !transformed.toLowerCase().includes('good job')) {
          transformed = 'Great! ' + transformed;
        }
        break;
        
      case 'Avoid jargon unless necessary':
        transformed = simplifyComplexTerms(transformed);
        break;
        
      case 'Provide small quizzes':
        if (!transformed.toLowerCase().includes('quiz') && 
            !transformed.toLowerCase().includes('question')) {
          transformed += ' Quick question: Can you recall what we just discussed?';
        }
        break;
        
      case 'Keep responses concise':
        if (transformed.length > 300) {
          const sentences = transformed.split(/[.!?]+/);
          transformed = sentences.slice(0, 3).join('. ') + '.';
        }
        break;
        
      case 'Give alternative explanations if confused':
        if (transformed.length > 100 && !transformed.toLowerCase().includes('another way')) {
          transformed += ' Another way to think about this is...';
        }
        break;
        
      case 'Use emojis lightly':
        // Add light emojis (sparingly)
        if (!transformed.match(/[\u{1F300}-\u{1F9FF}]/u)) {
          const emojiMap = {
            'great': '👍',
            'good': '✨',
            'important': '⭐',
            'remember': '💡',
          };
          Object.entries(emojiMap).forEach(([word, emoji]) => {
            if (transformed.toLowerCase().includes(word) && 
                !transformed.includes(emoji)) {
              transformed = transformed.replace(
                new RegExp(`\\b${word}\\b`, 'i'),
                `${word} ${emoji}`
              );
              return;
            }
          });
        }
        break;
        
      case 'Ask clarifying questions before answering':
        if (!transformed.includes('?')) {
          transformed = 'Before we dive in, what do you already know about this? ' + transformed;
        }
        break;
        
      default:
        break;
    }
  });
  
  return transformed;
};

/**
 * Apply response structure
 */
const applyResponseStructure = (text, responseStructure) => {
  if (!responseStructure) return text;
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  switch (responseStructure) {
    case 'intro-explanation-example-quiz-summary':
      if (sentences.length >= 3) {
        const intro = sentences[0] || 'Let\'s learn something new!';
        const explanation = sentences.slice(1, Math.min(3, sentences.length)).join('. ');
        const example = sentences.length > 3 ? `Example: ${sentences[3]}` : 'Here\'s an example to illustrate.';
        const quiz = 'Quick check: Can you apply this?';
        const summary = `To summarize: ${intro}`;
        return `${intro}. ${explanation}. ${example}. ${quiz}. ${summary}.`;
      }
      return text;
      
    case 'explanation-example-practice':
      if (sentences.length >= 2) {
        const explanation = sentences.slice(0, 2).join('. ');
        const example = sentences.length > 2 ? `Example: ${sentences[2]}` : 'Here\'s an example.';
        const practice = 'Now try practicing this yourself!';
        return `${explanation}. ${example}. ${practice}.`;
      }
      return text;
      
    case 'short-answer':
      // Keep only first sentence or two
      return sentences.slice(0, 2).join('. ') + '.';
      
    case 'long-detailed':
      // Expand if too short
      if (sentences.length < 4 && text.length < 200) {
        return text + ' Let me explain this in more detail. There are several important aspects to consider. Each part builds on the previous one.';
      }
      return text;
      
    case 'example-breakdown-answer':
      if (sentences.length >= 2) {
        const example = sentences[0] || 'Consider this example.';
        const breakdown = sentences.slice(1, 3).join('. ') || 'Let me break this down.';
        const answer = sentences.length > 3 ? sentences[3] : 'So the answer is clear.';
        return `Example: ${example}. Breakdown: ${breakdown}. Answer: ${answer}.`;
      }
      return text;
      
    case 'step-by-step-list':
      if (sentences.length > 1) {
        return sentences.map((s, i) => `${i + 1}. ${s.trim()}`).join('\n');
      }
      return text;
      
    default:
      return text;
  }
};

/**
 * Main execution function - applies all behavioural rules to text
 * 
 * @param {string} text - Original text to transform
 * @param {Object} config - Behavioural rules configuration
 * @returns {string} - Transformed text
 */
export const executeBehaviouralRules = (text, config) => {
  if (!text || !text.trim()) return text;
  if (!config) return text;
  
  let transformed = text;
  
  // Apply in order: language level -> teaching style -> behaviour rules -> response structure
  transformed = adjustLanguageLevel(transformed, config.languageLevel);
  transformed = applyTeachingStyle(transformed, config.teachingStyle);
  transformed = applyBehaviourRules(transformed, config.behaviourRules);
  transformed = applyResponseStructure(transformed, config.responseStructure);
  
  return transformed.trim();
};


