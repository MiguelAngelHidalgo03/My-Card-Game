import React, { useState, useEffect, useRef } from 'react';
import socket from '../../utils/sockets';
import './ChatWindows.css';

export default function ChatWindow({ code, username, avatar }) {
  const [open, setOpen]   = useState(false);
  const [msgs, setMsgs]   = useState([]);
  const [text, setText]   = useState('');
  const listRef           = useRef();

  useEffect(() => {
    const handler = msg => {
      setMsgs(ms => [...ms, msg]);
      // Scroll automático al final
      setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };
    socket.on('chat-message', handler);
    return () => socket.off('chat-message', handler);
  }, []);

  const send = () => {
    if (!text.trim()) return;
    socket.emit('chat-message', { code, username, text, avatar });
    setText('');
  };

  return (
    <div className={`chat-window ${open ? 'open' : ''}`}>
      <button className="chat-toggle" onClick={()=>setOpen(o=>!o)}>
        {open ? '×' : '💬'}
      </button>
      {open && (
        <div className="chat-body">
          <div className="messages">
            {msgs.map((m,i) => (
              <div key={i} className="msg">
                 <img src={m.avatar} alt={m.username} className="msg-avatar" />
                <div className="msg-body">
            <strong>{m.username}:</strong> {m.text}
        </div>
              </div>
            ))}
            <div ref={listRef} />
          </div>
          <div className="input-row">
            <input
              value={text}
              onChange={e=>setText(e.target.value)}
              onKeyDown={e=> e.key==='Enter' && send()}
              placeholder="Escribe un mensaje…"
            />
            <button onClick={send}>Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}
