'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Zap, 
  Star, 
  Crown, 
  Flame,
  Rocket,
  Diamond,
  Shield,
  Sword,
  Award,
  Medal,
  Gamepad2,
  Sparkles,
  ChevronRight,
  Plus,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface GamifiedDashboardProps {
  user: any;
  portfolio: any[];
  totals: any;
  onAddStock: () => void;
  onViewPortfolio: () => void;
}

const GamifiedDashboard: React.FC<GamifiedDashboardProps> = ({
  user,
  portfolio,
  totals,
  onAddStock,
  onViewPortfolio
}) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // Calculate user level based on portfolio performance
  useEffect(() => {
    const totalValue = totals?.current || 0;
    const pnl = totals?.totalPnL || 0;
    const stockCount = portfolio?.length || 0;
    
    // Level calculation based on portfolio value and performance
    const newLevel = Math.floor(totalValue / 10000) + 1;
    const newXp = (totalValue % 10000) / 100;
    
    setCurrentLevel(newLevel);
    setXp(newXp);
    
    // Check for achievements
    const newAchievements = [];
    if (stockCount >= 1) newAchievements.push('first-stock');
    if (stockCount >= 5) newAchievements.push('portfolio-builder');
    if (stockCount >= 10) newAchievements.push('diversifier');
    if (pnl > 1000) newAchievements.push('profit-maker');
    if (pnl > 5000) newAchievements.push('trader-pro');
    if (newLevel >= 5) newAchievements.push('level-master');
    
    setAchievements(newAchievements);
  }, [portfolio, totals]);

  const levelProgress = (xp / 100) * 100;
  const nextLevelXp = 100 - xp;

  const getLevelTitle = (level: number) => {
    if (level < 5) return 'Novice Trader';
    if (level < 10) return 'Rising Investor';
    if (level < 20) return 'Portfolio Master';
    if (level < 50) return 'Market Wizard';
    return 'Trading Legend';
  };

  const getLevelIcon = (level: number) => {
    if (level < 5) return <Shield className="w-6 h-6" />;
    if (level < 10) return <Sword className="w-6 h-6" />;
    if (level < 20) return <Crown className="w-6 h-6" />;
    if (level < 50) return <Diamond className="w-6 h-6" />;
    return <Rocket className="w-6 h-6" />;
  };

  const getLevelColor = (level: number) => {
    if (level < 5) return 'from-gray-400 to-gray-600';
    if (level < 10) return 'from-green-400 to-green-600';
    if (level < 20) return 'from-blue-400 to-blue-600';
    if (level < 50) return 'from-purple-400 to-purple-600';
    return 'from-yellow-400 to-yellow-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 p-4 space-y-6">
        {/* Header with Level and XP */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full bg-gradient-to-r ${getLevelColor(currentLevel)}`}>
                {getLevelIcon(currentLevel)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome back, {user?.name || 'Trader'}! 👋
                </h1>
                <p className="text-purple-200">
                  {getLevelTitle(currentLevel)} • Level {currentLevel}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                ${totals?.current?.toLocaleString() || '0'}
              </div>
              <div className={`text-sm ${totals?.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totals?.totalPnL >= 0 ? '+' : ''}${totals?.totalPnL?.toFixed(2) || '0'} 
                ({totals?.totalPnLPercent?.toFixed(2) || '0'}%)
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-purple-200">
              <span>XP Progress</span>
              <span>{xp.toFixed(1)}/100 XP</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <motion.div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-purple-300">
              {nextLevelXp.toFixed(1)} XP to Level {currentLevel + 1}
            </p>
          </div>
        </motion.div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-300">Portfolio Value</p>
                <p className="text-lg font-bold text-white">
                  ${totals?.current?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-300">Stocks</p>
                <p className="text-lg font-bold text-white">
                  {portfolio?.length || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Trophy className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-300">P&L</p>
                <p className={`text-lg font-bold ${totals?.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totals?.totalPnL >= 0 ? '+' : ''}${totals?.totalPnL?.toFixed(2) || '0'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-gray-300">Level</p>
                <p className="text-lg font-bold text-white">
                  {currentLevel}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Achievements Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <Award className="w-6 h-6 text-yellow-400" />
              <span>Achievements</span>
            </h3>
            <span className="text-sm text-purple-200">
              {achievements.length} unlocked
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'first-stock', name: 'First Stock', icon: <Target className="w-6 h-6" />, unlocked: achievements.includes('first-stock') },
              { id: 'portfolio-builder', name: 'Portfolio Builder', icon: <BarChart3 className="w-6 h-6" />, unlocked: achievements.includes('portfolio-builder') },
              { id: 'diversifier', name: 'Diversifier', icon: <PieChart className="w-6 h-6" />, unlocked: achievements.includes('diversifier') },
              { id: 'profit-maker', name: 'Profit Maker', icon: <TrendingUp className="w-6 h-6" />, unlocked: achievements.includes('profit-maker') },
              { id: 'trader-pro', name: 'Trader Pro', icon: <Crown className="w-6 h-6" />, unlocked: achievements.includes('trader-pro') },
              { id: 'level-master', name: 'Level Master', icon: <Diamond className="w-6 h-6" />, unlocked: achievements.includes('level-master') },
            ].map((achievement) => (
              <motion.div
                key={achievement.id}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  achievement.unlocked 
                    ? 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border-yellow-400/50' 
                    : 'bg-gray-700/50 border-gray-600/50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className={`p-2 rounded-full ${
                    achievement.unlocked ? 'bg-yellow-400/20' : 'bg-gray-600/50'
                  }`}>
                    {achievement.icon}
                  </div>
                  <p className={`text-sm font-medium text-center ${
                    achievement.unlocked ? 'text-yellow-200' : 'text-gray-400'
                  }`}>
                    {achievement.name}
                  </p>
                  {achievement.unlocked && (
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.button
            onClick={onAddStock}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 transition-all duration-300 transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-6 h-6" />
            <span>Add New Stock</span>
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          <motion.button
            onClick={onViewPortfolio}
            className="bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Activity className="w-6 h-6" />
            <span>View Portfolio</span>
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Celebration Animation */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50"
            >
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-8 px-12 rounded-2xl text-2xl shadow-2xl">
                🎉 Level Up! 🎉
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GamifiedDashboard;




