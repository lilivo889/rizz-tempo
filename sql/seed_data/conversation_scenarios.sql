-- Seed data for conversation scenarios
-- Run this after the initial setup migration

INSERT INTO public.conversation_scenarios (title, description, difficulty_level, category, prompt, expected_responses, tips) VALUES 
(
  'First Date Coffee Shop',
  'Practice casual conversation on a first date',
  2,
  'dating',
  'Start a natural conversation at a coffee shop',
  ARRAY['Ask about interests', 'Share about yourself', 'Comment on atmosphere'],
  ARRAY['Be genuinely curious', 'Share personal stories', 'Ask follow-up questions']
),
(
  'Approaching Someone at a Bar',
  'Learn to confidently approach someone',
  3,
  'approaching',
  'Practice starting a conversation naturally',
  ARRAY['Make situational comment', 'Give specific compliment', 'Ask open question'],
  ARRAY['Read body language', 'Be confident not aggressive', 'Have exit strategy']
),
(
  'Text Message Follow-up',
  'Practice engaging follow-up messages',
  2,
  'texting',
  'Write a follow-up message after meeting someone',
  ARRAY['Reference previous conversation', 'Suggest specific activity', 'Show genuine interest'],
  ARRAY['Be specific not generic', 'Show personality', 'Align with their interests']
),
(
  'Dealing with Rejection Gracefully',
  'Learn to handle rejection with confidence and grace',
  4,
  'confidence',
  'Someone you''re interested in has politely declined your invitation. Practice responding in a way that maintains your dignity and their comfort.',
  ARRAY[
    'Thank them for being honest',
    'Respect their decision without arguing',
    'Keep the interaction brief and positive',
    'Maintain friendly demeanor if you''ll see them again',
    'Exit the conversation gracefully'
  ],
  ARRAY[
    'Remember that rejection isn''t personal',
    'Don''t try to change their mind or ask why',
    'Your response shows your character',
    'A graceful response leaves doors open for friendship',
    'Use it as practice for building resilience'
  ]
),
(
  'Group Conversation Dynamics',
  'Navigate conversations when your interest is in a group setting',
  3,
  'social',
  'You''re at a party and want to join a conversation that includes someone you''re interested in. Practice engaging the group while showing interest.',
  ARRAY[
    'Contribute meaningfully to the group conversation',
    'Include everyone, not just your person of interest',
    'Share relevant stories or insights',
    'Ask questions that involve the whole group',
    'Find opportunities for brief one-on-one moments'
  ],
  ARRAY[
    'Don''t ignore others in the group',
    'Listen actively to build on what others are saying',
    'Be the person who makes everyone feel included',
    'Use humor appropriately to build rapport',
    'Look for natural opportunities to suggest continuing conversations'
  ]
),
(
  'Online Dating Profile Review',
  'Practice describing yourself authentically and attractively',
  2,
  'online',
  'You''re creating or updating your dating profile. Practice talking about yourself in a way that''s genuine, interesting, and attractive.',
  ARRAY[
    'Highlight your genuine interests and passions',
    'Mention what you''re looking for in a relationship',
    'Share what makes you unique',
    'Include conversation starters',
    'Show your personality through your description'
  ],
  ARRAY[
    'Be specific rather than generic',
    'Show, don''t just tell (give examples)',
    'Avoid negativity or what you don''t want',
    'Use recent, genuine photos',
    'Proofread for spelling and grammar'
  ]
),
(
  'Maintaining Long-term Interest',
  'Keep conversations engaging in ongoing relationships',
  3,
  'relationship',
  'You''ve been dating someone for a few weeks and want to keep things interesting. Practice bringing up new topics and maintaining attraction.',
  ARRAY[
    'Ask deeper questions about their thoughts and experiences',
    'Share your own growth and new experiences',
    'Plan interesting activities together',
    'Discuss future goals and dreams',
    'Maintain individual interests to stay interesting'
  ],
  ARRAY[
    'Don''t fall into routine conversations',
    'Keep developing yourself as an individual',
    'Show continued interest in their growth',
    'Balance comfort with excitement',
    'Don''t stop making effort just because things are going well'
  ]
),
(
  'Workplace Appropriate Flirting',
  'Navigate attraction in professional environments safely',
  4,
  'professional',
  'You''re interested in a colleague but need to keep things professional. Practice showing interest while maintaining workplace boundaries.',
  ARRAY[
    'Focus on building genuine friendship first',
    'Invite them to appropriate group activities',
    'Show interest in their professional growth',
    'Compliment their work and ideas',
    'Keep conversations professional during work hours'
  ],
  ARRAY[
    'Know your company''s policies about workplace relationships',
    'Never make someone uncomfortable at work',
    'Don''t pursue if they show disinterest',
    'Keep personal interactions outside of work initially',
    'Be prepared for the relationship to affect your work dynamic'
  ]
);

-- Insert some additional scenarios for different skill levels
INSERT INTO public.conversation_scenarios (title, description, difficulty_level, category, prompt, expected_responses, tips) VALUES 
(
  'Building Confidence After Breakup',
  'Rebuild your confidence and social skills after a difficult breakup',
  3,
  'confidence',
  'You''re getting back into dating after a difficult breakup. Practice rebuilding your confidence and social skills.',
  ARRAY[
    'Focus on rediscovering what you enjoy',
    'Practice self-compassion',
    'Set small, achievable social goals',
    'Reconnect with friends and family',
    'Take time to process your experiences'
  ],
  ARRAY[
    'Don''t rush into dating if you''re not ready',
    'Work on yourself first',
    'Learn from past relationship patterns',
    'Build a support network',
    'Remember that healing takes time'
  ]
),
(
  'Advanced Storytelling',
  'Master the art of engaging storytelling in conversations',
  4,
  'advanced',
  'Practice telling stories that captivate your audience and create emotional connection.',
  ARRAY[
    'Structure stories with setup, conflict, and resolution',
    'Include sensory details and emotions',
    'Make stories relevant to the conversation',
    'Use appropriate pacing and pauses',
    'End with impact or insight'
  ],
  ARRAY[
    'Practice your best stories beforehand',
    'Read your audience - adjust length and detail',
    'Use body language and voice modulation',
    'Make stories about transformation or learning',
    'Don''t make every story about yourself'
  ]
); 