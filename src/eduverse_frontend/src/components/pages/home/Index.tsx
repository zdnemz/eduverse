import { useState } from 'react';
import { eduverse_backend } from 'declarations/eduverse_backend';
import RootLayout from '@/components/layouts/RootLayout';
import Navbar from '@/components/Navbar';

export default function Home() {
  const [greeting, setGreeting] = useState('');
  const [name, setName] = useState('');

  function handleClick() {
    eduverse_backend.greet(name).then((greeting) => {
      setGreeting(greeting);
    });
  }

  return (
    <RootLayout header={<Navbar />}>
      <section className="flex min-h-screen w-full items-center justify-center">
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
        <div>{greeting}</div>
      </section>
    </RootLayout>
  );
}
