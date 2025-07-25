import * as React from 'react';

export interface InfoModalProps {
  state: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  title?: string;
  message: string;
}

export default function InfoModal({ state, title, message }: InfoModalProps) {
  const [show, setShow] = state;

  if (!show) return null;

  return (
    <dialog className="modal modal-open" onClick={() => setShow(false)}>
      <div
        className="modal-box bg-base-300 shadow-primary p-6 shadow"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 className="mb-2 text-lg font-semibold">{title}</h3>}
        <p>{message}</p>

        <div className="modal-action">
          <button onClick={() => setShow(false)} className="btn btn-primary">
            Oke
          </button>
        </div>
      </div>
    </dialog>
  );
}
