import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";

interface CoinAnimationProps {
  show: boolean;
  coinsEarned: number;
  onComplete: () => void;
}

interface FlyingCoin {
  id: number;
  startX: number;
  startY: number;
}

export const CoinAnimation = ({ show, coinsEarned, onComplete }: CoinAnimationProps) => {
  const [coins, setCoins] = useState<FlyingCoin[]>([]);
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (show) {
      // Create multiple coins with random positions
      const newCoins: FlyingCoin[] = [];
      const coinCount = Math.min(coinsEarned, 15); // Max 15 coins for performance
      
      for (let i = 0; i < coinCount; i++) {
        newCoins.push({
          id: i,
          startX: Math.random() * 200 - 100,
          startY: Math.random() * 100 + 50,
        });
      }
      
      setCoins(newCoins);
      setShowBurst(true);

      // Complete animation after coins fly to wallet
      setTimeout(() => {
        setShowBurst(false);
        setCoins([]);
        onComplete();
      }, 2000);
    }
  }, [show, coinsEarned, onComplete]);

  if (!show && coins.length === 0) return null;

  return (
    <AnimatePresence>
      {showBurst && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 pointer-events-none"
          />

          {/* Center burst effect */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1] }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Main coin display */}
              <motion.div
                className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(251, 191, 36, 0.5)",
                    "0 0 60px rgba(251, 191, 36, 0.8)",
                    "0 0 20px rgba(251, 191, 36, 0.5)",
                  ],
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="text-center">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-white drop-shadow-lg"
                  >
                    +{coinsEarned}
                  </motion.span>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs text-white/80"
                  >
                    COINS
                  </motion.p>
                </div>
              </motion.div>

              {/* Sparkle effects */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 bg-yellow-300 rounded-full"
                  style={{
                    left: "50%",
                    top: "50%",
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{
                    x: Math.cos((i * Math.PI * 2) / 8) * 100,
                    y: Math.sin((i * Math.PI * 2) / 8) * 100,
                    opacity: [1, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Flying coins to wallet (top-right) */}
          {coins.map((coin, index) => (
            <motion.div
              key={coin.id}
              className="fixed z-50 pointer-events-none"
              style={{ left: "50%", top: "50%" }}
              initial={{
                x: coin.startX,
                y: coin.startY,
                scale: 0,
                opacity: 0,
              }}
              animate={{
                x: [coin.startX, coin.startX * 1.5, window.innerWidth / 2 - 80],
                y: [coin.startY, coin.startY - 50, -window.innerHeight / 2 + 40],
                scale: [0, 1, 0.5],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 1.2,
                delay: index * 0.05 + 0.5,
                ease: "easeInOut",
              }}
            >
              <Coins className="w-8 h-8 text-yellow-500 drop-shadow-lg" />
            </motion.div>
          ))}
        </>
      )}
    </AnimatePresence>
  );
};
