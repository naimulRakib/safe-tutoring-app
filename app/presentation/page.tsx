import React from 'react';

const SpecialThanksSlide: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-screen overflow-hidden bg-slate-950 text-white">
      
      {/* Background Decor (Optional Glow effects) */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      {/* Main Content Card */}
      <div className="z-10 text-center px-4 animate-fade-in-up">
        
        {/* Top Label */}
        <p className="text-sm md:text-base uppercase tracking-[0.3em] text-gray-400 mb-2">
          Acknowledgement
        </p>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Special Thanks
        </h1>

        {/* Decorative Divider */}
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-8"></div>

        {/* Role Title */}
        <p className="text-lg md:text-2xl text-gray-300 font-light mb-4">
          Our Respected Senior & Pro Mentor
        </p>

        {/* Name (Highlighted) */}
        <h2 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 drop-shadow-lg">
          S M Abu Fayeem
        </h2>

      </div>
    </div>
  );
};

export default SpecialThanksSlide;