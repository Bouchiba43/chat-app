const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-gradient-to-r from-blue-500 to-teal-500 p-12 rounded-xl">
      <div className="max-w-lg text-center text-white">
        {/* Animated Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-2xl bg-blue-300 ${
                i % 2 === 0 ? "animate-pulse" : "animate-bounce"
              }`}
            />
          ))}
        </div>

        {/* Title and Subtitle */}
        <h2 className="text-3xl font-semibold mb-4">{title}</h2>
        <p className="text-lg opacity-90">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
