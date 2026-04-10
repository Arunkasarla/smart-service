import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';

const ChatModal = ({ targetUser, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !user || !targetUser) return;

    // Connect automatically via isolated WebSocket Channel over port 5000 
    // to bypass the static HTML block natively.
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.emit('register_user', user.id);

    // Fetch historical data initially
    fetch(`http://localhost:5000/api/messages/${user.id}/${targetUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
        if(Array.isArray(data)) setMessages(data);
    });

    // Listen for live messages
    socketRef.current.on('receive_message', (data) => {
       if (data.senderId === targetUser.id) {
          setMessages(prev => [...prev, data]);
       }
    });

    return () => socketRef.current.disconnect();
  }, [isOpen, targetUser, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgData = {
      senderId: user.id,
      receiverId: targetUser.id,
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    socketRef.current.emit('send_message', msgData);
    setMessages(prev => [...prev, msgData]);
    setNewMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in border border-gray-200 dark:border-slate-700 flex flex-col h-[450px]">
       <div className="bg-primary text-white p-3 flex justify-between items-center shadow-md z-10 relative">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
               {targetUser.name?.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">{targetUser.name}</h3>
              <p className="text-[10px] opacity-80">{targetUser.role === 'provider' ? 'Service Professional' : 'Customer'}</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={18} />
          </button>
       </div>

       <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-900/50 space-y-3">
          {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-muted opacity-50">
                <MessageSquare size={32} className="mb-2"/>
                <p className="text-xs text-center">Start a secure conversation.<br/>Messages are end-to-end recorded.</p>
             </div>
          )}
          {messages.map((msg, i) => {
             const isMe = msg.sender_id === user.id || msg.senderId === user.id;
             return (
               <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                     isMe 
                       ? 'bg-primary text-white rounded-tr-sm' 
                       : 'bg-white dark:bg-slate-700 text-main rounded-tl-sm border border-gray-100 dark:border-slate-600'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-muted mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
               </div>
             )
          })}
          <div ref={messagesEndRef} />
       </div>

       <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-800 border-t dark:border-slate-700 flex gap-2">
          <input 
             type="text" 
             className="flex-1 bg-gray-100 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-800 rounded-full px-4 text-sm outline-none transition-colors border focus:border-primary placeholder-gray-400"
             placeholder="Type message..." 
             value={newMessage}
             onChange={e => setNewMessage(e.target.value)}
          />
          <button type="submit" disabled={!newMessage.trim()} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors shrink-0">
             <Send size={16} className="-ml-1"/>
          </button>
       </form>
    </div>
  );
};

export default ChatModal;
