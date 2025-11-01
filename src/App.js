import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Sun, Moon, Music, Upload, SkipForward, Volume2, Plus, Trash2, Check, Download, TrendingUp, Settings, X, Calendar, Target, Zap } from 'lucide-react';

export default function AkatsukiPomodoro() {
  const [darkMode, setDarkMode] = useState(true);
  const [currentTheme, setCurrentTheme] = useState('akatsuki');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [selectedPreset, setSelectedPreset] = useState('25:5');
  const [showCustom, setShowCustom] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [isLongBreak, setIsLongBreak] = useState(false);
  
  // Tasks
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  
  // Stats
  const [stats, setStats] = useState({ totalSessions: 0, totalMinutes: 0, streak: 0, lastDate: null });
  const [showStats, setShowStats] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(8);
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [customNotificationSound, setCustomNotificationSound] = useState(null);
  const [autoStartNext, setAutoStartNext] = useState(false);
  
  // Music player states
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  
  const audioRef = useRef(null);
  const notificationRef = useRef(null);
  const fileInputRef = useRef(null);
  const soundInputRef = useRef(null);

  // Load data from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('pomodoroStats');
    const savedTasks = localStorage.getItem('pomodoroTasks');
    const savedTheme = localStorage.getItem('pomodoroTheme');
    const savedHistory = localStorage.getItem('pomodoroHistory');
    const savedGoal = localStorage.getItem('pomodoroGoal');
    const savedAutoStart = localStorage.getItem('pomodoroAutoStart');
    const savedSession = localStorage.getItem('pomodoroSession');
    
    if (savedStats) setStats(JSON.parse(savedStats));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedTheme) setCurrentTheme(savedTheme);
    if (savedHistory) setSessionHistory(JSON.parse(savedHistory));
    if (savedGoal) setDailyGoal(Number(savedGoal));
    if (savedAutoStart) setAutoStartNext(JSON.parse(savedAutoStart));
    
    // Restore session
    if (savedSession) {
      const session = JSON.parse(savedSession);
      const now = Date.now();
      const elapsed = Math.floor((now - session.timestamp) / 1000);
      const newTimeLeft = Math.max(0, session.timeLeft - elapsed);
      
      if (newTimeLeft > 0 && session.isRunning) {
        setTimeLeft(newTimeLeft);
        setIsBreak(session.isBreak);
        setIsLongBreak(session.isLongBreak);
        setWorkDuration(session.workDuration);
        setBreakDuration(session.breakDuration);
        setSessionCount(session.sessionCount);
        // Don't auto-start, just restore state
      }
    }
  }, []);

  // Save stats
  useEffect(() => {
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
  }, [stats]);

  // Save tasks
  useEffect(() => {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
  }, [tasks]);

  // Save theme
  useEffect(() => {
    localStorage.setItem('pomodoroTheme', currentTheme);
  }, [currentTheme]);

  // Save history
  useEffect(() => {
    localStorage.setItem('pomodoroHistory', JSON.stringify(sessionHistory));
  }, [sessionHistory]);

  // Save goal
  useEffect(() => {
    localStorage.setItem('pomodoroGoal', dailyGoal.toString());
  }, [dailyGoal]);

  // Save auto-start preference
  useEffect(() => {
    localStorage.setItem('pomodoroAutoStart', JSON.stringify(autoStartNext));
  }, [autoStartNext]);

  // Save session state
  useEffect(() => {
    const sessionState = {
      timeLeft,
      isRunning,
      isBreak,
      isLongBreak,
      workDuration,
      breakDuration,
      sessionCount,
      timestamp: Date.now()
    };
    localStorage.setItem('pomodoroSession', JSON.stringify(sessionState));
  }, [timeLeft, isRunning, isBreak, isLongBreak, workDuration, breakDuration, sessionCount]);

  // Update streak
  useEffect(() => {
    const today = new Date().toDateString();
    if (stats.lastDate !== today && sessionCount > 0) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = stats.lastDate === yesterday ? stats.streak + 1 : 1;
      setStats(prev => ({ ...prev, streak: newStreak, lastDate: today }));
    }
  }, [sessionCount, stats.lastDate, stats.streak]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        resetTimer();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning]);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (customNotificationSound && notificationRef.current) {
        notificationRef.current.src = customNotificationSound;
        notificationRef.current.play();
      } else if (notificationRef.current) {
        notificationRef.current.play();
      }
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(isBreak || isLongBreak ? 'Break Complete!' : 'Work Session Complete!', {
          body: isBreak || isLongBreak ? 'Time to get back to work!' : 'Time for a break!',
          icon: '/logo.jpg'
        });
      }
      
      if (!isBreak && !isLongBreak) {
        const newSession = {
          date: new Date().toISOString(),
          duration: workDuration,
          type: 'work'
        };
        setSessionHistory(prev => [newSession, ...prev].slice(0, 50)); // Keep last 50
        
        setStats(prev => ({
          ...prev,
          totalSessions: prev.totalSessions + 1,
          totalMinutes: prev.totalMinutes + workDuration
        }));
      }
      
      if (isBreak || isLongBreak) {
        setTimeLeft(workDuration * 60);
        setIsBreak(false);
        setIsLongBreak(false);
        if (autoStartNext) {
          setIsRunning(true);
        } else {
          setIsRunning(false);
        }
      } else {
        const newCount = sessionCount + 1;
        setSessionCount(newCount);
        
        if (newCount % 4 === 0) {
          setTimeLeft(longBreakDuration * 60);
          setIsLongBreak(true);
        } else {
          setTimeLeft(breakDuration * 60);
          setIsBreak(true);
        }
        
        if (autoStartNext) {
          setIsRunning(true);
        } else {
          setIsRunning(false);
        }
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak, isLongBreak, workDuration, breakDuration, longBreakDuration, sessionCount, customNotificationSound, autoStartNext]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && playlist.length > 0) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex, playlist]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    setShowCustom(false);
    const [work, breakTime] = preset.split(':').map(Number);
    setWorkDuration(work);
    setBreakDuration(breakTime);
    setTimeLeft(work * 60);
    setIsBreak(false);
    setIsLongBreak(false);
    setIsRunning(false);
  };

  const handleCustomTimer = () => {
    setShowCustom(true);
    setSelectedPreset('custom');
  };

  const applyCustomTimer = () => {
    setTimeLeft(workDuration * 60);
    setIsBreak(false);
    setIsLongBreak(false);
    setIsRunning(false);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(workDuration * 60);
    setIsBreak(false);
    setIsLongBreak(false);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newTracks = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      id: Date.now() + Math.random()
    }));
    setPlaylist([...playlist, ...newTracks]);
  };

  const deleteTrack = (id) => {
    const newPlaylist = playlist.filter(track => track.id !== id);
    setPlaylist(newPlaylist);
    if (currentTrackIndex >= newPlaylist.length) {
      setCurrentTrackIndex(Math.max(0, newPlaylist.length - 1));
    }
  };

  const clearPlaylist = () => {
    if (window.confirm('Clear entire playlist?')) {
      setPlaylist([]);
      setCurrentTrackIndex(0);
      setIsPlaying(false);
    }
  };

  const handleSoundUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomNotificationSound(url);
    }
  };

  const toggleMusic = () => {
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    if (playlist.length > 0) {
      setCurrentTrackIndex((currentTrackIndex + 1) % playlist.length);
    }
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const exportStats = () => {
    const csvContent = `Date,Total Sessions,Total Minutes,Current Streak\n${new Date().toLocaleDateString()},${stats.totalSessions},${stats.totalMinutes},${stats.streak}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pomodoro-stats.csv';
    a.click();
  };

  const resetStats = () => {
    if (window.confirm('Are you sure you want to reset all statistics?')) {
      setStats({ totalSessions: 0, totalMinutes: 0, streak: 0, lastDate: null });
      setSessionCount(0);
      setSessionHistory([]);
    }
  };

  const getTodaySessions = () => {
    const today = new Date().toDateString();
    return sessionHistory.filter(session => {
      const sessionDate = new Date(session.date).toDateString();
      return sessionDate === today && session.type === 'work';
    }).length;
  };

  const progress = ((isBreak ? breakDuration * 60 : isLongBreak ? longBreakDuration * 60 : workDuration * 60) - timeLeft) / 
                   (isBreak ? breakDuration * 60 : isLongBreak ? longBreakDuration * 60 : workDuration * 60) * 100;

  const todaySessions = getTodaySessions();
  const goalProgress = (todaySessions / dailyGoal) * 100;

  // Theme-based color classes
  const getThemeClasses = () => {
    switch(currentTheme) {
      case 'itachi':
        return {
          cloudColor: 'text-red-500',
          titleColor: 'text-red-500',
          primaryColor: 'text-red-500',
          primaryBg: darkMode ? 'bg-red-700' : 'bg-red-600',
          primaryHoverBg: darkMode ? 'hover:bg-red-600' : 'hover:bg-red-500',
          border: darkMode ? 'border-gray-800' : 'border-gray-300',
          gradient: 'from-red-700 to-gray-800',
          buttonBg: darkMode ? 'bg-red-700' : 'bg-red-600',
          buttonHover: darkMode ? 'hover:bg-red-600' : 'hover:bg-red-500'
        };
      case 'obito':
        return {
          cloudColor: 'text-orange-400',
          titleColor: 'text-orange-400',
          primaryColor: 'text-orange-400',
          primaryBg: darkMode ? 'bg-orange-600' : 'bg-orange-500',
          primaryHoverBg: darkMode ? 'hover:bg-orange-500' : 'hover:bg-orange-400',
          border: darkMode ? 'border-blue-900' : 'border-orange-200',
          gradient: 'from-orange-600 to-blue-700',
          buttonBg: darkMode ? 'bg-orange-600' : 'bg-orange-500',
          buttonHover: darkMode ? 'hover:bg-orange-500' : 'hover:bg-orange-400'
        };
      case 'pain':
        return {
          cloudColor: 'text-purple-400',
          titleColor: 'text-purple-400',
          primaryColor: 'text-purple-400',
          primaryBg: darkMode ? 'bg-purple-600' : 'bg-purple-500',
          primaryHoverBg: darkMode ? 'hover:bg-purple-500' : 'hover:bg-purple-400',
          border: darkMode ? 'border-purple-900' : 'border-purple-200',
          gradient: 'from-purple-600 to-purple-800',
          buttonBg: darkMode ? 'bg-purple-600' : 'bg-purple-500',
          buttonHover: darkMode ? 'hover:bg-purple-500' : 'hover:bg-purple-400'
        };
      default: // akatsuki
        return {
          cloudColor: 'text-red-400',
          titleColor: 'text-red-400',
          primaryColor: 'text-red-400',
          primaryBg: darkMode ? 'bg-red-600' : 'bg-red-500',
          primaryHoverBg: darkMode ? 'hover:bg-red-500' : 'hover:bg-red-400',
          border: darkMode ? 'border-red-900' : 'border-red-200',
          gradient: 'from-red-600 to-red-800',
          buttonBg: darkMode ? 'bg-red-600' : 'bg-red-500',
          buttonHover: darkMode ? 'hover:bg-red-500' : 'hover:bg-red-400'
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Animated background */}
      <div className="fixed inset-0 opacity-5 pointer-events-none overflow-hidden">
        <div className={`absolute top-10 left-10 ${themeClasses.cloudColor} text-9xl animate-pulse`}>☁</div>
        <div className={`absolute top-40 right-20 ${themeClasses.cloudColor} text-7xl animate-pulse`} style={{animationDelay: '1s'}}>☁</div>
        <div className={`absolute bottom-20 left-1/4 ${themeClasses.cloudColor} text-8xl animate-pulse`} style={{animationDelay: '2s'}}>☁</div>
        <div className={`absolute bottom-40 right-1/3 ${themeClasses.cloudColor} text-6xl animate-pulse`} style={{animationDelay: '3s'}}>☁</div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-4xl font-bold ${themeClasses.titleColor}`}>
            Pomodoro Timer
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`p-3 rounded-full transition-colors ${
                darkMode ? 'bg-gray-800 text-blue-400 hover:bg-gray-700' : 'bg-white text-blue-600 hover:bg-gray-200'
              }`}
            >
              <TrendingUp size={24} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-3 rounded-full transition-colors ${
                darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Settings size={24} />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-full transition-colors ${
                darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
            >
              {darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </div>
        </div>

        {/* Daily Goal Progress */}
        <div className={`rounded-2xl p-4 mb-6 shadow-2xl ${
          darkMode ? `bg-gray-800 border-2 ${themeClasses.border}` : `bg-white border-2 ${themeClasses.border}`
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className={themeClasses.primaryColor} size={20} />
              <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Daily Goal: {todaySessions}/{dailyGoal} sessions
              </span>
            </div>
            <span className={`text-sm ${themeClasses.primaryColor} font-bold`}>
              {Math.min(100, Math.round(goalProgress))}%
            </span>
          </div>
          <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${themeClasses.gradient}`}
              style={{ width: `${Math.min(100, goalProgress)}%` }}
            />
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div className={`rounded-2xl p-6 mb-6 shadow-2xl ${
            darkMode ? `bg-gray-800 border-2 ${themeClasses.border}` : `bg-white border-2 ${themeClasses.border}`
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-2xl font-bold ${themeClasses.primaryColor}`}>Statistics</h2>
              <div className="flex gap-2">
                <button
                  onClick={exportStats}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all inline-flex items-center gap-2 ${themeClasses.buttonBg} ${themeClasses.buttonHover} text-white`}
                >
                  <Download size={16} />
                  Export
                </button>
                <button
                  onClick={resetStats}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                  }`}
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className={`text-3xl font-bold ${themeClasses.primaryColor}`}>{stats.totalSessions}</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Sessions</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className={`text-3xl font-bold ${themeClasses.primaryColor}`}>{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Time</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className={`text-3xl font-bold ${themeClasses.primaryColor}`}>{stats.streak} 🔥</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Day Streak</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className={`text-3xl font-bold ${themeClasses.primaryColor}`}>{todaySessions}</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Today's Sessions</div>
              </div>
            </div>

            {/* Session History */}
            <div>
              <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${themeClasses.primaryColor}`}>
                <Calendar size={20} />
                Recent Sessions
              </h3>
              <div className={`max-h-64 overflow-y-auto rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {sessionHistory.length === 0 ? (
                  <p className={`text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    No sessions yet. Complete your first Pomodoro!
                  </p>
                ) : (
                  sessionHistory.map((session, index) => (
                    <div
                      key={index}
                      className={`px-4 py-2 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'} last:border-b-0`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {session.duration} min work session
                        </span>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(session.date).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className={`rounded-2xl p-6 mb-6 shadow-2xl ${
            darkMode ? `bg-gray-800 border-2 ${themeClasses.border}` : `bg-white border-2 ${themeClasses.border}`
          }`}>
            <h2 className={`text-2xl font-bold mb-4 ${themeClasses.primaryColor}`}>Settings</h2>
            
            <div className="mb-4">
              <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Theme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['akatsuki', 'itachi', 'obito', 'pain'].map((themeName) => (
                  <button
                    key={themeName}
                    onClick={() => setCurrentTheme(themeName)}
                    className={`py-2 px-4 rounded-lg font-semibold transition-all capitalize ${
                      currentTheme === themeName
                        ? `${themeClasses.buttonBg} text-white`
                        : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                    }`}
                  >
                    {themeName}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Long Break Duration (min)
              </label>
              <input
                type="number"
                value={longBreakDuration}
                onChange={(e) => setLongBreakDuration(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                }`}
                min="1"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Daily Goal (sessions)
              </label>
              <input
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                }`}
                min="1"
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoStartNext}
                  onChange={(e) => setAutoStartNext(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Auto-start next session
                </span>
                <Zap size={16} className={themeClasses.primaryColor} />
              </label>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Custom Notification Sound
              </label>
              <button
                onClick={() => soundInputRef.current?.click()}
                className={`px-4 py-2 rounded-lg font-semibold transition-all inline-flex items-center gap-2 ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                }`}
              >
                <Upload size={16} />
                {customNotificationSound ? 'Sound Uploaded ✓' : 'Upload Sound'}
              </button>
              <input
                ref={soundInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/wav,audio/ogg,.mp3,.m4a,.wav,.ogg"
                onChange={handleSoundUpload}
                className="hidden"
              />
            </div>

            <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                ⌨️ <strong>Keyboard Shortcuts:</strong><br/>
                <kbd className="px-2 py-1 bg-gray-600 text-white rounded text-xs mr-2">Space</kbd> Play/Pause<br/>
                <kbd className="px-2 py-1 bg-gray-600 text-white rounded text-xs mr-2">R</kbd> Reset Timer
              </p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Timer Card */}
          <div className={`md:col-span-2 rounded-2xl p-8 shadow-2xl ${
            darkMode ? `bg-gray-800 border-2 ${themeClasses.border}` : `bg-white border-2 ${themeClasses.border}`
          }`}>
            {/* Timer Display */}
            <div className="text-center mb-8">
              <div className={`text-5xl sm:text-7xl font-bold mb-4 transition-all ${
                isLongBreak
                  ? (darkMode ? 'text-blue-400' : 'text-blue-600')
                  : isBreak 
                    ? (darkMode ? 'text-green-400' : 'text-green-600')
                    : themeClasses.primaryColor
              } ${isRunning ? 'animate-pulse' : ''}`}>
                {formatTime(timeLeft)}
              </div>
              <div className={`text-lg sm:text-xl mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {isLongBreak ? 'Long Break' : isBreak ? 'Break Time' : 'Work Time'}
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Sessions: {sessionCount} ☁ | Streak: {stats.streak} 🔥
              </div>
            </div>

            {/* Progress Bar */}
            <div className={`w-full h-3 rounded-full mb-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isLongBreak
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                    : isBreak 
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : `bg-gradient-to-r ${themeClasses.gradient}`
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={toggleTimer}
                className={`p-4 rounded-full transition-all transform hover:scale-110 ${themeClasses.buttonBg} ${themeClasses.buttonHover} text-white`}
              >
                {isRunning ? <Pause size={32} /> : <Play size={32} />}
              </button>
              <button
                onClick={resetTimer}
                className={`p-4 rounded-full transition-all transform hover:scale-110 ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                }`}
              >
                <RotateCcw size={32} />
              </button>
            </div>

            {/* Preset Options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {['20:5', '25:5', '35:10'].map(preset => (
                <button
                  key={preset}
                  onClick={() => handlePresetChange(preset)}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                    selectedPreset === preset
                      ? `${themeClasses.buttonBg} text-white`
                      : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                  }`}
                >
                  {preset}
                </button>
              ))}
              <button
                onClick={handleCustomTimer}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  selectedPreset === 'custom'
                    ? `${themeClasses.buttonBg} text-white`
                    : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                }`}
              >
                Custom
              </button>
            </div>

            {/* Custom Timer Input */}
            {showCustom && (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Work (min)
                    </label>
                    <input
                      type="number"
                      value={workDuration}
                      onChange={(e) => setWorkDuration(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded ${
                        darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
                      }`}
                      min="1"
                    />
                  </div>
                  <div className="flex-1">
                    <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Break (min)
                    </label>
                    <input
                      type="number"
                      value={breakDuration}
                      onChange={(e) => setBreakDuration(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded ${
                        darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
                      }`}
                      min="1"
                    />
                  </div>
                  <button
                    onClick={applyCustomTimer}
                    className={`px-6 py-2 rounded font-semibold ${themeClasses.buttonBg} ${themeClasses.buttonHover} text-white`}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Task List */}
          <div className={`rounded-2xl p-6 shadow-2xl ${
            darkMode ? `bg-gray-800 border-2 ${themeClasses.border}` : `bg-white border-2 ${themeClasses.border}`
          }`}>
            <h2 className={`text-2xl font-bold mb-4 ${themeClasses.primaryColor}`}>Tasks</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                placeholder="Add a task..."
                className={`flex-1 px-3 py-2 rounded ${
                  darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                }`}
              />
              <button
                onClick={addTask}
                className={`p-2 rounded transition-all ${themeClasses.buttonBg} ${themeClasses.buttonHover} text-white`}
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tasks.length === 0 ? (
                <p className={`text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No tasks yet. Add one to get started!
                </p>
              ) : (
                tasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                        task.completed
                          ? `${themeClasses.buttonBg} border-transparent`
                          : (darkMode ? 'border-gray-500' : 'border-gray-400')
                      }`}
                    >
                      {task.completed && <Check size={16} className="text-white" />}
                    </button>
                    <span className={`flex-1 ${task.completed ? 'line-through opacity-50' : ''} ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {task.text}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className={`flex-shrink-0 p-1 rounded hover:bg-red-600 transition-colors ${
                        darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-white'
                      }`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Music Player */}
        <div className={`mt-6 rounded-2xl p-6 shadow-2xl ${
          darkMode ? 'bg-gray-800 border-2 border-purple-900' : 'bg-white border-2 border-purple-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Music className={darkMode ? 'text-purple-400' : 'text-purple-600'} size={24} />
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                Music Player
              </h2>
            </div>
            {playlist.length > 0 && (
              <button
                onClick={clearPlaylist}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                  darkMode ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                Clear All
              </button>
            )}
          </div>

          {playlist.length === 0 ? (
            <div className="text-center py-8">
              <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No tracks loaded. Upload your music to begin.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`px-6 py-3 rounded-lg font-semibold transition-all inline-flex items-center gap-2 ${
                  darkMode ? 'bg-purple-700 hover:bg-purple-600 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                <Upload size={20} />
                Upload Music
              </button>
            </div>
          ) : (
            <div>
              <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className={`text-lg font-semibold mb-1 truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {playlist[currentTrackIndex]?.name || 'No track'}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Track {currentTrackIndex + 1} of {playlist.length}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <button
                  onClick={toggleMusic}
                  className={`p-3 rounded-full transition-all ${
                    darkMode ? 'bg-purple-700 hover:bg-purple-600 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button
                  onClick={nextTrack}
                  className={`p-3 rounded-full transition-all ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                  }`}
                >
                  <SkipForward size={24} />
                </button>
                <div className="flex-1 flex items-center gap-3 min-w-[200px]">
                  <Volume2 className={darkMode ? 'text-gray-400' : 'text-gray-600'} size={20} />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="flex-1"
                  />
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3 rounded-full transition-all ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                  }`}
                >
                  <Upload size={20} />
                </button>
              </div>

              <div className={`max-h-32 overflow-y-auto rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {playlist.map((track, index) => (
                  <div
                    key={track.id}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer transition-colors ${
                      index === currentTrackIndex
                        ? (darkMode ? 'bg-purple-900 text-white' : 'bg-purple-200 text-purple-900')
                        : (darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-700')
                    }`}
                  >
                    <span onClick={() => setCurrentTrackIndex(index)} className="flex-1 truncate">
                      {track.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTrack(track.id);
                      }}
                      className={`ml-2 p-1 rounded hover:bg-red-600 transition-colors ${
                        darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-white'
                      }`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/wav,audio/ogg,.mp3,.m4a,.wav,.ogg"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Hidden audio elements */}
        <audio
          ref={audioRef}
          src={playlist[currentTrackIndex]?.url}
          onEnded={handleTrackEnd}
        />
        <audio
          ref={notificationRef}
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBD"
        />
      </div>
    </div>
  );
}