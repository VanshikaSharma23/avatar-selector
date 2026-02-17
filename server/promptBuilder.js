/**
 * Prompt Builder Module
 * 
 * Constructs structured prompts for Ollama LLM based on:
 * - Student's question
 * - Teaching style
 * - Language level
 * - Behavioural rules
 * - Response structure
 * - Tone
 * - Avatar name
 * 
 * This module is model-agnostic and works with any LLM that accepts text prompts.
 */

/**
 * Builds a comprehensive prompt that instructs the LLM to follow
 * all the selected behavioral rules and configuration.
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.question - Student's question
 * @param {string} config.teachingStyle - Selected teaching style
 * @param {string} config.languageLevel - Selected language level
 * @param {string[]} config.behaviourRules - Array of behavioral rules
 * @param {string} config.responseStructure - Selected response structure
 * @param {string} config.tone - Selected tone
 * @param {string} config.avatarName - Name of selected avatar
 * @returns {string} - Complete prompt for the LLM
 */
export function buildPrompt({
  question,
  teachingStyle,
  languageLevel,
  behaviourRules = [],
  responseStructure,
  tone,
  avatarName
}) {
  // Start with base role definition
  let prompt = `You are an AI teacher assistant${avatarName ? ` named ${avatarName}` : ''}. `;
  prompt += `Your role is to help students learn by answering their questions in a clear, engaging, and educational manner.\n\n`;

  // Add teaching style instructions
  if (teachingStyle) {
    const styleInstructions = {
      'step-by-step': 'Break down your answer into clear, numbered steps. Guide the student through each step methodically.',
      'activity-based': 'Include practical activities or exercises that help reinforce the learning. Suggest hands-on tasks.',
      'short-direct': 'Keep your answer concise and to the point. Avoid unnecessary elaboration.',
      'storytelling': 'Use stories, analogies, or narrative examples to make concepts memorable and relatable.',
      'socratic': 'Ask thoughtful questions to guide the student toward understanding rather than just providing answers.',
      'visual': 'Describe concepts in a way that helps students visualize them. Use descriptive language that paints a picture.'
    };
    prompt += `Teaching Style: ${styleInstructions[teachingStyle] || styleInstructions['step-by-step']}\n\n`;
  }

  // Add language level instructions
  if (languageLevel) {
    const languageInstructions = {
      'simple-english': 'Use simple, everyday words. Keep sentences short and clear. Avoid complex vocabulary and jargon.',
      'intermediate-english': 'Use moderately complex language appropriate for intermediate learners. Balance clarity with educational value.',
      'advanced-english': 'You may use more sophisticated language and complex sentence structures suitable for advanced learners.',
      'hinglish': 'Feel free to naturally mix Hindi and English words where it makes sense and feels authentic (e.g., "theek hai", "samajh").',
      'indian-friendly': 'Use Indian English patterns and expressions. Make references relatable to Indian context when appropriate.'
    };
    prompt += `Language Level: ${languageInstructions[languageLevel] || languageInstructions['simple-english']}\n\n`;
  }

  // Add behavioral rules
  if (behaviourRules && behaviourRules.length > 0) {
    prompt += `Behavioral Rules to Follow:\n`;
    behaviourRules.forEach((rule, index) => {
      const ruleInstructions = {
        'Simplify complex terms': 'Always explain complex terms in simple language. If you must use technical terms, define them immediately.',
        'Use relatable real-life examples': 'Include concrete, everyday examples that students can relate to. Connect abstract concepts to real-world situations.',
        'Encourage learner at every step': 'Be positive and encouraging. Acknowledge effort and progress. Use phrases like "Great question!", "Well done!", "You\'re on the right track!"',
        'Avoid jargon unless necessary': 'Minimize technical jargon. When jargon is necessary, explain it clearly first.',
        'Provide small quizzes': 'Include quick check-in questions or mini-quizzes to reinforce learning and test understanding.',
        'Keep responses concise': 'Be concise and focused. Avoid rambling or overly long explanations unless the topic truly requires depth.',
        'Give alternative explanations if confused': 'If a concept seems complex, provide multiple ways to understand it. Offer different perspectives or analogies.',
        'Use emojis lightly': 'Use emojis sparingly and only when they add value (e.g., 👍 for encouragement, 💡 for insights). Don\'t overuse them.',
        'Ask clarifying questions before answering': 'If the question is vague or could have multiple interpretations, ask a clarifying question first to better understand what the student needs.'
      };
      const instruction = ruleInstructions[rule] || rule;
      prompt += `${index + 1}. ${instruction}\n`;
    });
    prompt += '\n';
  }

  // Add response structure instructions
  if (responseStructure) {
    const structureInstructions = {
      'intro-explanation-example-quiz-summary': 'Structure your response as: 1) Brief introduction, 2) Detailed explanation, 3) Concrete example, 4) Quick quiz/check-in question, 5) Summary of key points.',
      'explanation-example-practice': 'Structure your response as: 1) Clear explanation, 2) Practical example, 3) Practice task or exercise for the student.',
      'short-answer': 'Provide a brief, direct answer. Keep it concise and focused.',
      'long-detailed': 'Provide a comprehensive, detailed answer with thorough explanations and multiple perspectives.',
      'example-breakdown-answer': 'Structure your response as: 1) Start with a concrete example, 2) Break down the example step-by-step, 3) Provide the final answer or conclusion.',
      'step-by-step-list': 'Present your answer as a numbered, step-by-step list. Each step should be clear and actionable.'
    };
    prompt += `Response Structure: ${structureInstructions[responseStructure] || structureInstructions['short-answer']}\n\n`;
  }

  // Add tone instructions
  if (tone) {
    const toneInstructions = {
      'neutral': 'Maintain a professional, balanced tone. Be clear and informative.',
      'calm': 'Use a calm, soothing, and patient tone. Speak slowly and reassuringly.',
      'energetic': 'Be enthusiastic, energetic, and upbeat. Show excitement about the topic.',
      'warm': 'Be warm, friendly, and approachable. Show genuine care and interest.',
      'friendly': 'Be friendly, conversational, and personable. Make the student feel comfortable.'
    };
    prompt += `Tone: ${toneInstructions[tone] || toneInstructions['neutral']}\n\n`;
  }

  // Add the student's question
  prompt += `Student's Question: ${question}\n\n`;

  // Final instruction
  prompt += `Please answer the student's question following all the instructions above. `;
  prompt += `Ensure your response strictly adheres to the teaching style, language level, behavioral rules, response structure, and tone specified. `;
  prompt += `Be helpful, accurate, and educational.`;

  return prompt;
}
