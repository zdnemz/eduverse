import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import EduVerse from '@/assets/icons/EduVerse';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t bg-black/40">
      {/* Main Content */}
      <div className="relative z-10 grid gap-6 py-12 md:grid-cols-3">
        {/* Brand */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <EduVerse color="oklch(90% 0.058 230.902)" className="h-6 w-6" />
            <span className="text-2xl font-bold">EduVerse</span>
          </div>
          <p className="text-muted max-w-xs text-sm">
            Learn, earn, and own your knowledge on the blockchain. The future of education starts
            here.
          </p>
        </div>

        {/* Navigation */}
        <div className="space-y-2">
          <h4 className="font-semibold">Quick Links</h4>
          <ul className="text-muted space-y-1 text-sm">
            <li className="hover:text-primary cursor-pointer transition-colors">About Us</li>
            <li className="hover:text-primary cursor-pointer transition-colors">How It Works</li>
            <li className="hover:text-primary cursor-pointer transition-colors">FAQ</li>
            <li className="hover:text-primary cursor-pointer transition-colors">Contact</li>
          </ul>
        </div>

        {/* Social Media */}
        <div className="space-y-2">
          <h4 className="font-semibold">Follow Us</h4>
          <div className="flex gap-3">
            {[
              { icon: <Github size={18} />, link: '/' },
              { icon: <Twitter size={18} />, link: '/' },
              { icon: <Linkedin size={18} />, link: '/' },
              { icon: <Mail size={18} />, link: '/' },
            ].map((social, i) => (
              <Link
                key={i}
                to={social.link}
                rel="noopener noreferrer"
                className="bg-base-200 hover:bg-base-300 rounded-full p-2 transition-colors duration-200"
              >
                {social.icon}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Note */}
      <div className="text-muted border-t py-4 text-center text-xs">
        {new Date().getFullYear()} EduVerse. All rights reserved.
      </div>
    </footer>
  );
}
