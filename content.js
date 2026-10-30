/* PERSONAL CONTENT CONFIG — edit the text, values, images and reactions here. */
window.BIRTHDAY_CONTENT = {
  name: 'Hasan', age: 23,
  media: { hero: '', portrait: '', final: '', sight: ['', '', ''], audio: '', perfume: '' },
  welcome: { kicker: 'A VERY PERSONAL EDITION · NO. 23', title: 'A day for Hasan.', message: 'Today, the world celebrates you. And I made a little world of my own — just for you.' },
  character: {
    className: 'THE STRATEGIST', rarity: 'LEGENDARY',
    description: 'A thoughtful, composed protagonist with a talent for seeing the bigger picture. Replace this demo bio with your own description.',
    stats: [
      { name: 'INTELLIGENCE', value: 96, note: 'DEMO: Describe the way his mind works and what you admire about it.' },
      { name: 'PATIENCE', value: 88, note: 'DEMO: Add your own observation about his patience.' },
      { name: 'RELIABILITY', value: 98, note: 'DEMO: Write what makes you trust and rely on him.' },
      { name: 'CHARISMA', value: 91, note: 'DEMO: Describe his particular kind of presence.' },
      { name: 'SENSE OF HUMOR', value: 87, note: 'DEMO: Add an inside joke or describe his humour.' },
      { name: 'PROBLEM SOLVING', value: 99, note: 'DEMO: Describe how he approaches difficult things.' }
    ],
    abilities: [
      { icon: '⌘', name: 'Strategic mind', detail: 'DEMO DESCRIPTION: Add a real example of this ability.' },
      { icon: '◈', name: 'Calm under pressure', detail: 'DEMO DESCRIPTION: Describe when this ability shows.' },
      { icon: '✧', name: 'Quiet influence', detail: 'DEMO DESCRIPTION: Add what makes his presence distinctive.' }
    ],
    passives: ['Observes before acting', 'Keeps a clear head', 'Knows when to be serious'],
    weakness: 'CLASSIFIED — add a harmless inside joke here.',
    superpower: 'THE RIGHT QUESTION — replace with his real-life superpower.'
  },
  notes: [
    { title: 'The way you think', tag: '01 / THE MIND', text: 'DEMO TEXT: Write what you admire about the way he thinks, makes decisions, or sees the world.', stamp: 'A BRIGHT MIND', image: '' },
    { title: 'Your quiet strength', tag: '02 / THE CHARACTER', text: 'DEMO TEXT: Describe a kind of strength he may not recognise in himself.', stamp: 'STEADY', image: '' },
    { title: 'Your intelligence', tag: '03 / THE DETAILS', text: 'DEMO TEXT: Add a specific example of his curiosity, insight, or cleverness.', stamp: 'ALWAYS THINKING', image: '' },
    { title: 'Your sense of humour', tag: '04 / THE COMEDY', text: 'DEMO TEXT: Add a private joke or a moment that still makes you smile.', stamp: 'ONLY YOU', image: '' },
    { title: 'The little things', tag: '05 / THE EVERYDAY', text: 'DEMO TEXT: Describe a small habit or gesture you notice and love.', stamp: 'I NOTICE', image: '' },
    { title: 'The way you care', tag: '06 / THE HEART', text: 'DEMO TEXT: Write about a real action that makes you feel cared for.', stamp: 'MORE THAN WORDS', image: '' },
    { title: 'Things you don’t notice', tag: '07 / THE UNSAID', text: 'DEMO TEXT: Tell him something good about himself that he may overlook.', stamp: 'ONE OF ONE', image: '' }
  ],
  reasons: [
    { title: 'Because of who you are', text: 'PLACEHOLDER: Write a reason rooted in his character, not a generic compliment.' },
    { title: 'Because of how you make me feel', text: 'PLACEHOLDER: Describe a feeling he brings into your life.' },
    { title: 'Because of the way you see the world', text: 'PLACEHOLDER: Add what you love about his perspective.' },
    { title: 'Because of the little things', text: 'PLACEHOLDER: Mention one tiny, specific everyday detail.' },
    { title: 'Because I can be myself', text: 'PLACEHOLDER: Explain what being fully yourself beside him feels like.' },
    { title: 'Simply because you’re you', text: 'PLACEHOLDER: Make this one unmistakably yours.' }
  ],
  games: {
    powers: [
      { id:'mind', title:'Read minds', icon:'◉', reaction:'Interesting choice. I would still recommend asking me directly. My thoughts are a premium feature.' },
      { id:'time', title:'Stop time', icon:'Ⅱ', reaction:'A strategic answer. More time to think, plan, and probably still be five minutes early.' },
      { id:'solution', title:'Always find the solution', icon:'⌘', reaction:'Very on-brand for a Strategist. Some problems, however, are solved by snacks.' },
      { id:'teleport', title:'Teleport anywhere', icon:'↗', reaction:'Efficient. Though I suspect I would immediately ask you to teleport back.' },
      { id:'future', title:'See the future', icon:'✧', reaction:'Bold. Please use this power to check whether I am right. For once.' }
    ],
    quiz: [
      { question:'When faced with a complicated problem, your first instinct is to…', answers:['Think it through','Try something and adapt','Ask the right question'], reactions:['A very respectable strategy.','A practical approach. I see the logic.','The question is often half the solution.'] },
      { question:'Your ideal kind of victory is…', answers:['A clever solution','A perfectly executed plan','A quiet “I told you so”'], reactions:['The elegance of a good answer.','Precision matters.','I knew that option would be tempting.'] },
      { question:'Choose your unofficial character soundtrack:', answers:['Calm and focused','A little mysterious','Something unexpectedly funny'], reactions:['Main character concentration.','The plot thickens.','That feels like a plot twist.'] }
    ],
    memories: [
      { id:'a', caption:'A moment worth keeping', message:'PLACEHOLDER: Add the story behind photograph one.', image:'' },
      { id:'b', caption:'A favourite little detail', message:'PLACEHOLDER: Add the story behind photograph two.', image:'' },
      { id:'c', caption:'One for the memory book', message:'PLACEHOLDER: Add the story behind photograph three.', image:'' }
    ],
    secret: { prompt:'A tiny birthday riddle: which number is the main character’s level today?', options:['21','23','25'], answer:1, success:'Correct. The main character is officially Level 23. And this little world was made for him.' }
  },
  senses: [
    { id:'sight', number:'01', name:'Sight', ru:'Зрение', theme:'THE PHOTO ALBUM', tagline:'Everything I love to see.', description:'Some moments are so lovely that I wish I could step back into them. These are a few I kept.', prompt:'Add your favourite photos and the stories behind them.', symbol:'✳', kind:'photos', memories:[{title:'The look',text:'Add the memory behind this photo.'},{title:'A day worth keeping',text:'Add a moment you wish you could relive.'},{title:'My favourite view',text:'A small detail about him that you love seeing.'}] },
    { id:'sound', number:'02', name:'Sound', ru:'Слух', theme:'SIDE A — OUR SOUNDTRACK', tagline:'Everything I love to hear.', description:'Your voice, familiar conversations, laughter — and the songs that somehow became ours.', prompt:'Upload a song or a voice note that belongs here.', symbol:'♫', kind:'audio', memories:[{title:'Your voice',text:'Add a voice note or a line you love hearing.'},{title:'Our song',text:'Add the story behind your song.'}] },
    { id:'taste', number:'03', name:'Taste', ru:'Вкус', theme:'A TABLE FOR TWO', tagline:'Everything I want to share.', description:'Coffee that lasts a little longer, favourite desserts, breakfasts, and all the small joys in between.', prompt:'Add a food memory, a recipe, or a little promise.', symbol:'❦', kind:'cards', memories:[{title:'Something sweet',text:'Add a favourite dessert or a shared memory.'},{title:'Coffee, always',text:'Add your coffee ritual or a moment around it.'},{title:'A recipe for us',text:'Add your own recipe for a happy moment.'}] },
    { id:'touch', number:'04', name:'Touch', ru:'Ощущения', theme:'THE SOFTEST THINGS', tagline:'Everything I feel beside you.', description:'A hug after a long day. Your hand finding mine. The quiet comfort of being close.', prompt:'Add a note, a photograph, or a little certificate.', symbol:'♡', kind:'letter', memories:[{title:'A safe place',text:'Add what it feels like to be close to him.'},{title:'A little promise',text:'Add a promise, a private joke, or a massage-certificate note.'}] },
    { id:'scent', number:'05', name:'Scent', ru:'Обоняние', theme:'THE SCENT OF A MEMORY', tagline:'The things that stay with me.', description:'Some scents bring a person back before you even realise you were missing them.', prompt:'Add his perfume and the memory attached to it.', symbol:'✿', kind:'scent', memories:[{title:'That familiar scent',text:'Add the perfume name and why it reminds you of him.'},{title:'A memory that lingers',text:'Add a place, a season, or a moment you associate with him.'}] }
  ],
  finalLetter: { salutation: 'My love,', body: 'Write your own letter here. The most important words should come from you.', signature: 'Always yours,' }
};
