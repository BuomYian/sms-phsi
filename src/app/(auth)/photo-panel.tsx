"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  {
    src: "/students-image.jpeg",
    caption: "Our Students",
    sub: "Training the next generation of health professionals",
  },
  {
    src: "/exam.jpeg",
    caption: "Examinations",
    sub: "Rigorous assessments that shape competent clinicians",
  },
  {
    src: "/classroom.jpeg",
    caption: "Learning in Action",
    sub: "Dedicated students committed to excellence",
  },
  {
    src: "/practical.jpeg",
    caption: "Clinical Practicals",
    sub: "Hands-on training with real medical equipment",
  },
  {
    src: "/graduation.jpeg",
    caption: "Graduation Ceremony",
    sub: "Celebrating the achievements of our graduates",
  },
  {
    src: "/photo.jpeg",
    caption: "Our Graduates",
    sub: "Proud alumni serving communities across South Sudan",
  },
];

export function PhotoPanel() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % SLIDES.length);
        setFading(false);
      }, 500);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-900">
      {/* Background image */}
      <Image
        src={slide.src}
        alt={slide.caption}
        fill
        className={`object-cover transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
        priority
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

      {/* Top badge */}
      <div className="absolute top-8 left-8 right-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-2 text-white text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Presbyterian Health Science Institute
        </div>
      </div>

      {/* Bottom caption */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-8 transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
      >
        <p className="text-3xl font-bold text-white leading-tight mb-1">
          {slide.caption}
        </p>
        <p className="text-white/75 text-sm mb-6">{slide.sub}</p>

        {/* Dot indicators */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setFading(true);
                setTimeout(() => {
                  setCurrent(i);
                  setFading(false);
                }, 300);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-white" : "w-2 bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
