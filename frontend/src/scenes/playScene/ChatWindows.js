import React, { useState, useEffect, useRef } from 'react';
import socket from '../../utils/sockets';
import './ChatWindows.css';

export default function ChatWindow({ code, username, avatar, onToggle }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef();
  
  

useEffect(() => {
  // sigue manteniendo el pointer-events para móvil…
  const wrapper = document.querySelector('.game-canvas');
  const canvas  = wrapper?.querySelector('canvas');
  if (wrapper) wrapper.style.pointerEvents = open ? 'none' : 'auto';
  if (canvas)  canvas .style.pointerEvents = open ? 'none' : 'auto';

  // **Y ahora notificamos a Phaser:**
  window.dispatchEvent(new CustomEvent(
    open 
      ? 'disable-phaser-input'
      : 'enable-phaser-input'
  ));

  return () => {
    if (wrapper) wrapper.style.pointerEvents = 'auto';
    if (canvas)  canvas .style.pointerEvents = 'auto';
  };
}, [open]);
  
  useEffect(() => {
    window.__chatOpen = open;
  }, [open]);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener('open-chat', openHandler);
    return () => window.removeEventListener('open-chat', openHandler);
  }, []);

  useEffect(() => {
    const handler = msg => {
      setMsgs(ms => [...ms, msg]);
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

  // Agrupa mensajes consecutivos por emisor
  const blocks = [];
  msgs.forEach(m => {
    const who = m.username === username ? 'local' : 'remote';
    if (!blocks.length || blocks[blocks.length - 1].who !== who) {
      blocks.push({ who, items: [m] });
    } else {
      blocks[blocks.length - 1].items.push(m);
    }
  });

  return (
   <div className={`chat-window ${open ? 'open' : ''}`}>
    <button className="chat-toggle" onClick={() => setOpen(o => !o)}>
        {open ? '×' : '💬'}
      </button>
      {open && (
        <div className="chat-body">
          <div className="messages">
            {blocks.map((block, bi) => (
              <div key={bi} className={`msg-block ${block.who}`}>
                {block.who === 'remote' && (
                  <div className="msg-header">{block.items[0].username}</div>
                )}
                {block.items.map((m, mi) => {
                  const isLast = mi === block.items.length - 1;
                  return (
                    <div key={mi} className="msg-item">
                      {/* Avatar del rival sólo en el último mensaje */}
                      {block.who === 'remote' && isLast && (
                        <img src={m.avatar} alt={m.username} className="msg-avatar" />
                      )}
                      {/* Avatar local sigue igual */}
                      {block.who === 'local' && isLast && (
                        <img src={m.avatar} alt="yo" className="msg-avatar" />
                      )}
                      <div className="msg-body">{m.text}</div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={listRef} />
          </div>
          <div className="input-row">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Escribe un mensaje…"
            />
            <button onClick={send}>Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}
