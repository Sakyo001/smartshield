'use client';
import Image from "next/image";
import {redirect} from "next/navigation";

export default function Home() {
  return (
    <div>
      Landing Page
      <button onClick={() => redirect('/login')}>Go to Login</button>
    </div>
  );
}
