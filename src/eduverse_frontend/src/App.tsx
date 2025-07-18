import { useState } from 'react';
import { eduverse_backend } from '../../declarations/eduverse_backend';
import Button from '@/components/ui/Button';

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
      <div className="w-full max-w-md flex gap-2">
        <input
          className="w-full px-2 py-1 outline-none focus:outline-none border-b"
          onChange={(e) => setName(e.target.value)}
          type="text"
        />
        <Button className="bg-blue-500 w-36 px-2 py-1 text-white" onClick={handleClick}>
          Click Me!
        </Button>
      </div>

      <section id="greeting">{greeting}</section>
    </main>
  );
}

export default App;
