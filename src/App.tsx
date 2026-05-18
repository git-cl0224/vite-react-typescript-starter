import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ClipboardList, Calendar, ChevronDown, ChevronUp, FileText, Clock, Trash } from 'lucide-react';

interface Note {
  id: string;
  content: string;
  timestamp: number;
}

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: 'low' | 'medium' | 'high';
  startDate?: string;
  endDate?: string;
  notes: Note[];
}

type Filter = 'all' | 'active' | 'completed';

interface TimeRemaining {
  days: number;
  hours: number;
  isOverdue: boolean;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const stored = localStorage.getItem('todos');
      const parsed = stored ? JSON.parse(stored) : [];
      return parsed.map((t: any) => ({
        ...t,
        notes: t.notes || (t.summary ? [{ id: crypto.randomUUID(), content: t.summary, timestamp: t.createdAt }] : []),
      }));
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showForm, setShowForm] = useState(false);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    const timer = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const calculateTimeRemaining = (endDate?: string): TimeRemaining | null => {
    if (!endDate) return null;

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const now = new Date();

    const diffMs = end.getTime() - now.getTime();
    const isOverdue = diffMs < 0;

    const absDiffMs = Math.abs(diffMs);
    const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return { days, hours, isOverdue };
  };

  const addTodo = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setTodos(prev => [
      {
        id: crypto.randomUUID(),
        text: trimmed,
        completed: false,
        createdAt: Date.now(),
        priority,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        notes: [],
      },
      ...prev,
    ]);
    setInput('');
    setPriority('medium');
    setStartDate('');
    setEndDate('');
    setShowForm(false);
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    if (!todos.find(t => t.id === id)?.completed) {
      setExpandedId(id);
      setEditingTodoId(id);
      setNoteText('');
    }
  };

  const addNote = (todoId: string) => {
    const trimmed = noteText.trim();
    if (!trimmed) return;

    setTodos(prev => prev.map(t => {
      if (t.id === todoId) {
        return {
          ...t,
          notes: [...t.notes, { id: crypto.randomUUID(), content: trimmed, timestamp: Date.now() }],
        };
      }
      return t;
    }));
    setNoteText('');
    setEditingTodoId(null);
  };

  const deleteNote = (todoId: string, noteId: string) => {
    setTodos(prev => prev.map(t => {
      if (t.id === todoId) {
        return {
          ...t,
          notes: t.notes.filter(n => n.id !== noteId),
        };
      }
      return t;
    }));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    setTodos(prev => prev.filter(t => !t.completed));
  };

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;

  const priorityColors = {
    high: { bg: 'bg-red-50', text: 'text-red-600', badge: 'bg-red-100', label: '高' },
    medium: { bg: 'bg-yellow-50', text: 'text-yellow-600', badge: 'bg-yellow-100', label: '中' },
    low: { bg: 'bg-green-50', text: 'text-green-600', badge: 'bg-green-100', label: '低' },
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getCountdownDisplay = (endDate?: string, completed?: boolean) => {
    if (completed || !endDate) return null;

    const timeRemaining = calculateTimeRemaining(endDate);
    if (!timeRemaining) return null;

    const { days, hours, isOverdue } = timeRemaining;

    if (isOverdue) {
      return {
        text: `已超期${days}天${hours}小时`,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: 'text-red-500',
      };
    } else {
      return {
        text: `还剩${days}天${hours}小时`,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: 'text-blue-500',
      };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 flex flex-col items-center px-4 py-12">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">待办清单</h1>
        </div>
        <p className="text-gray-400 text-sm">整理你的每一天</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-blue-100 overflow-hidden">
        {/* Input area */}
        <div className="p-6 border-b border-gray-100">
          {!showForm ? (
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && input.trim()) {
                    setShowForm(true);
                  }
                }}
                placeholder="添加新任务..."
                className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all text-sm"
              />
              <button
                onClick={() => input.trim() && setShowForm(true)}
                className="px-4 py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all duration-150 flex-shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">添加任务</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">优先级</label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        priority === p
                          ? `${priorityColors[p].badge} ${priorityColors[p].text}`
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {priorityColors[p].label}优先
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">开始日期</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">结束日期</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addTodo}
                  className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium text-sm transition-all"
                >
                  确认添加
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setPriority('medium');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-medium text-sm transition-all"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex gap-4 text-xs">
            <span className="text-gray-400">
              未完成 <span className="font-semibold text-blue-500">{activeCount}</span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-400">
              已完成 <span className="font-semibold text-emerald-500">{completedCount}</span>
            </span>
          </div>
          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              className="text-xs text-gray-300 hover:text-red-400 transition-colors"
            >
              清除已完成
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="px-6 pt-4 flex gap-1">
          {(['all', 'active', 'completed'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {f === 'all' ? '全部' : f === 'active' ? '未完成' : '已完成'}
            </button>
          ))}
        </div>

        {/* Todo list */}
        <div className="px-6 pb-6 pt-3 min-h-[200px]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <ClipboardList className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">
                {filter === 'completed' ? '暂无已完成任务' : filter === 'active' ? '暂无未完成任务' : '暂无任务，添加一个吧'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map(todo => {
                const colors = priorityColors[todo.priority];
                const isExpanded = expandedId === todo.id;
                const countdown = getCountdownDisplay(todo.endDate, todo.completed);
                const isEditingThisTodo = editingTodoId === todo.id;

                return (
                  <li
                    key={todo.id}
                    className={`group rounded-2xl transition-all overflow-hidden ${colors.bg}`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className="flex-shrink-0 mt-1 transition-transform hover:scale-110 active:scale-95"
                        >
                          {todo.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 group-hover:text-blue-300 transition-colors" />
                          )}
                        </button>
                        <div className="flex-1">
                          <span
                            className={`text-sm font-medium transition-colors block ${
                              todo.completed ? 'line-through text-gray-400' : 'text-gray-700'
                            }`}
                          >
                            {todo.text}
                          </span>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded-lg font-medium ${colors.badge} ${colors.text}`}>
                              {colors.label}优先
                            </span>
                            {(todo.startDate || todo.endDate) && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(todo.startDate || '')} {(todo.startDate && todo.endDate) && '~'} {formatDate(todo.endDate || '')}
                              </span>
                            )}
                            {countdown && (
                              <span className={`text-xs px-2 py-1 rounded-lg font-medium flex items-center gap-1 ${
                                countdown.text.includes('超期') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                <Clock className={`w-3.5 h-3.5 ${countdown.icon}`} />
                                {countdown.text}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {todo.completed && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : todo.id)}
                              className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-500 transition-all"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded notes section */}
                    {isExpanded && todo.completed && (
                      <div className="px-4 pb-4 border-t border-opacity-20 border-gray-400 space-y-3 pt-4">
                        {/* Notes list */}
                        {todo.notes.length > 0 && (
                          <div className="space-y-2">
                            {todo.notes.map(note => (
                              <div key={note.id} className="bg-white rounded-lg p-3 text-sm">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-gray-700 leading-relaxed flex-1 whitespace-pre-wrap">{note.content}</p>
                                  <button
                                    onClick={() => deleteNote(todo.id, note.id)}
                                    className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors opacity-0 hover:opacity-100"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{formatTime(note.timestamp)}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add note form */}
                        {isEditingThisTodo ? (
                          <div className="space-y-2">
                            <textarea
                              value={noteText}
                              onChange={e => setNoteText(e.target.value)}
                              placeholder="添加备注..."
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all resize-none"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => addNote(todo.id)}
                                disabled={!noteText.trim()}
                                className="flex-1 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium text-xs transition-all"
                              >
                                添加备注
                              </button>
                              <button
                                onClick={() => {
                                  setEditingTodoId(null);
                                  setNoteText('');
                                }}
                                className="flex-1 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-lg font-medium text-xs transition-all"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingTodoId(todo.id);
                              setNoteText('');
                            }}
                            className="w-full py-2 text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center justify-center gap-1 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            添加备注
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-300">数据保存在本地，刷新不丢失</p>
    </div>
  );
}
