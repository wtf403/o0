import { useState, KeyboardEvent } from 'react';

function App() {
  const [url, setUrl] = useState('');

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('Navigate to:', url);
      window.ipcRenderer.send('navigate', url);
    }
  };

  return (
    <div style={{ padding: '10px', maxWidth: '600px', margin: '0 auto' }}>
      <input
        type="text"
        className="url-bar"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Enter URL..."
        autoFocus
      />
    </div>
  );
}

export default App;
