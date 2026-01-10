import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t-4 border-black bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link
              href="/"
              className="text-xl font-black tracking-tight text-black"
            >
              Inkwell
            </Link>
            <p className="mt-2 text-gray-700">
              The collaborative writing platform for modern teams.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-black">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/features"
                  className="text-gray-700 hover:text-black"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-gray-700 hover:text-black"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className="text-gray-700 hover:text-black"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-black">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="text-gray-700 hover:text-black">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-700 hover:text-black">
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-gray-700 hover:text-black"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-black">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-700 hover:text-black"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-700 hover:text-black">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t-2 border-gray-200 pt-8 md:flex-row">
          <p className="text-gray-700">
            &copy; {new Date().getFullYear()} Inkwell. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a
              href="https://github.com/your-repo/inkwell"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-black"
            >
              <Github className="h-6 w-6" />
            </a>
            <a
              href="https://twitter.com/inkwell"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-black"
            >
              <Twitter className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
