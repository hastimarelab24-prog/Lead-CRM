import React from 'react'

export default function LeadModal({isOpen,onClose,title,children}) {
    if(!isOpen) return null;
  return (
    <div>
        <div>
            <div>
                <h3>{title}</h3>
                <button onClick={onClose}>&times;</button>
            </div>
            <div>{children}</div>
        </div>
    </div>
  )
}
