import { useState } from 'react';
import { eduverse_backend } from '../../declarations/eduverse_backend';

function App() {
  const [greeting, setGreeting] = useState('');
  const [name, setName] = useState('');

  function handleClick() {
    eduverse_backend.greet(name).then((greeting) => {
      setGreeting(greeting);
    });
  }

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 px-24 text-white">
      <div className="flex w-full max-w-md gap-2">
        <input
          className="w-full border-b px-2 py-1 outline-none focus:outline-none"
          onChange={(e) => setName(e.target.value)}
          type="text"
        />
        <button className="btn btn-primary" onClick={handleClick}>
          Click Me!
        </button>
      </div>

      <section id="greeting">{greeting}</section>
    </main>
  );
}

export default App;
