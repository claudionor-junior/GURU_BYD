const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatArea = document.getElementById('chatArea');

function scrollToBottom() {
  chatArea.scrollTop = chatArea.scrollHeight;
}

function appendMessage(role, text, sources = []) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', role === 'user' ? 'user-message' : 'ai-message');

  const avatar = document.createElement('div');
  avatar.classList.add('avatar');
  avatar.textContent = role === 'user' ? 'VC' : 'AI';

  const bubbleDiv = document.createElement('div');
  bubbleDiv.classList.add('bubble');
  
  // Converter quebras de linha para <br>
  bubbleDiv.innerHTML = text.replace(/\n/g, '<br>');

  if (sources.length > 0) {
    const sourcesDiv = document.createElement('div');
    sourcesDiv.classList.add('sources');
    sourcesDiv.innerText = 'Fontes Consultadas: ';
    
    // Removing string duplicates
    const uniqueSources = [...new Set(sources.map(s => s.document))];

    uniqueSources.forEach(doc => {
      const span = document.createElement('span');
      span.classList.add('source-item');
      span.textContent = doc;
      sourcesDiv.appendChild(span);
    });
    bubbleDiv.appendChild(sourcesDiv);
  }

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubbleDiv);
  chatArea.appendChild(msgDiv);
  scrollToBottom();
}

function showTyping() {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', 'ai-message');
  msgDiv.id = 'typingIndicator';

  const avatar = document.createElement('div');
  avatar.classList.add('avatar');
  avatar.textContent = 'AI';

  const bubbleDiv = document.createElement('div');
  bubbleDiv.classList.add('bubble', 'typing');
  bubbleDiv.innerHTML = '<span></span><span></span><span></span>';

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubbleDiv);
  chatArea.appendChild(msgDiv);
  scrollToBottom();
}

function hideTyping() {
  const typing = document.getElementById('typingIndicator');
  if (typing) typing.remove();
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const question = userInput.value.trim();
  if (!question) return;

  // Append user message
  appendMessage('user', question);
  userInput.value = '';
  
  // Show typing indicator
  showTyping();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });

    const data = await response.json();
    hideTyping();

    if (data.error) {
      appendMessage('ai', '❌ Ocorreu um erro: ' + data.error);
    } else {
      appendMessage('ai', data.answer, data.sources);
    }
  } catch (err) {
    hideTyping();
    appendMessage('ai', '❌ Falha de comunicação com o servidor.');
  }
});
